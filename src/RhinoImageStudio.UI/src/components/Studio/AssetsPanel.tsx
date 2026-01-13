import { useState } from 'react';
import { Capture, Generation } from '@/lib/types';
import { Button } from '@/components/Common/Button';
import { cn } from '@/lib/utils';
import { 
  Camera, 
  Image as ImageIcon, 
  Heart, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Layers
} from 'lucide-react';

interface AssetsPanelProps {
  captures: Capture[];
  generations: Generation[];
  selectedItem: Capture | Generation | null;
  onSelect: (item: Capture | Generation) => void;
  onCapture: () => void;
  onDelete: (id: string, type: 'capture' | 'generation') => void;
  isCapturing: boolean;
  rhinoAvailable: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

type Tab = 'captures' | 'generations' | 'favorites';

export function AssetsPanel({
  captures,
  generations,
  selectedItem,
  onSelect,
  onCapture,
  onDelete,
  isCapturing,
  rhinoAvailable,
  isCollapsed,
  onToggleCollapse
}: AssetsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('captures');

  const getActiveList = () => {
    switch (activeTab) {
      case 'captures': return captures;
      case 'generations': return generations;
      // Favorites not implemented yet, merge of both logic usually
      case 'favorites': return []; 
    }
  };

  const isSelected = (item: Capture | Generation) => selectedItem?.id === item.id;

  const renderCard = (item: Capture | Generation) => {
    const isCap = 'viewName' in item; // Simple type guard
    const title = isCap 
      ? (item as Capture).viewName || `Capture ${new Date(item.createdAt).toLocaleTimeString()}`
      : (item as Generation).prompt || 'Untitled Generation';
    
    const image = isCap 
      ? (item as Capture).thumbnailUrl || (item as Capture).imageUrl
      : (item as Generation).thumbnailUrl || (item as Generation).imageUrl;

    const meta = isCap
      ? `${(item as Capture).width}x${(item as Capture).height}`
      : (item as Generation).settings?.model?.split('/').pop() || 'AI';

    return (
      <div 
        key={item.id}
        onClick={() => onSelect(item)}
        className={cn(
          "group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border border-transparent",
          isSelected(item) 
            ? "ring-2 ring-[hsl(var(--accent-cta))] border-transparent" 
            : "hover:border-[hsl(var(--card-hover))] bg-[hsl(var(--card-bg))]"
        )}
      >
        {image ? (
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[hsl(var(--card-bg))] text-muted-foreground">
            <ImageIcon className="h-8 w-8 opacity-20" />
          </div>
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Delete Button (Hover) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id, isCap ? 'capture' : 'generation');
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500/80 transition-all"
        >
          <Trash2 className="h-3 w-3" />
        </button>

        {/* Metadata Label */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
          <p className="text-xs font-medium text-white truncate">{title}</p>
          <p className="text-[10px] text-white/60 truncate">{meta}</p>
        </div>

        {/* Selection Indicator (if selected) */}
        {isSelected(item) && (
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[hsl(var(--accent-cta))]" />
        )}
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="h-full w-14 flex flex-col items-center py-4 gap-4 bg-[hsl(var(--panel-bg))] rounded-2xl border border-[hsl(var(--border-subtle))]">
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} title="Expand">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="w-8 h-px bg-white/10" />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onCapture} 
          className="bg-[hsl(var(--accent-cta))] text-white hover:bg-[hsl(var(--accent-cta))/90]"
        >
          <Camera className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--panel-bg))] rounded-2xl overflow-hidden border border-[hsl(var(--border-subtle))]">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <h2 className="text-sm font-semibold tracking-wide text-white/90 uppercase">Assets</h2>
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="h-6 w-6">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Capture Action */}
      <div className="p-4 pb-2">
        <Button 
          className="w-full bg-[hsl(var(--card-bg))] hover:bg-[hsl(var(--card-hover))] text-white border border-white/5 h-10 gap-2 justify-start px-3"
          onClick={onCapture}
          disabled={!rhinoAvailable || isCapturing}
        >
          <div className="p-1 rounded bg-[hsl(var(--accent-cta))]">
            <Camera className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm font-medium">
            {isCapturing ? 'Capturing...' : 'New Capture'}
          </span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2">
        <button
          onClick={() => setActiveTab('captures')}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
            activeTab === 'captures' 
              ? "bg-white/10 text-white" 
              : "text-muted-foreground hover:bg-white/5"
          )}
        >
          Captures
        </button>
        <button
          onClick={() => setActiveTab('generations')}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
            activeTab === 'generations' 
              ? "bg-white/10 text-white" 
              : "text-muted-foreground hover:bg-white/5"
          )}
        >
          Generations
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={cn(
            "py-1.5 px-2 text-xs font-medium rounded-md transition-colors",
            activeTab === 'favorites' 
              ? "bg-white/10 text-white" 
              : "text-muted-foreground hover:bg-white/5"
          )}
        >
          <Heart className="h-3 w-3" />
        </button>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="grid grid-cols-2 gap-3">
          {getActiveList().map(renderCard)}
        </div>
        
        {getActiveList().length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
            <Layers className="h-8 w-8 mb-2" />
            <p className="text-xs">No assets found</p>
          </div>
        )}
      </div>
    </div>
  );
}
