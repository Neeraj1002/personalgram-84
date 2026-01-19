import { Button } from '@/components/ui/button';
import { MessageCircle, Camera, Heart, Save, Tag, CalendarDays, Plus } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: 'schedule' | 'bestie' | 'capture' | 'memories';
  onTabChange: (tab: 'schedule' | 'bestie' | 'capture' | 'memories') => void;
  capturedImage?: { dataUrl: string; blob: Blob } | null;
  onSaveCapture?: () => void;
  onTagCapture?: () => void;
  onCloseCapture?: () => void;
  onAddPress?: () => void;
}

const BottomNavigation = ({
  activeTab,
  onTabChange,
  capturedImage,
  onSaveCapture,
  onTagCapture,
  onAddPress,
}: BottomNavigationProps) => {
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
            <span className="text-xs">Memory</span>
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

  // Normal navigation - 4 tabs now (Schedule includes Goals & Notes)
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary border-t border-primary/20">
      <div className="flex items-center justify-around py-1 px-2 safe-area-pb">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTabChange('schedule')}
          className={`flex flex-col items-center gap-0.5 h-auto py-1.5 px-3 hover:bg-transparent focus:outline-none focus-visible:outline-none transition-none ${
            activeTab === 'schedule' 
              ? '!text-accent' 
              : 'text-primary-foreground/60 hover:text-primary-foreground'
          }`}
        >
          <CalendarDays className={`h-5 w-5 ${activeTab === 'schedule' ? 'text-accent' : ''}`} />
          <span className={`text-[10px] ${activeTab === 'schedule' ? 'text-accent' : ''}`}>Planner</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTabChange('bestie')}
          className={`flex flex-col items-center gap-0.5 h-auto py-1.5 px-3 hover:bg-transparent focus:outline-none focus-visible:outline-none transition-none ${
            activeTab === 'bestie' 
              ? '!text-accent' 
              : 'text-primary-foreground/60 hover:text-primary-foreground'
          }`}
        >
          <MessageCircle className={`h-5 w-5 ${activeTab === 'bestie' ? 'text-accent' : ''}`} />
          <span className={`text-[10px] ${activeTab === 'bestie' ? 'text-accent' : ''}`}>Bestie</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (activeTab === 'capture') {
              onAddPress?.();
              return;
            }
            onTabChange('capture');
          }}
          className={`flex flex-col items-center gap-0.5 h-auto py-1.5 px-3 hover:bg-transparent focus:outline-none focus-visible:outline-none transition-none ${
            activeTab === 'capture'
              ? '!text-accent'
              : 'text-primary-foreground/60 hover:text-primary-foreground'
          }`}
        >
          {activeTab === 'capture' ? (
            <Plus className="h-5 w-5 text-accent" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
          <span className={`text-[10px] ${activeTab === 'capture' ? 'text-accent' : ''}`}>{activeTab === 'capture' ? 'Add' : 'Capture'}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTabChange('memories')}
          className={`flex flex-col items-center gap-0.5 h-auto py-1.5 px-3 hover:bg-transparent focus:outline-none focus-visible:outline-none transition-none ${
            activeTab === 'memories' 
              ? '!text-accent' 
              : 'text-primary-foreground/60 hover:text-primary-foreground'
          }`}
        >
          <Heart className={`h-5 w-5 ${activeTab === 'memories' ? 'text-accent' : ''}`} />
          <span className={`text-[10px] ${activeTab === 'memories' ? 'text-accent' : ''}`}>Memories</span>
        </Button>
      </div>
    </div>
  );
};

export default BottomNavigation;
