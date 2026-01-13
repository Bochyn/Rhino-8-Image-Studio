import { Slider } from '@/components/Common/Slider';
import { Label } from '@/components/Common/Label';
import { Card } from '@/components/Common/Card';
import { ArrowUpCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpscaleSettingsProps {
  settings: {
    factor: number;
    creativity: number;
  };
  onChange: (settings: { factor: number; creativity: number }) => void;
}

export function UpscaleSettings({ settings, onChange }: UpscaleSettingsProps) {
  const factors = [2, 3, 4];

  return (
    <div className="space-y-4">
      {/* Scale Factor */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">UPSCALE FACTOR</Label>
        <div className="grid grid-cols-3 gap-2">
          {factors.map((factor) => (
            <button
              key={factor}
              onClick={() => onChange({ ...settings, factor })}
              className={cn(
                'p-3 rounded-lg border-2 transition-all',
                settings.factor === factor
                  ? 'border-primary bg-primary/10'
                  : 'border-muted hover:border-primary/50'
              )}
            >
              <div className="text-2xl font-bold text-center">{factor}×</div>
              <div className="text-xs text-muted-foreground text-center">
                {factor === 2 ? '2048px' : factor === 3 ? '3072px' : '4096px'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Creativity */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Creativity
          </Label>
          <span className="text-xs font-mono text-muted-foreground">
            {(settings.creativity * 100).toFixed(0)}%
          </span>
        </div>
        <Slider
          value={settings.creativity}
          onChange={(value) => onChange({ ...settings, creativity: value })}
          min={0}
          max={1}
          step={0.05}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Faithful</span>
          <span>Balanced</span>
          <span>Creative</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Higher values add more AI-generated detail. Lower values preserve the original more closely.
        </p>
      </div>

      {/* Preview Info */}
      <Card className="p-4 bg-muted/50">
        <div className="flex items-center gap-3">
          <ArrowUpCircle className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm font-medium">
              Output: ~{settings.factor * 1024}px
            </p>
            <p className="text-xs text-muted-foreground">
              Using Clarity Upscaler for best quality
            </p>
          </div>
        </div>
      </Card>

      {/* Tips */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>💡 <strong>Tips:</strong></p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>2× is best for web and presentations</li>
          <li>4× is ideal for print at 300 DPI</li>
          <li>Higher creativity works well with painterly styles</li>
        </ul>
      </div>
    </div>
  );
}
