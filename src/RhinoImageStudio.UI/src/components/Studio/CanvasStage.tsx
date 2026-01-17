import { useState } from 'react';
import { Button } from '@/components/Common/Button';
import { CompareSlider } from '@/components/Studio/CompareSlider';
import { ZoomIn, ZoomOut, Maximize2, Columns, Download, Sparkles, ImageIcon, Save } from 'lucide-react';
import { Job } from '@/lib/types';

interface CanvasStageProps {
  currentImage: string | null;
  originalImage?: string | null;
  isProcessing: boolean;
  activeJob?: Job | null;
  onDownload?: () => void;
}

export function CanvasStage({
  currentImage,
  originalImage,
  isProcessing,
  activeJob,
  onDownload
}: CanvasStageProps) {
  const [zoom, setZoom] = useState(1);
  const [compareMode, setCompareMode] = useState(false);

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.5, 8));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.5, 0.5));
  const handleFit = () => setZoom(1);
  
  const canCompare = !!(originalImage && currentImage && originalImage !== currentImage);

  return (
    <div className="relative flex-1 h-full w-full flex items-center justify-center overflow-hidden bg-[hsl(var(--panel-bg))] rounded-2xl">
      
      {/* Floating Toolbar */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-1 p-1 bg-black/40 backdrop-blur-md rounded-full shadow-lg border border-white/10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleZoomOut}
          className="h-8 w-8 rounded-full hover:bg-white/10 text-white"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <span className="text-xs font-medium text-white/80 w-10 text-center select-none">
          {Math.round(zoom * 100)}%
        </span>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleZoomIn}
          className="h-8 w-8 rounded-full hover:bg-white/10 text-white"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-white/20 mx-1" />

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleFit}
          className="h-8 w-8 rounded-full hover:bg-white/10 text-white"
          title="Fit to Screen"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>

        {canCompare && (
          <Button 
            variant={compareMode ? 'secondary' : 'ghost'} 
            size="icon" 
            onClick={() => setCompareMode(!compareMode)}
            className={`h-8 w-8 rounded-full transition-colors ${
              compareMode ? 'bg-white text-black hover:bg-white/90' : 'hover:bg-white/10 text-white'
            }`}
            title="Toggle Compare"
          >
            <Columns className="h-4 w-4" />
          </Button>
        )}

        {currentImage && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDownload}
            className="h-8 w-8 rounded-full hover:bg-white/10 text-white"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="w-full h-full p-8 flex items-center justify-center">
        
        {isProcessing && (
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="flex flex-col items-center gap-5 p-8 bg-[hsl(var(--card-bg))] rounded-2xl border border-[hsl(var(--border-subtle))] shadow-2xl min-w-[280px]">
              {/* Animated Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-[hsl(var(--accent-cta))]/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--accent-cta))]/30 to-[hsl(var(--accent-cta))]/10 flex items-center justify-center border border-[hsl(var(--accent-cta))]/30">
                  {activeJob && activeJob.progress >= 90 ? (
                    <Save className="h-7 w-7 text-[hsl(var(--accent-cta))] animate-pulse" />
                  ) : activeJob && activeJob.progress >= 20 ? (
                    <Sparkles className="h-7 w-7 text-[hsl(var(--accent-cta))] animate-pulse" />
                  ) : (
                    <ImageIcon className="h-7 w-7 text-[hsl(var(--accent-cta))] animate-pulse" />
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="text-center">
                <h3 className="text-base font-semibold text-white mb-1">
                  {activeJob?.type === 'Generate' || activeJob?.type === 'generation' ? 'Generating Image' :
                   activeJob?.type === 'Upscale' || activeJob?.type === 'upscale' ? 'Upscaling Image' :
                   activeJob?.type === 'Refine' || activeJob?.type === 'refine' ? 'Refining Image' :
                   activeJob?.type === 'MultiAngle' ? 'Rendering 3D View' : 'Processing'}
                </h3>
                <p className="text-xs text-white/50">
                  {activeJob?.progressMessage || 'Starting...'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full space-y-2">
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[hsl(var(--accent-cta))] to-[hsl(var(--accent-cta))]/70 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${activeJob?.progress ?? 0}%` }}
                  />
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40">Progress</span>
                  <span className="text-[hsl(var(--accent-cta))] font-medium tabular-nums">
                    {activeJob?.progress ?? 0}%
                  </span>
                </div>
              </div>

              {/* Phase Indicators */}
              <div className="flex items-center gap-2 text-[10px] text-white/40">
                <div className={`w-2 h-2 rounded-full transition-colors ${(activeJob?.progress ?? 0) >= 10 ? 'bg-[hsl(var(--accent-cta))]' : 'bg-white/20'}`} />
                <span className={(activeJob?.progress ?? 0) >= 10 && (activeJob?.progress ?? 0) < 20 ? 'text-white/80' : ''}>Prepare</span>
                <div className="w-4 h-px bg-white/20" />
                <div className={`w-2 h-2 rounded-full transition-colors ${(activeJob?.progress ?? 0) >= 20 ? 'bg-[hsl(var(--accent-cta))]' : 'bg-white/20'}`} />
                <span className={(activeJob?.progress ?? 0) >= 20 && (activeJob?.progress ?? 0) < 90 ? 'text-white/80' : ''}>Generate</span>
                <div className="w-4 h-px bg-white/20" />
                <div className={`w-2 h-2 rounded-full transition-colors ${(activeJob?.progress ?? 0) >= 90 ? 'bg-[hsl(var(--accent-cta))]' : 'bg-white/20'}`} />
                <span className={(activeJob?.progress ?? 0) >= 90 ? 'text-white/80' : ''}>Save</span>
              </div>
            </div>
          </div>
        )}

        {currentImage ? (
          <div 
            className={`relative shadow-2xl transition-transform duration-200 ease-out origin-center ${
              !compareMode && 'rounded-sm overflow-hidden ring-1 ring-white/10' // Slight border for single image
            }`}
            style={{ 
              transform: `scale(${zoom})`,
              maxWidth: '100%',
              maxHeight: '100%',
              // If compare mode is active, we let the slider component handle size constraints
              // But we need to ensure the container itself doesn't overflow the parent "p-8" area
            }}
          >
            {compareMode && originalImage ? (
              <div className="relative w-[800px] max-w-full aspect-[4/3]"> 
                 {/* Note: Aspect ratio here is tricky without known dimensions. 
                     Ideally we use the actual aspect ratio of the image. 
                     For now, we let the image define the container size naturally if possible, 
                     or fallback to a reasonable default. 
                     But CompareSlider needs explicit sizing or fills parent.
                 */}
                 <CompareSlider 
                   leftImage={originalImage}
                   rightImage={currentImage}
                   leftLabel="Original"
                   rightLabel="Result"
                   className="rounded-sm shadow-2xl ring-1 ring-white/10"
                 />
              </div>
            ) : (
              <img 
                src={currentImage} 
                alt="Current" 
                className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-sm shadow-2xl"
                draggable={false}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-[hsl(var(--muted-foreground))] opacity-50 select-none">
            <div className="w-24 h-24 mb-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
              <Maximize2 className="h-10 w-10 opacity-20" />
            </div>
            <p className="text-lg font-medium">No image selected</p>
            <p className="text-sm opacity-60 mt-1">Select a capture or start generating</p>
          </div>
        )}
      </div>
    </div>
  );
}
