import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Session } from '@/lib/types';
import { SessionCard } from '@/components/Sessions/SessionCard';
import { CreateSessionModal } from '@/components/Sessions/CreateSessionModal';
import { Button } from '@/components/Common/Button';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/Common/Input';

export function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const data = await api.sessions.list();
      setSessions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handlePin = async (id: string, current: boolean) => {
    try {
      await api.sessions.togglePin(id, !current);
      loadSessions();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      await api.sessions.delete(id);
      loadSessions();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredSessions = sessions
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Rhino Image Studio</h1>
            <p className="text-muted-foreground mt-2">AI-powered rendering and visualization</p>
          </div>
          <Button size="lg" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onPin={handlePin}
                onDelete={handleDelete}
              />
            ))}
            {filteredSessions.length === 0 && (
              <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                <p className="text-muted-foreground">No sessions found</p>
                <Button variant="link" onClick={() => setIsCreateModalOpen(true)}>
                  Create your first session
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateSessionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={loadSessions}
      />
    </div>
  );
}
