import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Type, Check, X, Palette } from 'lucide-react';

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
}

interface PhotoTextOverlayProps {
  imageUrl: string;
  overlays: TextOverlay[];
  onOverlaysChange: (overlays: TextOverlay[]) => void;
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
}

const TEXT_COLORS = [
  '#FFFFFF', // White
  '#000000', // Black
  '#FF3B30', // Red
  '#FF9500', // Orange
  '#FFCC00', // Yellow
  '#34C759', // Green
  '#007AFF', // Blue
  '#AF52DE', // Purple
  '#FF2D55', // Pink
];

const PhotoTextOverlay = ({
  imageUrl,
  overlays,
  onOverlaysChange,
  isEditing,
  onEditingChange,
}: PhotoTextOverlayProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentText, setCurrentText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tapPosition, setTapPosition] = useState<{ x: number; y: number } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleImageTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggingId) return;
    
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    setTapPosition({ x, y });
    setCurrentText('');
    onEditingChange(true);
  };

  const handleAddText = () => {
    if (!currentText.trim() || !tapPosition) return;

    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: currentText,
      x: tapPosition.x,
      y: tapPosition.y,
      color: selectedColor,
      fontSize: 24,
    };

    onOverlaysChange([...overlays, newOverlay]);
    setCurrentText('');
    setTapPosition(null);
    onEditingChange(false);
    setShowColorPicker(false);
  };

  const handleCancel = () => {
    setCurrentText('');
    setTapPosition(null);
    onEditingChange(false);
    setShowColorPicker(false);
  };

  const handleRemoveOverlay = (id: string) => {
    onOverlaysChange(overlays.filter((o) => o.id !== id));
  };

  // Drag handling for repositioning overlays
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, overlay: TextOverlay) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const currentX = (overlay.x / 100) * rect.width;
    const currentY = (overlay.y / 100) * rect.height;

    setDragOffset({
      x: clientX - rect.left - currentX,
      y: clientY - rect.top - currentY,
    });
    setDraggingId(overlay.id);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingId) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const y = ((clientY - rect.top - dragOffset.y) / rect.height) * 100;

    // Clamp values
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    onOverlaysChange(
      overlays.map((o) =>
        o.id === draggingId ? { ...o, x: clampedX, y: clampedY } : o
      )
    );
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onClick={!isEditing ? handleImageTap : undefined}
      onTouchStart={!isEditing ? handleImageTap : undefined}
      onMouseMove={draggingId ? handleDragMove : undefined}
      onTouchMove={draggingId ? handleDragMove : undefined}
      onMouseUp={handleDragEnd}
      onTouchEnd={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* Image */}
      <img
        src={imageUrl}
        alt="Captured"
        className="w-full h-full object-contain bg-black pointer-events-none"
      />

      {/* Existing text overlays */}
      {overlays.map((overlay) => (
        <div
          key={overlay.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move select-none"
          style={{
            left: `${overlay.x}%`,
            top: `${overlay.y}%`,
            color: overlay.color,
            fontSize: `${overlay.fontSize}px`,
            textShadow:
              overlay.color === '#000000'
                ? '0 0 4px rgba(255,255,255,0.8)'
                : '0 0 4px rgba(0,0,0,0.8)',
          }}
          onMouseDown={(e) => handleDragStart(e, overlay)}
          onTouchStart={(e) => handleDragStart(e, overlay)}
          onDoubleClick={() => handleRemoveOverlay(overlay.id)}
        >
          <span className="font-bold whitespace-nowrap">{overlay.text}</span>
        </div>
      ))}

      {/* Add text button (when not editing) */}
      {!isEditing && overlays.length === 0 && (
        <div className="absolute top-6 right-20 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTapPosition({ x: 50, y: 50 });
              onEditingChange(true);
            }}
            className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 hover:bg-white/30 transition-all backdrop-blur-sm flex items-center justify-center"
          >
            <Type className="h-5 w-5 text-white" />
          </button>
        </div>
      )}

      {/* Text input overlay */}
      {isEditing && tapPosition && (
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-30">
          {/* Color picker */}
          <div className="flex gap-2 mb-4 flex-wrap justify-center px-4">
            {TEXT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedColor === color
                    ? 'border-white scale-110'
                    : 'border-white/30'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Text input */}
          <div className="flex items-center gap-2 px-4 w-full max-w-sm">
            <Input
              ref={inputRef}
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder="Type your text..."
              className="bg-white/10 border-white/30 text-white placeholder:text-white/50 text-center text-lg"
              style={{ color: selectedColor }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddText();
                if (e.key === 'Escape') handleCancel();
              }}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleCancel}
              className="rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              onClick={handleAddText}
              disabled={!currentText.trim()}
              className="rounded-full bg-primary text-primary-foreground"
            >
              <Check className="h-5 w-5" />
            </Button>
          </div>

          <p className="text-white/60 text-sm mt-4">
            Tap anywhere to position text • Double-tap to remove
          </p>
        </div>
      )}

      {/* Hint for adding more text */}
      {!isEditing && overlays.length > 0 && (
        <div className="absolute top-6 right-20 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTapPosition({ x: 50, y: 50 });
              onEditingChange(true);
            }}
            className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 hover:bg-white/30 transition-all backdrop-blur-sm flex items-center justify-center"
          >
            <Type className="h-5 w-5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoTextOverlay;
