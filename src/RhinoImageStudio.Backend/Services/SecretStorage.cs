using System.Security.Cryptography;
using System.Text;

namespace RhinoImageStudio.Backend.Services;

/// <summary>
/// Interface for secure secret storage
/// </summary>
public interface ISecretStorage
{
    Task<string?> GetSecretAsync(string key);
    Task SetSecretAsync(string key, string value);
    Task DeleteSecretAsync(string key);
    Task<bool> HasSecretAsync(string key);
}

/// <summary>
/// Secure secret storage using Windows DPAPI (Data Protection API)
/// </summary>
public class DpapiSecretStorage : ISecretStorage
{
    private readonly string _storageDirectory;
    private readonly ILogger<DpapiSecretStorage> _logger;

    public DpapiSecretStorage(ILogger<DpapiSecretStorage> logger, string? storagePath = null)
    {
        _logger = logger;
        _storageDirectory = storagePath ?? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "RhinoImageStudio",
            "secrets"
        );

        Directory.CreateDirectory(_storageDirectory);
    }

    private string GetFilePath(string key)
    {
        // Sanitize key for use as filename
        var safeKey = Convert.ToBase64String(Encoding.UTF8.GetBytes(key))
            .Replace("/", "_")
            .Replace("+", "-")
            .Replace("=", "");
        return Path.Combine(_storageDirectory, $"{safeKey}.enc");
    }

    public Task<string?> GetSecretAsync(string key)
    {
        var filePath = GetFilePath(key);

        if (!File.Exists(filePath))
        {
            _logger.LogDebug("Secret not found: {Key}", key);
            return Task.FromResult<string?>(null);
        }

        try
        {
            var encryptedData = File.ReadAllBytes(filePath);
            var decryptedData = ProtectedData.Unprotect(
                encryptedData,
                optionalEntropy: null,
                scope: DataProtectionScope.CurrentUser
            );

            var secret = Encoding.UTF8.GetString(decryptedData);
            _logger.LogDebug("Secret retrieved: {Key}", key);
            return Task.FromResult<string?>(secret);
        }
        catch (CryptographicException ex)
        {
            _logger.LogError(ex, "Failed to decrypt secret: {Key}", key);
            return Task.FromResult<string?>(null);
        }
    }

    public Task SetSecretAsync(string key, string value)
    {
        var filePath = GetFilePath(key);

        try
        {
            var plainData = Encoding.UTF8.GetBytes(value);
            var encryptedData = ProtectedData.Protect(
                plainData,
                optionalEntropy: null,
                scope: DataProtectionScope.CurrentUser
            );

            File.WriteAllBytes(filePath, encryptedData);
            _logger.LogInformation("Secret stored: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to store secret: {Key}", key);
            throw;
        }

        return Task.CompletedTask;
    }

    public Task DeleteSecretAsync(string key)
    {
        var filePath = GetFilePath(key);

        if (File.Exists(filePath))
        {
            File.Delete(filePath);
            _logger.LogInformation("Secret deleted: {Key}", key);
        }

        return Task.CompletedTask;
    }

    public Task<bool> HasSecretAsync(string key)
    {
        var filePath = GetFilePath(key);
        return Task.FromResult(File.Exists(filePath));
    }
}
