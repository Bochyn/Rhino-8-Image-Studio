using RhinoImageStudio.Shared.Enums;

namespace RhinoImageStudio.Shared.Contracts;

// ============================================================================
// Session Contracts
// ============================================================================

public record CreateSessionRequest(string Name, string? Description = null);

public record UpdateSessionRequest(string? Name = null, string? Description = null, bool? IsPinned = null);

public record SessionDto(
    Guid Id,
    string Name,
    string? Description,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    bool IsPinned,
    int CaptureCount,
    int GenerationCount,
    string? LastThumbnailUrl
);

public record SessionListResponse(List<SessionDto> Sessions, int TotalCount);

// ============================================================================
// Capture Contracts
// ============================================================================

public record CaptureRequest(
    Guid SessionId,
    int Width = 1024,
    int Height = 1024,
    DisplayMode DisplayMode = DisplayMode.Shaded,
    bool TransparentBackground = false
);

public record CaptureDto(
    Guid Id,
    Guid SessionId,
    string ImageUrl,
    string? ThumbnailUrl,
    int Width,
    int Height,
    DisplayMode DisplayMode,
    string? ViewName,
    DateTime CreatedAt
);

// ============================================================================
// Generation Contracts
// ============================================================================

public record GenerateRequest(
    Guid SessionId,
    string Prompt,
    Guid? SourceCaptureId = null,
    Guid? ParentGenerationId = null,
    AspectRatio AspectRatio = AspectRatio.Auto,
    Resolution Resolution = Resolution.R_1K,
    int NumImages = 1,
    ImageFormat OutputFormat = ImageFormat.Png
);

public record RefineRequest(
    Guid SessionId,
    Guid ParentGenerationId,
    string Prompt
);

public record MultiAngleRequest(
    Guid SessionId,
    Guid SourceGenerationId,
    double Azimuth = 0,
    double Elevation = 0,
    double Zoom = 5,
    int NumImages = 1
);

public record UpscaleRequest(
    Guid SessionId,
    Guid SourceGenerationId,
    int UpscaleFactor = 2,
    string? Prompt = null,
    double Creativity = 0.35
);

public record GenerationDto(
    Guid Id,
    Guid SessionId,
    Guid? ParentGenerationId,
    Guid? SourceCaptureId,
    JobType Stage,
    string? Prompt,
    string? ImageUrl,
    string? ThumbnailUrl,
    int? Width,
    int? Height,
    double? Azimuth,
    double? Elevation,
    DateTime CreatedAt
);

// ============================================================================
// Job Contracts
// ============================================================================

public record JobDto(
    Guid Id,
    Guid SessionId,
    JobType Type,
    JobStatus Status,
    int Progress,
    string? ProgressMessage,
    string? ErrorMessage,
    Guid? ResultId,
    DateTime CreatedAt,
    DateTime? StartedAt,
    DateTime? CompletedAt
);

public record JobProgressEvent(
    Guid JobId,
    JobStatus Status,
    int Progress,
    string? Message,
    Guid? ResultId = null
);

// ============================================================================
// Config Contracts
// ============================================================================

public record ConfigDto(
    bool HasApiKey,
    string DataPath,
    int BackendPort
);

public record SetApiKeyRequest(string ApiKey);

// ============================================================================
// Export Contracts
// ============================================================================

public record ExportRequest(
    Guid GenerationId,
    ImageFormat Format = ImageFormat.Png,
    int? Width = null,
    int? Height = null,
    bool IncludeMetadata = true
);

public record ExportResult(
    string FilePath,
    long FileSizeBytes
);
