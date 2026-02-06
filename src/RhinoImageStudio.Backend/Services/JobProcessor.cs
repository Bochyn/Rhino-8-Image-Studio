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
        var geminiClient = scope.ServiceProvider.GetRequiredService<IGeminiClient>();
        var secretStorage = scope.ServiceProvider.GetRequiredService<ISecretStorage>();
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
                JobType.Generate => await ProcessGenerateJobAsync(job, dbContext, falClient, geminiClient, secretStorage, storage, cancellationToken),
                JobType.Refine => await ProcessRefineJobAsync(job, dbContext, falClient, geminiClient, secretStorage, storage, cancellationToken),
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
        // Update job in-memory for broadcast
        job.Progress = progress;
        job.ProgressMessage = message;
        if (resultId.HasValue) job.ResultId = resultId;

        // Send full JobDto so frontend can properly update state
        var jobDto = new JobDto(
            Id: job.Id,
            ProjectId: job.ProjectId,
            Type: job.Type,
            Status: job.Status,
            Progress: progress,
            ProgressMessage: message,
            ErrorMessage: job.ErrorMessage,
            ResultId: resultId,
            CreatedAt: job.CreatedAt,
            StartedAt: job.StartedAt,
            CompletedAt: job.CompletedAt
        );
        _eventBroadcaster.BroadcastToProject(job.ProjectId, jobDto);
    }

    private async Task<Guid> ProcessGenerateJobAsync(
        Job job,
        AppDbContext dbContext,
        IFalAiClient falClient,
        IGeminiClient geminiClient,
        ISecretStorage secretStorage,
        IStorageService storage,
        CancellationToken cancellationToken)
    {
        var request = JsonSerializer.Deserialize<GenerateRequest>(job.RequestJson)
            ?? throw new InvalidOperationException("Invalid generate request");

        // Serialize generation parameters for history restoration
        var parametersJson = JsonSerializer.Serialize(new
        {
            aspectRatio = request.AspectRatio,
            resolution = request.Resolution,
            numImages = request.NumImages,
            outputFormat = request.OutputFormat
        });

        BroadcastProgress(job, 10, "Preparing input...");

        // Get source image if provided (from Capture or parent Generation)
        byte[]? sourceImageData = null;
        if (request.SourceCaptureId.HasValue)
        {
            var capture = await dbContext.Captures.FindAsync(new object[] { request.SourceCaptureId.Value }, cancellationToken);
            if (capture != null)
            {
                sourceImageData = await storage.ReadFileAsync(capture.FilePath, cancellationToken);
            }
        }
        else if (request.ParentGenerationId.HasValue)
        {
            var parentGeneration = await dbContext.Generations.FindAsync(new object[] { request.ParentGenerationId.Value }, cancellationToken);
            if (parentGeneration?.FilePath != null)
            {
                sourceImageData = await storage.ReadFileAsync(parentGeneration.FilePath, cancellationToken);
            }
        }

        // Determine which provider to use based on model selection and available keys
        var hasGeminiKey = await secretStorage.HasSecretAsync("gemini_api_key");
        var hasFalKey = await secretStorage.HasSecretAsync("fal_api_key");
        
        // Determine the model to use
        var selectedModel = request.Model ?? GeminiModels.NanoBanana; // Default to Gemini 2.5 Flash
        var isGeminiModel = selectedModel.StartsWith("gemini-");
        var isFalModel = selectedModel.StartsWith("fal-");

        Generation generation;

        if (isGeminiModel && hasGeminiKey)
        {
            // Use Gemini with selected model
            BroadcastProgress(job, 20, $"Generating with {selectedModel}...");

            var config = new GeminiImageConfig(
                Model: selectedModel,
                OutputFormat: request.OutputFormat?.ToLowerInvariant() ?? "png",
                AspectRatio: request.AspectRatio ?? "1:1",
                ImageSize: request.Resolution ?? "1K"
            );

            // Start simulated progress updates while waiting for Gemini
            using var progressCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            var progressTask = SimulateProgressAsync(job, 20, 85, progressCts.Token);

            GeminiImageResult geminiResult;
            try
            {
                geminiResult = await geminiClient.GenerateImageAsync(
                    request.Prompt,
                    sourceImageData,
                    config,
                    cancellationToken);
            }
            finally
            {
                // Stop simulated progress
                progressCts.Cancel();
                try { await progressTask; } catch (OperationCanceledException) { }
            }

            BroadcastProgress(job, 90, "Saving result...");

            generation = await SaveGeminiGenerationResultAsync(
                job.ProjectId,
                request.SourceCaptureId,
                null,
                JobType.Generate,
                request.Prompt,
                geminiResult,
                selectedModel,
                dbContext,
                storage,
                cancellationToken,
                parametersJson);
        }
        else if (isFalModel && hasFalKey)
        {
            // Fallback to fal.ai
            BroadcastProgress(job, 20, "Generating with fal.ai...");

            var falInput = new Dictionary<string, object>
            {
                ["prompt"] = request.Prompt,
                ["num_images"] = request.NumImages,
                ["aspect_ratio"] = request.AspectRatio ?? "1:1",
                ["resolution"] = request.Resolution ?? "1K",
                ["output_format"] = request.OutputFormat?.ToLowerInvariant() ?? "png"
            };

            if (sourceImageData != null)
            {
                var imageUrl = await falClient.UploadImageAsync(sourceImageData, $"{request.SourceCaptureId}.png", cancellationToken);
                falInput["image_urls"] = new[] { imageUrl };
            }

            var queueResponse = await falClient.SubmitAsync(FalModels.NanoBananaEdit, falInput, cancellationToken);
            job.FalRequestId = queueResponse.RequestId;
            dbContext.Jobs.Update(job);
            await dbContext.SaveChangesAsync(cancellationToken);

            var result = await PollForResultAsync(job, falClient, FalModels.NanoBananaEdit, queueResponse.RequestId, cancellationToken);

            BroadcastProgress(job, 90, "Saving result...");

            generation = await SaveGenerationResultAsync(
                job.ProjectId,
                request.SourceCaptureId,
                null,
                JobType.Generate,
                request.Prompt,
                result,
                dbContext,
                storage,
                cancellationToken,
                parametersJson);
        }
        else
        {
            throw new InvalidOperationException("No API key configured. Please set a Gemini or fal.ai API key in Settings.");
        }

        return generation.Id;
    }

    private async Task<Guid> ProcessRefineJobAsync(
        Job job,
        AppDbContext dbContext,
        IFalAiClient falClient,
        IGeminiClient geminiClient,
        ISecretStorage secretStorage,
        IStorageService storage,
        CancellationToken cancellationToken)
    {
        var request = JsonSerializer.Deserialize<RefineRequest>(job.RequestJson)
            ?? throw new InvalidOperationException("Invalid refine request");

        var parentGeneration = await dbContext.Generations.FindAsync(new object[] { request.ParentGenerationId }, cancellationToken)
            ?? throw new InvalidOperationException("Parent generation not found");

        BroadcastProgress(job, 10, "Preparing input...");

        var imageData = await storage.ReadFileAsync(parentGeneration.FilePath!, cancellationToken);

        // Determine which provider to use - Gemini is primary
        var hasGeminiKey = await secretStorage.HasSecretAsync("gemini_api_key");
        var hasFalKey = await secretStorage.HasSecretAsync("fal_api_key");

        Generation generation;

        if (hasGeminiKey)
        {
            BroadcastProgress(job, 20, "Refining with Gemini Nano Banana...");

            var geminiResult = await geminiClient.EditImageAsync(
                request.Prompt,
                imageData,
                new GeminiImageConfig(Model: GeminiModels.NanoBanana),
                cancellationToken);

            BroadcastProgress(job, 90, "Saving result...");

            generation = await SaveGeminiGenerationResultAsync(
                job.ProjectId,
                parentGeneration.SourceCaptureId,
                request.ParentGenerationId,
                JobType.Refine,
                request.Prompt,
                geminiResult,
                GeminiModels.NanoBanana,
                dbContext,
                storage,
                cancellationToken);
        }
        else if (hasFalKey)
        {
            var imageUrl = await falClient.UploadImageAsync(imageData, $"{parentGeneration.Id}.png", cancellationToken);

            var falInput = new Dictionary<string, object>
            {
                ["prompt"] = request.Prompt,
                ["image_urls"] = new[] { imageUrl },
                ["num_images"] = 1
            };

            BroadcastProgress(job, 20, "Refining with fal.ai...");

            var queueResponse = await falClient.SubmitAsync(FalModels.NanoBananaEdit, falInput, cancellationToken);
            job.FalRequestId = queueResponse.RequestId;

            var refineResult = await PollForResultAsync(job, falClient, FalModels.NanoBananaEdit, queueResponse.RequestId, cancellationToken);

            BroadcastProgress(job, 90, "Saving result...");

            generation = await SaveGenerationResultAsync(
                job.ProjectId,
                parentGeneration.SourceCaptureId,
                request.ParentGenerationId,
                JobType.Refine,
                request.Prompt,
                refineResult,
                dbContext,
                storage,
                cancellationToken);
        }
        else
        {
            throw new InvalidOperationException("No API key configured. Please set a Gemini or fal.ai API key in Settings.");
        }

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

        // Support both generation and capture as source
        string? sourceFilePath = null;
        Guid? sourceCaptureId = request.SourceCaptureId;
        Guid? sourceGenerationId = request.SourceGenerationId;
        Guid sourceId;

        if (request.SourceGenerationId.HasValue)
        {
            var sourceGeneration = await dbContext.Generations.FindAsync(new object[] { request.SourceGenerationId.Value }, cancellationToken)
                ?? throw new InvalidOperationException("Source generation not found");
            sourceFilePath = sourceGeneration.FilePath;
            sourceCaptureId = sourceGeneration.SourceCaptureId;
            sourceId = sourceGeneration.Id;
        }
        else if (request.SourceCaptureId.HasValue)
        {
            var sourceCapture = await dbContext.Captures.FindAsync(new object[] { request.SourceCaptureId.Value }, cancellationToken)
                ?? throw new InvalidOperationException("Source capture not found");
            sourceFilePath = sourceCapture.FilePath;
            sourceCaptureId = sourceCapture.Id;
            sourceId = sourceCapture.Id;
        }
        else
        {
            throw new InvalidOperationException("Either SourceGenerationId or SourceCaptureId must be provided");
        }

        BroadcastProgress(job, 10, "Preparing input...");

        var maImageData = await storage.ReadFileAsync(sourceFilePath!, cancellationToken);
        var maImageUrl = await falClient.UploadImageAsync(maImageData, $"{sourceId}.png", cancellationToken);

        var maFalInput = new Dictionary<string, object>
        {
            ["image_urls"] = new[] { maImageUrl },
            ["horizontal_angle"] = request.HorizontalAngle,
            ["vertical_angle"] = request.VerticalAngle,
            ["zoom"] = request.Zoom,
            ["lora_scale"] = request.LoraScale,
            ["num_images"] = request.NumImages
        };

        BroadcastProgress(job, 20, "Submitting to fal.ai...");

        var maQueueResponse = await falClient.SubmitAsync(FalModels.QwenMultipleAngles, maFalInput, cancellationToken);
        job.FalRequestId = maQueueResponse.RequestId;

        var maResult = await PollForResultAsync(job, falClient, FalModels.QwenMultipleAngles, maQueueResponse.RequestId, cancellationToken);

        BroadcastProgress(job, 90, "Saving result...");

        var maGeneration = await SaveGenerationResultAsync(
            job.ProjectId,
            sourceCaptureId,
            sourceGenerationId,
            JobType.MultiAngle,
            maResult.Prompt,
            maResult,
            dbContext,
            storage,
            cancellationToken);

        maGeneration.Azimuth = request.HorizontalAngle;
        maGeneration.Elevation = request.VerticalAngle;
        maGeneration.Zoom = request.Zoom;
        await dbContext.SaveChangesAsync(cancellationToken);

        return maGeneration.Id;
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

        var upImageData = await storage.ReadFileAsync(sourceGeneration.FilePath!, cancellationToken);
        var upImageUrl = await falClient.UploadImageAsync(upImageData, $"{sourceGeneration.Id}.png", cancellationToken);

        // Build Topaz upscale input
        var upFalInput = new Dictionary<string, object>
        {
            ["image_url"] = upImageUrl,
            ["upscale_factor"] = request.UpscaleFactor,
            ["model"] = request.Model,
            ["face_enhancement"] = request.FaceEnhancement,
            ["output_format"] = request.OutputFormat.ToString().ToLowerInvariant()
        };

        BroadcastProgress(job, 20, "Submitting to fal.ai...");

        var upQueueResponse = await falClient.SubmitAsync(FalModels.TopazUpscale, upFalInput, cancellationToken);
        job.FalRequestId = upQueueResponse.RequestId;

        var upResult = await PollForResultAsync(job, falClient, FalModels.TopazUpscale, upQueueResponse.RequestId, cancellationToken);

        BroadcastProgress(job, 90, "Saving result...");

        var upGeneration = await SaveGenerationResultAsync(
            job.ProjectId,
            sourceGeneration.SourceCaptureId,
            request.SourceGenerationId,
            JobType.Upscale,
            null, // Topaz upscaler doesn't use prompt
            upResult,
            dbContext,
            storage,
            cancellationToken);

        return upGeneration.Id;
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
        Guid projectId,
        Guid? sourceCaptureId,
        Guid? parentGenerationId,
        JobType stage,
        string? prompt,
        FalResultResponse result,
        AppDbContext dbContext,
        IStorageService storage,
        CancellationToken cancellationToken,
        string? parametersJson = null)
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
            ProjectId = projectId,
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
                JobType.Generate => FalModels.NanoBananaEdit,
                JobType.Refine => FalModels.NanoBananaEdit,
                JobType.MultiAngle => FalModels.QwenMultipleAngles,
                JobType.Upscale => FalModels.TopazUpscale,
                _ => null
            },
            ParametersJson = parametersJson
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

    /// <summary>
    /// Save generation result from Gemini API (returns image data directly, no download needed)
    /// </summary>
    private async Task<Generation> SaveGeminiGenerationResultAsync(
        Guid projectId,
        Guid? sourceCaptureId,
        Guid? parentGenerationId,
        JobType stage,
        string? prompt,
        GeminiImageResult result,
        string modelId,
        AppDbContext dbContext,
        IStorageService storage,
        CancellationToken cancellationToken,
        string? parametersJson = null)
    {
        var extension = result.MimeType.Contains("png") ? "png" : "jpg";

        var generation = new Generation
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            SourceCaptureId = sourceCaptureId,
            ParentGenerationId = parentGenerationId,
            Stage = stage,
            Prompt = prompt,
            Width = null, // Gemini doesn't return dimensions in response
            Height = null,
            Seed = null,
            FalRequestId = null,
            ModelId = modelId,
            ParametersJson = parametersJson
        };

        // Save image file
        generation.FilePath = await storage.SaveGenerationAsync(generation.Id, result.ImageData, extension, cancellationToken);

        // Generate and save thumbnail
        generation.ThumbnailPath = await storage.SaveThumbnailAsync(generation.Id, result.ImageData, cancellationToken);

        dbContext.Generations.Add(generation);
        await dbContext.SaveChangesAsync(cancellationToken);

        return generation;
    }

    /// <summary>
    /// Simulates progress updates while waiting for a synchronous API call.
    /// Progress increases gradually from startProgress to maxProgress.
    /// </summary>
    private async Task SimulateProgressAsync(Job job, int startProgress, int maxProgress, CancellationToken cancellationToken)
    {
        var progress = startProgress;
        var progressMessages = new[]
        {
            "Analyzing input...",
            "Processing with AI...",
            "Generating image...",
            "Refining details...",
            "Almost there..."
        };
        var messageIndex = 0;

        try
        {
            while (progress < maxProgress && !cancellationToken.IsCancellationRequested)
            {
                await Task.Delay(800, cancellationToken);

                // Increase progress with diminishing returns (slower as it approaches max)
                var remaining = maxProgress - progress;
                var increment = Math.Max(1, remaining / 8);
                progress = Math.Min(progress + increment, maxProgress);

                // Cycle through progress messages
                var message = progressMessages[messageIndex % progressMessages.Length];
                if (progress > startProgress + (maxProgress - startProgress) / 3)
                    messageIndex = Math.Min(messageIndex + 1, progressMessages.Length - 1);

                BroadcastProgress(job, progress, message);
            }
        }
        catch (OperationCanceledException)
        {
            // Expected when the actual API call completes
        }
    }
}
