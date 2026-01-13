export interface Session {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  previewUrl?: string; // Derived from latest capture/generation
}

export interface Capture {
  id: string;
  sessionId: string;
  imageUrl: string; // Backend returns /images/captures/xxx.png
  thumbnailUrl?: string; // Backend returns /images/thumbnails/xxx_thumb.png
  width: number;
  height: number;
  displayMode: number; // Backend returns enum as number
  viewName?: string;
  createdAt: string; // ISO date string
}

export interface Generation {
  id: string;
  sessionId: string;
  prompt: string;
  negativePrompt?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  settings: GenerationSettings;
}

export interface GenerationSettings {
  aspectRatio: string;
  resolution: string; // "1024x1024"
  guidanceScale: number;
  numInferenceSteps: number;
  seed?: number;
  model: string;
}

export interface Job {
  id: string;
  type: 'generation' | 'upscale' | 'refine';
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result?: any;
  createdAt: string;
  sessionId: string;
}

export interface CreateSessionRequest {
  name: string;
}

export interface GenerateRequest {
  sessionId: string;
  prompt: string;
  settings: GenerationSettings;
  captureId?: string; // Optional source image
}

export interface ViewportInfo {
  id: string;
  name: string;
  width: number;
  height: number;
  displayMode: string;
}

export interface RhinoBridge {
  CaptureViewport(sessionId: string, width: number, height: number, displayMode: string): Promise<string>; // Returns captureId
  GetDisplayModes(): Promise<string[]>;
  GetViewports(): Promise<ViewportInfo[]>;
  GetApiUrl(): Promise<string>;
}
