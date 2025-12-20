import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, PenTool } from 'lucide-react';
import { NoteCard } from './NoteCard';
import { AddNoteDialog } from './AddNoteDialog';
import { EditNoteDialog } from './EditNoteDialog';
import { Note } from './Dashboard';

interface NotesViewProps {
  onBack: () => void;
}

const NotesView = ({ onBack }: NotesViewProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showEditNote, setShowEditNote] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('companion-notes');
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt)
      }));
      setNotes(parsedNotes);
    }
  }, []);

  // Save to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem('companion-notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      ...noteData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const updateNote = (noteId: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, ...updates, updatedAt: new Date() } 
        : note
    ));
  };

  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowEditNote(true);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-companion-cream via-background to-companion-cream-dark">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12 bg-white/50 backdrop-blur-md border-b border-gray-200/20">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-medium text-foreground">Notes</h1>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setShowAddNote(true)}
          className="text-accent-foreground hover:bg-companion-peach-light"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Notes Content */}
      <div className="p-6 pb-32">
        {notes.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 rounded-full bg-companion-peach-light mb-6 w-fit mx-auto">
              <PenTool className="h-12 w-12 text-accent-foreground" />
            </div>
            <h2 className="text-2xl font-medium text-foreground mb-2">Your Thoughts</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Capture your ideas, reflections, and moments of inspiration.
            </p>
            <Button 
              onClick={() => setShowAddNote(true)}
              className="bg-companion-peach text-foreground hover:bg-companion-peach/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Note
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map(note => (
              <Card key={note.id} className="shadow-soft border-0 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <NoteCard 
                    note={note} 
                    onUpdate={updateNote}
                    onDelete={deleteNote}
                    onEdit={handleEditNote}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Note Dialog */}
      <AddNoteDialog 
        open={showAddNote} 
        onOpenChange={setShowAddNote}
        onAdd={addNote}
      />

      {/* Edit Note Dialog */}
      <EditNoteDialog
        open={showEditNote}
        onOpenChange={setShowEditNote}
        note={editingNote}
        onUpdate={updateNote}
      />
    </div>
  );
};

export default NotesView;