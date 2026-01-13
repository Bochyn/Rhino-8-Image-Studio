using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using Rhino;
using RhinoImageStudio.Shared.Enums;

namespace RhinoImageStudio.Plugin;

/// <summary>
/// Bridge object exposed to JavaScript via WebView2 AddHostObjectToScript.
/// Provides Rhino-specific functionality to the React UI.
/// </summary>
[ComVisible(true)]
[ClassInterface(ClassInterfaceType.AutoDual)]
public class RhinoBridge
{
    private readonly int _backendPort;
    private readonly HttpClient _httpClient;

    public RhinoBridge(int backendPort)
    {
        _backendPort = backendPort;
        _httpClient = new HttpClient
        {
            BaseAddress = new Uri($"http://localhost:{backendPort}")
        };
    }

    /// <summary>
    /// Gets the backend API URL for the React app to use
    /// </summary>
    public string GetApiUrl()
    {
        return $"http://localhost:{_backendPort}";
    }

    /// <summary>
    /// Captures the current viewport and uploads it to the backend.
    /// Returns the capture ID on success, null on failure.
    /// </summary>
    public string? CaptureViewport(string sessionId, int width, int height, string displayModeStr)
    {
        string? result = null;

        // Must run on Rhino UI thread
        RhinoApp.InvokeOnUiThread(() =>
        {
            try
            {
                // Parse display mode
                if (!Enum.TryParse<DisplayMode>(displayModeStr, true, out var displayMode))
                {
                    displayMode = DisplayMode.Shaded;
                }

                RhinoApp.WriteLine($"Capturing viewport: {width}x{height}, mode={displayMode}");

                // Capture viewport
                var captureResult = ViewportCaptureService.CaptureActiveViewport(
                    width, height, displayMode, false);

                if (captureResult == null)
                {
                    RhinoApp.WriteLine("Capture failed");
                    return;
                }

                // Convert to PNG bytes
                var imageBytes = ViewportCaptureService.ToPngBytes(captureResult.Bitmap);

                // Upload to backend
                using var content = new MultipartFormDataContent();
                using var imageContent = new ByteArrayContent(imageBytes);
                imageContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
                content.Add(imageContent, "image", "capture.png");
                content.Add(new StringContent(sessionId), "sessionId");
                content.Add(new StringContent(width.ToString()), "width");
                content.Add(new StringContent(height.ToString()), "height");
                content.Add(new StringContent(displayMode.ToString()), "displayMode");
                content.Add(new StringContent(captureResult.ViewName ?? ""), "viewName");

                var response = _httpClient.PostAsync("/api/captures", content).Result;

                if (response.IsSuccessStatusCode)
                {
                    var responseJson = response.Content.ReadAsStringAsync().Result;
                    using var doc = JsonDocument.Parse(responseJson);
                    result = doc.RootElement.GetProperty("id").GetString();
                    RhinoApp.WriteLine($"Capture uploaded: {result}");
                }
                else
                {
                    RhinoApp.WriteLine($"Failed to upload capture: {response.StatusCode}");
                }

                // Dispose the bitmap
                captureResult.Bitmap.Dispose();
            }
            catch (Exception ex)
            {
                RhinoApp.WriteLine($"Capture error: {ex.Message}");
            }
        });

        return result;
    }

    /// <summary>
    /// Gets available display modes from Rhino
    /// </summary>
    public string GetDisplayModes()
    {
        var modes = new List<object>();

        RhinoApp.InvokeOnUiThread(() =>
        {
            var displayModes = Rhino.Display.DisplayModeDescription.GetDisplayModes();
            foreach (var mode in displayModes)
            {
                modes.Add(new { name = mode.EnglishName, id = mode.Id.ToString() });
            }
        });

        return JsonSerializer.Serialize(modes);
    }

    /// <summary>
    /// Gets the current viewport name
    /// </summary>
    public string? GetActiveViewportName()
    {
        string? name = null;

        RhinoApp.InvokeOnUiThread(() =>
        {
            var view = RhinoDoc.ActiveDoc?.Views.ActiveView;
            name = view?.ActiveViewport.Name;
        });

        return name;
    }

    /// <summary>
    /// Sets the active viewport by name
    /// </summary>
    public bool SetActiveViewport(string viewportName)
    {
        var success = false;

        RhinoApp.InvokeOnUiThread(() =>
        {
            var doc = RhinoDoc.ActiveDoc;
            if (doc == null) return;

            foreach (var view in doc.Views)
            {
                if (view.ActiveViewport.Name.Equals(viewportName, StringComparison.OrdinalIgnoreCase))
                {
                    doc.Views.ActiveView = view;
                    success = true;
                    return;
                }
            }
        });

        return success;
    }

    /// <summary>
    /// Gets list of all viewports
    /// </summary>
    public string GetViewports()
    {
        var viewports = new List<object>();

        RhinoApp.InvokeOnUiThread(() =>
        {
            var doc = RhinoDoc.ActiveDoc;
            if (doc == null) return;

            foreach (var view in doc.Views)
            {
                viewports.Add(new
                {
                    name = view.ActiveViewport.Name,
                    isActive = view == doc.Views.ActiveView
                });
            }
        });

        return JsonSerializer.Serialize(viewports);
    }

    /// <summary>
    /// Zooms to selected objects
    /// </summary>
    public void ZoomSelected()
    {
        RhinoApp.InvokeOnUiThread(() =>
        {
            RhinoApp.RunScript("_ZoomSelected", false);
        });
    }

    /// <summary>
    /// Zooms to show all objects
    /// </summary>
    public void ZoomExtents()
    {
        RhinoApp.InvokeOnUiThread(() =>
        {
            RhinoApp.RunScript("_ZoomExtents", false);
        });
    }

    /// <summary>
    /// Runs any Rhino command
    /// </summary>
    public void RunCommand(string command)
    {
        RhinoApp.InvokeOnUiThread(() =>
        {
            RhinoApp.RunScript(command, false);
        });
    }
}
