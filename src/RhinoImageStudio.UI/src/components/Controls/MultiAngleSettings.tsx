import { Slider } from '@/components/Common/Slider';
import { Label } from '@/components/Common/Label';
import { Card } from '@/components/Common/Card';
import { RotateCw, ArrowUp, Search } from 'lucide-react';

interface MultiAngleSettingsProps {
  settings: {
    azimuth: number;
    elevation: number;
    zoom: number;
  };
  onChange: (settings: { azimuth: number; elevation: number; zoom: number }) => void;
}

export function MultiAngleSettings({ settings, onChange }: MultiAngleSettingsProps) {
  const presets = [
    { label: 'Front', azimuth: 0, elevation: 0 },
    { label: 'Side', azimuth: 90, elevation: 0 },
    { label: 'Back', azimuth: 180, elevation: 0 },
    { label: 'Top', azimuth: 0, elevation: 60 },
    { label: '3/4 View', azimuth: 45, elevation: 30 },
  ];

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">PRESETS</Label>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onChange({ ...settings, azimuth: preset.azimuth, elevation: preset.elevation })}
              className="px-3 py-1.5 text-xs rounded-md bg-muted hover:bg-accent transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Azimuth (Horizontal Angle) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="flex items-center gap-2">
            <RotateCw className="h-4 w-4" />
            Azimuth (Horizontal)
          </Label>
          <span className="text-xs font-mono text-muted-foreground">{settings.azimuth}°</span>
        </div>
        <Slider
          value={settings.azimuth}
          onChange={(value) => onChange({ ...settings, azimuth: value })}
          min={0}
          max={360}
          step={15}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Front</span>
          <span>Right</span>
          <span>Back</span>
          <span>Left</span>
          <span>Front</span>
        </div>
      </div>

      {/* Elevation (Vertical Angle) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="flex items-center gap-2">
            <ArrowUp className="h-4 w-4" />
            Elevation (Vertical)
          </Label>
          <span className="text-xs font-mono text-muted-foreground">{settings.elevation}°</span>
        </div>
        <Slider
          value={settings.elevation}
          onChange={(value) => onChange({ ...settings, elevation: value })}
          min={-30}
          max={90}
          step={5}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Low</span>
          <span>Eye Level</span>
          <span>Bird's Eye</span>
        </div>
      </div>

      {/* Zoom/Distance */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Distance
          </Label>
          <span className="text-xs font-mono text-muted-foreground">{settings.zoom}</span>
        </div>
        <Slider
          value={settings.zoom}
          onChange={(value) => onChange({ ...settings, zoom: value })}
          min={0}
          max={10}
          step={1}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Wide</span>
          <span>Medium</span>
          <span>Close</span>
        </div>
      </div>

      {/* Visual Preview */}
      <Card className="p-4 bg-muted/50">
        <div className="relative w-full h-24 flex items-center justify-center">
          <div
            className="w-12 h-12 bg-primary/20 border-2 border-primary rounded-lg"
            style={{
              transform: `rotateY(${settings.azimuth}deg) rotateX(${-settings.elevation}deg) scale(${1 - settings.zoom * 0.05})`,
              transformStyle: 'preserve-3d',
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-muted to-transparent" />
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Camera position preview
        </p>
      </Card>
    </div>
  );
}
