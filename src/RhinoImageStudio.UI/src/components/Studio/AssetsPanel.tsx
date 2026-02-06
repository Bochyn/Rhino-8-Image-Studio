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
  Layers,
  Archive,
  ArchiveRestore,
  Bug
} from 'lucide-react';

interface AssetsPanelProps {
  captures: Capture[];
  generations: Generation[];
  archivedGenerations: Generation[];
  selectedItem: Capture | Generation | null;
  onSelect: (item: Capture | Generation) => void;
  onCapture: () => void;
  onDelete: (id: string, type: 'capture' | 'generation') => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onDebug?: (id: string) => void;
  isCapturing: boolean;
  rhinoAvailable: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

type Tab = 'captures' | 'generations' | 'favorites' | 'archived';

export function AssetsPanel({
  captures,
  generations,
  archivedGenerations,
  selectedItem,
  onSelect,
  onCapture,
  onDelete,
  onRestore,
  onPermanentDelete,
  onDebug,
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
      case 'favorites': return [];
      case 'archived': return archivedGenerations;
    }
  };

  const isSelected = (item: Capture | Generation) => selectedItem?.id === item.id;

  const renderCard = (item: Capture | Generation) => {
    const isCap = 'viewName' in item;
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
            ? "ring-2 ring-primary border-transparent"
            : "hover:border-card-hover bg-card"
        )}
      >
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-card text-secondary">
            <ImageIcon className="h-8 w-8 opacity-20" />
          </div>
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Action Buttons (Hover) */}
        {activeTab === 'archived' ? (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button
              onClick={(e) => { e.stopPropagation(); onDebug?.(item.id); }}
              className="p-1.5 rounded-full bg-background/60 text-primary hover:bg-primary/80 hover:text-white transition-all"
              title="Debug info"
            >
              <Bug className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRestore?.(item.id); }}
              className="p-1.5 rounded-full bg-background/60 text-primary hover:bg-green-500/80 hover:text-white transition-all"
              title="Restore"
            >
              <ArchiveRestore className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onPermanentDelete?.(item.id); }}
              className="p-1.5 rounded-full bg-background/60 text-primary hover:bg-red-500/80 hover:text-white transition-all"
              title="Delete permanently"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
            {!isCap && (
              <button
                onClick={(e) => { e.stopPropagation(); onDebug?.(item.id); }}
                className="p-1.5 rounded-full bg-background/60 text-primary hover:bg-primary/80 hover:text-white transition-all"
                title="Debug info"
              >
                <Bug className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id, isCap ? 'capture' : 'generation');
              }}
              className="p-1.5 rounded-full bg-background/60 text-primary hover:bg-red-500/80 hover:text-white transition-all"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Metadata Label */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
          <p className="text-xs font-medium text-primary truncate">{title}</p>
          <p className="text-[10px] text-secondary truncate">{meta}</p>
        </div>

        {/* Selection Indicator (if selected) */}
        {isSelected(item) && (
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
        )}
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="h-full w-14 flex flex-col items-center py-4 gap-4 bg-panel rounded-2xl border border-border">
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} title="Expand">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="w-8 h-px bg-border" />
        <Button
          variant="ghost"
          size="icon"
          onClick={onCapture}
          className="bg-primary text-background hover:bg-primary/90"
        >
          <Camera className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-panel rounded-2xl overflow-hidden border border-border">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border/50">
        <h2 className="text-sm font-semibold tracking-wide text-primary uppercase">Assets</h2>
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="h-6 w-6">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Capture Action */}
      <div className="p-4 pb-2">
        <Button
          className="w-full bg-card hover:bg-card-hover text-primary border border-border/50 h-10 gap-2 justify-start px-3"
          onClick={onCapture}
          disabled={!rhinoAvailable || isCapturing}
        >
          <div className="p-1 rounded bg-primary">
            <Camera className="h-3 w-3 text-background" />
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
              ? "bg-primary/10 text-primary"
              : "text-secondary hover:bg-primary/5"
          )}
        >
          Captures
        </button>
        <button
          onClick={() => setActiveTab('generations')}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
            activeTab === 'generations'
              ? "bg-primary/10 text-primary"
              : "text-secondary hover:bg-primary/5"
          )}
        >
          Generations
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={cn(
            "py-1.5 px-2 text-xs font-medium rounded-md transition-colors",
            activeTab === 'archived'
              ? "bg-primary/10 text-primary"
              : "text-secondary hover:bg-primary/5"
          )}
          title="Archived"
        >
          <Archive className="h-3 w-3" />
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={cn(
            "py-1.5 px-2 text-xs font-medium rounded-md transition-colors",
            activeTab === 'favorites'
              ? "bg-primary/10 text-primary"
              : "text-secondary hover:bg-primary/5"
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
