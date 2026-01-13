import { useState } from 'react';
import { Button } from '@/components/Common/Button';
import { ZoomIn, ZoomOut, RotateCcw, Columns, Loader2 } from 'lucide-react';

interface CanvasPanelProps {
  currentImage: string | null;
  originalImage?: string | null;
  isProcessing: boolean;
}

export function CanvasPanel({
  currentImage,
  originalImage,
  isProcessing,
}: CanvasPanelProps) {
  const [zoom, setZoom] = useState(1);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePosition, setComparePosition] = useState(50);

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.25, 4));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.25, 0.25));
  const handleReset = () => setZoom(1);

  const handleCompareMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!compareMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setComparePosition(Math.max(0, Math.min(100, x)));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {originalImage && currentImage && originalImage !== currentImage && (
            <Button
              variant={compareMode ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setCompareMode(!compareMode)}
            >
              <Columns className="h-4 w-4 mr-2" />
              Compare
            </Button>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div
        className="flex-1 overflow-hidden flex items-center justify-center relative"
        onMouseMove={handleCompareMove}
      >
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="text-sm text-foreground">Generating...</span>
            </div>
          </div>
        )}

        {currentImage ? (
          <div
            className="relative max-w-full max-h-full"
            style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s' }}
          >
            {/* Generated/Current Image */}
            <img
              src={currentImage}
              alt="Current"
              className="max-w-full max-h-full object-contain"
              style={
                compareMode && originalImage
                  ? { clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }
                  : undefined
              }
            />

            {/* Original Image (for compare) */}
            {compareMode && originalImage && (
              <img
                src={originalImage}
                alt="Original"
                className="absolute inset-0 max-w-full max-h-full object-contain"
                style={{ clipPath: `inset(0 0 0 ${comparePosition}%)` }}
              />
            )}

            {/* Compare Slider */}
            {compareMode && originalImage && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-lg cursor-ew-resize"
                style={{ left: `${comparePosition}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary shadow-lg flex items-center justify-center">
                  <Columns className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">No image selected</p>
            <p className="text-sm">Capture a viewport or select a generation</p>
          </div>
        )}
      </div>
    </div>
  );
}
