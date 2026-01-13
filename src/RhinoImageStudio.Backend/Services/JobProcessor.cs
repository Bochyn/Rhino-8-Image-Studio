using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RhinoImageStudio.Backend.Data;
using RhinoImageStudio.Shared.Constants;
using RhinoImageStudio.Shared.Contracts;
using RhinoImageStudio.Shared.Enums;
using RhinoImageStudio.Shared.Models;

namespace RhinoImageStudio.Backend.Services;

/// <summary>
/// Background service that processes jobs from the queue
/// </summary>
public class JobProcessor : BackgroundService
{
    private readonly IJobQueue _jobQueue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IEventBroadcaster _eventBroadcaster;
    private readonly ILogger<JobProcessor> _logger;

    public JobProcessor(
        IJobQueue jobQueue,
        IServiceScopeFactory scopeFactory,
        IEventBroadcaster eventBroadcaster,
        ILogger<JobProcessor> logger)
    {
        _jobQueue = jobQueue;
        _scopeFactory = scopeFactory;
        _eventBroadcaster = eventBroadcaster;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Job Processor started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var job = await _jobQueue.DequeueAsync(stoppingToken);
                await ProcessJobAsync(job, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Graceful shutdown
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in job processor loop");
                await Task.Delay(1000, stoppingToken); // Brief pause on error
            }
        }

        _logger.LogInformation("Job Processor stopped");
    }

    private async Task ProcessJobAsync(Job job, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var falClient = scope.ServiceProvider.GetRequiredService<IFalAiClient>();
        var storage = scope.ServiceProvider.GetRequiredService<IStorageService>();

        _logger.LogInformation("Processing job {JobId} of type {JobType}", job.Id, job.Type);

        try
        {
            // Update job status to running
            job.Status = JobStatus.Running;
            job.StartedAt = DateTime.UtcNow;
            dbContext.Jobs.Update(job);
            await dbContext.SaveChangesAsync(cancellationToken);

            BroadcastProgress(job, 0, "Starting...");

            // Process based on job type
            var result = job.Type switch
            {
                JobType.Generate => await ProcessGenerateJobAsync(job, dbContext, falClient, storage, cancellationToken),
                JobType.Refine => await ProcessRefineJobAsync(job, dbContext, falClient, storage, cancellationToken),
                JobType.MultiAngle => await ProcessMultiAngleJobAsync(job, dbContext, falClient, storage, cancellationToken),
                JobType.Upscale => await ProcessUpscaleJobAsync(job, dbContext, falClient, storage, cancellationToken),
                _ => throw new NotSupportedException($"Job type {job.Type} not supported")
            };

            // Update job as succeeded
            job.Status = JobStatus.Succeeded;
            job.ResultId = result;
            job.CompletedAt = DateTime.UtcNow;
            job.Progress = 100;
            job.ProgressMessage = "Completed";
            dbContext.Jobs.Update(job);
            await dbContext.SaveChangesAsync(cancellationToken);

            BroadcastProgress(job, 100, "Completed", result);
            _logger.LogInformation("Job {JobId} completed successfully", job.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Job {JobId} failed", job.Id);

            job.Status = JobStatus.Failed;
            job.ErrorMessage = ex.Message;
            job.CompletedAt = DateTime.UtcNow;
            dbContext.Jobs.Update(job);
            await dbContext.SaveChangesAsync(cancellationToken);

            BroadcastProgress(job, job.Progress, $"Failed: {ex.Message}");
        }
    }

    private void BroadcastProgress(Job job, int progress, string? message, Guid? resultId = null)
    {
        var evt = new JobProgressEvent(job.Id, job.Status, progress, message, resultId);
        _eventBroadcaster.BroadcastToSession(job.SessionId, evt);
    }

    private async Task<Guid> ProcessGenerateJobAsync(
        Job job,
        AppDbContext dbContext,
        IFalAiClient falClient,
        IStorageService storage,
        CancellationToken cancellationToken)
    {
        var request = JsonSerializer.Deserialize<GenerateRequest>(job.RequestJson)
            ?? throw new InvalidOperationException("Invalid generate request");

        BroadcastProgress(job, 10, "Preparing input...");

        // Build fal.ai input
        var falInput = new Dictionary<string, object>
        {
            ["prompt"] = request.Prompt,
            ["num_images"] = request.NumImages,
            ["aspect_ratio"] = ConvertAspectRatio(request.AspectRatio),
            ["resolution"] = ConvertResolution(request.Resolution),
            ["output_format"] = request.OutputFormat.ToString().ToLowerInvariant()
        };

        // If we have a source capture, add it
        if (request.SourceCaptureId.HasValue)
        {
            var capture = await dbContext.Captures.FindAsync(new object[] { request.SourceCaptureId.Value }, cancellationToken);
            if (capture != null)
            {
                var imageData = await storage.ReadFileAsync(capture.FilePath, cancellationToken);
                var imageUrl = await falClient.UploadImageAsync(imageData, $"{capture.Id}.png", cancellationToken);
                falInput["image_urls"] = new[] { imageUrl };
            }
        }

        BroadcastProgress(job, 20, "Submitting to fal.ai...");

        // Submit to fal.ai
        var queueResponse = await falClient.SubmitAsync(FalModels.NanoBananaProEdit, falInput, cancellationToken);
        job.FalRequestId = queueResponse.RequestId;
        dbContext.Jobs.Update(job);
        await dbContext.SaveChangesAsync(cancellationToken);

        // Poll for completion
        var result = await PollForResultAsync(job, falClient, FalModels.NanoBananaProEdit, queueResponse.RequestId, cancellationToken);

        BroadcastProgress(job, 90, "Saving result...");

        // Download and save result
        var generation = await SaveGenerationResultAsync(
            job.SessionId,
            request.SourceCaptureId,
            null,
            JobType.Generate,
            request.Prompt,
            result,
            dbContext,
            storage,
            cancellationToken);

        return generation.Id;
    }

    private async Task<Guid> ProcessRefineJobAsync(
        Job job,
        AppDbContext dbContext,
        IFalAiClient falClient,
        IStorageService storage,
        CancellationToken cancellationToken)
    {
        var request = JsonSerializer.Deserialize<RefineRequest>(job.RequestJson)
            ?? throw new InvalidOperationException("Invalid refine request");

        var parentGeneration = await dbContext.Generations.FindAsync(new object[] { request.ParentGenerationId }, cancellationToken)
            ?? throw new InvalidOperationException("Parent generation not found");

        BroadcastProgress(job, 10, "Preparing input...");

        // Upload parent image
        var imageData = await storage.ReadFileAsync(parentGeneration.FilePath!, cancellationToken);
        var imageUrl = await falClient.UploadImageAsync(imageData, $"{parentGeneration.Id}.png", cancellationToken);

        var falInput = new Dictionary<string, object>
        {
            ["prompt"] = request.Prompt,
            ["image_urls"] = new[] { imageUrl },
            ["num_images"] = 1
        };

        BroadcastProgress(job, 20, "Submitting to fal.ai...");

        var queueResponse = await falClient.SubmitAsync(FalModels.NanoBananaProEdit, falInput, cancellationToken);
        job.FalRequestId = queueResponse.RequestId;

        var result = await PollForResultAsync(job, falClient, FalModels.NanoBananaProEdit, queueResponse.RequestId, cancellationToken);

        BroadcastProgress(job, 90, "Saving result...");

        var generation = await SaveGenerationResultAsync(
            job.SessionId,
            parentGeneration.SourceCaptureId,
            request.ParentGenerationId,
            JobType.Refine,
            request.Prompt,
            result,
            dbContext,
            storage,
            cancellationToken);

        return generation.Id;
    }

    private async Task<Guid> ProcessMultiAngleJobAsync(
        Job job,
        AppDbContext dbContext,
        IFalAiClient falClient,
        IStorageService storage,
        CancellationToken cancellationToken)
    {
        var request = JsonSerializer.Deserialize<MultiAngleRequest>(job.RequestJson)
            ?? throw new InvalidOperationException("Invalid multi-angle request");

        var sourceGeneration = await dbContext.Generations.FindAsync(new object[] { request.SourceGenerationId }, cancellationToken)
            ?? throw new InvalidOperationException("Source generation not found");

        BroadcastProgress(job, 10, "Preparing input...");

        var imageData = await storage.ReadFileAsync(sourceGeneration.FilePath!, cancellationToken);
        var imageUrl = await falClient.UploadImageAsync(imageData, $"{sourceGeneration.Id}.png", cancellationToken);

        var falInput = new Dictionary<string, object>
        {
            ["image_urls"] = new[] { imageUrl },
            ["horizontal_angle"] = request.Azimuth,
            ["vertical_angle"] = request.Elevation,
            ["zoom"] = request.Zoom,
            ["num_images"] = request.NumImages
        };

        BroadcastProgress(job, 20, "Submitting to fal.ai...");

        var queueResponse = await falClient.SubmitAsync(FalModels.QwenMultipleAngles, falInput, cancellationToken);
        job.FalRequestId = queueResponse.RequestId;

        var result = await PollForResultAsync(job, falClient, FalModels.QwenMultipleAngles, queueResponse.RequestId, cancellationToken);

        BroadcastProgress(job, 90, "Saving result...");

        var generation = await SaveGenerationResultAsync(
            job.SessionId,
            sourceGeneration.SourceCaptureId,
            request.SourceGenerationId,
            JobType.MultiAngle,
            result.Prompt,
            result,
            dbContext,
            storage,
            cancellationToken);

        generation.Azimuth = request.Azimuth;
        generation.Elevation = request.Elevation;
        generation.Zoom = request.Zoom;
        await dbContext.SaveChangesAsync(cancellationToken);

        return generation.Id;
    }

    private async Task<Guid> ProcessUpscaleJobAsync(
        Job job,
        AppDbContext dbContext,
        IFalAiClient falClient,
        IStorageService storage,
        CancellationToken cancellationToken)
    {
        var request = JsonSerializer.Deserialize<UpscaleRequest>(job.RequestJson)
            ?? throw new InvalidOperationException("Invalid upscale request");

        var sourceGeneration = await dbContext.Generations.FindAsync(new object[] { request.SourceGenerationId }, cancellationToken)
            ?? throw new InvalidOperationException("Source generation not found");

        BroadcastProgress(job, 10, "Preparing input...");

        var imageData = await storage.ReadFileAsync(sourceGeneration.FilePath!, cancellationToken);
        var imageUrl = await falClient.UploadImageAsync(imageData, $"{sourceGeneration.Id}.png", cancellationToken);

        var falInput = new Dictionary<string, object>
        {
            ["image_url"] = imageUrl,
            ["upscale_factor"] = request.UpscaleFactor,
            ["creativity"] = request.Creativity
        };

        if (!string.IsNullOrEmpty(request.Prompt))
        {
            falInput["prompt"] = request.Prompt;
        }

        BroadcastProgress(job, 20, "Submitting to fal.ai...");

        var queueResponse = await falClient.SubmitAsync(FalModels.ClarityUpscaler, falInput, cancellationToken);
        job.FalRequestId = queueResponse.RequestId;

        var result = await PollForResultAsync(job, falClient, FalModels.ClarityUpscaler, queueResponse.RequestId, cancellationToken);

        BroadcastProgress(job, 90, "Saving result...");

        var generation = await SaveGenerationResultAsync(
            job.SessionId,
            sourceGeneration.SourceCaptureId,
            request.SourceGenerationId,
            JobType.Upscale,
            request.Prompt,
            result,
            dbContext,
            storage,
            cancellationToken);

        return generation.Id;
    }

    private async Task<FalResultResponse> PollForResultAsync(
        Job job,
        IFalAiClient falClient,
        string modelId,
        string requestId,
        CancellationToken cancellationToken)
    {
        const int maxAttempts = 120; // 2 minutes with 1s intervals
        var attempt = 0;

        while (attempt < maxAttempts)
        {
            await Task.Delay(1000, cancellationToken);
            attempt++;

            var status = await falClient.GetStatusAsync(modelId, requestId, cancellationToken);

            var progress = 20 + (int)((attempt / (float)maxAttempts) * 60);
            BroadcastProgress(job, Math.Min(progress, 80), $"Processing... ({status.Status})");

            if (status.Status == "COMPLETED")
            {
                return await falClient.GetResultAsync(modelId, requestId, cancellationToken);
            }
            else if (status.Status == "FAILED")
            {
                var errorMessage = status.Logs?.LastOrDefault()?.Message ?? "Unknown error";
                throw new Exception($"fal.ai job failed: {errorMessage}");
            }
        }

        throw new TimeoutException("Job timed out waiting for fal.ai response");
    }

    private async Task<Generation> SaveGenerationResultAsync(
        Guid sessionId,
        Guid? sourceCaptureId,
        Guid? parentGenerationId,
        JobType stage,
        string? prompt,
        FalResultResponse result,
        AppDbContext dbContext,
        IStorageService storage,
        CancellationToken cancellationToken)
    {
        // Get the first image (or single image for upscalers)
        var falImage = result.Images?.FirstOrDefault() ?? result.Image
            ?? throw new InvalidOperationException("No image in result");

        // Download image
        using var httpClient = new HttpClient();
        var imageData = await httpClient.GetByteArrayAsync(falImage.Url, cancellationToken);

        // Create generation record
        var generation = new Generation
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            SourceCaptureId = sourceCaptureId,
            ParentGenerationId = parentGenerationId,
            Stage = stage,
            Prompt = prompt,
            Width = falImage.Width,
            Height = falImage.Height,
            Seed = result.Seed,
            FalRequestId = result.RequestId,
            ModelId = stage switch
            {
                JobType.Generate => FalModels.NanoBananaProEdit,
                JobType.Refine => FalModels.NanoBananaProEdit,
                JobType.MultiAngle => FalModels.QwenMultipleAngles,
                JobType.Upscale => FalModels.ClarityUpscaler,
                _ => null
            }
        };

        // Save image file
        generation.FilePath = await storage.SaveGenerationAsync(generation.Id, imageData, "png", cancellationToken);

        // Generate and save thumbnail (simplified - just save at smaller size)
        // In production, use ImageSharp or similar for actual resizing
        generation.ThumbnailPath = await storage.SaveThumbnailAsync(generation.Id, imageData, cancellationToken);

        dbContext.Generations.Add(generation);
        await dbContext.SaveChangesAsync(cancellationToken);

        return generation;
    }

    private static string ConvertAspectRatio(AspectRatio ratio) => ratio switch
    {
        AspectRatio.Auto => "auto",
        AspectRatio.Square_1_1 => "1:1",
        AspectRatio.Landscape_16_9 => "16:9",
        AspectRatio.Landscape_4_3 => "4:3",
        AspectRatio.Landscape_3_2 => "3:2",
        AspectRatio.Landscape_21_9 => "21:9",
        AspectRatio.Portrait_9_16 => "9:16",
        AspectRatio.Portrait_3_4 => "3:4",
        AspectRatio.Portrait_2_3 => "2:3",
        AspectRatio.Portrait_4_5 => "4:5",
        _ => "auto"
    };

    private static string ConvertResolution(Resolution res) => res switch
    {
        Resolution.R_1K => "1K",
        Resolution.R_2K => "2K",
        Resolution.R_4K => "4K",
        _ => "1K"
    };
}
