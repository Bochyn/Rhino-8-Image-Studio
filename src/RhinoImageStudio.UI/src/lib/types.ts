export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  previewUrl?: string; // Derived from latest capture/generation
}

export interface Capture {
  id: string;
  projectId: string;
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
  projectId: string;
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
  numImages: number;         // 1-4 for nano-banana
  outputFormat: 'jpeg' | 'png';
  seed?: number;
  model: string;
}

export interface MultiAngleSettings {
  horizontalAngle: number;   // 0-360
  verticalAngle: number;     // -30 to 90
  zoom: number;              // 0-10
  loraScale: number;
}

export interface UpscaleSettings {
  model: string;             // Topaz model type
  upscaleFactor: number;     // 1-4
  faceEnhancement: boolean;
  outputFormat: 'jpeg' | 'png';
}

export interface Job {
  id: string;
  type: 'generation' | 'upscale' | 'refine';
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result?: any;
  createdAt: string;
  projectId: string;
}

export interface CreateProjectRequest {
  name: string;
}

export interface GenerateRequest {
  projectId: string;
  prompt: string;
  sourceCaptureId?: string;
  parentGenerationId?: string;
  model?: string;  // e.g., "gemini-2.5-flash-image", "gemini-3-pro-image-preview"
  aspectRatio?: string;
  resolution?: string;
  numImages?: number;
  outputFormat?: 'jpeg' | 'png' | 'Jpeg' | 'Png';
}

export interface ViewportInfo {
  id: string;
  name: string;
  width: number;
  height: number;
  displayMode: string;
}

export interface RhinoBridge {
  CaptureViewport(projectId: string, width: number, height: number, displayMode: string): Promise<string>; // Returns captureId
  GetDisplayModes(): Promise<string[]>;
  GetViewports(): Promise<ViewportInfo[]>;
  GetApiUrl(): Promise<string>;
}
