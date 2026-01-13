import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { CheckCircle2, Camera } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  icon: string;
  color: string;
  daysOfWeek: string[];
  duration: number;
  startDate: string;
  streak: number;
  completedDates: string[];
  isActive: boolean;
  createdAt?: string;
}

interface TagGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGoal: (goalId: string, dayNumber: number) => void;
}

const TagGoalDialog = ({ open, onOpenChange, onSelectGoal }: TagGoalDialogProps) => {
  const goals: Goal[] = JSON.parse(localStorage.getItem('bestie-goals') || '[]');
  const activeGoals = goals.filter(g => g.isActive);

  // Calculate day number for a goal (based on unique completed days + 1 for today if not already completed)
  const getDayNumber = (goal: Goal): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if already completed today
    const completedToday = goal.completedDates?.some((date: string) => {
      const completedDate = new Date(date);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    });
    
    // Count unique days completed
    const uniqueDays = new Set(
      (goal.completedDates || []).map((date: string) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );
    
    // If already completed today, show current day number (no increment)
    // If not completed today, this will be the next day
    return completedToday ? uniqueDays.size : uniqueDays.size + 1;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Tag Photo to Goal
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-2">
          Select a goal to tag this photo. It will be saved as your progress for that day.
        </p>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {activeGoals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No active goals found</p>
          ) : (
            activeGoals.map((goal) => {
              const dayNumber = getDayNumber(goal);
              return (
                <Button
                  key={goal.id}
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-4 hover:bg-accent/10"
                  onClick={() => {
                    onSelectGoal(goal.id, dayNumber);
                    onOpenChange(false);
                  }}
                >
                  <span className="text-2xl">{goal.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{goal.title}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {goal.streak} day streak
                      </span>
                      <span className="text-primary font-medium">
                        • Day {dayNumber}
                      </span>
                    </div>
                  </div>
                  <div className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">
                    Day {dayNumber}
                  </div>
                </Button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TagGoalDialog;