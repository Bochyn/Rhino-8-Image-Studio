namespace RhinoImageStudio.Shared.Constants;

/// <summary>
/// API route constants
/// </summary>
public static class Routes
{
    public const string ApiBase = "/api";

    // Projects
    public const string Projects = $"{ApiBase}/projects";
    public const string ProjectById = $"{Projects}/{{id}}";

    // Captures
    public const string Captures = $"{ApiBase}/captures";
    public const string CaptureById = $"{Captures}/{{id}}";
    public const string CapturesByProject = $"{Projects}/{{projectId}}/captures";

    // Jobs
    public const string Jobs = $"{ApiBase}/jobs";
    public const string JobById = $"{Jobs}/{{id}}";
    public const string JobsByProject = $"{Projects}/{{projectId}}/jobs";
    public const string JobCancel = $"{JobById}/cancel";

    // Generations
    public const string Generations = $"{ApiBase}/generations";
    public const string GenerationById = $"{Generations}/{{id}}";
    public const string GenerationsByProject = $"{Projects}/{{projectId}}/generations";

    // Pipeline actions
    public const string Generate = $"{ApiBase}/generate";
    public const string Refine = $"{ApiBase}/refine";
    public const string MultiAngle = $"{ApiBase}/multi-angle";
    public const string Upscale = $"{ApiBase}/upscale";
    public const string Export = $"{ApiBase}/export";

    // Config
    public const string Config = $"{ApiBase}/config";
    public const string ConfigApiKey = $"{Config}/api-key";

    // Events (SSE)
    public const string Events = $"{ApiBase}/events";
    public const string EventsByProject = $"{Projects}/{{projectId}}/events";

    // Static files (images)
    public const string Images = "/images";
    public const string Thumbnails = "/thumbnails";
}

/// <summary>
/// fal.ai model identifiers
/// </summary>
public static class FalModels
{
    // Generation & Refine
    public const string NanoBananaPro = "fal-ai/nano-banana-pro";
    public const string NanoBananaEdit = "fal-ai/nano-banana/edit";
    
    // Multi-Angle
    public const string QwenMultipleAngles = "fal-ai/qwen-image-edit-2511-multiple-angles";
    
    // Upscale
    public const string TopazUpscale = "fal-ai/topaz/upscale/image";
    public const string ClarityUpscaler = "fal-ai/clarity-upscaler";
    public const string Esrgan = "fal-ai/esrgan";
    public const string CreativeUpscaler = "fal-ai/creative-upscaler";
}

/// <summary>
/// File storage paths
/// </summary>
public static class StoragePaths
{
    public const string Captures = "captures";
    public const string Generations = "generations";
    public const string Thumbnails = "thumbnails";
    public const string Exports = "exports";
    public const string Temp = "temp";
}

/// <summary>
/// Default values
/// </summary>
public static class Defaults
{
    public const int CaptureWidth = 1024;
    public const int CaptureHeight = 1024;
    public const int ThumbnailSize = 256;
    public const int DefaultPort = 17532;  // "RISTU" on phone keypad
    public const string DatabaseName = "rhinoimagestudio.db";
}
