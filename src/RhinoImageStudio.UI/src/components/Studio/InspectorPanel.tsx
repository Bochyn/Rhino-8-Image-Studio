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
  jobs: Job[];
}

export function InspectorPanel({
  selectedCapture,
  selectedGeneration,
  onGenerate,
  jobs,
}: InspectorPanelProps) {
  const [mode, setMode] = useState<ModeType>('generate');
  const [prompt, setPrompt] = useState('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  
  // Unified settings state
  const [settings, setSettings] = useState<AllModelSettings>(DEFAULT_ALL_SETTINGS);

  const activeJobs = jobs.filter(j => j.status === 'running' || j.status === 'queued');
  const isProcessing = activeJobs.length > 0;
  const hasSource = !!(selectedCapture || selectedGeneration);

  // Initialize model selection when mode changes
  useEffect(() => {
    const models = AVAILABLE_MODELS[mode];
    if (models.length > 0 && !models.includes(selectedModelId)) {
      setSelectedModelId(models[0]);
    }
  }, [mode]);

  const handleSubmit = () => {
    if (!hasSource) return;

    // Construct the payload based on mode and current settings
    // Note: The backend expects specific flat structures depending on the model, 
    // or we can pass a structured object if the API supports it. 
    // Looking at previous ControlsPanel, it flattened the settings.
    
    let payload: any = {
      modelId: selectedModelId
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
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">
          AI Model
        </label>
        <div className="relative">
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="w-full appearance-none bg-[hsl(var(--card-bg))] border border-[hsl(var(--border-subtle))] text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-cta))]"
          >
            {models.map(id => (
              <option key={id} value={id}>
                {MODELS[id]?.name || id}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-white/50 pointer-events-none" />
        </div>
        {currentModelInfo && (
          <p className="mt-1.5 text-[10px] text-white/50 leading-relaxed">
            {currentModelInfo.description}
          </p>
        )}
      </div>
    );
  };

  const renderModes = () => (
    <div className="grid grid-cols-4 gap-1 p-1 bg-black/20 rounded-lg mb-6 border border-white/5">
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
              ? "bg-[hsl(var(--card-bg))] text-white shadow-lg ring-1 ring-white/10"
              : "text-white/40 hover:text-white hover:bg-white/5"
          )}
        >
          <m.icon className="h-4 w-4" />
          <span className="text-[10px] font-medium">{m.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--panel-bg))] rounded-2xl border border-[hsl(var(--border-subtle))] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-black/10">
        <h2 className="text-sm font-semibold tracking-wide text-white/90 uppercase flex items-center gap-2">
          <Settings2 className="h-4 w-4 opacity-50" />
          Inspector
        </h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
        
        {renderModes()}
        
        {/* Source Card */}
        {hasSource ? (
          <div className="p-3 bg-[hsl(var(--card-bg))] rounded-xl border border-[hsl(var(--border-subtle))] flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-black/30 overflow-hidden flex-shrink-0">
               <img 
                 src={selectedGeneration?.thumbnailUrl || selectedCapture?.thumbnailUrl || selectedGeneration?.imageUrl || selectedCapture?.imageUrl} 
                 className="w-full h-full object-cover"
                 alt="Source"
               />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-white/40 uppercase">Source Input</p>
              <p className="text-xs text-white truncate font-medium">
                {selectedGeneration ? 'Generated Image' : 'Rhino Viewport Capture'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-white/10 text-center">
            <p className="text-xs text-white/40">Select a capture to begin</p>
          </div>
        )}

        {renderModelSelector()}

        <hr className="border-white/5" />

        {/* Dynamic Fields */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Prompt Input (Generate/Refine only) */}
          {(mode === 'generate' || mode === 'refine') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                  Prompt
                </label>
                <button className="text-[10px] text-[hsl(var(--accent-cta))] hover:underline flex items-center gap-1">
                  <Wand2 className="h-3 w-3" /> Enhance
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'generate' ? "Describe the image..." : "Describe changes..."}
                className="w-full h-24 bg-[hsl(var(--card-bg))] border border-[hsl(var(--border-subtle))] rounded-xl p-3 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-cta))]"
              />
            </div>
          )}

          {/* General Generation Settings */}
          {(mode === 'generate' || mode === 'refine') && (
            <>
               <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  {['1:1', '16:9', '4:3', '3:4', '9:16'].map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setSettings(s => ({ ...s, generation: { ...s.generation, aspectRatio: ratio } }))}
                      className={cn(
                        "py-2 px-1 text-xs rounded-lg border transition-all",
                        settings.generation.aspectRatio === ratio
                          ? "bg-[hsl(var(--accent-cta))]/20 border-[hsl(var(--accent-cta))] text-[hsl(var(--accent-cta))]"
                          : "bg-transparent border-white/10 text-white/60 hover:border-white/30"
                      )}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                   Image Count ({settings.generation.numImages})
                 </label>
                 <input 
                   type="range" 
                   min="1" 
                   max="4" 
                   step="1"
                   value={settings.generation.numImages}
                   onChange={(e) => setSettings(s => ({ ...s, generation: { ...s.generation, numImages: parseInt(e.target.value) } }))}
                   className="w-full accent-[hsl(var(--accent-cta))] bg-white/10 h-1 rounded-full appearance-none cursor-pointer"
                 />
                 <div className="flex justify-between text-[10px] text-white/30 px-1">
                   <span>1</span><span>4</span>
                 </div>
              </div>
            </>
          )}

          {/* Multi-Angle Settings */}
          {mode === 'multiangle' && (
            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Presets</label>
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
                        className="py-2 px-2 text-xs rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:border-white/30 text-left"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
               </div>
               
               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                   Horizontal Angle ({settings.multiAngle.horizontalAngle}°)
                 </label>
                 <input 
                   type="range" 
                   min="0" 
                   max="360" 
                   value={settings.multiAngle.horizontalAngle}
                   onChange={(e) => setSettings(s => ({ ...s, multiAngle: { ...s.multiAngle, horizontalAngle: parseInt(e.target.value) } }))}
                   className="w-full accent-[hsl(var(--accent-cta))] bg-white/10 h-1 rounded-full appearance-none"
                 />
               </div>
            </div>
          )}

          {/* Upscale Settings */}
          {mode === 'upscale' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Upscale Model</label>
                <div className="space-y-1">
                  {TOPAZ_MODELS_LIST.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setSettings(s => ({ ...s, upscale: { ...s.upscale, model: m.value as any } }))}
                      className={cn(
                        "w-full text-left py-2 px-3 text-xs rounded-lg transition-all",
                         settings.upscale.model === m.value
                          ? "bg-[hsl(var(--accent-cta))]/20 text-[hsl(var(--accent-cta))]"
                          : "hover:bg-white/5 text-white/70"
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
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
                            ? "bg-[hsl(var(--accent-cta))]/20 border-[hsl(var(--accent-cta))] text-[hsl(var(--accent-cta))]"
                            : "bg-transparent border-white/10 text-white/60"
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
      <div className="p-4 bg-[hsl(var(--card-bg))] border-t border-[hsl(var(--border-subtle))]">
        
        {/* Active Jobs Mini-View */}
        {activeJobs.length > 0 && (
          <div className="mb-3 p-2 bg-black/20 rounded border border-white/5 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin text-[hsl(var(--accent-cta))]" />
            <span className="text-[10px] text-white/70">
              Processing {activeJobs.length} job(s)...
            </span>
          </div>
        )}

        <Button
          className="w-full bg-[hsl(var(--accent-cta))] hover:bg-[hsl(var(--accent-cta))/90] text-white font-medium h-11 rounded-xl shadow-[0_0_15px_hsl(var(--accent-cta))/20]"
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
