import { Project, Capture, Generation, CreateProjectRequest, GenerateRequest, ReferenceImage } from './types';

const API_BASE = '/api';

export interface ConfigInfo {
  hasFalApiKey: boolean;
  hasGeminiApiKey: boolean;
  dataPath: string;
  backendPort: number;
  defaultProvider: 'gemini' | 'fal';
}

export const api = {
  config: {
    get: async (): Promise<ConfigInfo> => {
      const res = await fetch(`${API_BASE}/config`);
      if (!res.ok) throw new Error('Failed to fetch config');
      return res.json();
    },
    setGeminiApiKey: async (apiKey: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/config/gemini-api-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      if (!res.ok) throw new Error('Failed to set Gemini API key');
    },
    setFalApiKey: async (apiKey: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/config/fal-api-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      if (!res.ok) throw new Error('Failed to set fal.ai API key');
    },
    // Legacy method for backwards compatibility
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
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/captures/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete capture');
    },
  },
  references: {
    list: async (projectId: string): Promise<ReferenceImage[]> => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/references`);
      if (!res.ok) throw new Error('Failed to fetch references');
      return res.json();
    },
    upload: async (projectId: string, file: File): Promise<ReferenceImage> => {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_BASE}/projects/${projectId}/references`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Failed to upload reference image');
      }
      return res.json();
    },
    delete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/references/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete reference');
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
      const data = await res.json();
      // API returns { generations: [], totalCount: number }
      return data.generations || [];
    },
    create: async (data: GenerateRequest): Promise<Generation> => {
      const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to start generation');
      return res.json();
    },
    archive: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/generations/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to archive generation');
    },
    restore: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/generations/${id}/restore`, {
        method: 'PUT',
      });
      if (!res.ok) throw new Error('Failed to restore generation');
    },
    permanentDelete: async (id: string): Promise<void> => {
      const res = await fetch(`${API_BASE}/generations/${id}/permanent`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to permanently delete generation');
    },
    listArchived: async (projectId: string): Promise<Generation[]> => {
      const res = await fetch(`${API_BASE}/projects/${projectId}/generations/archived`);
      if (!res.ok) throw new Error('Failed to fetch archived generations');
      return res.json();
    },
  },
  multiAngle: {
    create: async (data: MultiAngleRequest): Promise<void> => {
      const res = await fetch(`${API_BASE}/multi-angle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to start multi-angle generation');
    }
  },
  upscale: {
    create: async (data: UpscaleRequest): Promise<void> => {
      const res = await fetch(`${API_BASE}/upscale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to start upscale');
    }
  }
};

// Request types for new endpoints
export interface MultiAngleRequest {
  projectId: string;
  sourceGenerationId?: string;  // Either generation or capture
  sourceCaptureId?: string;
  horizontalAngle?: number;     // 0-360 (API format)
  verticalAngle?: number;       // -30 to 90
  zoom?: number;                // 0-10
  loraScale?: number;           // 0-1
  numImages?: number;
}

export interface UpscaleRequest {
  projectId: string;
  sourceGenerationId: string;
  model?: string;
  upscaleFactor?: number;
  faceEnhancement?: boolean;
  outputFormat?: 'jpeg' | 'png';
}
