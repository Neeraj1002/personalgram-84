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
  frequency: 'daily' | 'weekly';
  selectedDays?: number[];
  duration?: number;
  streak: number;
  lastCompleted?: Date;
  completedDates: Date[];
  createdAt: Date;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const Dashboard = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Load data from localStorage on mount
  useEffect(() => {
    const savedGoals = localStorage.getItem('companion-goals');
    
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

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('companion-goals', JSON.stringify(goals));
  }, [goals]);

  const addGoal = (goalData: Omit<Goal, 'id' | 'streak' | 'completedDates' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: crypto.randomUUID(),
      streak: 0,
      completedDates: [],
      createdAt: new Date()
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


  const getFilteredGoals = () => {
    switch (activeFilter) {
      case 'active':
        return goals.filter(goal => {
          const today = new Date();
          if (goal.frequency === 'daily') {
            today.setHours(0, 0, 0, 0);
            return !goal.completedDates.some(date => {
              const completedDate = new Date(date);
              completedDate.setHours(0, 0, 0, 0);
              return completedDate.getTime() === today.getTime();
            });
          }
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          return !goal.completedDates.some(date => {
            const completedDate = new Date(date);
            return completedDate >= startOfWeek && completedDate <= today;
          });
        });
      case 'completed':
        return goals.filter(goal => {
          const today = new Date();
          if (goal.frequency === 'daily') {
            today.setHours(0, 0, 0, 0);
            return goal.completedDates.some(date => {
              const completedDate = new Date(date);
              completedDate.setHours(0, 0, 0, 0);
              return completedDate.getTime() === today.getTime();
            });
          }
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          return goal.completedDates.some(date => {
            const completedDate = new Date(date);
            return completedDate >= startOfWeek && completedDate <= today;
          });
        });
      default:
        return goals;
    }
  };

  const getConsistencyPercentage = () => {
    if (goals.length === 0) return 0;
    const totalPossibleCompletions = goals.reduce((sum, goal) => {
      const daysSinceCreated = Math.floor(
        (new Date().getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + (goal.frequency === 'daily' ? daysSinceCreated : Math.floor(daysSinceCreated / 7));
    }, 0);
    const totalCompletions = goals.reduce((sum, goal) => sum + goal.completedDates.length, 0);
    return totalPossibleCompletions > 0 ? Math.round((totalCompletions / totalPossibleCompletions) * 100) : 0;
  };

  const filteredGoals = getFilteredGoals();
  const activeGoalsCount = goals.filter(goal => {
    const today = new Date();
    if (goal.frequency === 'daily') {
      today.setHours(0, 0, 0, 0);
      return !goal.completedDates.some(date => {
        const completedDate = new Date(date);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === today.getTime();
      });
    }
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return !goal.completedDates.some(date => {
      const completedDate = new Date(date);
      return completedDate >= startOfWeek && completedDate <= today;
    });
  }).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-foreground">Goals Dashboard</h1>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAddGoal(true)}
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
              <div className="text-3xl font-bold text-foreground">{goals.length}</div>
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
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
            className="rounded-full"
          >
            All
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
                showStreak
              />
            ))
          )}
        </div>

        {goals.length >= 3 && (
          <div className="mt-8 text-center py-6 border-t">
            <p className="text-muted-foreground mb-2">You've reached your goal limit</p>
            <p className="text-sm text-muted-foreground">Upgrade to premium for unlimited goals</p>
            <Button variant="outline" size="sm" className="mt-3">
              <Plus className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
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