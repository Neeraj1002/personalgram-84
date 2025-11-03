import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Target, AlertCircle, Tag, StickyNote, ListChecks, SwitchCamera, X, Save } from 'lucide-react';

interface CameraViewProps {
  onOpenNotes?: () => void;
  onOpenGoals?: () => void;
  onSaveMemory?: () => void;
  onCapture?: (image: { dataUrl: string; blob: Blob }) => void;
  onCloseCapture?: () => void;
}

// Goal button component with streak indicators
const GoalButton = ({ goalIndex, onClick, goals }: { goalIndex: number, onClick?: () => void, goals: any[] }) => {
  const goal = goals[goalIndex];
  if (!goal) {
    return null;
  }

  const hasStreak = goal.streak > 0;
  const isOverdue = goal.frequency === 'daily' && goal.lastCompleted && 
    new Date().getTime() - new Date(goal.lastCompleted).getTime() > 24 * 60 * 60 * 1000;

  return (
    <button onClick={onClick} className="relative w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 hover:bg-white/30 transition-all backdrop-blur-sm">
      <Target className="h-6 w-6 text-white mx-auto" />
      <div className="absolute -top-1 -right-1 text-xs">
        {hasStreak ? '🔥' : isOverdue ? '⌛' : ''}
      </div>
      <div className="absolute -top-1 -left-1 text-[10px] bg-black/60 text-white rounded-full px-1.5 py-0.5 border border-white/30">
        {goal.streak}
      </div>
    </button>
  );
};

const CameraView = ({ onOpenNotes, onOpenGoals, onSaveMemory, onCapture, onCloseCapture }: CameraViewProps) => {
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
  
  // Auto-initialize camera on mount
  useEffect(() => {
    initCamera();
    return () => stopCamera();
  }, [facingMode]);
  
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
      
      // Check if mediaDevices is available
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
          addDebug('📸 Photo captured!');
          
          // Notify parent component
          onCapture?.({ dataUrl, blob });
        }
      }, 'image/png');
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

  return (
    <div className="h-screen bg-black relative overflow-hidden">
      {/* Camera feed or captured image */}
      {capturedImage ? (
        <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      )}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top controls */}
      {capturedImage ? (
        /* Close button at top left when photo is captured */
        <button
          onClick={handleClose}
          className="absolute top-6 left-6 z-20 w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 hover:bg-white/30 transition-all backdrop-blur-sm flex items-center justify-center"
        >
          <X className="h-6 w-6 text-white" />
        </button>
      ) : (
        /* Camera flip button at top right when camera is active */
        <button
          onClick={flipCamera}
          className="absolute top-6 right-6 z-20 w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 hover:bg-white/30 transition-all backdrop-blur-sm flex items-center justify-center"
        >
          <SwitchCamera className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Bottom controls */}
      {!capturedImage && (
        /* Camera capture and utility buttons */
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/50 to-transparent">
          <div className="grid grid-cols-3 items-center p-6 pb-32">
            <div />
            <div className="flex items-center justify-center">
              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full bg-white hover:scale-105 transition-transform active:scale-95 shadow-lg"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onOpenNotes}
                className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/30 hover:bg-white/30 transition-all backdrop-blur-sm flex items-center justify-center"
              >
                <StickyNote className="h-6 w-6 text-white" />
              </button>

              <button
                onClick={onOpenGoals}
                className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/30 hover:bg-white/30 transition-all backdrop-blur-sm flex items-center justify-center"
              >
                <ListChecks className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraView;
