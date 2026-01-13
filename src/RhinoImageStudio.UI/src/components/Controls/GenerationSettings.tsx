import { Label } from '@/components/Common/Label';
import { Card } from '@/components/Common/Card';
import { 
  NanoBananaSettings, 
  ASPECT_RATIOS, 
  OUTPUT_FORMATS,
  getResolutionFromAspectRatio,
} from '@/lib/models';
import { cn } from '@/lib/utils';
import { RatioIcon, ImageIcon, FileImage } from 'lucide-react';

interface GenerationSettingsProps {
  settings: NanoBananaSettings;
  onChange: (settings: NanoBananaSettings) => void;
  disabled?: boolean;
}

export function GenerationSettings({ settings, onChange, disabled }: GenerationSettingsProps) {
  const handleChange = <K extends keyof NanoBananaSettings>(key: K, value: NanoBananaSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  // Calculate preview resolution from aspect ratio
  const resolution = getResolutionFromAspectRatio(settings.aspectRatio);

  return (
    <div className="space-y-6">
      {/* Aspect Ratio */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <RatioIcon className="h-4 w-4 text-muted-foreground" />
          <Label>Aspect Ratio</Label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIOS.slice(0, 9).map((ar) => (
            <button
              key={ar.value}
              onClick={() => handleChange('aspectRatio', ar.value)}
              disabled={disabled}
              className={cn(
                'px-2 py-2 text-xs rounded-md border transition-all',
                settings.aspectRatio === ar.value
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-muted hover:border-primary/50 text-muted-foreground'
              )}
            >
              {ar.value === 'auto' ? 'Auto' : ar.value}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Output: {resolution.width} × {resolution.height}px
        </p>
      </div>

      {/* Number of Images */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <Label>Number of Images</Label>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              onClick={() => handleChange('numImages', num)}
              disabled={disabled}
              className={cn(
                'p-3 rounded-lg border-2 transition-all',
                settings.numImages === num
                  ? 'border-primary bg-primary/10'
                  : 'border-muted hover:border-primary/50'
              )}
            >
              <div className="text-lg font-bold text-center">{num}</div>
            </button>
          ))}
        </div>
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

      {/* Info Card */}
      <Card className="p-3 bg-muted/50">
        <p className="text-xs text-muted-foreground">
          <strong>nano-banana/edit</strong> uses your prompt and source image to generate 
          creative variations. Higher image count means more options but longer processing time.
        </p>
      </Card>
    </div>
  );
}
