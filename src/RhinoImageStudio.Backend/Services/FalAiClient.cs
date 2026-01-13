using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using RhinoImageStudio.Shared.Constants;

namespace RhinoImageStudio.Backend.Services;

/// <summary>
/// Client service for fal.ai API interactions
/// </summary>
public interface IFalAiClient
{
    Task<string> UploadImageAsync(byte[] imageData, string fileName, CancellationToken cancellationToken = default);
    Task<FalQueueResponse> SubmitAsync(string modelId, object input, CancellationToken cancellationToken = default);
    Task<FalStatusResponse> GetStatusAsync(string modelId, string requestId, CancellationToken cancellationToken = default);
    Task<FalResultResponse> GetResultAsync(string modelId, string requestId, CancellationToken cancellationToken = default);
    Task CancelAsync(string modelId, string requestId, CancellationToken cancellationToken = default);
}

public class FalAiClient : IFalAiClient
{
    private readonly HttpClient _httpClient;
    private readonly ISecretStorage _secretStorage;
    private readonly ILogger<FalAiClient> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    private const string FalQueueBaseUrl = "https://queue.fal.run";
    private const string FalStorageUrl = "https://rest.alpha.fal.ai/storage/upload";

    public FalAiClient(
        HttpClient httpClient,
        ISecretStorage secretStorage,
        ILogger<FalAiClient> logger)
    {
        _httpClient = httpClient;
        _secretStorage = secretStorage;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };
    }

    private async Task<string> GetApiKeyAsync()
    {
        var apiKey = await _secretStorage.GetSecretAsync("fal_api_key");
        if (string.IsNullOrEmpty(apiKey))
        {
            throw new InvalidOperationException("fal.ai API key not configured. Please set it in Settings.");
        }
        return apiKey;
    }

    private async Task<HttpRequestMessage> CreateRequestAsync(HttpMethod method, string url)
    {
        var request = new HttpRequestMessage(method, url);
        var apiKey = await GetApiKeyAsync();
        request.Headers.Authorization = new AuthenticationHeaderValue("Key", apiKey);
        return request;
    }

    public async Task<string> UploadImageAsync(byte[] imageData, string fileName, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Uploading image to fal.ai storage: {FileName}", fileName);

        using var content = new MultipartFormDataContent();
        using var imageContent = new ByteArrayContent(imageData);
        imageContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        content.Add(imageContent, "file", fileName);

        var request = await CreateRequestAsync(HttpMethod.Post, FalStorageUrl);
        request.Content = content;

        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        var uploadResult = JsonSerializer.Deserialize<FalUploadResponse>(responseJson, _jsonOptions);

        _logger.LogInformation("Image uploaded successfully: {Url}", uploadResult?.Url);
        return uploadResult?.Url ?? throw new InvalidOperationException("Failed to get upload URL");
    }

    public async Task<FalQueueResponse> SubmitAsync(string modelId, object input, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Submitting job to fal.ai: {ModelId}", modelId);

        var url = $"{FalQueueBaseUrl}/{modelId}";
        var request = await CreateRequestAsync(HttpMethod.Post, url);

        var jsonContent = JsonSerializer.Serialize(input, _jsonOptions);
        request.Content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        var queueResponse = JsonSerializer.Deserialize<FalQueueResponse>(responseJson, _jsonOptions);

        _logger.LogInformation("Job submitted: {RequestId}", queueResponse?.RequestId);
        return queueResponse ?? throw new InvalidOperationException("Failed to parse queue response");
    }

    public async Task<FalStatusResponse> GetStatusAsync(string modelId, string requestId, CancellationToken cancellationToken = default)
    {
        var url = $"{FalQueueBaseUrl}/{modelId}/requests/{requestId}/status";
        var request = await CreateRequestAsync(HttpMethod.Get, url);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        return JsonSerializer.Deserialize<FalStatusResponse>(responseJson, _jsonOptions)
            ?? throw new InvalidOperationException("Failed to parse status response");
    }

    public async Task<FalResultResponse> GetResultAsync(string modelId, string requestId, CancellationToken cancellationToken = default)
    {
        var url = $"{FalQueueBaseUrl}/{modelId}/requests/{requestId}";
        var request = await CreateRequestAsync(HttpMethod.Get, url);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        return JsonSerializer.Deserialize<FalResultResponse>(responseJson, _jsonOptions)
            ?? throw new InvalidOperationException("Failed to parse result response");
    }

    public async Task CancelAsync(string modelId, string requestId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Canceling fal.ai job: {RequestId}", requestId);

        var url = $"{FalQueueBaseUrl}/{modelId}/requests/{requestId}/cancel";
        var request = await CreateRequestAsync(HttpMethod.Post, url);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        _logger.LogInformation("Job canceled: {RequestId}", requestId);
    }
}

// Response DTOs for fal.ai API

public record FalUploadResponse(
    [property: JsonPropertyName("url")] string Url
);

public record FalQueueResponse(
    [property: JsonPropertyName("request_id")] string RequestId,
    [property: JsonPropertyName("status")] string? Status
);

public record FalStatusResponse(
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("logs")] List<FalLogEntry>? Logs
);

public record FalLogEntry(
    [property: JsonPropertyName("message")] string Message,
    [property: JsonPropertyName("timestamp")] string? Timestamp
);

public record FalResultResponse(
    [property: JsonPropertyName("request_id")] string RequestId,
    [property: JsonPropertyName("images")] List<FalImage>? Images,
    [property: JsonPropertyName("image")] FalImage? Image,
    [property: JsonPropertyName("seed")] long? Seed,
    [property: JsonPropertyName("prompt")] string? Prompt
);

public record FalImage(
    [property: JsonPropertyName("url")] string Url,
    [property: JsonPropertyName("width")] int? Width,
    [property: JsonPropertyName("height")] int? Height,
    [property: JsonPropertyName("content_type")] string? ContentType
);
