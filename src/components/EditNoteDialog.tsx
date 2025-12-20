import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Note } from './Dashboard';

interface EditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  onUpdate: (noteId: string, updates: Partial<Note>) => void;
}

export const EditNoteDialog = ({ open, onOpenChange, note, onUpdate }: EditNoteDialogProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !note) return;

    onUpdate(note.id, {
      title: title.trim(),
      content: content.trim()
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 bg-card/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-accent-foreground">
            Edit Note
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-note-title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="edit-note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              className="bg-background/50 border-companion-peach-light focus:border-companion-peach"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-note-content" className="text-sm font-medium">
              Content
            </Label>
            <Textarea
              id="edit-note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts here..."
              className="bg-background/50 border-companion-peach-light focus:border-companion-peach min-h-[120px]"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-companion-peach-light hover:bg-companion-peach-light"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="flex-1 bg-companion-peach hover:bg-accent text-accent-foreground"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
