import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { CheckCircle2 } from "lucide-react";

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
}

interface TagGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGoal: (goalId: string) => void;
}

const TagGoalDialog = ({ open, onOpenChange, onSelectGoal }: TagGoalDialogProps) => {
  const goals: Goal[] = JSON.parse(localStorage.getItem('bestie-goals') || '[]');
  const activeGoals = goals.filter(g => g.isActive);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Tag to Goal</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {activeGoals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No active goals found</p>
          ) : (
            activeGoals.map((goal) => (
              <Button
                key={goal.id}
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4"
                onClick={() => {
                  onSelectGoal(goal.id);
                  onOpenChange(false);
                }}
              >
                <span className="text-2xl">{goal.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{goal.title}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {goal.streak} day streak
                  </div>
                </div>
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TagGoalDialog;
