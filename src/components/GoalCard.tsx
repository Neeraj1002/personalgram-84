import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, MoreVertical, Edit, Trash2, Flame } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Goal } from './Dashboard';
import { EditGoalDialog } from './EditGoalDialog';

interface GoalCardProps {
  goal: Goal;
  onUpdate: (goalId: string, updates: Partial<Goal>) => void;
  onDelete: (goalId: string) => void;
  onViewDetail?: (goalId: string) => void;
  showStreak?: boolean;
}

export const GoalCard = ({ goal, onUpdate, onDelete, onViewDetail, showStreak = false }: GoalCardProps) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const markCompleted = async () => {
    setIsCompleting(true);
    
    const today = new Date();
    const newCompletedDates = [...goal.completedDates, today];
    
    let newStreak = goal.streak;
    
    // Check if completed yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const hasYesterday = goal.completedDates.some(date => {
      const completedDate = new Date(date);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === yesterday.getTime();
    });
    
    newStreak = hasYesterday ? goal.streak + 1 : 1;
    
    onUpdate(goal.id, {
      completedDates: newCompletedDates,
      lastCompleted: today,
      streak: newStreak
    });
    
    setTimeout(() => setIsCompleting(false), 500);
  };

  const isCompletedToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return goal.completedDates.some(date => {
      const completedDate = new Date(date);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    });
  };

  const isActiveToday = () => {
    const today = new Date().getDay();
    return goal.selectedDays.includes(today);
  };

  const completed = isCompletedToday();
  const activeToday = isActiveToday();

  return (
    <>
      <Card 
        className={`transition-all duration-300 border-0 cursor-pointer ${
          completed 
            ? 'bg-companion-green-light/50 shadow-gentle' 
            : 'bg-card hover:shadow-gentle'
        } ${isCompleting ? 'scale-105' : ''}`}
        onClick={() => onViewDetail?.(goal.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className={`font-medium truncate ${
                  completed ? 'text-companion-green-dark' : 'text-foreground'
                }`}>
                  {goal.title}
                </h3>
                {showStreak && goal.streak > 0 && (
                  <div className="flex items-center gap-1 text-xs bg-companion-peach text-accent-foreground px-2 py-1 rounded-full">
                    <Flame className="h-3 w-3" />
                    {goal.streak}
                  </div>
                )}
              </div>
              
              {goal.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {goal.description}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="bg-companion-cream-dark text-xs"
                  >
                    {goal.selectedDays.length === 7 ? 'Daily' : `${goal.selectedDays.length} days/week`}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={`text-xs ${
                      goal.state === 'completed' 
                        ? 'bg-green-500/10 text-green-700 border-green-300' 
                        : goal.state === 'inactive'
                        ? 'bg-red-500/10 text-red-700 border-red-300'
                        : 'bg-blue-500/10 text-blue-700 border-blue-300'
                    }`}
                  >
                    {goal.state.charAt(0).toUpperCase() + goal.state.slice(1)}
                  </Badge>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    markCompleted();
                  }}
                  disabled={completed || isCompleting || !activeToday}
                  className={`h-8 w-8 rounded-full transition-all ${
                    completed 
                      ? 'bg-companion-green text-white' 
                      : !activeToday
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'hover:bg-companion-green-light hover:text-companion-green-dark'
                  }`}
                  title={!activeToday ? 'Not scheduled for today' : completed ? 'Completed' : 'Mark as complete'}
                >
                  <Check className={`h-4 w-4 ${isCompleting ? 'animate-bounce' : ''}`} />
                </Button>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 ml-2">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setShowEditDialog(true);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(goal.id);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <EditGoalDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        goal={goal}
        onUpdate={onUpdate}
      />
    </>
  );
};