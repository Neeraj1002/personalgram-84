import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Note } from './Dashboard';

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const AddNoteDialog = ({ open, onOpenChange, onAdd }: AddNoteDialogProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onAdd({
      title: title.trim(),
      content: content.trim()
    });

    // Reset form
    setTitle('');
    setContent('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 bg-card/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-accent-foreground">
            Add New Note
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note-title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              className="bg-background/50 border-companion-peach-light focus:border-companion-peach"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-content" className="text-sm font-medium">
              Content
            </Label>
            <Textarea
              id="note-content"
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
              Add Note
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};