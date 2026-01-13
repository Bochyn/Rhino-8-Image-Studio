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

interface CaptureSettingsProps {
  displayMode: string;
  onDisplayModeChange: (mode: string) => void;
}

export function CaptureSettings({
  displayMode,
  onDisplayModeChange,
}: CaptureSettingsProps) {
  return (
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
  );
}
