import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Menu, MoreHorizontal, MessageCircle, PenTool, Target, AlertCircle } from 'lucide-react';

interface CameraViewProps {
  onOpenChat?: () => void;
  onOpenNotes?: () => void;
}

// Goal button component with streak indicators
const GoalButton = ({ goalIndex }: { goalIndex: number }) => {
  const mockGoals = [
    { name: 'Exercise', streak: 3, frequency: 'daily', lastCompleted: new Date().toISOString() },
    { name: 'Read', streak: 0, frequency: 'daily', lastCompleted: null },
    { name: 'Meditate', streak: 5, frequency: 'daily', lastCompleted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
  ];

  const goal = mockGoals[goalIndex];
  if (!goal) {
    return <div className="w-12 h-12" />;
  }

  const hasStreak = goal.streak > 0;
  const isOverdue = goal.frequency === 'daily' && goal.lastCompleted && 
    new Date().getTime() - new Date(goal.lastCompleted).getTime() > 24 * 60 * 60 * 1000;

  return (
    <button className="relative w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 hover:bg-white/30 transition-all backdrop-blur-sm">
      <Target className="h-6 w-6 text-white mx-auto" />
      <div className="absolute -top-1 -right-1 text-xs">
        {hasStreak ? '🔥' : isOverdue ? '⌛' : ''}
      </div>
    </button>
  );
};

const CameraView = ({ onOpenChat, onOpenNotes }: CameraViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

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
      
      // Request camera access with simpler constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
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

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      addDebug('📸 Photo captured!');
    }
  };

  if (cameraState === 'idle' || cameraState === 'loading') {
    return (
      <div className="h-screen bg-black flex items-center justify-center p-6">
        <div className="text-white text-center max-w-md">
          <Camera className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          {cameraState === 'loading' ? (
            <>
              <p className="mb-4">Initializing camera...</p>
              <div className="bg-gray-800 rounded-lg p-4 mb-4 max-h-40 overflow-y-auto text-left">
                {debugInfo.map((info, i) => (
                  <div key={i} className="text-xs text-gray-300 mb-1">{info}</div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3 className="text-xl font-medium mb-2">Camera Access Required</h3>
              <p className="text-white/80 mb-6">Click below to enable camera access</p>
            </>
          )}
          
          <Button 
            onClick={initCamera}
            disabled={cameraState === 'loading'}
            className="bg-white text-black hover:bg-white/90 w-full mb-4"
          >
            {cameraState === 'loading' ? 'Requesting Access...' : 'Enable Camera'}
          </Button>

          <div className="text-xs text-white/60 text-left space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-1">Troubleshooting:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Allow camera permission in browser prompt</li>
                  <li>Check browser settings for camera permissions</li>
                  <li>Make sure no other app is using the camera</li>
                  <li>Try a different browser (Chrome/Firefox/Safari)</li>
                  <li>Use HTTPS connection (not HTTP)</li>
                </ul>
              </div>
            </div>
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
      {/* Camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Top header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between p-4 pt-12">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-white font-medium text-lg">My Space</h1>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <MoreHorizontal className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Camera controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex items-center justify-between p-6 pb-32 px-8">
          {/* Goal buttons on the left */}
          <div className="flex items-center gap-2">
            <GoalButton goalIndex={0} />
            <GoalButton goalIndex={1} />
            <GoalButton goalIndex={2} />
          </div>

          {/* Capture button */}
          <button
            onClick={capturePhoto}
            className="w-20 h-20 rounded-full bg-white border-4 border-white/20 hover:scale-105 transition-transform active:scale-95"
          >
            <div className="w-full h-full rounded-full bg-white shadow-lg" />
          </button>

          {/* Chat and Notes buttons on the right */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChat?.()}
              className="text-white hover:bg-white/20 rounded-full w-12 h-12"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenNotes?.()}
              className="text-white hover:bg-white/20 rounded-full w-12 h-12"
            >
              <PenTool className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraView;
