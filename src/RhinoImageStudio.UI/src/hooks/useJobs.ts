import { useState, useCallback, useRef } from 'react';
import { Job } from '@/lib/types';

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentProjectIdRef = useRef<string | null>(null);

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

  const subscribe = useCallback((projectId: string) => {
    // Don't reconnect if already connected to same project
    if (currentProjectIdRef.current === projectId && eventSourceRef.current) {
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    currentProjectIdRef.current = projectId;
    const eventSource = new EventSource(`/api/projects/${projectId}/events`);
    
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
      currentProjectIdRef.current = null;
    }
  }, []);

  return { jobs, subscribe, unsubscribe };
}
