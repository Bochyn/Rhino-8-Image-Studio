import { useState, useEffect, useCallback } from 'react';
import { Session, Capture, Generation } from '@/lib/types';
import { api } from '@/lib/api';

export function useSession(sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const [s, c, g] = await Promise.all([
        api.sessions.get(sessionId),
        api.captures.list(sessionId),
        api.generations.list(sessionId)
      ]);
      setSession(s);
      setCaptures(c);
      setGenerations(g);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { session, captures, generations, isLoading, error, refresh };
}
