import { Button } from '@/components/ui/button';
import { MessageCircle, Camera, Heart, Save, Tag, CalendarDays, StickyNote } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: 'schedule' | 'bestie' | 'capture' | 'memories' | 'notes';
  onTabChange: (tab: 'schedule' | 'bestie' | 'capture' | 'memories' | 'notes') => void;
  capturedImage?: { dataUrl: string; blob: Blob } | null;
  onSaveCapture?: () => void;
  onTagCapture?: () => void;
  onCloseCapture?: () => void;
}

const BottomNavigation = ({ activeTab, onTabChange, capturedImage, onSaveCapture, onTagCapture }: BottomNavigationProps) => {
  // Show Save and Tag buttons when image is captured
  if (capturedImage) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary backdrop-blur-md border-t border-primary/20">
        <div className="flex items-center justify-around py-2 px-4 safe-area-pb">
          <Button
            variant="ghost"
            size="lg"
            onClick={onSaveCapture}
            className="flex flex-col items-center gap-1 h-auto py-3 px-6 text-primary-foreground hover:text-primary-foreground hover:bg-primary/80"
          >
            <Save className="h-6 w-6" />
            <span className="text-xs">Save</span>
          </Button>

          <div className="w-20" />

          <Button
            variant="ghost"
            size="lg"
            onClick={onTagCapture}
            className="flex flex-col items-center gap-1 h-auto py-3 px-6 text-primary-foreground hover:text-primary-foreground hover:bg-primary/80"
          >
            <Tag className="h-6 w-6" />
            <span className="text-xs">Tag</span>
          </Button>
        </div>
      </div>
    );
  }

  // Normal navigation
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary backdrop-blur-md border-t border-primary/20">
      <div className="flex items-center justify-around py-2 px-4 safe-area-pb">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => onTabChange('schedule')}
          className={`flex flex-col items-center gap-1 h-auto py-2 px-2 focus:outline-none focus-visible:outline-none ${
            activeTab === 'schedule' 
              ? 'text-accent' 
              : 'text-primary-foreground/70 hover:text-primary-foreground'
          }`}
        >
          <CalendarDays className="h-5 w-5" />
          <span className="text-[10px]">Schedule</span>
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={() => onTabChange('bestie')}
          className={`flex flex-col items-center gap-1 h-auto py-2 px-2 focus:outline-none focus-visible:outline-none ${
            activeTab === 'bestie' 
              ? 'text-accent' 
              : 'text-primary-foreground/70 hover:text-primary-foreground'
          }`}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-[10px]">Bestie</span>
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={() => onTabChange('capture')}
          className={`flex flex-col items-center gap-1 h-auto py-2 px-2 focus:outline-none focus-visible:outline-none ${
            activeTab === 'capture' 
              ? 'text-accent' 
              : 'text-primary-foreground/70 hover:text-primary-foreground'
          }`}
        >
          <Camera className="h-5 w-5" />
          <span className="text-[10px]">Capture</span>
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={() => onTabChange('notes')}
          className={`flex flex-col items-center gap-1 h-auto py-2 px-2 focus:outline-none focus-visible:outline-none ${
            activeTab === 'notes' 
              ? 'text-accent' 
              : 'text-primary-foreground/70 hover:text-primary-foreground'
          }`}
        >
          <StickyNote className="h-5 w-5" />
          <span className="text-[10px]">Notes</span>
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={() => onTabChange('memories')}
          className={`flex flex-col items-center gap-1 h-auto py-2 px-2 focus:outline-none focus-visible:outline-none ${
            activeTab === 'memories' 
              ? 'text-accent' 
              : 'text-primary-foreground/70 hover:text-primary-foreground'
          }`}
        >
          <Heart className="h-5 w-5" />
          <span className="text-[10px]">Memories</span>
        </Button>
      </div>
    </div>
  );
};

export default BottomNavigation;