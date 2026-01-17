import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Flame, TrendingUp } from 'lucide-react';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Goal } from './Dashboard';

interface GoalDetailViewProps {
  goalId: string;
  onBack: () => void;
}

interface Photo {
  id: number;
  blob: Blob;
  timestamp: number;
  goalId?: string;
}

const GoalDetailView = ({ goalId, onBack }: GoalDetailViewProps) => {
  const [input, setInput] = useState('');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  
  // Use goal-specific storage key for chat persistence
  const { messages, sendMessage, isLoading, clearMessages } = useRealtimeChat({
    storageKey: `bestie-goal-chat-${goalId}`
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load goal data
    const savedGoals = localStorage.getItem('bestie-goals');
    if (savedGoals) {
      const goals = JSON.parse(savedGoals).map((g: any) => ({
        ...g,
        lastCompleted: g.lastCompleted ? new Date(g.lastCompleted) : undefined,
        completedDates: g.completedDates.map((date: string) => new Date(date)),
        createdAt: new Date(g.createdAt)
      }));
      const foundGoal = goals.find((g: Goal) => g.id === goalId);
      setGoal(foundGoal);
    }

    // Load photos for this goal
    const openDB = (): Promise<IDBDatabase> => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('BestiePhotos', 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    };

    openDB().then(db => {
      const tx = db.transaction('photos', 'readonly');
      const store = tx.objectStore('photos');
      const request = store.getAll();
      return new Promise<Photo[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }).then((allPhotos: Photo[]) => {
      const goalPhotos = allPhotos.filter(p => p.goalId === goalId);
      setPhotos(goalPhotos.reverse());
    });
  }, [goalId]);

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]'
    ) as HTMLDivElement | null;

    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !goal) return;
    await sendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const calculateConsistency = () => {
    if (!goal) return 0;
    const daysSinceCreated = Math.floor(
      (new Date().getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const possibleCompletions = Math.max(daysSinceCreated, 1);
    return Math.round((goal.completedDates.length / possibleCompletions) * 100);
  };

  if (!goal) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Goal not found</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-companion-cream via-background to-companion-cream-dark flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-[env(safe-area-inset-top,12px)] bg-white/50 backdrop-blur-md border-b border-gray-200/20">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        
        <div className="flex-1 flex items-center justify-between px-4">
          {/* Streak Count - Top Left */}
          <div className="flex items-center gap-1 bg-companion-peach px-3 py-1.5 rounded-full">
            <Flame className="h-4 w-4 text-white" />
            <span className="text-sm font-semibold text-white">{goal.streak}</span>
          </div>
          
          {/* Goal Title - Center */}
          <h1 className="text-lg font-semibold text-foreground absolute left-1/2 -translate-x-1/2">
            {goal.title}
          </h1>
          
          {/* Consistency - Top Right */}
          <div className="flex items-center gap-1 bg-companion-green px-3 py-1.5 rounded-full">
            <TrendingUp className="h-4 w-4 text-white" />
            <span className="text-sm font-semibold text-white">{calculateConsistency()}%</span>
          </div>
        </div>
      </div>

      {/* Photos Grid */}
      {photos.length > 0 && (
        <div className="p-4 bg-white/30 backdrop-blur-sm border-b border-gray-200/20">
          <h3 className="text-sm font-medium text-foreground mb-2">Goal Progress</h3>
          <div className="grid grid-cols-4 gap-2">
            {photos.slice(0, 8).map((photo) => (
              <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                <img
                  src={URL.createObjectURL(photo.blob)}
                  alt="Goal progress"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          {photos.length > 8 && (
            <p className="text-xs text-muted-foreground mt-2">+{photos.length - 8} more photos</p>
          )}
        </div>
      )}

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 pb-20" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">💙</div>
              <h2 className="text-2xl font-medium text-foreground mb-2">Let's talk about your goal!</h2>
              <p className="text-muted-foreground">
                Share your progress, challenges, or ask for advice about "{goal.title}"
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto pb-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 sticky bottom-16 z-40">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Talk about your goal..."
            disabled={isLoading}
            className="flex-1 rounded-full bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:ring-companion-green"
          />
          <Button 
            size="icon" 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GoalDetailView;