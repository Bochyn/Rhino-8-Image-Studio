import { Session } from '@/lib/types';
import { Card, CardContent } from '@/components/Common/Card';
import { Button } from '@/components/Common/Button';
import { Pin, Trash2, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface SessionCardProps {
  session: Session;
  onPin: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}

export function SessionCard({ session, onPin, onDelete }: SessionCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="group relative overflow-hidden transition-all hover:ring-2 hover:ring-primary cursor-pointer"
      onClick={() => navigate(`/session/${session.id}`)}
    >
      <div className="aspect-video w-full bg-muted overflow-hidden relative">
        {session.previewUrl ? (
          <img 
            src={session.previewUrl} 
            alt={session.name} 
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
              onPin(session.id, session.pinned);
            }}
          >
            <Pin className={cn("h-4 w-4", session.pinned && "fill-white")} />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold truncate">{session.name}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <Calendar className="h-3 w-3" />
          <span>{formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}</span>
        </div>
      </CardContent>
    </Card>
  );
}
