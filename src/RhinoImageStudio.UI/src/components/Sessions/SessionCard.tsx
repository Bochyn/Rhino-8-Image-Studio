import { Project } from '@/lib/types';
import { Card, CardContent } from '@/components/Common/Card';
import { Button } from '@/components/Common/Button';
import { Pin, Trash2, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ProjectCardProps {
  project: Project;
  onPin: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onPin, onDelete }: ProjectCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="group relative overflow-hidden transition-all hover:ring-2 hover:ring-primary cursor-pointer"
      onClick={() => navigate(`/project/${project.id}`)}
    >
      <div className="aspect-video w-full bg-muted overflow-hidden relative">
        {project.previewUrl ? (
          <img 
            src={project.previewUrl} 
            alt={project.name} 
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/50 text-muted-foreground">
            No Preview
          </div>
        )}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-0"
            onClick={(e) => {
              e.stopPropagation();
              onPin(project.id, project.pinned);
            }}
          >
            <Pin className={cn("h-4 w-4", project.pinned && "fill-white")} />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold truncate">{project.name}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <Calendar className="h-3 w-3" />
          <span>{formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
        </div>
      </CardContent>
    </Card>
  );
}
