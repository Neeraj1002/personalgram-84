import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Target, AlertCircle, Tag, StickyNote, ListChecks, SwitchCamera, X, Save, Timer } from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import PhotoTextOverlay from './PhotoTextOverlay';

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
}

interface CameraViewProps {
  onOpenNotes?: () => void;
  onOpenGoals?: () => void;
  onSaveMemory?: () => void;
  onCapture?: (image: { dataUrl: string; blob: Blob; textOverlays?: TextOverlay[] }) => void;
  onCloseCapture?: () => void;
  onViewGoalDetail?: (goalId: string) => void;
}

// Goal button component with streak indicators
const GoalButton = ({ goal, onClick }: { goal: any, onClick?: () => void }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDay = today.getDay();
  
  // Check if this goal is scheduled for today
  const isScheduledToday = goal.selectedDays.includes(todayDay);
  
  // Check if completed today
  const completedToday = goal.completedDates?.some((date: string) => {
    const completedDate = new Date(date);
    completedDate.setHours(0, 0, 0, 0);
    return completedDate.getTime() === today.getTime();
  });
  
  const hasStreak = goal.streak > 0;
  const isOverdue = isScheduledToday && !completedToday;
  const showFire = hasStreak && completedToday;
  const showTimer = isOverdue;

  return (
    <button onClick={onClick} className="relative w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 hover:bg-white/30 transition-all backdrop-blur-sm flex items-center justify-center flex-shrink-0">
      <Target className="h-4 w-4 text-white" />
      {/* Bottom - goal title truncated */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded-full max-w-[60px] truncate text-center whitespace-nowrap">
        {goal.title}
      </div>
      {/* Left top - streak count */}
      <div className="absolute -top-1 -left-1 text-[9px] bg-black/60 text-white rounded-full px-1 py-0.5 border border-white/30 min-w-[18px] text-center">
        {goal.streak || 0}
      </div>
      {/* Right top - fire or timer */}
      {(showFire || showTimer) && (
        <div className="absolute -top-0.5 -right-0.5 text-[10px]">
          {showFire ? '🔥' : showTimer ? '⌛' : ''}
        </div>
      )}
    </button>
  );
};

const CameraView = ({ onOpenNotes, onOpenGoals, onSaveMemory, onCapture, onCloseCapture, onViewGoalDetail }: CameraViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [taggingMode, setTaggingMode] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasOverdueGoals, setHasOverdueGoals] = useState(false);
  const [activeGoals, setActiveGoals] = useState<any[]>([]);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [isEditingText, setIsEditingText] = useState(false);
  
  // Auto-initialize camera on mount
  useEffect(() => {
    initCamera();
    checkOverdueGoals();
    loadActiveGoals();
    return () => stopCamera();
  }, [facingMode]);

  const loadActiveGoals = () => {
    const storedGoals = localStorage.getItem('bestie-goals');
    if (storedGoals) {
      const goals = JSON.parse(storedGoals);
      const active = goals.filter((goal: any) => goal.state === 'active').slice(0, 4);
      setActiveGoals(active);
    }
  };

  const checkOverdueGoals = () => {
    const storedGoals = localStorage.getItem('bestie-goals');
    if (storedGoals) {
      const goals = JSON.parse(storedGoals);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayDay = today.getDay();
      
      const hasOverdue = goals.some((goal: any) => {
        if (goal.state !== 'active') return false;
        if (!goal.selectedDays.includes(todayDay)) return false;
        
        // Check if completed today
        const completedToday = goal.completedDates.some((date: string) => {
          const completedDate = new Date(date);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === today.getTime();
        });
        
        return !completedToday;
      });
      
      setHasOverdueGoals(hasOverdue);
      loadActiveGoals();
    }
  };
  
  // TODO: Replace with actual goals from database
  const mockGoals = [
    // { name: 'Exercise', streak: 3, frequency: 'daily', lastCompleted: new Date().toISOString() },
    // Uncomment above to see goals
  ];

  const addDebug = (msg: string) => {
    console.log(msg);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      addDebug('Camera stopped');
    }
  };

  const initCamera = async () => {
    try {
      addDebug('🎥 Starting camera initialization...');
      setCameraState('loading');
      setErrorMessage('');
      
      // Check if running on native platform
      const isNative = Capacitor.isNativePlatform();
      addDebug(`Platform: ${isNative ? 'Native' : 'Web'}`);
      
      if (isNative) {
        // On native, we don't need to start a stream - just set ready state
        // Camera will be accessed when user taps capture button
        addDebug('✅ Native camera ready');
        setCameraState('ready');
        return;
      }
      
      // Web browser flow (original code)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }
      
      addDebug('✓ MediaDevices API available');

      // Stop any existing streams
      stopCamera();

      addDebug('📱 Requesting camera access...');
      
      // Request camera access with facingMode
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false
      });

      addDebug('✅ Camera stream obtained!');
      addDebug(`Stream tracks: ${stream.getTracks().length}`);
      
      streamRef.current = stream;

      // Change state to 'ready' FIRST so the video element gets rendered
      addDebug('📺 Switching to camera view...');
      setCameraState('ready');
      
      // Wait a tick for React to render the video element
      await new Promise(resolve => setTimeout(resolve, 100));

      // Now set up video element
      if (!videoRef.current) {
        throw new Error('Video element still not found after state change');
      }

      const video = videoRef.current;
      video.srcObject = stream;
      addDebug('📺 Stream assigned to video element');
      
      // Wait for metadata to load
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for video metadata'));
        }, 10000);

        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          addDebug(`📹 Metadata loaded: ${video.videoWidth}x${video.videoHeight}`);
          resolve(true);
        };

        video.onerror = (e) => {
          clearTimeout(timeout);
          reject(new Error('Video element error'));
        };
      });

      // Play the video
      addDebug('▶️ Attempting to play video...');
      await video.play();
      addDebug('🎬 Video is playing!');
      
    } catch (err: any) {
      addDebug(`❌ Error: ${err.message}`);
      console.error('Camera initialization failed:', err);
      setErrorMessage(err.message || 'Unknown error');
      setCameraState('error');
    }
  };

  const capturePhoto = async () => {
    try {
      const isNative = Capacitor.isNativePlatform();
      
      if (isNative) {
        // Use Capacitor Camera plugin on native
        addDebug('📸 Using native camera...');
        
        const image = await CapCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
          saveToGallery: false
        });
        
        addDebug('✅ Native photo captured!');
        
        // Convert to blob
        const response = await fetch(image.webPath!);
        const blob = await response.blob();
        const dataUrl = URL.createObjectURL(blob);
        
        setCapturedImage(dataUrl);
        setCapturedBlob(blob);
        setTaggingMode(false);
        setTextOverlays([]);
        
        onCapture?.({ dataUrl, blob, textOverlays: [] });
        return;
      }
      
      // Web browser flow (original code)
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        // Convert canvas to blob and data URL
        canvas.toBlob((blob) => {
          if (blob) {
            const dataUrl = canvas.toDataURL('image/png');
            setCapturedImage(dataUrl);
            setCapturedBlob(blob);
            setTaggingMode(false);
            setTextOverlays([]);
            addDebug('📸 Photo captured!');
            
            // Notify parent component
            onCapture?.({ dataUrl, blob, textOverlays: [] });
          }
        }, 'image/png');
      }
    } catch (err: any) {
      addDebug(`❌ Camera error: ${err.message}`);
      console.error('Failed to capture photo:', err);
    }
  };
  
  const flipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BestiePhotos', 2);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (db.objectStoreNames.contains('photos')) {
          db.deleteObjectStore('photos');
        }
        db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
      };
    });
  };

  const handleTag = (goalIndex: number) => {
    addDebug(`🏷️ Tagged photo with goal index ${goalIndex}`);
    setTaggingMode(false);
    setCapturedImage(null);
  };

  const handleSave = async () => {
    if (!capturedBlob) return;
    
    // NOW save to IndexedDB
    try {
      const db = await openDB();
      const timestamp = Date.now();
      const tx = db.transaction('photos', 'readwrite');
      await tx.objectStore('photos').add({
        id: timestamp,
        blob: capturedBlob,
        timestamp: timestamp
      });
      addDebug('💾 Photo saved to memories!');
      setCapturedImage(null);
      setCapturedBlob(null);
      onSaveMemory?.();
    } catch (err) {
      console.error('Failed to save photo:', err);
      addDebug('❌ Save failed');
    }
  };

  const handleClose = () => {
    addDebug('❌ Discarding photo');
    setCapturedImage(null);
    setCapturedBlob(null);
    setTextOverlays([]);
    setIsEditingText(false);
    onCloseCapture?.();
    // Ensure camera continues running
    if (!streamRef.current && videoRef.current) {
      initCamera();
    }
  };

  if (cameraState === 'loading') {
    return (
      <div className="h-screen bg-black flex items-center justify-center p-6">
        <div className="text-white text-center max-w-md">
          <Camera className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p className="mb-4">Initializing camera...</p>
          <div className="bg-gray-800 rounded-lg p-4 mb-4 max-h-40 overflow-y-auto text-left">
            {debugInfo.map((info, i) => (
              <div key={i} className="text-xs text-gray-300 mb-1">{info}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (cameraState === 'error') {
    return (
      <div className="h-screen bg-black flex items-center justify-center p-6">
        <div className="text-white text-center max-w-md">
          <Camera className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-xl font-medium mb-2">Camera Access Failed</h3>
          <p className="text-white/80 mb-2">Unable to access camera</p>
          
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-200 font-mono">{errorMessage}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 mb-4 max-h-60 overflow-y-auto text-left">
            <p className="text-xs font-semibold mb-2">Debug Log:</p>
            {debugInfo.map((info, i) => (
              <div key={i} className="text-xs text-gray-300 mb-1">{info}</div>
            ))}
          </div>
          
          <Button 
            onClick={initCamera}
            className="bg-white text-black hover:bg-white/90 w-full"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="h-screen bg-black relative overflow-hidden">
      {/* Camera feed or captured image with text overlay */}
      {capturedImage ? (
        <PhotoTextOverlay
          imageUrl={capturedImage}
          overlays={textOverlays}
          onOverlaysChange={(overlays) => {
            setTextOverlays(overlays);
            // Update parent with new overlays
            if (capturedBlob) {
              onCapture?.({ dataUrl: capturedImage, blob: capturedBlob, textOverlays: overlays });
            }
          }}
          isEditing={isEditingText}
          onEditingChange={setIsEditingText}
        />
      ) : isNative ? (
        // Native: Show camera placeholder
        <div className="w-full h-full flex items-center justify-center bg-black">
          <Camera className="h-24 w-24 text-white/30" />
        </div>
      ) : (
        // Web: Show video stream
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-contain bg-black"
        />
      )}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top controls */}
      {capturedImage ? (
        /* Close button at top left when photo is captured */
        <button
          onClick={handleClose}
          className="absolute z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 border-2 border-white/30 hover:bg-white/30 transition-all backdrop-blur-sm flex items-center justify-center"
          style={{ top: 'calc(env(safe-area-inset-top, 12px) + 8px)', left: '16px' }}
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </button>
      ) : (
        /* Camera flip button at top right when camera is active */
        <button
          onClick={flipCamera}
          className="absolute z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 border-2 border-white/30 hover:bg-white/30 transition-all backdrop-blur-sm flex items-center justify-center"
          style={{ top: 'calc(env(safe-area-inset-top, 12px) + 8px)', right: '16px' }}
        >
          <SwitchCamera className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </button>
      )}

      {/* Bottom controls */}
      {!capturedImage && (
        /* Camera capture and utility buttons */
        <div className="absolute left-0 right-0 z-10 bg-gradient-to-t from-black/50 to-transparent" style={{ bottom: 'var(--footer-total-height)' }}>
          <div className="flex items-center justify-center p-3 sm:p-4 pb-4 sm:pb-6 px-2 sm:px-4">
            {/* Left side - Goals at index 0 and 2 */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-end">
              {activeGoals.filter((_, idx) => idx % 2 === 0).map((goal) => (
                <GoalButton 
                  key={goal.id} 
                  goal={goal} 
                  onClick={() => onViewGoalDetail?.(goal.id)} 
                />
              ))}
            </div>
            
            {/* Center - Capture button (always centered) */}
            <div className="mx-3 sm:mx-4">
              <button
                onClick={capturePhoto}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white hover:scale-105 transition-transform active:scale-95 shadow-lg"
              />
            </div>

            {/* Right side - Goals at index 1 and 3 */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-start">
              {activeGoals.filter((_, idx) => idx % 2 === 1).map((goal) => (
                <GoalButton 
                  key={goal.id} 
                  goal={goal} 
                  onClick={() => onViewGoalDetail?.(goal.id)} 
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraView;
