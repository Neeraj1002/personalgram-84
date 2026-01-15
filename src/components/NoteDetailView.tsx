import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Calendar } from 'lucide-react';
import { Note } from './Dashboard';

interface NoteDetailViewProps {
  note: Note;
  onBack: () => void;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

const NoteDetailView = ({ note, onBack, onEdit, onDelete }: NoteDetailViewProps) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleDelete = () => {
    onDelete(note.id);
    onBack();
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12 bg-accent/40 border-b border-primary/10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-6 w-6 text-primary" />
        </Button>
        <h1 className="text-lg font-medium text-foreground">Note</h1>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onEdit(note)}
          >
            <Edit className="h-5 w-5 text-primary" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDelete}
          >
            <Trash2 className="h-5 w-5 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-24">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-semibold text-foreground mb-4">
            {note.title}
          </h1>
          
          <div className="flex items-center gap-2 text-muted-foreground mb-6">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">{formatDate(note.updatedAt)}</span>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {note.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDetailView;
