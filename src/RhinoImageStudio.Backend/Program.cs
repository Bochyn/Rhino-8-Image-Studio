using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RhinoImageStudio.Backend.Data;
using RhinoImageStudio.Backend.Services;
using RhinoImageStudio.Shared.Constants;
using RhinoImageStudio.Shared.Contracts;
using RhinoImageStudio.Shared.Enums;
using RhinoImageStudio.Shared.Models;

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
builder.Services.AddHostedService<JobProcessor>();

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

// --- Sessions ---
api.MapGet("/sessions", async (AppDbContext db) =>
{
    var sessions = await db.Sessions
        .OrderByDescending(s => s.IsPinned)
        .ThenByDescending(s => s.UpdatedAt)
        .Select(s => new SessionDto(
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

    return Results.Ok(new SessionListResponse(sessions, sessions.Count));
});

api.MapGet("/sessions/{id:guid}", async (Guid id, AppDbContext db) =>
{
    var session = await db.Sessions.FindAsync(id);
    return session is null ? Results.NotFound() : Results.Ok(session);
});

api.MapPost("/sessions", async (CreateSessionRequest request, AppDbContext db) =>
{
    var session = new Session
    {
        Name = request.Name,
        Description = request.Description
    };

    db.Sessions.Add(session);
    await db.SaveChangesAsync();

    return Results.Created($"/api/sessions/{session.Id}", session);
});

api.MapPut("/sessions/{id:guid}", async (Guid id, UpdateSessionRequest request, AppDbContext db) =>
{
    var session = await db.Sessions.FindAsync(id);
    if (session is null) return Results.NotFound();

    if (request.Name is not null) session.Name = request.Name;
    if (request.Description is not null) session.Description = request.Description;
    if (request.IsPinned.HasValue) session.IsPinned = request.IsPinned.Value;
    session.UpdatedAt = DateTime.UtcNow;

    await db.SaveChangesAsync();
    return Results.Ok(session);
});

api.MapDelete("/sessions/{id:guid}", async (Guid id, AppDbContext db, IStorageService storage) =>
{
    var session = await db.Sessions
        .Include(s => s.Captures)
        .Include(s => s.Generations)
        .FirstOrDefaultAsync(s => s.Id == id);

    if (session is null) return Results.NotFound();

    // Delete files
    foreach (var capture in session.Captures)
    {
        await storage.DeleteFileAsync(capture.FilePath);
        if (capture.ThumbnailPath != null)
            await storage.DeleteFileAsync(capture.ThumbnailPath);
    }
    foreach (var generation in session.Generations)
    {
        if (generation.FilePath != null)
            await storage.DeleteFileAsync(generation.FilePath);
        if (generation.ThumbnailPath != null)
            await storage.DeleteFileAsync(generation.ThumbnailPath);
    }

    db.Sessions.Remove(session);
    await db.SaveChangesAsync();

    return Results.NoContent();
});

// --- Captures ---
api.MapGet("/sessions/{sessionId:guid}/captures", async (Guid sessionId, AppDbContext db) =>
{
    var captures = await db.Captures
        .Where(c => c.SessionId == sessionId)
        .OrderByDescending(c => c.CreatedAt)
        .Select(c => new CaptureDto(
            c.Id,
            c.SessionId,
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
    var sessionIdStr = form["sessionId"].ToString();
    var widthStr = form["width"].ToString();
    var heightStr = form["height"].ToString();
    var displayModeStr = form["displayMode"].ToString();
    var viewName = form["viewName"].ToString();

    if (file is null || !Guid.TryParse(sessionIdStr, out var sessionId))
    {
        return Results.BadRequest("Missing image or sessionId");
    }

    using var ms = new MemoryStream();
    await file.CopyToAsync(ms);
    var imageData = ms.ToArray();

    var capture = new Capture
    {
        SessionId = sessionId,
        Width = int.TryParse(widthStr, out var w) ? w : 1024,
        Height = int.TryParse(heightStr, out var h) ? h : 1024,
        DisplayMode = Enum.TryParse<DisplayMode>(displayModeStr, out var dm) ? dm : DisplayMode.Shaded,
        ViewName = string.IsNullOrEmpty(viewName) ? null : viewName
    };

    capture.FilePath = await storage.SaveCaptureAsync(capture.Id, imageData);
    capture.ThumbnailPath = await storage.SaveThumbnailAsync(capture.Id, imageData);

    db.Captures.Add(capture);
    await db.SaveChangesAsync();

    // Update session timestamp
    var session = await db.Sessions.FindAsync(sessionId);
    if (session != null)
    {
        session.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    return Results.Created($"/api/captures/{capture.Id}", new CaptureDto(
        capture.Id,
        capture.SessionId,
        $"/images/{capture.FilePath}",
        capture.ThumbnailPath != null ? $"/images/{capture.ThumbnailPath}" : null,
        capture.Width,
        capture.Height,
        capture.DisplayMode,
        capture.ViewName,
        capture.CreatedAt
    ));
});

// --- Generations ---
api.MapGet("/sessions/{sessionId:guid}/generations", async (Guid sessionId, AppDbContext db) =>
{
    var generations = await db.Generations
        .Where(g => g.SessionId == sessionId)
        .OrderByDescending(g => g.CreatedAt)
        .Select(g => new GenerationDto(
            g.Id,
            g.SessionId,
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

api.MapGet("/generations/{id:guid}", async (Guid id, AppDbContext db) =>
{
    var generation = await db.Generations.FindAsync(id);
    if (generation is null) return Results.NotFound();

    return Results.Ok(new GenerationDto(
        generation.Id,
        generation.SessionId,
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
api.MapGet("/sessions/{sessionId:guid}/jobs", async (Guid sessionId, AppDbContext db) =>
{
    var jobs = await db.Jobs
        .Where(j => j.SessionId == sessionId)
        .OrderByDescending(j => j.CreatedAt)
        .Select(j => new JobDto(
            j.Id,
            j.SessionId,
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
                    JobType.Generate => FalModels.NanoBananaProEdit,
                    JobType.Refine => FalModels.NanoBananaProEdit,
                    JobType.MultiAngle => FalModels.QwenMultipleAngles,
                    JobType.Upscale => FalModels.ClarityUpscaler,
                    _ => FalModels.NanoBananaProEdit
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
        SessionId = request.SessionId,
        Type = JobType.Generate,
        RequestJson = JsonSerializer.Serialize(request)
    };

    db.Jobs.Add(job);
    await db.SaveChangesAsync();
    await jobQueue.EnqueueAsync(job);

    return Results.Accepted($"/api/jobs/{job.Id}", new JobDto(
        job.Id, job.SessionId, job.Type, job.Status, job.Progress,
        job.ProgressMessage, job.ErrorMessage, job.ResultId,
        job.CreatedAt, job.StartedAt, job.CompletedAt
    ));
});

api.MapPost("/refine", async (RefineRequest request, AppDbContext db, IJobQueue jobQueue) =>
{
    var job = new Job
    {
        SessionId = request.SessionId,
        Type = JobType.Refine,
        RequestJson = JsonSerializer.Serialize(request)
    };

    db.Jobs.Add(job);
    await db.SaveChangesAsync();
    await jobQueue.EnqueueAsync(job);

    return Results.Accepted($"/api/jobs/{job.Id}", new JobDto(
        job.Id, job.SessionId, job.Type, job.Status, job.Progress,
        job.ProgressMessage, job.ErrorMessage, job.ResultId,
        job.CreatedAt, job.StartedAt, job.CompletedAt
    ));
});

api.MapPost("/multi-angle", async (MultiAngleRequest request, AppDbContext db, IJobQueue jobQueue) =>
{
    var job = new Job
    {
        SessionId = request.SessionId,
        Type = JobType.MultiAngle,
        RequestJson = JsonSerializer.Serialize(request)
    };

    db.Jobs.Add(job);
    await db.SaveChangesAsync();
    await jobQueue.EnqueueAsync(job);

    return Results.Accepted($"/api/jobs/{job.Id}", new JobDto(
        job.Id, job.SessionId, job.Type, job.Status, job.Progress,
        job.ProgressMessage, job.ErrorMessage, job.ResultId,
        job.CreatedAt, job.StartedAt, job.CompletedAt
    ));
});

api.MapPost("/upscale", async (UpscaleRequest request, AppDbContext db, IJobQueue jobQueue) =>
{
    var job = new Job
    {
        SessionId = request.SessionId,
        Type = JobType.Upscale,
        RequestJson = JsonSerializer.Serialize(request)
    };

    db.Jobs.Add(job);
    await db.SaveChangesAsync();
    await jobQueue.EnqueueAsync(job);

    return Results.Accepted($"/api/jobs/{job.Id}", new JobDto(
        job.Id, job.SessionId, job.Type, job.Status, job.Progress,
        job.ProgressMessage, job.ErrorMessage, job.ResultId,
        job.CreatedAt, job.StartedAt, job.CompletedAt
    ));
});

// --- Config ---
api.MapGet("/config", async (ISecretStorage secrets, IStorageService storage) =>
{
    var hasApiKey = await secrets.HasSecretAsync("fal_api_key");
    return Results.Ok(new ConfigDto(hasApiKey, storage.BasePath, port));
});

api.MapPost("/config/api-key", async (SetApiKeyRequest request, ISecretStorage secrets) =>
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
        var json = JsonSerializer.Serialize(evt);
        await context.Response.WriteAsync($"data: {json}\n\n", cancellationToken);
        await context.Response.Body.FlushAsync(cancellationToken);
    }
});

api.MapGet("/sessions/{sessionId:guid}/events", async (Guid sessionId, IEventBroadcaster broadcaster, HttpContext context, CancellationToken cancellationToken) =>
{
    context.Response.ContentType = "text/event-stream";
    context.Response.Headers.CacheControl = "no-cache";
    context.Response.Headers.Connection = "keep-alive";

    await foreach (var evt in broadcaster.SubscribeToSessionAsync(sessionId, cancellationToken))
    {
        var json = JsonSerializer.Serialize(evt);
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
