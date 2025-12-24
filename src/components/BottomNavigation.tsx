import { Button } from '@/components/ui/button';
import { MessageCircle, Camera, Heart, Save, Tag, CalendarDays } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: 'schedule' | 'bestie' | 'capture' | 'memories';
  onTabChange: (tab: 'schedule' | 'bestie' | 'capture' | 'memories') => void;
  capturedImage?: { dataUrl: string; blob: Blob } | null;
  onSaveCapture?: () => void;
  onTagCapture?: () => void;
  onCloseCapture?: () => void;
}

const BottomNavigation = ({ activeTab, onTabChange, capturedImage, onSaveCapture, onTagCapture }: BottomNavigationProps) => {
  // Show Save and Tag buttons when image is captured
  if (capturedImage) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-t border-white/10">
        <div className="flex items-center justify-around py-2 px-4 safe-area-pb">
          <Button
            variant="ghost"
            size="lg"
            onClick={onSaveCapture}
            className="flex flex-col items-center gap-1 h-auto py-3 px-6 text-white hover:text-white"
          >
            <Save className="h-6 w-6" />
            <span className="text-xs">Save</span>
          </Button>

          <div className="w-20" />

          <Button
            variant="ghost"
            size="lg"
            onClick={onTagCapture}
            className="flex flex-col items-center gap-1 h-auto py-3 px-6 text-white hover:text-white"
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-t border-white/10">
      <div className="flex items-center justify-around py-2 px-4 safe-area-pb">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => onTabChange('schedule')}
          className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
            activeTab === 'schedule' 
              ? 'text-teal-400' 
              : 'text-white/70 hover:text-white'
          }`}
        >
          <CalendarDays className="h-5 w-5" />
          <span className="text-xs">Schedule</span>
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={() => onTabChange('bestie')}
          className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
            activeTab === 'bestie' 
              ? 'text-companion-green' 
              : 'text-white/70 hover:text-white'
          }`}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-xs">Bestie</span>
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={() => onTabChange('capture')}
          className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
            activeTab === 'capture' 
              ? 'text-white' 
              : 'text-white/70 hover:text-white'
          }`}
        >
          <Camera className="h-5 w-5" />
          <span className="text-xs">Capture</span>
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={() => onTabChange('memories')}
          className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
            activeTab === 'memories' 
              ? 'text-companion-peach' 
              : 'text-white/70 hover:text-white'
          }`}
        >
          <Heart className="h-5 w-5" />
          <span className="text-xs">Memories</span>
        </Button>
      </div>
    </div>
  );
};

export default BottomNavigation;