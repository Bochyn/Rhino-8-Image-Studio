import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Project, Capture, Generation, ReferenceImage, MaskState, MaskLayer, MASK_COLORS, MaskLayerPayload } from '@/lib/types';
import { calculateDimensions, AllModelSettings, DEFAULT_ALL_SETTINGS, MODELS, getAvailableMaskSlots } from '@/lib/models';
import { exportMaskAsPng } from '@/lib/maskUtils';
import { useJobs } from '@/hooks/useJobs';
import { useRhino } from '@/hooks/useRhino';
import { AssetsPanel } from '@/components/Studio/AssetsPanel';
import { CanvasStage } from '@/components/Studio/CanvasStage';
import { InspectorPanel } from '@/components/Studio/InspectorPanel';
import { ReferencePanel } from '@/components/Studio/ReferencePanel';
import { SettingsModal } from '@/components/Settings/SettingsModal';
import { DebugModal } from '@/components/Studio/DebugModal';
import { Button } from '@/components/Common/Button';
import { ThemeSwitch } from '@/components/Common/ThemeSwitch';
import { Settings, Loader2, Home } from 'lucide-react';

export function StudioPage() {
  const { sessionId: projectId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { rhino, isAvailable: rhinoAvailable } = useRhino();
  const { jobs, subscribe, unsubscribe } = useJobs();

  const [project, setProject] = useState<Project | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [archivedGenerations, setArchivedGenerations] = useState<Generation[]>([]);

  // Unified selection state
  const [selectedItem, setSelectedItem] = useState<Capture | Generation | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [assetsCollapsed, setAssetsCollapsed] = useState(false);
  const [debugGenerationId, setDebugGenerationId] = useState<string | null>(null);

  // Editor settings from InspectorPanel (for capture sync)
  const [editorSettings, setEditorSettings] = useState<AllModelSettings>(DEFAULT_ALL_SETTINGS);
  const [currentModelId, setCurrentModelId] = useState<string>('gemini-3-pro-image-preview');
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [showReferences, setShowReferences] = useState(false);

  // Mask state
  const [maskState, setMaskState] = useState<MaskState>({
    layers: [],
    activeLayerId: null,
    brush: { size: 20, mode: 'brush' },
  });
  const [isMaskMode, setIsMaskMode] = useState(false);
  const [sourceImageDimensions, setSourceImageDimensions] = useState<{ w: number; h: number } | null>(null);

  const currentModelInfo = MODELS[currentModelId];
  const supportsRefs = currentModelInfo?.capabilities.supportsReferences ?? false;
  const maxRefs = currentModelInfo?.maxReferences ?? 0;
  const supportsMasks = currentModelInfo?.capabilities.supportsMasks ?? false;
  const maxMaskLayers = currentModelInfo?.maxMaskLayers ?? 0;

  // Load project data
  const loadData = useCallback(async () => {
    if (!projectId) return;
    try {
      const [projectData, capturesData, generationsData, referencesData, archivedData] = await Promise.all([
        api.projects.get(projectId),
        api.captures.list(projectId),
        api.generations.list(projectId),
        api.references.list(projectId),
        api.generations.listArchived(projectId),
      ]);
      setProject(projectData);
      setCaptures(capturesData);
      setGenerations(generationsData);
      setReferences(referencesData);
      setArchivedGenerations(archivedData);

      // Auto-select logic if nothing selected
      if (!selectedItem) {
        if (generationsData.length > 0) {
          setSelectedItem(generationsData[0]);
        } else if (capturesData.length > 0) {
          setSelectedItem(capturesData[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load project data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, selectedItem]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to SSE events
  useEffect(() => {
    if (!projectId) return;
    subscribe(projectId);
    return () => unsubscribe();
  }, [projectId, subscribe, unsubscribe]);

  // Reload generations when job completes
  useEffect(() => {
    const completedJob = jobs.find(j => j.status === 'completed' || j.status === 'Succeeded');
    if (completedJob) {
      loadData();
    }
  }, [jobs, loadData]);

  // Hide reference panel when model doesn't support references
  useEffect(() => {
    if (!supportsRefs) {
      setShowReferences(false);
    }
  }, [supportsRefs]);

  // Handle settings changes from InspectorPanel
  const handleSettingsChange = useCallback((settings: AllModelSettings, modelId: string) => {
    setEditorSettings(settings);
    setCurrentModelId(modelId);
  }, []);

  // ---- Mask handlers ----

  const handleAddMaskLayer = useCallback(() => {
    setMaskState(prev => {
      if (prev.layers.length >= maxMaskLayers) return prev;
      const colorIndex = prev.layers.length % MASK_COLORS.length;
      const newLayer: MaskLayer = {
        id: crypto.randomUUID(),
        name: `Mask ${prev.layers.length + 1}`,
        color: MASK_COLORS[colorIndex],
        instruction: '',
        visible: true,
        imageData: null,
      };
      return {
        ...prev,
        layers: [...prev.layers, newLayer],
        activeLayerId: newLayer.id,
      };
    });
  }, [maxMaskLayers]);

  const handleRemoveMaskLayer = useCallback((layerId: string) => {
    setMaskState(prev => {
      const filtered = prev.layers.filter(l => l.id !== layerId);
      return {
        ...prev,
        layers: filtered,
        activeLayerId: prev.activeLayerId === layerId ? (filtered[0]?.id ?? null) : prev.activeLayerId,
      };
    });
  }, []);

  const handleSelectMaskLayer = useCallback((layerId: string) => {
    setMaskState(prev => ({ ...prev, activeLayerId: layerId }));
  }, []);

  const handleUpdateMaskInstruction = useCallback((layerId: string, instruction: string) => {
    setMaskState(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === layerId ? { ...l, instruction } : l),
    }));
  }, []);

  const handleToggleMaskVisibility = useCallback((layerId: string) => {
    setMaskState(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l),
    }));
  }, []);

  const handleMaskLayerUpdate = useCallback((layerId: string, imageData: ImageData) => {
    setMaskState(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === layerId ? { ...l, imageData } : l),
    }));
  }, []);

  const handleToggleMaskMode = useCallback(() => {
    setIsMaskMode(prev => !prev);
  }, []);

  // ---- Mask effects ----

  // Load source image dimensions
  useEffect(() => {
    const url = getDisplayImage();
    if (!url) {
      setSourceImageDimensions(null);
      return;
    }
    const img = new Image();
    img.onload = () => setSourceImageDimensions({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  }, [selectedItem]);

  // Clear masks on selectedItem change
  useEffect(() => {
    setMaskState(prev => ({
      ...prev,
      layers: [],
      activeLayerId: null,
    }));
    setIsMaskMode(false);
  }, [selectedItem?.id]);

  // Trim masks when model/refs change and exceed limit
  useEffect(() => {
    const available = getAvailableMaskSlots(currentModelId, references.length);
    setMaskState(prev => {
      if (prev.layers.length <= available) return prev;
      const trimmed = prev.layers.slice(0, available);
      return {
        ...prev,
        layers: trimmed,
        activeLayerId: trimmed.some(l => l.id === prev.activeLayerId) ? prev.activeLayerId : (trimmed[0]?.id ?? null),
      };
    });
  }, [currentModelId, references.length]);

  // Capture viewport with AR/Resolution from editor settings
  const handleCapture = async () => {
    if (!projectId || !rhino) return;

    // Get dimensions from current editor settings
    const { aspectRatio, resolution } = editorSettings.generation;
    const { width, height } = calculateDimensions(aspectRatio, resolution, currentModelId);
    const displayMode = 'Shaded';

    setIsCapturing(true);
    try {
      const captureId = await rhino.CaptureViewport(projectId, width, height, displayMode);
      if (captureId) {
        await loadData();
        const newCaptures = await api.captures.list(projectId);
        setCaptures(newCaptures);
        const newCapture = newCaptures.find(c => c.id === captureId);
        if (newCapture) setSelectedItem(newCapture);
      }
    } catch (error) {
      console.error('Capture failed:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleGenerate = async (prompt: string, settings: any) => {
    if (!projectId) return;

    try {
      const mode = settings?.mode || 'generate';

      // Determine source based on selected item type
      let sourceCaptureId: string | undefined;
      let sourceGenerationId: string | undefined;

      if (selectedItem) {
        if ('viewName' in selectedItem) {
          // It's a Capture
          sourceCaptureId = selectedItem.id;
        } else if ('prompt' in selectedItem) {
          // It's a Generation
          sourceGenerationId = selectedItem.id;
        }
      }

      if (mode === 'multiangle') {
        // Multi-angle works with both capture and generation
        if (!sourceGenerationId && !sourceCaptureId) {
          console.error('Multi-angle requires an image source');
          return;
        }
        await api.multiAngle.create({
          projectId,
          sourceGenerationId,
          sourceCaptureId,
          horizontalAngle: settings?.horizontalAngle,
          verticalAngle: settings?.verticalAngle,
          zoom: settings?.zoom,
          loraScale: settings?.loraScale,
        });
      } else if (mode === 'upscale') {
        // Upscale requires a source generation
        if (!sourceGenerationId) {
          console.error('Upscale requires a generated image as source');
          return;
        }
        await api.upscale.create({
          projectId,
          sourceGenerationId,
          model: settings?.model,
          upscaleFactor: settings?.upscaleFactor,
          faceEnhancement: settings?.faceEnhancement,
          outputFormat: settings?.outputFormat,
        });
      } else {
        // Generate or Refine — export mask layers if present
        let maskLayers: MaskLayerPayload[] | undefined;
        if (maskState.layers.length > 0) {
          const validMasks = maskState.layers.filter(l => l.imageData && l.instruction.trim());
          if (validMasks.length > 0) {
            maskLayers = await Promise.all(
              validMasks.map(async (layer) => ({
                maskImageBase64: await exportMaskAsPng(layer.imageData!),
                instruction: layer.instruction.trim(),
              }))
            );
          }
        }

        await api.generations.create({
          projectId,
          prompt,
          sourceCaptureId,
          parentGenerationId: sourceGenerationId,
          model: settings?.model,
          aspectRatio: settings?.aspectRatio,
          resolution: settings?.resolution,
          numImages: settings?.numImages ?? 1,
          outputFormat: settings?.outputFormat ?? 'Png',
          referenceImageIds: supportsRefs ? references.map(r => r.id) : undefined,
          maskLayers,
        });
      }
      // Job will be tracked via SSE
    } catch (error) {
      console.error('Generate failed:', error);
    }
  };

  const handleDelete = async (id: string, type: 'capture' | 'generation') => {
    if (!projectId) return;
    if (type === 'capture') {
       if (confirm('Are you sure you want to delete this capture?')) {
         await api.captures.delete(id);
         setCaptures(prev => prev.filter(c => c.id !== id));
         if (selectedItem?.id === id) setSelectedItem(null);
       }
    } else {
      try {
        await api.generations.archive(id);
        const archived = generations.find(g => g.id === id);
        setGenerations(prev => prev.filter(g => g.id !== id));
        if (archived) {
          setArchivedGenerations(prev => [{ ...archived, isArchived: true, archivedAt: new Date().toISOString() }, ...prev]);
        }
        if (selectedItem?.id === id) setSelectedItem(null);
      } catch (error) {
        console.error('Failed to archive generation:', error);
        loadData();
      }
    }
  };

  const handleRestore = async (id: string) => {
    if (!projectId) return;
    try {
      await api.generations.restore(id);
      const restored = archivedGenerations.find(g => g.id === id);
      setArchivedGenerations(prev => prev.filter(g => g.id !== id));
      if (restored) {
        setGenerations(prev => [{ ...restored, isArchived: false, archivedAt: undefined }, ...prev]);
      }
    } catch (error) {
      console.error('Failed to restore generation:', error);
      loadData();
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!projectId) return;
    if (confirm('Permanently delete this generation? This cannot be undone.')) {
      try {
        await api.generations.permanentDelete(id);
        setArchivedGenerations(prev => prev.filter(g => g.id !== id));
        if (selectedItem?.id === id) setSelectedItem(null);
      } catch (error) {
        console.error('Failed to permanently delete generation:', error);
        loadData();
      }
    }
  };

  const handleDebug = useCallback((id: string) => {
    setDebugGenerationId(id);
  }, []);

  const handleDownload = () => {
    if (!selectedItem) return;
    const url = 'imageUrl' in selectedItem ? selectedItem.imageUrl : '';
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `rhino-image-${selectedItem.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Helper to get image URL for Canvas
  const getDisplayImage = (): string | null => {
    if (!selectedItem) return null;
    const url = 'imageUrl' in selectedItem ? selectedItem.imageUrl : null;
    return url || null;
  };

  // Helper to get original image for A/B comparison
  const getOriginalImage = (): string | null => {
    if (!selectedItem) return null;

    // Captures have no "original" - they ARE the original
    if ('viewName' in selectedItem) return null;

    // Generation - find source capture or parent generation
    const generation = selectedItem as Generation;

    // Priority 1: Source capture (direct input)
    if (generation.sourceCaptureId) {
      const sourceCapture = captures.find(c => c.id === generation.sourceCaptureId);
      if (sourceCapture) return sourceCapture.imageUrl;
    }

    // Priority 2: Parent generation (refinement chain)
    if (generation.parentGenerationId) {
      const parentGen = generations.find(g => g.id === generation.parentGenerationId)
        || archivedGenerations.find(g => g.id === generation.parentGenerationId);
      if (parentGen?.imageUrl) return parentGen.imageUrl;
    }

    return null;
  };

  // Find active job for progress display
  const activeJob = jobs.find(j => j.status === 'running' || j.status === 'Running') || null;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background text-text overflow-hidden">
      {/* App Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-border/50 bg-panel flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="hover:bg-primary/5">
            <Home className="h-5 w-5 text-secondary" />
          </Button>
          <div className="flex items-center gap-3">
             <div className="h-6 w-px bg-border" />
             <h1 className="font-medium text-sm tracking-wide text-primary">{project?.name || 'Untitled Project'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!rhinoAvailable && (
            <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs">
              Rhino Bridge Disconnected
            </div>
          )}
          <ThemeSwitch />
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="hover:bg-primary/5">
            <Settings className="h-5 w-5 text-secondary" />
          </Button>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <div className="flex-1 flex gap-3 p-3 overflow-hidden">

        {/* Left: Assets */}
        <div className={`flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${assetsCollapsed ? 'w-16' : 'w-80'}`}>
          <AssetsPanel
            captures={captures}
            generations={generations}
            selectedItem={selectedItem}
            onSelect={setSelectedItem}
            onCapture={handleCapture}
            onDelete={handleDelete}
            isCapturing={isCapturing}
            rhinoAvailable={rhinoAvailable}
            isCollapsed={assetsCollapsed}
            onToggleCollapse={() => setAssetsCollapsed(!assetsCollapsed)}
            archivedGenerations={archivedGenerations}
            onRestore={handleRestore}
            onPermanentDelete={handlePermanentDelete}
            onDebug={handleDebug}
          />
        </div>

        {/* Center: Canvas + Reference Panel */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex-1 min-h-0">
            <CanvasStage
              currentImage={getDisplayImage()}
              originalImage={getOriginalImage()}
              isProcessing={!!activeJob}
              activeJob={activeJob}
              onDownload={handleDownload}
              supportsReferences={supportsRefs}
              hasReferences={references.length > 0}
              onToggleReferences={() => setShowReferences(!showReferences)}
              captures={captures}
              generations={generations}
              selectedItemId={selectedItem?.id || null}
              maskState={maskState}
              onMaskLayerUpdate={handleMaskLayerUpdate}
              isMaskMode={isMaskMode}
              onToggleMaskMode={handleToggleMaskMode}
              supportsMasks={supportsMasks}
              sourceWidth={sourceImageDimensions?.w}
              sourceHeight={sourceImageDimensions?.h}
            />
          </div>
          {showReferences && supportsRefs && (
            <ReferencePanel
              projectId={projectId!}
              references={references}
              maxReferences={maxRefs}
              onReferencesChange={setReferences}
              onClose={() => setShowReferences(false)}
            />
          )}
        </div>

        {/* Right: Inspector */}
        <div className="w-80 flex-shrink-0">
          <InspectorPanel
            selectedCapture={selectedItem && 'viewName' in selectedItem ? selectedItem : null}
            selectedGeneration={selectedItem && 'prompt' in selectedItem ? selectedItem : null}
            onGenerate={handleGenerate}
            onSettingsChange={handleSettingsChange}
            jobs={jobs}
            maskState={maskState}
            onAddMaskLayer={handleAddMaskLayer}
            onRemoveMaskLayer={handleRemoveMaskLayer}
            onSelectMaskLayer={handleSelectMaskLayer}
            onUpdateMaskInstruction={handleUpdateMaskInstruction}
            onToggleMaskVisibility={handleToggleMaskVisibility}
            isMaskMode={isMaskMode}
            onToggleMaskMode={handleToggleMaskMode}
            maxMaskLayers={maxMaskLayers}
            supportsMasks={supportsMasks}
          />
        </div>

      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <DebugModal
        isOpen={!!debugGenerationId}
        onClose={() => setDebugGenerationId(null)}
        generationId={debugGenerationId}
      />
    </div>
  );
}
