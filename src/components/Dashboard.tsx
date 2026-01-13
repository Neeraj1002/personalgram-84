import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Target, PenTool, Calendar } from 'lucide-react';
import { GoalCard } from './GoalCard';
import { NoteCard } from './NoteCard';
import { AddGoalDialog } from './AddGoalDialog';
import { AddNoteDialog } from './AddNoteDialog';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  selectedDays: number[];
  duration: number;
  streak: number;
  lastCompleted?: Date;
  completedDates: Date[];
  createdAt: Date;
  isActive: boolean;
  state: 'active' | 'inactive' | 'completed';
  scheduledTime?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardProps {
  onBack?: () => void;
  onViewGoalDetail?: (goalId: string) => void;
  onViewGoalChat?: (goalId: string) => void;
  onNavigateToSchedule?: () => void;
}

const Dashboard = ({ onBack, onViewGoalDetail, onViewGoalChat, onNavigateToSchedule }: DashboardProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'active' | 'completed' | 'inactive'>('active');

  const calculateGoalState = (goal: Goal): 'active' | 'inactive' | 'completed' => {
    const daysSinceCreated = Math.floor(
      (new Date().getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const requiredCompletions = Math.floor((goal.duration / 7) * goal.selectedDays.length);
    const currentCompletions = goal.completedDates.length;
    
    if (currentCompletions >= requiredCompletions) {
      return 'completed';
    }
    
    if (daysSinceCreated >= goal.duration) {
      return 'inactive';
    }
    
    return 'active';
  };

  // Load data from localStorage on mount
  useEffect(() => {
    const savedGoals = localStorage.getItem('bestie-goals');
    
    if (savedGoals) {
      const parsedGoals = JSON.parse(savedGoals).map((goal: any) => ({
        ...goal,
        lastCompleted: goal.lastCompleted ? new Date(goal.lastCompleted) : undefined,
        completedDates: goal.completedDates.map((date: string) => new Date(date)),
        createdAt: new Date(goal.createdAt)
      }));
      setGoals(parsedGoals);
    }
  }, []);

  // Update goal states and save to localStorage whenever data changes
  useEffect(() => {
    const updatedGoals = goals.map(goal => ({
      ...goal,
      state: calculateGoalState(goal)
    }));
    localStorage.setItem('bestie-goals', JSON.stringify(updatedGoals));
  }, [goals]);

  const addGoal = (goalData: Omit<Goal, 'id' | 'streak' | 'completedDates' | 'createdAt' | 'isActive' | 'state'>) => {
    const activeGoalsCount = goals.filter(g => g.isActive).length;
    if (activeGoalsCount >= 4) {
      return; // Don't add if already at limit
    }
    
    const newGoal: Goal = {
      ...goalData,
      id: crypto.randomUUID(),
      streak: 0,
      completedDates: [],
      createdAt: new Date(),
      isActive: true,
      state: 'active'
    };
    setGoals(prev => [newGoal, ...prev]);
  };

  const updateGoal = (goalId: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId ? { ...goal, ...updates } : goal
    ));
  };

  const deleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
  };


  const isGoalCompletedToday = (goal: Goal) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return goal.completedDates.some(date => {
      const completedDate = new Date(date);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    });
  };

  const isGoalActiveToday = (goal: Goal) => {
    const today = new Date().getDay();
    return goal.selectedDays.includes(today);
  };

  const getFilteredGoals = () => {
    switch (activeFilter) {
      case 'active':
        return goals.filter(goal => goal.state === 'active');
      case 'completed':
        return goals.filter(goal => goal.state === 'completed');
      case 'inactive':
        return goals.filter(goal => goal.state === 'inactive');
      default:
        return goals.filter(goal => goal.state === 'active');
    }
  };

  const getConsistencyPercentage = () => {
    const activeGoals = goals.filter(g => g.isActive);
    if (activeGoals.length === 0) return 0;
    
    const consistencies = activeGoals.map(goal => {
      const createdAt = new Date(goal.createdAt);
      createdAt.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Count how many scheduled days have passed since goal creation
      let scheduledDays = 0;
      const currentDate = new Date(createdAt);
      
      // Limit to goal duration or days elapsed, whichever is smaller
      const daysElapsed = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const effectiveDays = Math.min(daysElapsed, goal.duration);
      
      for (let i = 0; i <= effectiveDays; i++) {
        const dayOfWeek = currentDate.getDay();
        if (goal.selectedDays.includes(dayOfWeek)) {
          scheduledDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // If no scheduled days have passed yet, return 0
      if (scheduledDays === 0) return 0;
      
      // Calculate consistency as completed / scheduled
      const completedCount = goal.completedDates.length;
      return Math.min((completedCount / scheduledDays) * 100, 100);
    });
    
    // Average consistency across all goals
    const totalConsistency = consistencies.reduce((sum, val) => sum + val, 0);
    return Math.round(totalConsistency / activeGoals.length);
  };

  const filteredGoals = getFilteredGoals();
  const activeGoalsCount = goals.filter(goal => goal.isActive && isGoalActiveToday(goal) && !isGoalCompletedToday(goal)).length;

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Schedule notifications for goals
  useEffect(() => {
    const scheduleNotifications = () => {
      const today = new Date().getDay();
      goals.forEach(goal => {
        if (goal.isActive && goal.selectedDays.includes(today) && !isGoalCompletedToday(goal)) {
          const notificationKey = `goal-notified-${goal.id}-${new Date().toDateString()}`;
          if (!localStorage.getItem(notificationKey)) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Goal Reminder: ${goal.title}`, {
                body: goal.description || 'Time to work on your goal!',
                icon: '/favicon.ico'
              });
              localStorage.setItem(notificationKey, 'true');
            }
          }
        }
      });
    };

    scheduleNotifications();
    const interval = setInterval(scheduleNotifications, 60000 * 30); // Check every 30 minutes
    
    return () => clearInterval(interval);
  }, [goals]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onBack}
                  className="text-foreground"
                >
                  ← Back
                </Button>
              )}
              <h1 className="text-2xl font-semibold text-foreground">Goals Dashboard</h1>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                const activeGoalsCount = goals.filter(g => g.isActive).length;
                if (activeGoalsCount >= 4) {
                  alert('You can only have 4 active goals at a time');
                  return;
                }
                setShowAddGoal(true);
              }}
              className="text-primary hover:bg-primary/10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Progress Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-muted-foreground mb-6">Your Progress Overview</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-3xl font-bold text-foreground">{goals.filter(g => g.isActive).length}</div>
              <div className="text-sm text-muted-foreground">Total Goals</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-3xl font-bold text-foreground">{activeGoalsCount}</div>
              <div className="text-sm text-muted-foreground">Active Goals</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-3xl font-bold text-foreground">{getConsistencyPercentage()}%</div>
              <div className="text-sm text-muted-foreground">Consistency</div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToSchedule?.()}
            className="rounded-full"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Today's Schedule
          </Button>
          <Button
            variant={activeFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('active')}
            className="rounded-full"
          >
            Active
          </Button>
          <Button
            variant={activeFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('completed')}
            className="rounded-full"
          >
            Completed
          </Button>
          <Button
            variant={activeFilter === 'inactive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('inactive')}
            className="rounded-full"
          >
            Inactive
          </Button>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {filteredGoals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No goals found for this filter</p>
              <p className="text-sm mt-2">Create your first goal to get started!</p>
            </div>
          ) : (
            filteredGoals.map(goal => (
              <GoalCard 
                key={goal.id} 
                goal={goal} 
                onUpdate={updateGoal}
                onDelete={deleteGoal}
                onViewDetail={onViewGoalDetail}
                onViewChat={onViewGoalChat}
                showStreak
              />
            ))
          )}
        </div>

        {goals.filter(g => g.isActive).length >= 4 && (
          <div className="mt-8 text-center py-6 border-t">
            <p className="text-muted-foreground mb-2">You've reached your goal limit (4 active goals)</p>
            <p className="text-sm text-muted-foreground">Complete or delete a goal to add new ones</p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddGoalDialog 
        open={showAddGoal} 
        onOpenChange={setShowAddGoal}
        onAdd={addGoal}
      />
    </div>
  );
};

export default Dashboard;