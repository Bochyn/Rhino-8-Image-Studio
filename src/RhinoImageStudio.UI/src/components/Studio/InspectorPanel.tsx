import { useState, useEffect } from 'react';
import { Capture, Generation, Job } from '@/lib/types';
import { Button } from '@/components/Common/Button';
import {
  Sparkles,
  RefreshCw,
  Move3D,
  ArrowUpCircle,
  Loader2,
  ChevronDown,
  Wand2,
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ModeType,
  AVAILABLE_MODELS,
  MODELS,
  AllModelSettings,
  DEFAULT_ALL_SETTINGS,
  TOPAZ_MODELS_LIST,
  MULTI_ANGLE_PRESETS
} from '@/lib/models';

interface InspectorPanelProps {
  selectedCapture: Capture | null;
  selectedGeneration: Generation | null;
  onGenerate: (prompt: string, settings: any) => void;
  onSettingsChange?: (settings: AllModelSettings, modelId: string) => void;
  jobs: Job[];
}

export function InspectorPanel({
  selectedCapture,
  selectedGeneration,
  onGenerate,
  onSettingsChange,
  jobs,
}: InspectorPanelProps) {
  const [mode, setMode] = useState<ModeType>('generate');
  const [prompt, setPrompt] = useState('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');

  // Unified settings state
  const [settings, setSettings] = useState<AllModelSettings>(DEFAULT_ALL_SETTINGS);

  const activeJobs = jobs.filter(j =>
    j.status === 'running' || j.status === 'Running' ||
    j.status === 'queued' || j.status === 'Queued'
  );
  const isProcessing = activeJobs.length > 0;
  const hasSource = !!(selectedCapture || selectedGeneration);

  // Get model-specific options
  const currentModel = MODELS[selectedModelId];
  const availableAspectRatios = currentModel?.aspectRatios || [];
  const availableResolutions = currentModel?.resolutions || [];
  const hasResolutions = availableResolutions.length > 0;

  // Initialize model selection when mode changes
  useEffect(() => {
    const models = AVAILABLE_MODELS[mode];
    if (models.length > 0 && !models.includes(selectedModelId)) {
      setSelectedModelId(models[0]);
    }
  }, [mode]);

  // Notify parent of settings changes
  useEffect(() => {
    onSettingsChange?.(settings, selectedModelId);
  }, [settings, selectedModelId, onSettingsChange]);

  // Validate AR/Resolution when model changes
  useEffect(() => {
    const model = MODELS[selectedModelId];
    if (!model) return;

    const currentAR = settings.generation.aspectRatio;
    const currentRes = settings.generation.resolution;

    // Check if current AR is available for this model
    const arValid = model.aspectRatios?.some(a => a.value === currentAR);
    // Check if current Resolution is available for this model
    const resValid = !model.resolutions || model.resolutions.some(r => r.value === currentRes);

    if (!arValid || !resValid) {
      setSettings(s => ({
        ...s,
        generation: {
          ...s.generation,
          aspectRatio: arValid ? currentAR : (model.aspectRatios?.[0]?.value || '1:1'),
          resolution: resValid ? currentRes : (model.resolutions?.[0]?.value || '1K'),
        }
      }));
    }
  }, [selectedModelId]);

  const handleSubmit = () => {
    if (!hasSource) return;

    // Construct the payload based on mode and current settings
    // The StudioPage expects: { model, aspectRatio, numImages, outputFormat, ... }

    let payload: any = {
      model: selectedModelId
    };

    if (mode === 'generate' || mode === 'refine') {
      payload = { ...payload, ...settings.generation };
    } else if (mode === 'multiangle') {
      payload = { ...payload, ...settings.multiAngle };
    } else if (mode === 'upscale') {
      payload = { ...payload, ...settings.upscale };
    }

    onGenerate(prompt, payload);
  };

  const renderModelSelector = () => {
    const models = AVAILABLE_MODELS[mode];
    const currentModelInfo = MODELS[selectedModelId];

    return (
      <div className="relative mb-4 group">
        <label className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1.5 block">
          AI Model
        </label>
        <div className="relative">
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="w-full appearance-none bg-card border border-border text-primary text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {models.map(id => (
              <option key={id} value={id}>
                {MODELS[id]?.name || id}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-secondary pointer-events-none" />
        </div>
        {currentModelInfo && (
          <p className="mt-1.5 text-[10px] text-secondary leading-relaxed">
            {currentModelInfo.description}
          </p>
        )}
      </div>
    );
  };

  const renderModes = () => (
    <div className="grid grid-cols-4 gap-1 p-1 bg-card/50 rounded-lg mb-6 border border-border/50">
      {[
        { id: 'generate', icon: Sparkles, label: 'Gen' },
        { id: 'refine', icon: RefreshCw, label: 'Edit' },
        { id: 'multiangle', icon: Move3D, label: '3D' },
        { id: 'upscale', icon: ArrowUpCircle, label: 'Up' },
      ].map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id as ModeType)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-2 rounded-md transition-all duration-200",
            mode === m.id
              ? "bg-card text-primary shadow-lg ring-1 ring-border"
              : "text-accent hover:text-primary hover:bg-primary/5"
          )}
        >
          <m.icon className="h-4 w-4" />
          <span className="text-[10px] font-medium">{m.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-panel rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-background/50">
        <h2 className="text-sm font-semibold tracking-wide text-primary uppercase flex items-center gap-2">
          <Settings2 className="h-4 w-4 opacity-50" />
          Editor
        </h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">

        {renderModes()}

        {/* Source Card */}
        {hasSource ? (
          <div className="p-3 bg-card rounded-xl border border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-background/50 overflow-hidden flex-shrink-0">
               <img
                 src={selectedGeneration?.thumbnailUrl || selectedCapture?.thumbnailUrl || selectedGeneration?.imageUrl || selectedCapture?.imageUrl}
                 className="w-full h-full object-cover"
                 alt="Source"
               />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-accent uppercase">Source Input</p>
              <p className="text-xs text-primary truncate font-medium">
                {selectedGeneration ? 'Generated Image' : 'Rhino Viewport Capture'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-border text-center">
            <p className="text-xs text-accent">Select a capture to begin</p>
          </div>
        )}

        {renderModelSelector()}

        <hr className="border-border/50" />

        {/* Dynamic Fields */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Prompt Input (Generate/Refine only) */}
          {(mode === 'generate' || mode === 'refine') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-accent uppercase tracking-wider">
                  Prompt
                </label>
                <button className="text-[10px] text-primary hover:underline flex items-center gap-1">
                  <Wand2 className="h-3 w-3" /> Enhance
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'generate' ? "Describe the image..." : "Describe changes..."}
                className="w-full h-24 bg-card border border-border rounded-xl p-3 text-sm text-primary placeholder:text-accent/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* General Generation Settings */}
          {(mode === 'generate' || mode === 'refine') && (
            <>
              {/* Aspect Ratio Selector - dynamic from model */}
              {availableAspectRatios.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-accent uppercase tracking-wider">Aspect Ratio</label>
                  <div className="grid grid-cols-5 gap-1">
                    {availableAspectRatios.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setSettings(s => ({ ...s, generation: { ...s.generation, aspectRatio: value } }))}
                        title={label}
                        className={cn(
                          "py-1.5 px-1 text-[10px] rounded-md border transition-all",
                          settings.generation.aspectRatio === value
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-transparent border-border text-secondary hover:border-secondary"
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Selector - only if model supports it */}
              {hasResolutions && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-accent uppercase tracking-wider">Resolution</label>
                  <div className="flex gap-2">
                    {availableResolutions.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setSettings(s => ({ ...s, generation: { ...s.generation, resolution: value } }))}
                        className={cn(
                          "flex-1 py-2 text-xs rounded-lg border transition-all",
                          settings.generation.resolution === value
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-transparent border-border text-secondary hover:border-secondary"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-accent uppercase tracking-wider">
                   Image Count ({settings.generation.numImages})
                 </label>
                 <input
                   type="range"
                   min="1"
                   max="4"
                   step="1"
                   value={settings.generation.numImages}
                   onChange={(e) => setSettings(s => ({ ...s, generation: { ...s.generation, numImages: parseInt(e.target.value) } }))}
                   className="w-full accent-primary bg-primary/10 h-1 rounded-full appearance-none cursor-pointer"
                 />
                 <div className="flex justify-between text-[10px] text-accent px-1">
                   <span>1</span><span>4</span>
                 </div>
              </div>
            </>
          )}

          {/* Multi-Angle Settings */}
          {mode === 'multiangle' && (
            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-accent uppercase tracking-wider">Presets</label>
                  <div className="grid grid-cols-2 gap-2">
                    {MULTI_ANGLE_PRESETS.slice(0, 4).map(preset => (
                      <button
                        key={preset.label}
                        onClick={() => setSettings(s => ({
                          ...s,
                          multiAngle: {
                            ...s.multiAngle,
                            horizontalAngle: preset.horizontalAngle,
                            verticalAngle: preset.verticalAngle
                          }
                        }))}
                        className="py-2 px-2 text-xs rounded-lg border border-border text-secondary hover:bg-primary/5 hover:border-secondary text-left"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-accent uppercase tracking-wider">
                   Horizontal Angle ({settings.multiAngle.horizontalAngle}°)
                 </label>
                 <input
                   type="range"
                   min="0"
                   max="360"
                   value={settings.multiAngle.horizontalAngle}
                   onChange={(e) => setSettings(s => ({ ...s, multiAngle: { ...s.multiAngle, horizontalAngle: parseInt(e.target.value) } }))}
                   className="w-full accent-primary bg-primary/10 h-1 rounded-full appearance-none"
                 />
               </div>
            </div>
          )}

          {/* Upscale Settings */}
          {mode === 'upscale' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-accent uppercase tracking-wider">Upscale Model</label>
                <div className="space-y-1">
                  {TOPAZ_MODELS_LIST.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setSettings(s => ({ ...s, upscale: { ...s.upscale, model: m.value as any } }))}
                      className={cn(
                        "w-full text-left py-2 px-3 text-xs rounded-lg transition-all",
                         settings.upscale.model === m.value
                          ? "bg-primary/20 text-primary"
                          : "hover:bg-primary/5 text-text"
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-accent uppercase tracking-wider">
                   Factor ({settings.upscale.upscaleFactor}x)
                 </label>
                 <div className="flex gap-2">
                   {[2, 4].map(fac => (
                      <button
                        key={fac}
                        onClick={() => setSettings(s => ({ ...s, upscale: { ...s.upscale, upscaleFactor: fac } }))}
                        className={cn(
                          "flex-1 py-2 text-xs rounded-lg border transition-all",
                          settings.upscale.upscaleFactor === fac
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-transparent border-border text-secondary"
                        )}
                      >
                        {fac}x
                      </button>
                   ))}
                 </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer / CTA */}
      <div className="p-4 bg-card border-t border-border">

        {/* Active Jobs Mini-View */}
        {activeJobs.length > 0 && (
          <div className="mb-3 space-y-2">
            {activeJobs.map((job) => (
              <div key={job.id} className="p-3 bg-card/50 rounded-lg border border-border/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <span className="text-[10px] font-medium text-text uppercase tracking-wide">
                      {job.type === 'Generate' || job.type === 'generation' ? 'Generation' :
                       job.type === 'Upscale' || job.type === 'upscale' ? 'Upscale' :
                       job.type === 'Refine' || job.type === 'refine' ? 'Refine' :
                       job.type === 'MultiAngle' ? 'Multi-Angle' : 'Processing'}
                    </span>
                  </div>
                  <span className="text-[10px] text-primary font-medium tabular-nums">
                    {job.progress ?? 0}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="relative h-1.5 bg-primary/10 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${job.progress ?? 0}%` }}
                  />
                </div>

                {/* Progress Message */}
                {job.progressMessage && (
                  <p className="text-[10px] text-secondary truncate">
                    {job.progressMessage}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <Button
          className="w-full bg-primary hover:bg-primary/90 text-background font-medium h-11 rounded-xl shadow-lg"
          onClick={handleSubmit}
          disabled={isProcessing || !hasSource}
        >
          {isProcessing ? (
             <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
             <Sparkles className="h-4 w-4 mr-2" />
          )}
          {mode === 'generate' ? 'Generate' : mode === 'refine' ? 'Refine' : mode === 'upscale' ? 'Upscale' : 'Render 3D'}
        </Button>
      </div>
    </div>
  );
}
