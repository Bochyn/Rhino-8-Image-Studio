import { RhinoBridge } from './types';

// Declare the window object extension
declare global {
  interface Window {
    chrome?: {
      webview?: {
        hostObjects?: {
          rhino?: RhinoBridge;
        };
      };
    };
  }
}

export type { RhinoBridge };

/**
 * Gets the Rhino bridge object if available (running in WebView2)
 */
export function getRhinoBridge(): RhinoBridge | null {
  const bridge = window.chrome?.webview?.hostObjects?.rhino;
  return bridge || null;
}

/**
 * Mock Rhino bridge for development outside of Rhino
 */
export const mockRhinoBridge: RhinoBridge = {
  CaptureViewport: async () => {
    console.warn('Mock: CaptureViewport called');
    return 'mock-capture-id';
  },
  GetDisplayModes: async () => {
    return ['Wireframe', 'Shaded', 'Rendered', 'Ghosted', 'XRay'] as unknown as Promise<string[]>;
  },
  GetViewports: async () => {
    return [
      { id: '1', name: 'Perspective', width: 1920, height: 1080, displayMode: 'Shaded' },
      { id: '2', name: 'Top', width: 1920, height: 1080, displayMode: 'Wireframe' },
    ] as unknown as Promise<any[]>;
  },
  GetApiUrl: async () => {
    return 'http://localhost:17532';
  },
};
