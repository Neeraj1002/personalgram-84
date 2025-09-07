import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, MoreVertical, Edit, Trash2, Flame } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Goal } from './Dashboard';

interface GoalCardProps {
  goal: Goal;
  onUpdate: (goalId: string, updates: Partial<Goal>) => void;
  onDelete: (goalId: string) => void;
  showStreak?: boolean;
}

export const GoalCard = ({ goal, onUpdate, onDelete, showStreak = false }: GoalCardProps) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const markCompleted = async () => {
    setIsCompleting(true);
    
    const today = new Date();
    const newCompletedDates = [...goal.completedDates, today];
    
    let newStreak = goal.streak;
    
    if (goal.frequency === 'daily') {
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
    } else {
      // Weekly goal
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const hasLastWeek = goal.completedDates.some(date => {
        const completedDate = new Date(date);
        return completedDate >= lastWeek && completedDate < new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      });
      
      newStreak = hasLastWeek ? goal.streak + 1 : 1;
    }
    
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
    
    if (goal.frequency === 'daily') {
      return goal.completedDates.some(date => {
        const completedDate = new Date(date);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === today.getTime();
      });
    } else {
      // Weekly - check if completed this week
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      return goal.completedDates.some(date => {
        const completedDate = new Date(date);
        return completedDate >= startOfWeek && completedDate <= today;
      });
    }
  };

  const completed = isCompletedToday();

  return (
    <Card className={`transition-all duration-300 border-0 ${
      completed 
        ? 'bg-companion-green-light/50 shadow-gentle' 
        : 'bg-card hover:shadow-gentle'
    } ${isCompleting ? 'scale-105' : ''}`}>
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
              <Badge 
                variant="secondary" 
                className="bg-companion-cream-dark text-xs"
              >
                {goal.frequency}
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={markCompleted}
                disabled={completed || isCompleting}
                className={`h-8 w-8 rounded-full transition-all ${
                  completed 
                    ? 'bg-companion-green text-white' 
                    : 'hover:bg-companion-green-light hover:text-companion-green-dark'
                }`}
              >
                <Check className={`h-4 w-4 ${isCompleting ? 'animate-bounce' : ''}`} />
              </Button>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 ml-2">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(goal.id)}
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
  );
};