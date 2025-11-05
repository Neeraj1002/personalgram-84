import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Target, Flame, Camera, Image } from 'lucide-react';
import { Goal, useGoals } from '@/hooks/useGoals';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface GoalDetailViewProps {
  goalId: string;
  onBack: () => void;
}

interface GoalLog {
  id: string;
  photo_url: string | null;
  notes: string | null;
  completed_at: string;
}

const GoalDetailView = ({ goalId, onBack }: GoalDetailViewProps) => {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [logs, setLogs] = useState<GoalLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { goals } = useGoals();
  const { user } = useAuth();

  useEffect(() => {
    const foundGoal = goals.find(g => g.id === goalId);
    setGoal(foundGoal || null);
    if (foundGoal) {
      fetchGoalLogs();
    }
  }, [goalId, goals]);

  const fetchGoalLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('goal_logs')
        .select('*')
        .eq('goal_id', goalId)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching goal logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhotoUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from('goal-photos')
      .createSignedUrl(path, 60 * 60); // 1 hour
    return data?.signedUrl;
  };

  if (!goal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Goal not found</p>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getConsistencyPercentage = () => {
    const daysSinceCreated = Math.floor(
      (new Date().getTime() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const expectedCompletions = goal.frequency.type === 'daily' 
      ? daysSinceCreated 
      : Math.floor(daysSinceCreated / 7);
    
    return expectedCompletions > 0 
      ? Math.round((goal.completed_dates.length / expectedCompletions) * 100)
      : 0;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-medium text-foreground">{goal.title}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Goal Overview */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center border-0 bg-gradient-soft">
            <CardContent className="p-4">
              <Flame className="h-6 w-6 mx-auto mb-2 text-companion-peach" />
              <div className="text-2xl font-bold text-foreground">{goal.streak}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </CardContent>
          </Card>
          
          <Card className="text-center border-0 bg-gradient-warm">
            <CardContent className="p-4">
              <Target className="h-6 w-6 mx-auto mb-2 text-companion-green-dark" />
              <div className="text-2xl font-bold text-foreground">{goal.completed_dates.length}</div>
              <div className="text-sm text-muted-foreground">Completions</div>
            </CardContent>
          </Card>
          
          <Card className="text-center border-0 bg-gradient-gentle">
            <CardContent className="p-4">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-foreground">{getConsistencyPercentage()}%</div>
              <div className="text-sm text-muted-foreground">Consistency</div>
            </CardContent>
          </Card>
        </div>

        {/* Goal Details */}
        <Card className="border-0 shadow-gentle">
          <CardHeader>
            <CardTitle className="text-lg">Goal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {goal.description && (
              <p className="text-muted-foreground">{goal.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Frequency:</span>
              <span className="text-muted-foreground">
                {goal.frequency.type === 'daily' ? 'Daily' : `${goal.frequency.times || 1}x per week`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Duration:</span>
              <span className="text-muted-foreground">{goal.duration} days</span>
            </div>
          </CardContent>
        </Card>

        {/* Progress Photos */}
        <Card className="border-0 shadow-gentle">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Progress Gallery
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading progress...</p>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No progress photos yet</p>
                <p className="text-sm text-muted-foreground mt-1">Take photos to track your journey!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {logs.map(log => (
                  <Card key={log.id} className="border-0 bg-companion-cream">
                    <CardContent className="p-3">
                      {log.photo_url && (
                        <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
                          <PhotoWithSignedUrl photoPath={log.photo_url} />
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mb-1">
                        {formatDate(log.completed_at)}
                      </div>
                      {log.notes && (
                        <p className="text-sm text-foreground line-clamp-2">{log.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const PhotoWithSignedUrl = ({ photoPath }: { photoPath: string }) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const loadImage = async () => {
      try {
        const { data } = await supabase.storage
          .from('goal-photos')
          .createSignedUrl(photoPath, 60 * 60); // 1 hour
        
        if (data?.signedUrl) {
          setImageUrl(data.signedUrl);
        }
      } catch (error) {
        console.error('Error loading image:', error);
      }
    };

    loadImage();
  }, [photoPath]);

  if (!imageUrl) {
    return <div className="w-full h-full bg-muted animate-pulse" />;
  }

  return (
    <img
      src={imageUrl}
      alt="Progress photo"
      className="w-full h-full object-cover"
    />
  );
};

export default GoalDetailView;