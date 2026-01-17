/**
 * Model configurations for Rhino Image Studio
 * Each model has its own set of parameters
 */

// ============================================================================
// SHARED CONSTANTS
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

export type ModelProvider = 'fal' | 'gemini';

export type ModeType = 'generate' | 'refine' | 'multiangle' | 'upscale';

export interface ModelCapabilities {
  supportsNegativePrompt: boolean;
  supportsSeed: boolean;
  supportsAspectRatio: boolean;
  supportsNumImages: boolean;
  supportsStrength: boolean; // For image-to-image/refine
}

export interface ModelInfo {
  id: string;
  provider: ModelProvider;
  name: string;
  shortName: string;
  description: string;
  capabilities: ModelCapabilities;
}

export const MODELS: Record<string, ModelInfo> = {
  'gemini-3-pro-image-preview': {
    id: 'gemini-3-pro-image-preview',
    provider: 'gemini',
    name: 'Gemini 3 Pro (Preview)',
    shortName: 'gemini-3-pro',
    description: 'Google DeepMind advanced image generation',
    capabilities: {
      supportsNegativePrompt: true,
      supportsSeed: false,
      supportsAspectRatio: true,
      supportsNumImages: true,
      supportsStrength: true,
    },
  },
  'fal-ai/qwen-image-edit-2511-multiple-angles': {
    id: 'fal-ai/qwen-image-edit-2511-multiple-angles',
    provider: 'fal',
    name: 'Qwen Multi-Angle',
    shortName: 'qwen-multi-angle',
    description: 'Generate different camera angles',
    capabilities: {
      supportsNegativePrompt: false,
      supportsSeed: true,
      supportsAspectRatio: false,
      supportsNumImages: false,
      supportsStrength: false,
    },
  },
  'fal-ai/topaz/upscale/image': {
    id: 'fal-ai/topaz/upscale/image',
    provider: 'fal',
    name: 'Topaz Upscale',
    shortName: 'topaz',
    description: 'AI-powered image upscaling',
    capabilities: {
      supportsNegativePrompt: false,
      supportsSeed: false,
      supportsAspectRatio: false,
      supportsNumImages: false,
      supportsStrength: false,
    },
  },
};

// ============================================================================
// MODE MAPPINGS
// ============================================================================

// Default models for each mode (Gemini 3 Pro is PRIMARY)
export const MODE_DEFAULTS: Record<ModeType, string> = {
  generate: 'gemini-3-pro-image-preview',
  refine: 'gemini-3-pro-image-preview',
  multiangle: 'fal-ai/qwen-image-edit-2511-multiple-angles',
  upscale: 'fal-ai/topaz/upscale/image',
};

export const AVAILABLE_MODELS: Record<ModeType, string[]> = {
  generate: ['gemini-3-pro-image-preview'],
  refine: ['gemini-3-pro-image-preview'],
  multiangle: ['fal-ai/qwen-image-edit-2511-multiple-angles'],
  upscale: ['fal-ai/topaz/upscale/image'],
};

// ============================================================================
// SETTINGS SCHEMAS & TYPES
// ============================================================================

// NANO BANANA / GEMINI
export interface GenerationSettings {
  aspectRatio: string;
  numImages: number;
  outputFormat: 'jpeg' | 'png';
  seed?: number;
  negativePrompt?: string;
  strength?: number; // 0-1, used for input image influence
}

export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  aspectRatio: '1:1',
  numImages: 1,
  outputFormat: 'jpeg',
  strength: 0.75,
};

// QWEN MULTI-ANGLE
export interface QwenMultiAngleSettings {
  horizontalAngle: number;
  verticalAngle: number;
  zoom: number;
  loraScale: number;
}

export const DEFAULT_QWEN_SETTINGS: QwenMultiAngleSettings = {
  horizontalAngle: 0,
  verticalAngle: 0,
  zoom: 5,
  loraScale: 0.8,
};

// TOPAZ UPSCALE
export type TopazModelType = 
  | 'Standard V2'
  | 'High Fidelity V2'
  | 'Graphics'
  | 'Low Resolution V2'
  | 'CG';

export interface TopazUpscaleSettings {
  model: TopazModelType;
  upscaleFactor: number;
  faceEnhancement: boolean;
  outputFormat: 'jpeg' | 'png';
}

export const DEFAULT_TOPAZ_SETTINGS: TopazUpscaleSettings = {
  model: 'Standard V2',
  upscaleFactor: 2,
  faceEnhancement: false,
  outputFormat: 'jpeg',
};

export const TOPAZ_MODELS_LIST = [
  { value: 'Standard V2', label: 'Standard V2' },
  { value: 'High Fidelity V2', label: 'High Fidelity V2' },
  { value: 'Graphics', label: 'Graphics' },
  { value: 'Low Resolution V2', label: 'Low Resolution V2' },
  { value: 'CG', label: 'CG' },
];

export const MULTI_ANGLE_PRESETS = [
  { label: 'Front', horizontalAngle: 0, verticalAngle: 0 },
  { label: 'Right Side', horizontalAngle: 90, verticalAngle: 0 },
  { label: 'Back', horizontalAngle: 180, verticalAngle: 0 },
  { label: 'Left Side', horizontalAngle: 270, verticalAngle: 0 },
  { label: 'Top Down', horizontalAngle: 0, verticalAngle: 90 },
  { label: '3/4 View', horizontalAngle: 45, verticalAngle: 30 },
  { label: 'Low Angle', horizontalAngle: 0, verticalAngle: -30 },
] as const;

// Unified Settings Object for State
export interface AllModelSettings {
  generation: GenerationSettings;
  multiAngle: QwenMultiAngleSettings;
  upscale: TopazUpscaleSettings;
}

export const DEFAULT_ALL_SETTINGS: AllModelSettings = {
  generation: DEFAULT_GENERATION_SETTINGS,
  multiAngle: DEFAULT_QWEN_SETTINGS,
  upscale: DEFAULT_TOPAZ_SETTINGS,
};

// ============================================================================
// HELPERS
// ============================================================================

export function getModelInfo(id: string): ModelInfo | undefined {
  return MODELS[id];
}

export function getResolutionFromAspectRatio(aspectRatio: string, baseDimension = 1024): { width: number; height: number } {
  if (aspectRatio === 'auto') {
    return { width: baseDimension, height: baseDimension };
  }
  
  const [w, h] = aspectRatio.split(':').map(Number);
  if (!w || !h) {
    return { width: baseDimension, height: baseDimension };
  }
  
  const ratio = w / h;
  if (ratio >= 1) {
    return {
      width: baseDimension,
      height: Math.round(baseDimension / ratio),
    };
  } else {
    return {
      width: Math.round(baseDimension * ratio),
      height: baseDimension,
    };
  }
}
