import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, PenTool, Target } from 'lucide-react';

interface CameraViewProps {
  onOpenChat?: () => void;
  onOpenNotes?: () => void;
  onOpenGoals?: () => void;
}

// Goal button component with streak indicators
const GoalButton = ({ goalIndex, onClick }: { goalIndex: number; onClick?: () => void }) => {
  const [goals, setGoals] = useState<any[]>([]);
  
  useEffect(() => {
    const savedGoals = localStorage.getItem('companion-goals');
    if (savedGoals) {
      const parsedGoals = JSON.parse(savedGoals);
      setGoals(parsedGoals);
    }
  }, []);

  const goal = goals[goalIndex];
  if (!goal) {
    return <div className="w-12 h-12" />; // Empty placeholder
  }

  const hasStreak = goal.streak > 0;
  const isOverdue = goal.frequency === 'daily' && goal.lastCompleted && 
    new Date().getTime() - new Date(goal.lastCompleted).getTime() > 24 * 60 * 60 * 1000;

  return (
    <button 
      onClick={onClick}
      className="relative w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 hover:bg-white/30 transition-all backdrop-blur-sm"
    >
      <Target className="h-6 w-6 text-white mx-auto" />
      {/* Streak count on top left */}
      {hasStreak && (
        <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-companion-green text-white text-xs font-bold flex items-center justify-center border border-white">
          {goal.streak}
        </div>
      )}
      {/* Status indicator on bottom right */}
      <div className="absolute -bottom-1 -right-1 text-xs">
        {hasStreak ? '🔥' : isOverdue ? '⌛' : ''}
      </div>
    </button>
  );
};

const CameraView = ({ onOpenChat, onOpenNotes, onOpenGoals }: CameraViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      
      // First stop any existing stream
      stopCamera();
      
      console.log('🎥 Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      });
      
      console.log('✅ Camera stream obtained');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Simple approach: just play the video
        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Video metadata loaded, starting playback...');
          videoRef.current?.play()
            .then(() => {
              console.log('🎬 Video playing!');
              setHasPermission(true);
              setIsLoading(false);
            })
            .catch((error) => {
              console.error('❌ Play error:', error);
              setHasPermission(false);
              setIsLoading(false);
            });
        };
        
        // Handle errors
        videoRef.current.onerror = (error) => {
          console.error('❌ Video error:', error);
          setHasPermission(false);
          setIsLoading(false);
        };
        
      } else {
        console.error('❌ Video ref not available');
        setHasPermission(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Camera access error:', error);
      setHasPermission(false);
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/png');
      setCapturedImage(imageData);
      console.log('Photo captured!');
    }
  };

  const handleGoalTag = (goalIndex: number) => {
    // Load existing goals
    const savedGoals = localStorage.getItem('companion-goals');
    if (savedGoals) {
      const goals = JSON.parse(savedGoals);
      if (goals[goalIndex]) {
        // Increment streak
        goals[goalIndex].streak = (goals[goalIndex].streak || 0) + 1;
        goals[goalIndex].lastCompleted = new Date().toISOString();
        localStorage.setItem('companion-goals', JSON.stringify(goals));
        console.log(`Goal ${goalIndex} tagged! New streak: ${goals[goalIndex].streak}`);
      }
    }
    // Close the captured image view
    setCapturedImage(null);
  };

  const flipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <Camera className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p>Loading camera...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center px-6">
          <Camera className="h-16 w-16 mx-auto mb-4 text-white/60" />
          <h3 className="text-xl font-medium mb-2">Camera Access Needed</h3>
          <p className="text-white/80 mb-6">To capture moments, please allow camera access.</p>
          <Button 
            onClick={startCamera}
            className="bg-white text-black hover:bg-white/90"
          >
            Enable Camera
          </Button>
        </div>
      </div>
    );
  }

  // If image is captured, show goal tagging interface
  if (capturedImage) {
    return (
      <div className="h-screen bg-black relative overflow-hidden">
        {/* Captured image */}
        <img 
          src={capturedImage} 
          alt="Captured" 
          className="w-full h-full object-cover"
        />
        
        {/* Goal tagging interface */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6 pb-32">
          <p className="text-white text-center mb-4 font-medium">Tag this moment to a goal</p>
          <div className="flex items-center justify-center gap-4">
            <GoalButton goalIndex={0} onClick={() => handleGoalTag(0)} />
            <GoalButton goalIndex={1} onClick={() => handleGoalTag(1)} />
            <GoalButton goalIndex={2} onClick={() => handleGoalTag(2)} />
          </div>
          <Button
            onClick={() => setCapturedImage(null)}
            variant="ghost"
            className="text-white hover:bg-white/20 mt-4 mx-auto block"
          >
            Cancel
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

      {/* Camera controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex items-center justify-between p-6 pb-32 px-8">
          {/* Goal buttons on the left - 50% space */}
          <div className="flex items-center gap-3 flex-1 justify-start">
            <GoalButton goalIndex={0} />
            <GoalButton goalIndex={1} />
            <GoalButton goalIndex={2} />
          </div>

          {/* Capture button - centered */}
          <button
            onClick={capturePhoto}
            className="w-16 h-16 rounded-full bg-white border-4 border-white/20 hover:scale-105 transition-transform active:scale-95 flex-shrink-0"
          />

          {/* Goal page and Notes buttons on the right - 50% space */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenGoals?.()}
              className="text-white hover:bg-white/20 rounded-full w-14 h-14 flex-shrink-0"
            >
              <Target className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenNotes?.()}
              className="text-white hover:bg-white/20 rounded-full w-14 h-14 flex-shrink-0"
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