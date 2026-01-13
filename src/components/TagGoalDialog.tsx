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

  // Calculate day number for a goal (based on completed dates count + 1 for new photo)
  const getDayNumber = (goal: Goal): number => {
    return (goal.completedDates?.length || 0) + 1;
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