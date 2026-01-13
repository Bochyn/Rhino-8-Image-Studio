import { useState, useCallback, useRef } from 'react';
import { Job } from '@/lib/types';

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  const handleJobUpdate = useCallback((event: MessageEvent) => {
    try {
      const updatedJob = JSON.parse(event.data) as Job;
      setJobs(current => {
        const idx = current.findIndex(j => j.id === updatedJob.id);
        if (idx >= 0) {
          const newJobs = [...current];
          newJobs[idx] = updatedJob;
          return newJobs;
        }
        return [updatedJob, ...current];
      });
    } catch (e) {
      console.error('Failed to parse job event:', e);
    }
  }, []);

  const subscribe = useCallback((sessionId: string) => {
    // Don't reconnect if already connected to same session
    if (currentSessionIdRef.current === sessionId && eventSourceRef.current) {
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    currentSessionIdRef.current = sessionId;
    const eventSource = new EventSource(`/api/sessions/${sessionId}/events`);
    
    eventSource.onmessage = handleJobUpdate;
    eventSource.onerror = (e) => {
      console.error('SSE error:', e);
    };

    eventSourceRef.current = eventSource;
  }, [handleJobUpdate]);

  const unsubscribe = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      currentSessionIdRef.current = null;
    }
  }, []);

  return { jobs, subscribe, unsubscribe };
}
