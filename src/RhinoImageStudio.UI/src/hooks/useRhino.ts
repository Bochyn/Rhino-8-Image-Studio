import { useState, useEffect, useMemo } from 'react';
import { getRhinoBridge } from '@/lib/rhino';
import { ViewportInfo } from '@/lib/types';

export function useRhino() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [viewports, setViewports] = useState<ViewportInfo[]>([]);
  const [displayModes, setDisplayModes] = useState<string[]>([]);

  const rhino = useMemo(() => getRhinoBridge(), []);

  useEffect(() => {
    if (!rhino) {
      setIsAvailable(false);
      return;
    }

    // Check connection on mount
    const checkConnection = async () => {
      try {
        const modes = await rhino.GetDisplayModes();
        const vps = await rhino.GetViewports();
        setDisplayModes(JSON.parse(modes as unknown as string));
        setViewports(JSON.parse(vps as unknown as string));
        setIsAvailable(true);
      } catch (err) {
        setIsAvailable(false);
        console.warn("Rhino bridge not available:", err);
      }
    };
    checkConnection();
  }, [rhino]);

  return { rhino, isAvailable, viewports, displayModes };
}
