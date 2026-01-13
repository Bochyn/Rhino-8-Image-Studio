import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Session, Capture, Generation } from '@/lib/types';
import { useJobs } from '@/hooks/useJobs';
import { useRhino } from '@/hooks/useRhino';
import { SourcesPanel } from '@/components/Studio/SourcesPanel';
import { CanvasPanel } from '@/components/Studio/CanvasPanel';
import { ControlsPanel } from '@/components/Studio/ControlsPanel';
import { TimelinePanel } from '@/components/Studio/TimelinePanel';
import { Button } from '@/components/Common/Button';
import { ArrowLeft, Settings, Loader2 } from 'lucide-react';

export function StudioPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { rhino, isAvailable: rhinoAvailable } = useRhino();
  const { jobs, subscribe, unsubscribe } = useJobs();

  const [session, setSession] = useState<Session | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [selectedCapture, setSelectedCapture] = useState<Capture | null>(null);
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);

  // Load session data
  const loadData = useCallback(async () => {
    if (!sessionId) return;
    try {
      const [sessionData, capturesData, generationsData] = await Promise.all([
        api.sessions.get(sessionId),
        api.captures.list(sessionId),
        api.generations.list(sessionId),
      ]);
      setSession(sessionData);
      setCaptures(capturesData);
      setGenerations(generationsData);
      
      // Auto-select latest
      if (generationsData.length > 0) {
        setSelectedGeneration(generationsData[0]);
      } else if (capturesData.length > 0) {
        setSelectedCapture(capturesData[0]);
      }
    } catch (error) {
      console.error('Failed to load session data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to SSE events
  useEffect(() => {
    if (!sessionId) return;
    subscribe(sessionId);
    return () => unsubscribe();
  }, [sessionId, subscribe, unsubscribe]);

  // Reload generations when job completes
  useEffect(() => {
    const completedJob = jobs.find(j => j.status === 'completed');
    if (completedJob) {
      loadData();
    }
  }, [jobs, loadData]);

  // Capture viewport
  const handleCapture = async (width: number, height: number, displayMode: string) => {
    if (!sessionId || !rhino) return;
    
    setIsCapturing(true);
    try {
      const captureId = await rhino.CaptureViewport(sessionId, width, height, displayMode);
      if (captureId) {
        await loadData();
        const newCapture = captures.find(c => c.id === captureId);
        if (newCapture) setSelectedCapture(newCapture);
      }
    } catch (error) {
      console.error('Capture failed:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  // Generate image
  const handleGenerate = async (prompt: string, settings: any) => {
    if (!sessionId) return;
    
    try {
      await api.generations.create({
        sessionId,
        prompt,
        settings,
        captureId: selectedCapture?.id,
      });
      // Job will be tracked via SSE
    } catch (error) {
      console.error('Generate failed:', error);
    }
  };

  // Get current display image
  const currentImage = selectedGeneration?.imageUrl || selectedCapture?.imageUrl || null;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold">{session?.name || 'Untitled Session'}</h1>
            <p className="text-xs text-muted-foreground">
              {captures.length} captures · {generations.length} generations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!rhinoAvailable && (
            <span className="text-xs text-yellow-500">Rhino bridge not available</span>
          )}
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content - 4 Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Sources */}
        <div className="w-64 border-r flex flex-col">
          <SourcesPanel
            captures={captures}
            selectedCapture={selectedCapture}
            onSelectCapture={(c) => {
              setSelectedCapture(c);
              setSelectedGeneration(null);
            }}
            onCapture={handleCapture}
            isCapturing={isCapturing}
            rhinoAvailable={rhinoAvailable}
          />
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 flex flex-col">
          <CanvasPanel
            currentImage={currentImage}
            originalImage={selectedCapture?.imageUrl}
            isProcessing={jobs.some(j => j.status === 'running')}
          />
        </div>

        {/* Right Panel - Controls */}
        <div className="w-80 border-l flex flex-col">
          <ControlsPanel
            selectedCapture={selectedCapture}
            selectedGeneration={selectedGeneration}
            onGenerate={handleGenerate}
            jobs={jobs}
          />
        </div>
      </div>

      {/* Bottom Panel - Timeline */}
      <div className="h-32 border-t">
        <TimelinePanel
          generations={generations}
          selectedGeneration={selectedGeneration}
          onSelectGeneration={(g) => {
            setSelectedGeneration(g);
            setSelectedCapture(null);
          }}
        />
      </div>
    </div>
  );
}
