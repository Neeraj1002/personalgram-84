import { Button } from '@/components/ui/button';
import { Target, Camera, Heart } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: 'goals' | 'capture' | 'memories';
  onTabChange: (tab: 'goals' | 'capture' | 'memories') => void;
}

const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-t border-white/10">
      <div className="flex items-center justify-around py-2 px-4 safe-area-pb">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => onTabChange('goals')}
          className={`flex flex-col items-center gap-1 h-auto py-3 px-6 ${
            activeTab === 'goals' 
              ? 'text-companion-green' 
              : 'text-white/70 hover:text-white'
          }`}
        >
          <Target className="h-6 w-6" />
          <span className="text-xs">Goals</span>
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={() => onTabChange('capture')}
          className={`flex flex-col items-center gap-1 h-auto py-3 px-6 ${
            activeTab === 'capture' 
              ? 'text-white' 
              : 'text-white/70 hover:text-white'
          }`}
        >
          <Camera className="h-6 w-6" />
          <span className="text-xs">Capture</span>
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={() => onTabChange('memories')}
          className={`flex flex-col items-center gap-1 h-auto py-3 px-6 ${
            activeTab === 'memories' 
              ? 'text-companion-peach' 
              : 'text-white/70 hover:text-white'
          }`}
        >
          <Heart className="h-6 w-6" />
          <span className="text-xs">Memories</span>
        </Button>
      </div>
    </div>
  );
};

export default BottomNavigation;