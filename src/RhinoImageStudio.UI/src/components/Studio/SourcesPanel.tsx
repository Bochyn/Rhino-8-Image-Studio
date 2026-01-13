import { Capture } from '@/lib/types';
import { Button } from '@/components/Common/Button';
import { CaptureSettings } from '@/components/Controls/CaptureSettings';
import { Card } from '@/components/Common/Card';
import { Camera, Image, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SourcesPanelProps {
  captures: Capture[];
  selectedCapture: Capture | null;
  onSelectCapture: (capture: Capture) => void;
  onCapture: (width: number, height: number, displayMode: string) => void;
  isCapturing: boolean;
  rhinoAvailable: boolean;
}

export function SourcesPanel({
  captures,
  selectedCapture,
  onSelectCapture,
  onCapture,
  isCapturing,
  rhinoAvailable,
}: SourcesPanelProps) {
  const [captureWidth, setCaptureWidth] = useState(1024);
  const [captureHeight, setCaptureHeight] = useState(1024);
  const [displayMode, setDisplayMode] = useState('Shaded');

  const handleCapture = () => {
    onCapture(captureWidth, captureHeight, displayMode);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Capture Controls */}
      <div className="p-4 border-b space-y-4">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Viewport Capture
        </h3>
        
        <CaptureSettings
          width={captureWidth}
          height={captureHeight}
          displayMode={displayMode}
          onWidthChange={setCaptureWidth}
          onHeightChange={setCaptureHeight}
          onDisplayModeChange={setDisplayMode}
        />

        <Button
          className="w-full"
          onClick={handleCapture}
          disabled={!rhinoAvailable || isCapturing}
        >
          {isCapturing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Capturing...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Capture Viewport
            </>
          )}
        </Button>

        {!rhinoAvailable && (
          <p className="text-xs text-yellow-500 text-center">
            Connect to Rhino to capture viewport
          </p>
        )}
      </div>

      {/* Captures List */}
      <div className="flex-1 overflow-y-auto p-4">
        <h4 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Image className="h-3 w-3" />
          CAPTURES ({captures.length})
        </h4>
        
        {captures.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No captures yet
          </div>
        ) : (
          <div className="space-y-2">
            {captures.map((capture) => (
              <Card
                key={capture.id}
                className={cn(
                  'p-2 cursor-pointer transition-colors hover:bg-accent',
                  selectedCapture?.id === capture.id && 'ring-2 ring-primary'
                )}
                onClick={() => onSelectCapture(capture)}
              >
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                    {capture.imageUrl && (
                      <img
                        src={capture.thumbnailUrl || capture.imageUrl}
                        alt="Capture"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {capture.viewName || `Mode ${capture.displayMode}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {capture.width}×{capture.height}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {capture.createdAt ? new Date(capture.createdAt).toLocaleTimeString() : ''}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
