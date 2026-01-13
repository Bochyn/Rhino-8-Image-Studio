import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Project, Capture, Generation } from '@/lib/types';
import { useJobs } from '@/hooks/useJobs';
import { useRhino } from '@/hooks/useRhino';
import { AssetsPanel } from '@/components/Studio/AssetsPanel';
import { CanvasStage } from '@/components/Studio/CanvasStage';
import { InspectorPanel } from '@/components/Studio/InspectorPanel';
import { SettingsModal } from '@/components/Settings/SettingsModal';
import { Button } from '@/components/Common/Button';
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
    const completedJob = jobs.find(j => j.status === 'completed');
    if (completedJob) {
      loadData();
    }
  }, [jobs, loadData]);

  // Capture viewport
  const handleCapture = async () => {
    // Default capture settings
    const width = 1024;
    const height = 1024;
    const displayMode = 'Shaded';

    if (!projectId || !rhino) return;
    
    setIsCapturing(true);
    try {
      const captureId = await rhino.CaptureViewport(projectId, width, height, displayMode);
      if (captureId) {
        await loadData();
        // Since loadData is async and state updates batch, we might not find it immediately in 'captures'
        // But the next render after loadData will have it. 
        // We can manually fetch the new list to be sure or just wait.
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
      // Determine captureId based on selected item
      let captureId: string | undefined;
      if (selectedItem && 'viewName' in selectedItem) {
        captureId = selectedItem.id;
      } else if (selectedItem && 'prompt' in selectedItem) {
        // If a generation is selected, we might want to use its source capture? 
        // Or if it's refinement, we use the generation image itself?
        // API.generations.create expects `captureId`.
        // If we are refining a generation, the backend might handle it differently or we need to pass the image URL.
        // For now, let's assume we need a base capture.
        // If we don't have one, we can't generate unless it's text-to-image (not supported by NanoBanana usually without Init image?)
        // Wait, NanoBanana/Edit needs an image.
        // Let's see if we can trace back the capture ID or if we just pass the selected ID.
        // The API definition says `captureId?: string`.
        // If we selected a generation, we might be out of luck unless we stored the source capture ID.
        // But for now, let's just pass captureId if it IS a capture.
      }

      await api.generations.create({
        projectId,
        prompt,
        settings,
        captureId: captureId, // Only pass if it's a capture for now, strictly speaking
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

  // Determine original/source image for comparison
  // Ideally, if selectedItem is a Generation, its source was a Capture.
  // But we don't have that link easily available in the frontend types yet without traversing.
  // For now, we compare against nothing or handle it if we had the data.
  // A simple hack: If we have a selected Generation, and we have Captures, maybe we can find one? No.
  // We'll leave 'originalImage' undefined for generations for now unless we store it.
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[hsl(var(--app-bg))]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--accent-cta))]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[hsl(var(--app-bg))] text-white overflow-hidden">
      {/* App Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-white/5 bg-[hsl(var(--panel-bg))] flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="hover:bg-white/5">
            <Home className="h-5 w-5 text-white/70" />
          </Button>
          <div className="flex items-center gap-3">
             <div className="h-6 w-px bg-white/10" />
             <h1 className="font-medium text-sm tracking-wide">{project?.name || 'Untitled Project'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!rhinoAvailable && (
            <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs">
              Rhino Bridge Disconnected
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="hover:bg-white/5">
            <Settings className="h-5 w-5 text-white/70" />
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
            originalImage={null} // TODO: Implement source tracking for proper comparison
            isProcessing={jobs.some(j => j.status === 'running')}
            onDownload={handleDownload}
          />
        </div>

        {/* Right: Inspector */}
        <div className="w-80 flex-shrink-0">
          <InspectorPanel
            selectedCapture={selectedItem && 'viewName' in selectedItem ? selectedItem : null}
            selectedGeneration={selectedItem && 'prompt' in selectedItem ? selectedItem : null}
            onGenerate={handleGenerate}
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
