import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Project } from '@/lib/types';
import { ProjectCard } from '@/components/Sessions/SessionCard';
import { CreateProjectModal } from '@/components/Sessions/CreateSessionModal';
import { Button } from '@/components/Common/Button';
import { Plus, Search, Loader2, FolderOpen, Image } from 'lucide-react';
import { Input } from '@/components/Common/Input';

type TabType = 'projects' | 'generations';

export function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await api.projects.list();
      setProjects(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handlePin = async (id: string, current: boolean) => {
    try {
      await api.projects.togglePin(id, !current);
      loadProjects();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.projects.delete(id);
      loadProjects();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredProjects = projects
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
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
            New Project
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 border-b">
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'projects'
                ? 'border-primary text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            My Projects
          </button>
          <button
            onClick={() => setActiveTab('generations')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'generations'
                ? 'border-primary text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Image className="h-4 w-4" />
            Generations
          </button>
        </div>

        {activeTab === 'projects' && (
          <>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
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
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onPin={handlePin}
                    onDelete={handleDelete}
                  />
                ))}
                {filteredProjects.length === 0 && (
                  <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                    <p className="text-muted-foreground">No projects found</p>
                    <Button variant="link" onClick={() => setIsCreateModalOpen(true)}>
                      Create your first project
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'generations' && (
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
            <Image className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Generation history coming soon</p>
            <p className="text-sm text-muted-foreground mt-1">
              View all your AI-generated images across projects
            </p>
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={loadProjects}
      />
    </div>
  );
}
