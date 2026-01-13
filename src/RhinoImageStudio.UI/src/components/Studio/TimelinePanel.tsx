import { Generation } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card } from '@/components/Common/Card';
import { Clock, Sparkles, RefreshCw, Move3D, ArrowUpCircle } from 'lucide-react';

interface TimelinePanelProps {
  generations: Generation[];
  selectedGeneration: Generation | null;
  onSelectGeneration: (generation: Generation) => void;
}

const stageIcons: Record<string, React.ReactNode> = {
  generate: <Sparkles className="h-3 w-3" />,
  refine: <RefreshCw className="h-3 w-3" />,
  multiangle: <Move3D className="h-3 w-3" />,
  upscale: <ArrowUpCircle className="h-3 w-3" />,
};

export function TimelinePanel({
  generations,
  selectedGeneration,
  onSelectGeneration,
}: TimelinePanelProps) {
  if (generations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No generations yet</p>
          <p className="text-xs">Your generation history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center h-full px-4 overflow-x-auto gap-3">
      {generations.map((generation, index) => (
        <Card
          key={generation.id}
          className={cn(
            'flex-shrink-0 w-24 h-24 p-0 cursor-pointer transition-all overflow-hidden',
            'hover:ring-2 hover:ring-primary/50',
            selectedGeneration?.id === generation.id && 'ring-2 ring-primary'
          )}
          onClick={() => onSelectGeneration(generation)}
        >
          <div className="relative w-full h-full">
            {generation.thumbnailUrl ? (
              <img
                src={generation.thumbnailUrl}
                alt={`Generation ${index + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            
            {/* Status Overlay */}
            {generation.status === 'processing' && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            
            {/* Stage Badge */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-1.5">
              <div className="flex items-center gap-1 text-foreground">
                {stageIcons[generation.settings?.model || 'generate']}
                <span className="text-[10px] font-medium truncate">
                  {generation.prompt?.slice(0, 15) || 'Generation'}
                </span>
              </div>
            </div>
            
            {/* Index Badge */}
            <div className="absolute top-1 right-1 bg-background/80 text-foreground text-[10px] font-mono px-1 rounded">
              #{generations.length - index}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
