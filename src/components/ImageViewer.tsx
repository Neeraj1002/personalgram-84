import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Photo {
  id: number;
  url: string;
  timestamp: number;
  goalId?: string;
  goalName?: string;
  dayNumber?: number;
}

interface ImageViewerProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
  onDelete?: (photoId: number) => void;
}

export const ImageViewer = ({ photos, initialIndex, onClose, onDelete }: ImageViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const minSwipeDistance = 50;

  const currentPhoto = photos[currentIndex];

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [goToPrevious, goToNext, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [handleKeyDown]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  const handleDelete = () => {
    if (onDelete && currentPhoto) {
      onDelete(currentPhoto.id);
      if (photos.length === 1) {
        onClose();
      } else if (currentIndex >= photos.length - 1) {
        setCurrentIndex(currentIndex - 1);
      }
    }
  };

  if (!currentPhoto) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
        
        <span className="text-sm">
          {currentIndex + 1} / {photos.length}
        </span>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowInfo(!showInfo)}
            className={`text-white hover:bg-white/20 ${showInfo ? 'bg-white/20' : ''}`}
          >
            <Info className="h-5 w-5" />
          </Button>
          {onDelete && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleDelete}
              className="text-white hover:bg-destructive/50"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && currentPhoto && (
        <div className="absolute top-16 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white z-10">
          <h3 className="font-medium mb-2">Photo Details</h3>
          <div className="space-y-1 text-sm text-white/80">
            <p><span className="text-white/60">Date:</span> {new Date(currentPhoto.timestamp).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
            <p><span className="text-white/60">Time:</span> {new Date(currentPhoto.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            {currentPhoto.goalName && currentPhoto.dayNumber ? (
              <p><span className="text-white/60">Goal:</span> {currentPhoto.goalName} - Day {currentPhoto.dayNumber}</p>
            ) : (
              <p><span className="text-white/60">Tagged:</span> Quick capture</p>
            )}
          </div>
        </div>
      )}

      {/* Main Image Area */}
      <div className="flex-1 flex items-center justify-center relative px-4">
        {/* Previous Button (Desktop) */}
        {photos.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-4 z-10 text-white hover:bg-white/20 hidden md:flex h-12 w-12"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}

        {/* Image */}
        <div className="max-w-full max-h-full flex items-center justify-center">
          <img
            src={currentPhoto.url}
            alt={`Memory from ${new Date(currentPhoto.timestamp).toLocaleDateString()}`}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>

        {/* Next Button (Desktop) */}
        {photos.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-4 z-10 text-white hover:bg-white/20 hidden md:flex h-12 w-12"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}
      </div>

      {/* Footer with date */}
      <div className="p-4 text-center text-white">
        <p className="text-sm opacity-80">
          {new Date(currentPhoto.timestamp).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
        
        {/* Swipe hint for mobile */}
        {photos.length > 1 && (
          <p className="text-xs opacity-50 mt-2 md:hidden">
            Swipe left or right to navigate
          </p>
        )}
      </div>

      {/* Dots indicator */}
      {photos.length > 1 && photos.length <= 10 && (
        <div className="flex justify-center gap-2 pb-6">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-4' 
                  : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
