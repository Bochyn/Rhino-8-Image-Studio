import { Slider } from '@/components/Common/Slider';
import { Label } from '@/components/Common/Label';
import { Card } from '@/components/Common/Card';
import { RotateCw, ArrowUp, ZoomIn, Wand2 } from 'lucide-react';
import { 
  QwenMultiAngleSettings, 
  MULTI_ANGLE_PRESETS,
} from '@/lib/models';

interface MultiAngleSettingsProps {
  settings: QwenMultiAngleSettings;
  onChange: (settings: QwenMultiAngleSettings) => void;
  disabled?: boolean;
}

export function MultiAngleSettings({ settings, onChange, disabled }: MultiAngleSettingsProps) {
  const handleChange = <K extends keyof QwenMultiAngleSettings>(key: K, value: QwenMultiAngleSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">CAMERA PRESETS</Label>
        <div className="grid grid-cols-4 gap-2">
          {MULTI_ANGLE_PRESETS.slice(0, 4).map((preset) => (
            <button
              key={preset.label}
              onClick={() => onChange({ 
                ...settings, 
                horizontalAngle: preset.horizontalAngle, 
                verticalAngle: preset.verticalAngle 
              })}
              disabled={disabled}
              className="px-2 py-1.5 text-xs rounded-md bg-muted hover:bg-accent transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {MULTI_ANGLE_PRESETS.slice(4).map((preset) => (
            <button
              key={preset.label}
              onClick={() => onChange({ 
                ...settings, 
                horizontalAngle: preset.horizontalAngle, 
                verticalAngle: preset.verticalAngle 
              })}
              disabled={disabled}
              className="px-2 py-1.5 text-xs rounded-md bg-muted hover:bg-accent transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Angle (0-360) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="flex items-center gap-2">
            <RotateCw className="h-4 w-4" />
            Horizontal Angle
          </Label>
          <span className="text-xs font-mono text-muted-foreground">{settings.horizontalAngle}°</span>
        </div>
        <Slider
          value={settings.horizontalAngle}
          onChange={(value) => handleChange('horizontalAngle', value)}
          min={0}
          max={360}
          step={15}
          disabled={disabled}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Front (0°)</span>
          <span>Right (90°)</span>
          <span>Back (180°)</span>
          <span>Left (270°)</span>
        </div>
      </div>

      {/* Vertical Angle (-30 to 90) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="flex items-center gap-2">
            <ArrowUp className="h-4 w-4" />
            Vertical Angle
          </Label>
          <span className="text-xs font-mono text-muted-foreground">{settings.verticalAngle}°</span>
        </div>
        <Slider
          value={settings.verticalAngle}
          onChange={(value) => handleChange('verticalAngle', value)}
          min={-30}
          max={90}
          step={5}
          disabled={disabled}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Low (-30°)</span>
          <span>Eye Level (0°)</span>
          <span>Top (90°)</span>
        </div>
      </div>

      {/* Zoom (0-10) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="flex items-center gap-2">
            <ZoomIn className="h-4 w-4" />
            Zoom Level
          </Label>
          <span className="text-xs font-mono text-muted-foreground">{settings.zoom}</span>
        </div>
        <Slider
          value={settings.zoom}
          onChange={(value) => handleChange('zoom', value)}
          min={0}
          max={10}
          step={1}
          disabled={disabled}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Wide</span>
          <span>Medium</span>
          <span>Close</span>
        </div>
      </div>

      {/* LoRA Scale */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            LoRA Scale
          </Label>
          <span className="text-xs font-mono text-muted-foreground">{settings.loraScale.toFixed(2)}</span>
        </div>
        <Slider
          value={settings.loraScale}
          onChange={(value) => handleChange('loraScale', value)}
          min={0}
          max={1}
          step={0.05}
          disabled={disabled}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Subtle</span>
          <span>Balanced</span>
          <span>Strong</span>
        </div>
      </div>

      {/* Visual Preview */}
      <Card className="p-4 bg-muted/50">
        <div className="relative w-full h-24 flex items-center justify-center">
          <div
            className="w-12 h-12 bg-primary/20 border-2 border-primary rounded-lg"
            style={{
              transform: `rotateY(${settings.horizontalAngle}deg) rotateX(${-settings.verticalAngle}deg) scale(${1 - settings.zoom * 0.05})`,
              transformStyle: 'preserve-3d',
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-muted to-transparent" />
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Camera position preview
        </p>
      </Card>

      {/* Info Card */}
      <Card className="p-3 bg-muted/50">
        <p className="text-xs text-muted-foreground">
          <strong>qwen-multi-angle</strong> generates the same scene from different camera 
          positions. Perfect for creating consistent multi-view presentations.
        </p>
      </Card>
    </div>
  );
}
