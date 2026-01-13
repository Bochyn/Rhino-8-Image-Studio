import { Label } from '@/components/Common/Label';
import { Card } from '@/components/Common/Card';
import { ArrowUpCircle, FileImage, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TopazUpscaleSettings,
  TOPAZ_MODELS,
  OUTPUT_FORMATS,
} from '@/lib/models';

interface UpscaleSettingsProps {
  settings: TopazUpscaleSettings;
  onChange: (settings: TopazUpscaleSettings) => void;
  disabled?: boolean;
}

export function UpscaleSettings({ settings, onChange, disabled }: UpscaleSettingsProps) {
  const handleChange = <K extends keyof TopazUpscaleSettings>(key: K, value: TopazUpscaleSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const factors = [1, 2, 3, 4];

  return (
    <div className="space-y-4">
      {/* Model Selection */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">UPSCALE MODEL</Label>
        <div className="space-y-2">
          {TOPAZ_MODELS.map((model) => (
            <button
              key={model.value}
              onClick={() => handleChange('model', model.value)}
              disabled={disabled}
              className={cn(
                'w-full p-3 rounded-lg border-2 text-left transition-all',
                settings.model === model.value
                  ? 'border-primary bg-primary/10'
                  : 'border-muted hover:border-primary/50'
              )}
            >
              <div className="text-sm font-medium">{model.label}</div>
              <div className="text-xs text-muted-foreground">{model.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Scale Factor */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">UPSCALE FACTOR</Label>
        <div className="grid grid-cols-4 gap-2">
          {factors.map((factor) => (
            <button
              key={factor}
              onClick={() => handleChange('upscaleFactor', factor)}
              disabled={disabled}
              className={cn(
                'p-3 rounded-lg border-2 transition-all',
                settings.upscaleFactor === factor
                  ? 'border-primary bg-primary/10'
                  : 'border-muted hover:border-primary/50'
              )}
            >
              <div className="text-2xl font-bold text-center">{factor}×</div>
              <div className="text-xs text-muted-foreground text-center">
                {factor * 1024}px
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Face Enhancement Toggle */}
      <div>
        <button
          onClick={() => handleChange('faceEnhancement', !settings.faceEnhancement)}
          disabled={disabled}
          className={cn(
            'w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all',
            settings.faceEnhancement
              ? 'border-primary bg-primary/10'
              : 'border-muted hover:border-primary/50'
          )}
        >
          <div className={cn(
            'w-10 h-6 rounded-full transition-colors relative',
            settings.faceEnhancement ? 'bg-primary' : 'bg-muted'
          )}>
            <div className={cn(
              'absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow',
              settings.faceEnhancement ? 'left-5' : 'left-1'
            )} />
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <div>
              <div className="text-sm font-medium">Face Enhancement</div>
              <div className="text-xs text-muted-foreground">Improve facial details automatically</div>
            </div>
          </div>
        </button>
      </div>

      {/* Output Format */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileImage className="h-4 w-4 text-muted-foreground" />
          <Label>Output Format</Label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {OUTPUT_FORMATS.map((format) => (
            <button
              key={format.value}
              onClick={() => handleChange('outputFormat', format.value)}
              disabled={disabled}
              className={cn(
                'px-3 py-2 text-sm rounded-md border transition-all',
                settings.outputFormat === format.value
                  ? 'border-primary bg-primary/10 text-foreground font-medium'
                  : 'border-muted hover:border-primary/50 text-muted-foreground'
              )}
            >
              {format.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Info */}
      <Card className="p-4 bg-muted/50">
        <div className="flex items-center gap-3">
          <ArrowUpCircle className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm font-medium">
              Output: ~{settings.upscaleFactor * 1024}px
            </p>
            <p className="text-xs text-muted-foreground">
              Using {settings.model}
            </p>
          </div>
        </div>
      </Card>

      {/* Tips */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Tips:</strong></p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>2× is best for web and presentations</li>
          <li>4× is ideal for print at 300 DPI</li>
          <li>Use "CG" model for 3D renders</li>
          <li>Enable Face Enhancement for portraits</li>
        </ul>
      </div>
    </div>
  );
}
