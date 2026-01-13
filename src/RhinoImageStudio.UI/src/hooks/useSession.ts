import { useState, useEffect, useCallback } from 'react';
import { Project, Capture, Generation } from '@/lib/types';
import { api } from '@/lib/api';

export function useProject(projectId: string | null) {
  const [project, setProject] = useState<Project | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [p, c, g] = await Promise.all([
        api.projects.get(projectId),
        api.captures.list(projectId),
        api.generations.list(projectId)
      ]);
      setProject(p);
      setCaptures(c);
      setGenerations(g);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { project, captures, generations, isLoading, error, refresh };
}
