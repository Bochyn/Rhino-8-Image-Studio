// ============================================================================
// MASK CONSTANTS
// ============================================================================

export const MASK_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#eab308', // yellow
  '#a855f7', // purple
  '#f97316', // orange
  '#06b6d4', // cyan
  '#ec4899', // pink
] as const;

// ============================================================================
// MASK TYPES
// ============================================================================

export interface MaskLayer {
  id: string;
  name: string;
  color: string;
  instruction: string;
  visible: boolean;
  imageData: ImageData | null; // Canvas pixel data for this layer
}

export interface BrushSettings {
  size: number;      // 5-200 pixels
  mode: 'brush' | 'eraser';
}

export interface MaskState {
  layers: MaskLayer[];
  activeLayerId: string | null;
  brush: BrushSettings;
}

export interface MaskLayerPayload {
  maskImageBase64: string;  // Binary PNG, white = edit, black = keep
  instruction: string;
}

// ============================================================================
// PROJECT & DATA TYPES
// ============================================================================

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
  sourceCaptureId?: string;
  parentGenerationId?: string;
  prompt: string;
  negativePrompt?: string;
  stage?: string;
  modelId?: string;
  parametersJson?: string;
  zoom?: number;
  azimuth?: number;
  elevation?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  isArchived?: boolean;
  archivedAt?: string;
  settings?: GenerationSettings;
}

export interface ReferenceImage {
  id: string;
  projectId: string;
  originalFileName: string;
  imageUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface GenerationSettings {
  aspectRatio: string;
  resolution?: string;       // "1K", "2K", "4K" (Gemini)
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
  type: 'generation' | 'upscale' | 'refine' | 'Generate' | 'Refine' | 'MultiAngle' | 'Upscale';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'Queued' | 'Running' | 'Succeeded' | 'Failed' | 'Canceled';
  progress: number;
  message?: string;
  progressMessage?: string;
  errorMessage?: string;
  resultId?: string;
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
  referenceImageIds?: string[];
  maskLayers?: MaskLayerPayload[];
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

export interface GenerationDebugInfo {
  prompt: string;
  model?: string;
  aspectRatio?: string;
  resolution?: string;
  sourceType?: 'capture' | 'generation';
  sourceId?: string;
  referenceCount: number;
  referenceImageIds?: string[];
  masks?: { index: number; instruction: string; imageSize: string }[];
  numImages?: number;
  outputFormat?: string;
}
