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
    <div className="relative flex-1 h-full w-full flex items-center justify-center overflow-hidden bg-panel rounded-2xl">

      {/* Floating Toolbar */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-1 p-1 bg-card/80 backdrop-blur-md rounded-full shadow-lg border border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>

        <span className="text-xs font-medium text-text w-10 text-center select-none">
          {Math.round(zoom * 100)}%
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={handleFit}
          className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary"
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
              compareMode ? 'bg-primary text-background hover:bg-primary/90' : 'hover:bg-primary/10 text-primary'
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
            className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="w-full h-full p-8 flex items-center justify-center">

        {isProcessing && (
          <div className="absolute inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="flex flex-col items-center gap-5 p-8 bg-card rounded-2xl border border-border shadow-2xl min-w-[280px]">
              {/* Animated Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30">
                  {activeJob && activeJob.progress >= 90 ? (
                    <Save className="h-7 w-7 text-primary animate-pulse" />
                  ) : activeJob && activeJob.progress >= 20 ? (
                    <Sparkles className="h-7 w-7 text-primary animate-pulse" />
                  ) : (
                    <ImageIcon className="h-7 w-7 text-primary animate-pulse" />
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="text-center">
                <h3 className="text-base font-semibold text-primary mb-1">
                  {activeJob?.type === 'Generate' || activeJob?.type === 'generation' ? 'Generating Image' :
                   activeJob?.type === 'Upscale' || activeJob?.type === 'upscale' ? 'Upscaling Image' :
                   activeJob?.type === 'Refine' || activeJob?.type === 'refine' ? 'Refining Image' :
                   activeJob?.type === 'MultiAngle' ? 'Rendering 3D View' : 'Processing'}
                </h3>
                <p className="text-xs text-secondary">
                  {activeJob?.progressMessage || 'Starting...'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full space-y-2">
                <div className="relative h-2 bg-primary/10 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${activeJob?.progress ?? 0}%` }}
                  />
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-shimmer" />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-accent">Progress</span>
                  <span className="text-primary font-medium tabular-nums">
                    {activeJob?.progress ?? 0}%
                  </span>
                </div>
              </div>

              {/* Phase Indicators */}
              <div className="flex items-center gap-2 text-[10px] text-accent">
                <div className={`w-2 h-2 rounded-full transition-colors ${(activeJob?.progress ?? 0) >= 10 ? 'bg-primary' : 'bg-accent/50'}`} />
                <span className={(activeJob?.progress ?? 0) >= 10 && (activeJob?.progress ?? 0) < 20 ? 'text-text' : ''}>Prepare</span>
                <div className="w-4 h-px bg-border" />
                <div className={`w-2 h-2 rounded-full transition-colors ${(activeJob?.progress ?? 0) >= 20 ? 'bg-primary' : 'bg-accent/50'}`} />
                <span className={(activeJob?.progress ?? 0) >= 20 && (activeJob?.progress ?? 0) < 90 ? 'text-text' : ''}>Generate</span>
                <div className="w-4 h-px bg-border" />
                <div className={`w-2 h-2 rounded-full transition-colors ${(activeJob?.progress ?? 0) >= 90 ? 'bg-primary' : 'bg-accent/50'}`} />
                <span className={(activeJob?.progress ?? 0) >= 90 ? 'text-text' : ''}>Save</span>
              </div>
            </div>
          </div>
        )}

        {currentImage ? (
          <div
            className={`relative shadow-2xl transition-transform duration-200 ease-out origin-center ${
              !compareMode && 'rounded-sm overflow-hidden ring-1 ring-border'
            }`}
            style={{
              transform: `scale(${zoom})`,
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          >
            {compareMode && originalImage ? (
              <div className="relative w-[800px] max-w-full aspect-[4/3]">
                 <CompareSlider
                   leftImage={originalImage}
                   rightImage={currentImage}
                   leftLabel="Original"
                   rightLabel="Result"
                   className="rounded-sm shadow-2xl ring-1 ring-border"
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
          <div className="flex flex-col items-center justify-center text-secondary opacity-50 select-none">
            <div className="w-24 h-24 mb-6 rounded-2xl bg-primary/5 border border-border/50 flex items-center justify-center">
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
