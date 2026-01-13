import { Label } from '@/components/Common/Label';

const DISPLAY_MODES = [
  'Shaded', 
  'Rendered', 
  'Wireframe', 
  'Arctic', 
  'Raytraced',
  'Ghosted',
  'XRay',
  'Technical',
  'Artistic',
  'Pen'
];
const RESOLUTIONS = [
  { label: '512×512', width: 512, height: 512 },
  { label: '1024×1024', width: 1024, height: 1024 },
  { label: '1920×1080 (HD)', width: 1920, height: 1080 },
  { label: '2560×1440 (QHD)', width: 2560, height: 1440 },
];

interface CaptureSettingsProps {
  width: number;
  height: number;
  displayMode: string;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  onDisplayModeChange: (mode: string) => void;
}

export function CaptureSettings({
  width,
  height,
  displayMode,
  onWidthChange,
  onHeightChange,
  onDisplayModeChange,
}: CaptureSettingsProps) {
  const handlePresetChange = (preset: string) => {
    const res = RESOLUTIONS.find((r) => r.label === preset);
    if (res) {
      onWidthChange(res.width);
      onHeightChange(res.height);
    }
  };

  const currentPreset = RESOLUTIONS.find((r) => r.width === width && r.height === height)?.label || 'Custom';

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Display Mode</Label>
        <select
          className="w-full h-9 rounded-md border bg-background px-3 py-1 text-sm shadow-sm"
          value={displayMode}
          onChange={(e) => onDisplayModeChange(e.target.value)}
        >
          {DISPLAY_MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Resolution Preset</Label>
        <select
          className="w-full h-9 rounded-md border bg-background px-3 py-1 text-sm shadow-sm"
          value={currentPreset}
          onChange={(e) => handlePresetChange(e.target.value)}
        >
          {RESOLUTIONS.map((r) => (
            <option key={r.label} value={r.label}>
              {r.label}
            </option>
          ))}
          {currentPreset === 'Custom' && <option value="Custom">Custom</option>}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Width</Label>
          <input
            type="number"
            className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-sm"
            value={width}
            onChange={(e) => onWidthChange(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Height</Label>
          <input
            type="number"
            className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-sm"
            value={height}
            onChange={(e) => onHeightChange(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
