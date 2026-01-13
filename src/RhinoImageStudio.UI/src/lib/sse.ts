import { useEffect } from 'react';
import { Job } from './types';

type EventHandler = (event: MessageEvent) => void;

export class SSEClient {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();

  connect(url: string) {
    if (this.eventSource) {
      if (this.eventSource.url === url && this.eventSource.readyState !== EventSource.CLOSED) return;
      this.disconnect();
    }

    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      this.emit('message', event);
    };

    this.eventSource.addEventListener('job-update', (event) => {
      this.emit('job-update', event);
    });

    this.eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      this.disconnect();
      // Simple reconnect logic could go here
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  on(event: string, handler: EventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(handler);
  }

  off(event: string, handler: EventHandler) {
    this.listeners.get(event)?.delete(handler);
  }

  private emit(event: string, data: MessageEvent) {
    this.listeners.get(event)?.forEach(handler => handler(data));
  }
}

export const sse = new SSEClient();

export function useJobEvents(sessionId: string | null, onJobUpdate: (job: Job) => void) {
  useEffect(() => {
    if (!sessionId) return;
    
    // Connect to global events or session specific events
    // For now, assuming global events endpoint handles session filtering or we just filter client side
    // Or we connect to /api/events
    sse.connect('/api/events');

    const handler = (event: MessageEvent) => {
      try {
        const job: Job = JSON.parse(event.data);
        if (job.sessionId === sessionId) {
          onJobUpdate(job);
        }
      } catch (e) {
        console.error('Failed to parse job update', e);
      }
    };

    sse.on('job-update', handler);

    return () => {
      sse.off('job-update', handler);
    };
  }, [sessionId, onJobUpdate]);
}
