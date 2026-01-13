import { Project, Capture, Generation, CreateProjectRequest, GenerateRequest } from './types';

const API_BASE = '/api';

export interface ConfigInfo {
  hasApiKey: boolean;
  dataPath: string;
  backendPort: number;
}

export const api = {
  config: {
    get: async (): Promise<ConfigInfo> => {
      const res = await fetch(`${API_BASE}/config`);
      if (!res.ok) throw new Error('Failed to fetch config');
      return res.json();
    },
    setApiKey: async (apiKey: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/config/api-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      if (!res.ok) throw new Error('Failed to set API key');
    },
  },
  projects: {
    list: async (): Promise<Project[]> => {
      const res = await fetch(`${API_BASE}/projects`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      // API returns { projects: [], totalCount: number }
      return data.projects || [];
    },
    get: async (id: string): Promise<Project> => {
      const res = await fetch(`${API_BASE}/projects/${id}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      return res.json();
    },
    create: async (data: CreateProjectRequest): Promise<Project> => {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create project');
      return res.json();
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete project');
    },
    togglePin: async (id: string, pinned: boolean): Promise<Project> => {
       const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: pinned }),
      });
      if (!res.ok) throw new Error('Failed to update pin status');
      return res.json();
    }
  },
  captures: {
    list: async (projectId: string): Promise<Capture[]> => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/captures`);
      if (!res.ok) throw new Error('Failed to fetch captures');
      return res.json();
    },
  },
  generations: {
    list: async (projectId: string): Promise<Generation[]> => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/generations`);
      if (!res.ok) throw new Error('Failed to fetch generations');
      return res.json();
    },
    listAll: async (): Promise<Generation[]> => {
      const res = await fetch(`${API_BASE}/generations`);
      if (!res.ok) throw new Error('Failed to fetch all generations');
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
