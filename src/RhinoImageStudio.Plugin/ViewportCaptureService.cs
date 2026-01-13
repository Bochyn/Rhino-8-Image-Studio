using System;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;
using Rhino;
using Rhino.Display;
using RhinoImageStudio.Shared.Enums;

namespace RhinoImageStudio.Plugin;

/// <summary>
/// Service for capturing viewport to bitmap
/// </summary>
public static class ViewportCaptureService
{
    /// <summary>
    /// Captures the active viewport to a bitmap
    /// </summary>
    public static CaptureResult? CaptureActiveViewport(
        int width = 1024,
        int height = 1024,
        Shared.Enums.DisplayMode displayMode = Shared.Enums.DisplayMode.Shaded,
        bool transparentBackground = false)
    {
        var doc = RhinoDoc.ActiveDoc;
        if (doc == null)
        {
            RhinoApp.WriteLine("No active document");
            return null;
        }

        var view = doc.Views.ActiveView;
        if (view == null)
        {
            RhinoApp.WriteLine("No active view");
            return null;
        }

        try
        {
            // Get the display mode to use
            var rhinoDisplayMode = GetRhinoDisplayMode(displayMode);
            RhinoApp.WriteLine($"[ViewportCapture] Requested mode: {displayMode}, Found Rhino mode: {rhinoDisplayMode?.EnglishName ?? "NULL"}");

            Bitmap? bitmap = null;
            var captureSize = new Size(width, height);

            if (rhinoDisplayMode != null)
            {
                // Use the overload that captures with a specific DisplayMode WITHOUT changing the viewport
                // This is the correct API: RhinoView.CaptureToBitmap(Size, DisplayModeDescription)
                RhinoApp.WriteLine($"[ViewportCapture] Using CaptureToBitmap(Size, DisplayMode) - no viewport change");
                bitmap = view.CaptureToBitmap(captureSize, rhinoDisplayMode);
            }
            else
            {
                // Fallback: use ViewCapture with current viewport settings
                RhinoApp.WriteLine($"[ViewportCapture] DisplayMode not found, using current viewport mode");
                var viewCapture = new ViewCapture
                {
                    Width = width,
                    Height = height,
                    ScaleScreenItems = false,
                    DrawAxes = false,
                    DrawGrid = false,
                    DrawGridAxes = false,
                    TransparentBackground = transparentBackground
                };
                bitmap = viewCapture.CaptureToBitmap(view);
            }

            if (bitmap == null)
            {
                RhinoApp.WriteLine("Failed to capture viewport - bitmap is null");
                return null;
            }

            RhinoApp.WriteLine($"[ViewportCapture] Captured bitmap: {bitmap.Width}x{bitmap.Height}");

            // Get camera info
            var viewport = view.ActiveViewport;
            var cameraLocation = viewport.CameraLocation;
            var cameraTarget = viewport.CameraTarget;

            return new CaptureResult
            {
                Bitmap = bitmap,
                Width = bitmap.Width,
                Height = bitmap.Height,
                ViewName = view.ActiveViewport.Name,
                DisplayMode = displayMode,
                CameraPosition = $"{cameraLocation.X:F2},{cameraLocation.Y:F2},{cameraLocation.Z:F2}",
                CameraTarget = $"{cameraTarget.X:F2},{cameraTarget.Y:F2},{cameraTarget.Z:F2}",
                CameraLens = viewport.Camera35mmLensLength
            };
        }
        catch (Exception ex)
        {
            RhinoApp.WriteLine($"Capture error: {ex.Message}");
            return null;
        }
    }

    /// <summary>
    /// Converts captured bitmap to PNG bytes
    /// </summary>
    public static byte[] ToPngBytes(Bitmap bitmap)
    {
        using var ms = new MemoryStream();
        bitmap.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
        return ms.ToArray();
    }

    /// <summary>
    /// Converts captured bitmap to base64 data URI
    /// </summary>
    public static string ToBase64DataUri(Bitmap bitmap)
    {
        var bytes = ToPngBytes(bitmap);
        var base64 = Convert.ToBase64String(bytes);
        return $"data:image/png;base64,{base64}";
    }

    private static DisplayModeDescription? GetRhinoDisplayMode(Shared.Enums.DisplayMode displayMode)
    {
        var name = displayMode switch
        {
            Shared.Enums.DisplayMode.Shaded => "Shaded",
            Shared.Enums.DisplayMode.Wireframe => "Wireframe",
            Shared.Enums.DisplayMode.Rendered => "Rendered",
            Shared.Enums.DisplayMode.Ghosted => "Ghosted",
            Shared.Enums.DisplayMode.XRay => "X-Ray",
            Shared.Enums.DisplayMode.Technical => "Technical",
            Shared.Enums.DisplayMode.Artistic => "Artistic",
            Shared.Enums.DisplayMode.Pen => "Pen",
            Shared.Enums.DisplayMode.Arctic => "Arctic",
            Shared.Enums.DisplayMode.Raytraced => "Raytraced",
            _ => "Shaded"
        };

        var mode = DisplayModeDescription.FindByName(name);
        if (mode == null)
        {
            RhinoApp.WriteLine($"[ViewportCapture] WARNING: DisplayMode '{name}' not found in Rhino. Available modes:");
            foreach (var m in DisplayModeDescription.GetDisplayModes())
            {
                RhinoApp.WriteLine($"  - {m.EnglishName}");
            }
        }
        return mode;
    }
}

/// <summary>
/// Result of a viewport capture
/// </summary>
public class CaptureResult
{
    public Bitmap Bitmap { get; set; } = null!;
    public int Width { get; set; }
    public int Height { get; set; }
    public string? ViewName { get; set; }
    public Shared.Enums.DisplayMode DisplayMode { get; set; }
    public string? CameraPosition { get; set; }
    public string? CameraTarget { get; set; }
    public double? CameraLens { get; set; }
}
