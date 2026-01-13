/**
 * Model configurations for Rhino Image Studio
 * Each model has its own set of parameters as defined by fal.ai API
 */

// ============================================================================
// ASPECT RATIOS (shared across models that support them)
// ============================================================================

export const ASPECT_RATIOS = [
  { value: 'auto', label: 'Auto' },
  { value: '21:9', label: 'Ultra Wide (21:9)' },
  { value: '16:9', label: 'Widescreen (16:9)' },
  { value: '3:2', label: 'Classic (3:2)' },
  { value: '4:3', label: 'Standard (4:3)' },
  { value: '5:4', label: 'Photo (5:4)' },
  { value: '1:1', label: 'Square (1:1)' },
  { value: '4:5', label: 'Portrait Photo (4:5)' },
  { value: '3:4', label: 'Portrait (3:4)' },
  { value: '2:3', label: 'Tall (2:3)' },
  { value: '9:16', label: 'Vertical (9:16)' },
] as const;

export const OUTPUT_FORMATS = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
] as const;

// ============================================================================
// MODEL DEFINITIONS
// ============================================================================

export type ModelId = 
  | 'fal-ai/nano-banana/edit'
  | 'fal-ai/qwen-image-edit-2511-multiple-angles'
  | 'fal-ai/topaz/upscale/image';

export type ModeType = 'generate' | 'refine' | 'multiangle' | 'upscale';

// Model info displayed in UI
export interface ModelInfo {
  id: ModelId;
  name: string;
  shortName: string;
  description: string;
}

// ============================================================================
// MODE -> MODEL MAPPING (as specified by user)
// ============================================================================

export const MODE_MODELS: Record<ModeType, ModelInfo> = {
  generate: {
    id: 'fal-ai/nano-banana/edit',
    name: 'Nano Banana Edit',
    shortName: 'nano-banana',
    description: 'Fast image generation with prompt editing',
  },
  refine: {
    id: 'fal-ai/nano-banana/edit',
    name: 'Nano Banana Edit',
    shortName: 'nano-banana',
    description: 'Refine and iterate on existing generations',
  },
  multiangle: {
    id: 'fal-ai/qwen-image-edit-2511-multiple-angles',
    name: 'Qwen Multi-Angle',
    shortName: 'qwen-multi-angle',
    description: 'Generate different camera angles of the same scene',
  },
  upscale: {
    id: 'fal-ai/topaz/upscale/image',
    name: 'Topaz Upscale',
    shortName: 'topaz',
    description: 'AI-powered image upscaling with enhancement',
  },
};

// ============================================================================
// NANO-BANANA/EDIT SETTINGS (Generate & Refine modes)
// ============================================================================

export interface NanoBananaSettings {
  aspectRatio: string;       // 'auto', '1:1', '16:9', etc.
  numImages: number;         // 1-4
  outputFormat: 'jpeg' | 'png';
}

export const DEFAULT_NANO_BANANA_SETTINGS: NanoBananaSettings = {
  aspectRatio: '1:1',
  numImages: 1,
  outputFormat: 'jpeg',
};

// ============================================================================
// QWEN MULTI-ANGLE SETTINGS
// ============================================================================

export interface QwenMultiAngleSettings {
  horizontalAngle: number;   // 0-360 degrees
  verticalAngle: number;     // -30 to 90 degrees
  zoom: number;              // 0-10
  loraScale: number;         // LoRA scale factor (0-1)
}

export const DEFAULT_QWEN_SETTINGS: QwenMultiAngleSettings = {
  horizontalAngle: 0,
  verticalAngle: 0,
  zoom: 5,
  loraScale: 0.8,
};

// Presets for common camera angles
export const MULTI_ANGLE_PRESETS = [
  { label: 'Front', horizontalAngle: 0, verticalAngle: 0 },
  { label: 'Right Side', horizontalAngle: 90, verticalAngle: 0 },
  { label: 'Back', horizontalAngle: 180, verticalAngle: 0 },
  { label: 'Left Side', horizontalAngle: 270, verticalAngle: 0 },
  { label: 'Top Down', horizontalAngle: 0, verticalAngle: 90 },
  { label: '3/4 View', horizontalAngle: 45, verticalAngle: 30 },
  { label: 'Low Angle', horizontalAngle: 0, verticalAngle: -30 },
] as const;

// ============================================================================
// TOPAZ UPSCALE SETTINGS
// ============================================================================

export type TopazModelType = 
  | 'Standard V2'
  | 'High Fidelity V2'
  | 'Graphics'
  | 'Low Resolution V2'
  | 'CG';

export interface TopazUpscaleSettings {
  model: TopazModelType;
  upscaleFactor: number;     // 1-4
  faceEnhancement: boolean;
  outputFormat: 'jpeg' | 'png';
}

export const DEFAULT_TOPAZ_SETTINGS: TopazUpscaleSettings = {
  model: 'Standard V2',
  upscaleFactor: 2,
  faceEnhancement: false,
  outputFormat: 'jpeg',
};

export const TOPAZ_MODELS: { value: TopazModelType; label: string; description: string }[] = [
  { value: 'Standard V2', label: 'Standard V2', description: 'Best for most images' },
  { value: 'High Fidelity V2', label: 'High Fidelity V2', description: 'Maximum detail preservation' },
  { value: 'Graphics', label: 'Graphics', description: 'Optimized for illustrations & graphics' },
  { value: 'Low Resolution V2', label: 'Low Resolution V2', description: 'Best for very small images' },
  { value: 'CG', label: 'CG', description: 'Optimized for 3D renders & CGI' },
];

// ============================================================================
// UNIFIED SETTINGS TYPE (for state management)
// ============================================================================

export interface AllModelSettings {
  nanoBanana: NanoBananaSettings;
  qwenMultiAngle: QwenMultiAngleSettings;
  topazUpscale: TopazUpscaleSettings;
}

export const DEFAULT_ALL_SETTINGS: AllModelSettings = {
  nanoBanana: DEFAULT_NANO_BANANA_SETTINGS,
  qwenMultiAngle: DEFAULT_QWEN_SETTINGS,
  topazUpscale: DEFAULT_TOPAZ_SETTINGS,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getModelForMode(mode: ModeType): ModelInfo {
  return MODE_MODELS[mode];
}

export function getAspectRatioLabel(value: string): string {
  const ar = ASPECT_RATIOS.find(a => a.value === value);
  return ar ? ar.label : value;
}

// Get resolution from aspect ratio (base dimension = 1024)
export function getResolutionFromAspectRatio(aspectRatio: string, baseDimension = 1024): { width: number; height: number } {
  if (aspectRatio === 'auto') {
    return { width: baseDimension, height: baseDimension };
  }
  
  const [w, h] = aspectRatio.split(':').map(Number);
  if (!w || !h) {
    return { width: baseDimension, height: baseDimension };
  }
  
  // Calculate dimensions maintaining aspect ratio with base dimension
  const ratio = w / h;
  if (ratio >= 1) {
    // Landscape or square
    return {
      width: baseDimension,
      height: Math.round(baseDimension / ratio),
    };
  } else {
    // Portrait
    return {
      width: Math.round(baseDimension * ratio),
      height: baseDimension,
    };
  }
}
