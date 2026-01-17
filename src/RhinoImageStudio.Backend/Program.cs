using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using RhinoImageStudio.Backend.Data;
using RhinoImageStudio.Backend.Services;
using RhinoImageStudio.Shared.Constants;
using RhinoImageStudio.Shared.Contracts;
using RhinoImageStudio.Shared.Enums;
using RhinoImageStudio.Shared.Models;

// JSON options with enum string converter for SSE events
var jsonOptions = new JsonSerializerOptions
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    Converters = { new JsonStringEnumConverter() }
};

var builder = WebApplication.CreateBuilder(args);

// Parse command line for port
var port = Defaults.DefaultPort;
var portArg = args.FirstOrDefault(a => a.StartsWith("--port="));
if (portArg != null && int.TryParse(portArg.Split('=')[1], out var parsedPort))
{
    port = parsedPort;
}

// Configure Kestrel to listen on localhost only
builder.WebHost.ConfigureKestrel(options =>
{
    options.Listen(IPAddress.Loopback, port);
});

// Database
var dbPath = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
    "RhinoImageStudio",
    Defaults.DatabaseName
);
Directory.CreateDirectory(Path.GetDirectoryName(dbPath)!);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

// Services
builder.Services.AddSingleton<IJobQueue, JobQueue>();
builder.Services.AddSingleton<IEventBroadcaster, EventBroadcaster>();
builder.Services.AddSingleton<ISecretStorage, DpapiSecretStorage>();
builder.Services.AddSingleton<IStorageService, StorageService>();
builder.Services.AddHttpClient<IFalAiClient, FalAiClient>();
builder.Services.AddHttpClient<IGeminiClient, GeminiClient>();
builder.Services.AddHostedService<JobProcessor>();

// Configure JSON to serialize enums as strings
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});

// CORS for localhost UI
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins($"http://localhost:{port}", $"http://127.0.0.1:{port}", "null")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// API documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Rhino Image Studio API", Version = "v1" });
});

var app = builder.Build();

// Apply migrations
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

// Middleware
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Serve static files (React UI)
app.UseStaticFiles();

// ============================================================================
// API Endpoints
// ============================================================================

var api = app.MapGroup("/api");

// --- Health Check ---
api.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// --- Projects ---
api.MapGet("/projects", async (AppDbContext db) =>
{
    var projects = await db.Projects
        .OrderByDescending(s => s.IsPinned)
        .ThenByDescending(s => s.UpdatedAt)
        .Select(s => new ProjectDto(
            s.Id,
            s.Name,
            s.Description,
            s.CreatedAt,
            s.UpdatedAt,
            s.IsPinned,
            s.Captures.Count,
            s.Generations.Count,
            s.Generations.OrderByDescending(g => g.CreatedAt).FirstOrDefault()!.ThumbnailPath
        ))
        .ToListAsync();

    return Results.Ok(new ProjectListResponse(projects, projects.Count));
});

api.MapGet("/projects/{id:guid}", async (Guid id, AppDbContext db) =>
{
    var project = await db.Projects.FindAsync(id);
    return project is null ? Results.NotFound() : Results.Ok(project);
});

api.MapPost("/projects", async (CreateProjectRequest request, AppDbContext db) =>
{
    var project = new Project
    {
        Name = request.Name,
        Description = request.Description
    };

    db.Projects.Add(project);
    await db.SaveChangesAsync();

    return Results.Created($"/api/projects/{project.Id}", project);
});

api.MapPut("/projects/{id:guid}", async (Guid id, UpdateProjectRequest request, AppDbContext db) =>
{
    var project = await db.Projects.FindAsync(id);
    if (project is null) return Results.NotFound();

    if (request.Name is not null) project.Name = request.Name;
    if (request.Description is not null) project.Description = request.Description;
    if (request.IsPinned.HasValue) project.IsPinned = request.IsPinned.Value;
    project.UpdatedAt = DateTime.UtcNow;

    await db.SaveChangesAsync();
    return Results.Ok(project);
});

api.MapDelete("/projects/{id:guid}", async (Guid id, AppDbContext db, IStorageService storage) =>
{
    var project = await db.Projects
        .Include(s => s.Captures)
        .Include(s => s.Generations)
        .FirstOrDefaultAsync(s => s.Id == id);

    if (project is null) return Results.NotFound();

    // Delete files
    foreach (var capture in project.Captures)
    {
        await storage.DeleteFileAsync(capture.FilePath);
        if (capture.ThumbnailPath != null)
            await storage.DeleteFileAsync(capture.ThumbnailPath);
    }
    foreach (var generation in project.Generations)
    {
        if (generation.FilePath != null)
            await storage.DeleteFileAsync(generation.FilePath);
        if (generation.ThumbnailPath != null)
            await storage.DeleteFileAsync(generation.ThumbnailPath);
    }

    db.Projects.Remove(project);
    await db.SaveChangesAsync();

    return Results.NoContent();
});

// --- Captures ---
api.MapGet("/projects/{projectId:guid}/captures", async (Guid projectId, AppDbContext db) =>
{
    var captures = await db.Captures
        .Where(c => c.ProjectId == projectId)
        .OrderByDescending(c => c.CreatedAt)
        .Select(c => new CaptureDto(
            c.Id,
            c.ProjectId,
            $"/images/{c.FilePath}",
            c.ThumbnailPath != null ? $"/images/{c.ThumbnailPath}" : null,
            c.Width,
            c.Height,
            c.DisplayMode,
            c.ViewName,
            c.CreatedAt
        ))
        .ToListAsync();

    return Results.Ok(captures);
});

api.MapPost("/captures", async (HttpRequest httpRequest, AppDbContext db, IStorageService storage) =>
{
    // Expect multipart form with image and metadata
    var form = await httpRequest.ReadFormAsync();
    var file = form.Files.GetFile("image");
    var projectIdStr = form["projectId"].ToString();
    var widthStr = form["width"].ToString();
    var heightStr = form["height"].ToString();
    var displayModeStr = form["displayMode"].ToString();
    var viewName = form["viewName"].ToString();

    if (file is null || !Guid.TryParse(projectIdStr, out var projectId))
    {
        return Results.BadRequest("Missing image or projectId");
    }

    using var ms = new MemoryStream();
    await file.CopyToAsync(ms);
    var imageData = ms.ToArray();

    var capture = new Capture
    {
        ProjectId = projectId,
        Width = int.TryParse(widthStr, out var w) ? w : 1024,
        Height = int.TryParse(heightStr, out var h) ? h : 1024,
        DisplayMode = Enum.TryParse<DisplayMode>(displayModeStr, out var dm) ? dm : DisplayMode.Shaded,
        ViewName = string.IsNullOrEmpty(viewName) ? null : viewName
    };

    capture.FilePath = await storage.SaveCaptureAsync(capture.Id, imageData);
    capture.ThumbnailPath = await storage.SaveThumbnailAsync(capture.Id, imageData);

    db.Captures.Add(capture);
    await db.SaveChangesAsync();

    // Update project timestamp
    var project = await db.Projects.FindAsync(projectId);
    if (project != null)
    {
        project.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    return Results.Created($"/api/captures/{capture.Id}", new CaptureDto(
        capture.Id,
        capture.ProjectId,
        $"/images/{capture.FilePath}",
        capture.ThumbnailPath != null ? $"/images/{capture.ThumbnailPath}" : null,
        capture.Width,
        capture.Height,
        capture.DisplayMode,
        capture.ViewName,
        capture.CreatedAt
    ));
});

// Delete capture
api.MapDelete("/captures/{id:guid}", async (Guid id, AppDbContext db, IStorageService storage) =>
{
    var capture = await db.Captures.FindAsync(id);
    if (capture is null) return Results.NotFound();

    // Delete files
    await storage.DeleteFileAsync(capture.FilePath);
    if (capture.ThumbnailPath != null)
        await storage.DeleteFileAsync(capture.ThumbnailPath);

    db.Captures.Remove(capture);
    await db.SaveChangesAsync();

    return Results.NoContent();
});

// --- Generations ---
api.MapGet("/projects/{projectId:guid}/generations", async (Guid projectId, AppDbContext db) =>
{
    var generations = await db.Generations
        .Where(g => g.ProjectId == projectId)
        .OrderByDescending(g => g.CreatedAt)
        .Select(g => new GenerationDto(
            g.Id,
            g.ProjectId,
            g.ParentGenerationId,
            g.SourceCaptureId,
            g.Stage,
            g.Prompt,
            g.FilePath != null ? $"/images/{g.FilePath}" : null,
            g.ThumbnailPath != null ? $"/images/{g.ThumbnailPath}" : null,
            g.Width,
            g.Height,
            g.Azimuth,
            g.Elevation,
            g.CreatedAt
        ))
        .ToListAsync();

    return Results.Ok(generations);
});

// Global generations list (for Generations tab on home page)
api.MapGet("/generations", async (AppDbContext db, int? limit, int? offset) =>
{
    var query = db.Generations
        .Include(g => g.Project)
        .OrderByDescending(g => g.CreatedAt);

    var total = await query.CountAsync();
    
    var generations = await query
        .Skip(offset ?? 0)
        .Take(limit ?? 50)
        .Select(g => new GenerationDto(
            g.Id,
            g.ProjectId,
            g.ParentGenerationId,
            g.SourceCaptureId,
            g.Stage,
            g.Prompt,
            g.FilePath != null ? $"/images/{g.FilePath}" : null,
            g.ThumbnailPath != null ? $"/images/{g.ThumbnailPath}" : null,
            g.Width,
            g.Height,
            g.Azimuth,
            g.Elevation,
            g.CreatedAt
        ))
        .ToListAsync();

    return Results.Ok(new { generations, total });
});

api.MapGet("/generations/{id:guid}", async (Guid id, AppDbContext db) =>
{
    var generation = await db.Generations.FindAsync(id);
    if (generation is null) return Results.NotFound();

    return Results.Ok(new GenerationDto(
        generation.Id,
        generation.ProjectId,
        generation.ParentGenerationId,
        generation.SourceCaptureId,
        generation.Stage,
        generation.Prompt,
        generation.FilePath != null ? $"/images/{generation.FilePath}" : null,
        generation.ThumbnailPath != null ? $"/images/{generation.ThumbnailPath}" : null,
        generation.Width,
        generation.Height,
        generation.Azimuth,
        generation.Elevation,
        generation.CreatedAt
    ));
});

// --- Jobs ---
api.MapGet("/projects/{projectId:guid}/jobs", async (Guid projectId, AppDbContext db) =>
{
    var jobs = await db.Jobs
        .Where(j => j.ProjectId == projectId)
        .OrderByDescending(j => j.CreatedAt)
        .Select(j => new JobDto(
            j.Id,
            j.ProjectId,
            j.Type,
            j.Status,
            j.Progress,
            j.ProgressMessage,
            j.ErrorMessage,
            j.ResultId,
            j.CreatedAt,
            j.StartedAt,
            j.CompletedAt
        ))
        .ToListAsync();

    return Results.Ok(jobs);
});

api.MapPost("/jobs/{id:guid}/cancel", async (Guid id, AppDbContext db, IFalAiClient falClient) =>
{
    var job = await db.Jobs.FindAsync(id);
    if (job is null) return Results.NotFound();

    if (job.Status == JobStatus.Queued || job.Status == JobStatus.Running)
    {
        // Try to cancel fal.ai job
        if (!string.IsNullOrEmpty(job.FalRequestId))
        {
            try
            {
                var modelId = job.Type switch
                {
                    JobType.Generate => FalModels.NanoBananaEdit,
                    JobType.Refine => FalModels.NanoBananaEdit,
                    JobType.MultiAngle => FalModels.QwenMultipleAngles,
                    JobType.Upscale => FalModels.TopazUpscale,
                    _ => FalModels.NanoBananaEdit
                };
                await falClient.CancelAsync(modelId, job.FalRequestId);
            }
            catch { /* Ignore cancel errors */ }
        }

        job.Status = JobStatus.Canceled;
        job.CompletedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    return Results.Ok(job);
});

// --- Pipeline Actions ---
api.MapPost("/generate", async (GenerateRequest request, AppDbContext db, IJobQueue jobQueue) =>
{
    var job = new Job
    {
        ProjectId = request.ProjectId,
        Type = JobType.Generate,
        RequestJson = JsonSerializer.Serialize(request)
    };

    db.Jobs.Add(job);
    await db.SaveChangesAsync();
    await jobQueue.EnqueueAsync(job);

    return Results.Accepted($"/api/jobs/{job.Id}", new JobDto(
        job.Id, job.ProjectId, job.Type, job.Status, job.Progress,
        job.ProgressMessage, job.ErrorMessage, job.ResultId,
        job.CreatedAt, job.StartedAt, job.CompletedAt
    ));
});

api.MapPost("/refine", async (RefineRequest request, AppDbContext db, IJobQueue jobQueue) =>
{
    var job = new Job
    {
        ProjectId = request.ProjectId,
        Type = JobType.Refine,
        RequestJson = JsonSerializer.Serialize(request)
    };

    db.Jobs.Add(job);
    await db.SaveChangesAsync();
    await jobQueue.EnqueueAsync(job);

    return Results.Accepted($"/api/jobs/{job.Id}", new JobDto(
        job.Id, job.ProjectId, job.Type, job.Status, job.Progress,
        job.ProgressMessage, job.ErrorMessage, job.ResultId,
        job.CreatedAt, job.StartedAt, job.CompletedAt
    ));
});

api.MapPost("/multi-angle", async (MultiAngleRequest request, AppDbContext db, IJobQueue jobQueue) =>
{
    var job = new Job
    {
        ProjectId = request.ProjectId,
        Type = JobType.MultiAngle,
        RequestJson = JsonSerializer.Serialize(request)
    };

    db.Jobs.Add(job);
    await db.SaveChangesAsync();
    await jobQueue.EnqueueAsync(job);

    return Results.Accepted($"/api/jobs/{job.Id}", new JobDto(
        job.Id, job.ProjectId, job.Type, job.Status, job.Progress,
        job.ProgressMessage, job.ErrorMessage, job.ResultId,
        job.CreatedAt, job.StartedAt, job.CompletedAt
    ));
});

api.MapPost("/upscale", async (UpscaleRequest request, AppDbContext db, IJobQueue jobQueue) =>
{
    var job = new Job
    {
        ProjectId = request.ProjectId,
        Type = JobType.Upscale,
        RequestJson = JsonSerializer.Serialize(request)
    };

    db.Jobs.Add(job);
    await db.SaveChangesAsync();
    await jobQueue.EnqueueAsync(job);

    return Results.Accepted($"/api/jobs/{job.Id}", new JobDto(
        job.Id, job.ProjectId, job.Type, job.Status, job.Progress,
        job.ProgressMessage, job.ErrorMessage, job.ResultId,
        job.CreatedAt, job.StartedAt, job.CompletedAt
    ));
});

// --- Config ---
api.MapGet("/config", async (ISecretStorage secrets, IStorageService storage) =>
{
    var hasFalApiKey = await secrets.HasSecretAsync("fal_api_key");
    var hasGeminiApiKey = await secrets.HasSecretAsync("gemini_api_key");
    return Results.Ok(new ConfigDto(hasFalApiKey, hasGeminiApiKey, storage.BasePath, port, "gemini"));
});

api.MapPost("/config/api-key", async (SetApiKeyRequest request, ISecretStorage secrets) =>
{
    // Legacy endpoint - defaults to fal.ai for backwards compatibility
    await secrets.SetSecretAsync("fal_api_key", request.ApiKey);
    return Results.Ok(new { success = true });
});

api.MapPost("/config/gemini-api-key", async (SetGeminiApiKeyRequest request, ISecretStorage secrets) =>
{
    await secrets.SetSecretAsync("gemini_api_key", request.ApiKey);
    return Results.Ok(new { success = true });
});

api.MapPost("/config/fal-api-key", async (SetFalApiKeyRequest request, ISecretStorage secrets) =>
{
    await secrets.SetSecretAsync("fal_api_key", request.ApiKey);
    return Results.Ok(new { success = true });
});

// --- SSE Events ---
api.MapGet("/events", async (IEventBroadcaster broadcaster, HttpContext context, CancellationToken cancellationToken) =>
{
    context.Response.ContentType = "text/event-stream";
    context.Response.Headers.CacheControl = "no-cache";
    context.Response.Headers.Connection = "keep-alive";

    await foreach (var evt in broadcaster.SubscribeAsync(cancellationToken))
    {
        var json = JsonSerializer.Serialize(evt, jsonOptions);
        await context.Response.WriteAsync($"data: {json}\n\n", cancellationToken);
        await context.Response.Body.FlushAsync(cancellationToken);
    }
});

api.MapGet("/projects/{projectId:guid}/events", async (Guid projectId, IEventBroadcaster broadcaster, HttpContext context, CancellationToken cancellationToken) =>
{
    context.Response.ContentType = "text/event-stream";
    context.Response.Headers.CacheControl = "no-cache";
    context.Response.Headers.Connection = "keep-alive";

    await foreach (var evt in broadcaster.SubscribeToProjectAsync(projectId, cancellationToken))
    {
        var json = JsonSerializer.Serialize(evt, jsonOptions);
        await context.Response.WriteAsync($"data: {json}\n\n", cancellationToken);
        await context.Response.Body.FlushAsync(cancellationToken);
    }
});

// --- Static Image Files ---
app.MapGet("/images/{**path}", async (string path, IStorageService storage) =>
{
    try
    {
        var data = await storage.ReadFileAsync(path);
        var contentType = path.EndsWith(".png") ? "image/png"
            : path.EndsWith(".jpg") || path.EndsWith(".jpeg") ? "image/jpeg"
            : path.EndsWith(".webp") ? "image/webp"
            : "application/octet-stream";
        return Results.File(data, contentType);
    }
    catch (FileNotFoundException)
    {
        return Results.NotFound();
    }
});

// Fallback to index.html for SPA routing
app.MapFallbackToFile("index.html");

Console.WriteLine($"Rhino Image Studio Backend starting on http://localhost:{port}");
app.Run();
