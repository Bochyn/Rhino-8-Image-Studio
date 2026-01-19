import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { Project, Generation } from '@/lib/types';
import { ProjectCard } from '@/components/Sessions/SessionCard';
import { CreateProjectModal } from '@/components/Sessions/CreateSessionModal';
import { Button } from '@/components/Common/Button';
import { ThemeSwitch } from '@/components/Common/ThemeSwitch';
import { Plus, Search, Loader2, FolderOpen, Image } from 'lucide-react';
import { Input } from '@/components/Common/Input';

type TabType = 'projects' | 'generations';

export function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projectsData, generationsData] = await Promise.all([
        api.projects.list(),
        api.generations.listAll().catch(() => []), // Fallback to empty if endpoint not available
      ]);
      setProjects(projectsData);
      setGenerations(generationsData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Create a map of projectId -> first generation image URL
  const projectPreviewMap = useMemo(() => {
    const map: Record<string, string> = {};

    // Sort generations by createdAt (oldest first) to get the first generation
    // Filter only generations that have an imageUrl (meaning they're complete)
    const sortedGenerations = [...generations]
      .filter(g => g.imageUrl)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Get the first generation for each project
    for (const gen of sortedGenerations) {
      if (!map[gen.projectId] && gen.imageUrl) {
        map[gen.projectId] = gen.imageUrl;
      }
    }

    return map;
  }, [generations]);

  // Enhance projects with preview URLs from first generation
  const projectsWithPreviews = useMemo(() => {
    return projects.map(project => ({
      ...project,
      previewUrl: projectPreviewMap[project.id] || project.previewUrl,
    }));
  }, [projects, projectPreviewMap]);

  const handlePin = async (id: string, current: boolean) => {
    try {
      await api.projects.togglePin(id, !current);
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.projects.delete(id);
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredProjects = projectsWithPreviews
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
            <h1 className="text-4xl font-bold tracking-tight text-primary">Rhino Image Studio</h1>
            <p className="text-secondary mt-2">AI-powered rendering and visualization</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitch />
            <Button size="lg" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 border-b border-border">
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'projects'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            My Projects
          </button>
          <button
            onClick={() => setActiveTab('generations')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'generations'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-secondary hover:text-primary'
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
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-secondary" />
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
                  <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
                    <p className="text-secondary">No projects found</p>
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
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
            <Image className="h-12 w-12 text-secondary mb-4" />
            <p className="text-secondary">Generation history coming soon</p>
            <p className="text-sm text-accent mt-1">
              View all your AI-generated images across projects
            </p>
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={loadData}
      />
    </div>
  );
}
