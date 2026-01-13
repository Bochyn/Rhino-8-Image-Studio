import { useState } from 'react';
import { Capture, Generation, Job } from '@/lib/types';
import { Button } from '@/components/Common/Button';
import { PromptInput } from '@/components/Controls/PromptInput';
import { GenerationSettings } from '@/components/Controls/GenerationSettings';
import { MultiAngleSettings } from '@/components/Controls/MultiAngleSettings';
import { UpscaleSettings } from '@/components/Controls/UpscaleSettings';
import { Card } from '@/components/Common/Card';
import { cn } from '@/lib/utils';
import {
  MODE_MODELS,
  ModeType,
  DEFAULT_NANO_BANANA_SETTINGS,
  DEFAULT_QWEN_SETTINGS,
  DEFAULT_TOPAZ_SETTINGS,
  NanoBananaSettings,
  QwenMultiAngleSettings,
  TopazUpscaleSettings,
} from '@/lib/models';
import {
  Sparkles,
  RefreshCw,
  Move3D,
  ArrowUpCircle,
  Loader2,
  Cpu,
} from 'lucide-react';

interface ControlsPanelProps {
  selectedCapture: Capture | null;
  selectedGeneration: Generation | null;
  onGenerate: (prompt: string, settings: any) => void;
  jobs: Job[];
}

export function ControlsPanel({
  selectedCapture,
  selectedGeneration,
  onGenerate,
  jobs,
}: ControlsPanelProps) {
  const [mode, setMode] = useState<ModeType>('generate');
  const [prompt, setPrompt] = useState('');
  
  // Model-specific settings states
  const [nanoBananaSettings, setNanoBananaSettings] = useState<NanoBananaSettings>(DEFAULT_NANO_BANANA_SETTINGS);
  const [qwenSettings, setQwenSettings] = useState<QwenMultiAngleSettings>(DEFAULT_QWEN_SETTINGS);
  const [topazSettings, setTopazSettings] = useState<TopazUpscaleSettings>(DEFAULT_TOPAZ_SETTINGS);

  const activeJobs = jobs.filter(j => j.status === 'running' || j.status === 'queued');
  const isProcessing = activeJobs.length > 0;

  // Get current model info for selected mode
  const currentModel = MODE_MODELS[mode];

  const handleSubmit = () => {
    const modelId = currentModel.id;
    
    if (mode === 'generate' || mode === 'refine') {
      onGenerate(prompt, {
        modelId,
        ...nanoBananaSettings,
      });
    } else if (mode === 'multiangle') {
      onGenerate('', {
        modelId,
        ...qwenSettings,
      });
    } else if (mode === 'upscale') {
      onGenerate('', {
        modelId,
        ...topazSettings,
      });
    }
  };

  const modes: { id: ModeType; label: string; icon: React.ReactNode }[] = [
    { id: 'generate', label: 'Generate', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'refine', label: 'Refine', icon: <RefreshCw className="h-4 w-4" /> },
    { id: 'multiangle', label: 'Multi-Angle', icon: <Move3D className="h-4 w-4" /> },
    { id: 'upscale', label: 'Upscale', icon: <ArrowUpCircle className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Mode Selector */}
      <div className="p-4 border-b">
        <div className="grid grid-cols-4 gap-1 p-1 bg-muted rounded-lg">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-md text-xs transition-colors',
                mode === m.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {m.icon}
              <span className="font-medium">{m.label}</span>
            </button>
          ))}
        </div>
        
        {/* Current Model Indicator */}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Cpu className="h-3 w-3" />
          <span>Model: </span>
          <span className="font-medium text-foreground">{currentModel.shortName}</span>
        </div>
      </div>

      {/* Controls based on mode */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Source Info */}
        {(selectedCapture || selectedGeneration) && (
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Source</p>
            <p className="text-sm font-medium truncate">
              {selectedGeneration
                ? `Generation: ${selectedGeneration.prompt?.slice(0, 30)}...`
                : selectedCapture
                ? `Capture: ${selectedCapture.displayMode} ${selectedCapture.width}×${selectedCapture.height}`
                : 'None'}
            </p>
          </Card>
        )}

        {/* Generate / Refine Mode (nano-banana/edit) */}
        {(mode === 'generate' || mode === 'refine') && (
          <>
            <PromptInput
              value={prompt}
              onChange={setPrompt}
              placeholder={
                mode === 'generate'
                  ? 'Describe the visualization you want...'
                  : 'Describe what to change...'
              }
            />
            <GenerationSettings
              settings={nanoBananaSettings}
              onChange={setNanoBananaSettings}
            />
          </>
        )}

        {/* Multi-Angle Mode (qwen) */}
        {mode === 'multiangle' && (
          <MultiAngleSettings
            settings={qwenSettings}
            onChange={setQwenSettings}
          />
        )}

        {/* Upscale Mode (topaz) */}
        {mode === 'upscale' && (
          <UpscaleSettings
            settings={topazSettings}
            onChange={setTopazSettings}
          />
        )}

        {/* Active Jobs */}
        {activeJobs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">PROCESSING</p>
            {activeJobs.map((job) => (
              <Card key={job.id} className="p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">{job.type}</p>
                    <p className="text-xs text-muted-foreground">{job.message || 'Processing...'}</p>
                  </div>
                  <span className="text-xs font-mono">{job.progress}%</span>
                </div>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="p-4 border-t">
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={isProcessing || (!selectedCapture && !selectedGeneration)}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {modes.find(m => m.id === mode)?.icon}
              <span className="ml-2">{modes.find(m => m.id === mode)?.label}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
