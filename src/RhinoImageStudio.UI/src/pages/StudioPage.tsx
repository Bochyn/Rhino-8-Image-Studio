import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Project, Capture, Generation } from '@/lib/types';
import { calculateDimensions, AllModelSettings, DEFAULT_ALL_SETTINGS } from '@/lib/models';
import { useJobs } from '@/hooks/useJobs';
import { useRhino } from '@/hooks/useRhino';
import { AssetsPanel } from '@/components/Studio/AssetsPanel';
import { CanvasStage } from '@/components/Studio/CanvasStage';
import { InspectorPanel } from '@/components/Studio/InspectorPanel';
import { SettingsModal } from '@/components/Settings/SettingsModal';
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

  // Unified selection state
  const [selectedItem, setSelectedItem] = useState<Capture | Generation | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [assetsCollapsed, setAssetsCollapsed] = useState(false);

  // Editor settings from InspectorPanel (for capture sync)
  const [editorSettings, setEditorSettings] = useState<AllModelSettings>(DEFAULT_ALL_SETTINGS);
  const [currentModelId, setCurrentModelId] = useState<string>('gemini-3-pro-image-preview');

  // Load project data
  const loadData = useCallback(async () => {
    if (!projectId) return;
    try {
      const [projectData, capturesData, generationsData] = await Promise.all([
        api.projects.get(projectId),
        api.captures.list(projectId),
        api.generations.list(projectId),
      ]);
      setProject(projectData);
      setCaptures(capturesData);
      setGenerations(generationsData);

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

  // Handle settings changes from InspectorPanel
  const handleSettingsChange = useCallback((settings: AllModelSettings, modelId: string) => {
    setEditorSettings(settings);
    setCurrentModelId(modelId);
  }, []);

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
      // Determine source based on selected item type
      let sourceCaptureId: string | undefined;
      let parentGenerationId: string | undefined;

      if (selectedItem) {
        if ('viewName' in selectedItem) {
          // It's a Capture
          sourceCaptureId = selectedItem.id;
        } else if ('prompt' in selectedItem) {
          // It's a Generation
          parentGenerationId = selectedItem.id;
        }
      }

      await api.generations.create({
        projectId,
        prompt,
        sourceCaptureId,
        parentGenerationId,
        model: settings?.model,
        aspectRatio: settings?.aspectRatio,
        resolution: settings?.resolution,
        numImages: settings?.numImages ?? 1,
        outputFormat: settings?.outputFormat ?? 'Png',
      });
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
      // Generation delete not supported by API yet
      console.warn('Generation delete not supported');
    }
  };

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
      const parentGen = generations.find(g => g.id === generation.parentGenerationId);
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
          />
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 min-w-0">
          <CanvasStage
            currentImage={getDisplayImage()}
            originalImage={getOriginalImage()}
            isProcessing={!!activeJob}
            activeJob={activeJob}
            onDownload={handleDownload}
          />
        </div>

        {/* Right: Inspector */}
        <div className="w-80 flex-shrink-0">
          <InspectorPanel
            selectedCapture={selectedItem && 'viewName' in selectedItem ? selectedItem : null}
            selectedGeneration={selectedItem && 'prompt' in selectedItem ? selectedItem : null}
            onGenerate={handleGenerate}
            onSettingsChange={handleSettingsChange}
            jobs={jobs}
          />
        </div>

      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
