namespace RhinoImageStudio.Shared.Constants;

/// <summary>
/// API route constants
/// </summary>
public static class Routes
{
    public const string ApiBase = "/api";

    // Sessions
    public const string Sessions = $"{ApiBase}/sessions";
    public const string SessionById = $"{Sessions}/{{id}}";

    // Captures
    public const string Captures = $"{ApiBase}/captures";
    public const string CaptureById = $"{Captures}/{{id}}";
    public const string CapturesBySession = $"{Sessions}/{{sessionId}}/captures";

    // Jobs
    public const string Jobs = $"{ApiBase}/jobs";
    public const string JobById = $"{Jobs}/{{id}}";
    public const string JobsBySession = $"{Sessions}/{{sessionId}}/jobs";
    public const string JobCancel = $"{JobById}/cancel";

    // Generations
    public const string Generations = $"{ApiBase}/generations";
    public const string GenerationById = $"{Generations}/{{id}}";
    public const string GenerationsBySession = $"{Sessions}/{{sessionId}}/generations";

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
    public const string EventsBySession = $"{Sessions}/{{sessionId}}/events";

    // Static files (images)
    public const string Images = "/images";
    public const string Thumbnails = "/thumbnails";
}

/// <summary>
/// fal.ai model identifiers
/// </summary>
public static class FalModels
{
    public const string NanoBananaPro = "fal-ai/nano-banana-pro";
    public const string NanoBananaProEdit = "fal-ai/nano-banana-pro/edit";
    public const string QwenMultipleAngles = "fal-ai/qwen-image-edit-2511-multiple-angles";
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
