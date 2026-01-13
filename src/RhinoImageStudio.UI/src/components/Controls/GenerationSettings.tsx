import { Label } from '@/components/Common/Label';
import { Slider } from '@/components/Common/Slider';
import { GenerationSettings as IGenerationSettings } from '@/lib/types';

interface GenerationSettingsProps {
  settings: IGenerationSettings;
  onChange: (settings: IGenerationSettings) => void;
  disabled?: boolean;
}

export function GenerationSettings({ settings, onChange, disabled }: GenerationSettingsProps) {
  const handleChange = (key: keyof IGenerationSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Resolution</Label>
        <select
          className="w-full h-9 rounded-md border bg-background px-3 py-1 text-sm shadow-sm"
          value={settings.resolution}
          onChange={(e) => handleChange('resolution', e.target.value)}
          disabled={disabled}
        >
          <option value="1024x1024">Square (1024x1024)</option>
          <option value="1216x832">Landscape (1216x832)</option>
          <option value="832x1216">Portrait (832x1216)</option>
          <option value="1536x640">Widescreen (1536x640)</option>
        </select>
      </div>

      <Slider
        label="Guidance Scale"
        value={settings.guidanceScale}
        min={1}
        max={20}
        step={0.5}
        onChange={(val) => handleChange('guidanceScale', val)}
        disabled={disabled}
        suffix=""
      />

      <Slider
        label="Inference Steps"
        value={settings.numInferenceSteps}
        min={10}
        max={100}
        step={1}
        onChange={(val) => handleChange('numInferenceSteps', val)}
        disabled={disabled}
        suffix=""
      />
      
      <div className="space-y-2">
        <Label>Model</Label>
        <select
          className="w-full h-9 rounded-md border bg-background px-3 py-1 text-sm shadow-sm"
          value={settings.model}
          onChange={(e) => handleChange('model', e.target.value)}
          disabled={disabled}
        >
          <option value="stable-diffusion-xl-v1-0">SDXL 1.0</option>
          <option value="stable-diffusion-v1-5">SD 1.5</option>
          <option value="kandinsky-2-2">Kandinsky 2.2</option>
        </select>
      </div>
    </div>
  );
}
