import { Session, Capture, Generation, CreateSessionRequest, GenerateRequest } from './types';

const API_BASE = '/api';

export const api = {
  sessions: {
    list: async (): Promise<Session[]> => {
      const res = await fetch(`${API_BASE}/sessions`);
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      // API returns { sessions: [], totalCount: number }
      return data.sessions || [];
    },
    get: async (id: string): Promise<Session> => {
      const res = await fetch(`${API_BASE}/sessions/${id}`);
      if (!res.ok) throw new Error('Failed to fetch session');
      return res.json();
    },
    create: async (data: CreateSessionRequest): Promise<Session> => {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create session');
      return res.json();
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/sessions/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete session');
    },
    togglePin: async (id: string, pinned: boolean): Promise<Session> => {
       const res = await fetch(`${API_BASE}/sessions/${id}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned }),
      });
      if (!res.ok) throw new Error('Failed to update pin status');
      return res.json();
    }
  },
  captures: {
    list: async (sessionId: string): Promise<Capture[]> => {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/captures`);
      if (!res.ok) throw new Error('Failed to fetch captures');
      return res.json();
    },
  },
  generations: {
    list: async (sessionId: string): Promise<Generation[]> => {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/generations`);
      if (!res.ok) throw new Error('Failed to fetch generations');
      return res.json();
    },
    create: async (data: GenerateRequest): Promise<Generation> => {
      const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to start generation');
      return res.json();
    }
  }
};
