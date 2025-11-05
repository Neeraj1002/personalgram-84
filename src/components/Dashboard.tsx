import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Target, Eye, Flame, Clock } from 'lucide-react';
import { GoalCard } from './GoalCard';
import { AddGoalDialog } from './AddGoalDialog';
import { Goal, useGoals } from '@/hooks/useGoals';
import GoalDetailView from './GoalDetailView';
import { useGoalTimer } from '@/hooks/useGoalTimer';
import { useNotifications } from '@/hooks/useNotifications';

const Dashboard = () => {
  const { goals, loading, addGoal, updateGoal, deleteGoal, completeGoal } = useGoals();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const notifications = useNotifications(goals);

  if (selectedGoalId) {
    return (
      <GoalDetailView
        goalId={selectedGoalId}
        onBack={() => setSelectedGoalId(null)}
      />
    );
  }


  const getFilteredGoals = () => {
    switch (activeFilter) {
      case 'active':
        return goals.filter(goal => {
          const today = new Date().toISOString().split('T')[0];
          if (goal.frequency.type === 'daily') {
            return !goal.completed_dates.includes(today);
          }
          const startOfWeek = new Date();
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          const weekStart = startOfWeek.toISOString().split('T')[0];
          return !goal.completed_dates.some(date => date >= weekStart);
        });
      case 'completed':
        return goals.filter(goal => {
          const today = new Date().toISOString().split('T')[0];
          if (goal.frequency.type === 'daily') {
            return goal.completed_dates.includes(today);
          }
          const startOfWeek = new Date();
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          const weekStart = startOfWeek.toISOString().split('T')[0];
          return goal.completed_dates.some(date => date >= weekStart);
        });
      default:
        return goals;
    }
  };

  const getConsistencyPercentage = () => {
    if (goals.length === 0) return 0;
    const totalPossibleCompletions = goals.reduce((sum, goal) => {
      const daysSinceCreated = Math.floor(
        (new Date().getTime() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + (goal.frequency.type === 'daily' ? daysSinceCreated : Math.floor(daysSinceCreated / 7));
    }, 0);
    const totalCompletions = goals.reduce((sum, goal) => sum + goal.completed_dates.length, 0);
    return totalPossibleCompletions > 0 ? Math.round((totalCompletions / totalPossibleCompletions) * 100) : 0;
  };

  const filteredGoals = getFilteredGoals();
  const activeGoalsCount = goals.filter(goal => {
    const today = new Date().toISOString().split('T')[0];
    if (goal.frequency.type === 'daily') {
      return !goal.completed_dates.includes(today);
    }
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const weekStart = startOfWeek.toISOString().split('T')[0];
    return !goal.completed_dates.some(date => date >= weekStart);
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
            filteredGoals.map(goal => {
              const timerInfo = useGoalTimer(goal);
              
              return (
                <div key={goal.id} className="relative">
                  <GoalCard 
                    goal={goal} 
                    onUpdate={updateGoal}
                    onDelete={deleteGoal}
                    showStreak
                  />
                  
                  {/* Status Indicators */}
                  <div className="absolute top-2 right-20 flex items-center gap-1">
                    {timerInfo.hasActiveStreak && (
                      <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full text-xs">
                        <Flame className="h-3 w-3" />
                        <span>{goal.streak}</span>
                      </div>
                    )}
                    
                    {timerInfo.isInDanger && (
                      <div className="flex items-center gap-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded-full text-xs">
                        <Clock className="h-3 w-3" />
                        <span>
                          {goal.frequency.type === 'daily' 
                            ? `${timerInfo.hoursUntilDeadline}h`
                            : `${timerInfo.daysUntilWeekEnd}d`
                          }
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGoalId(goal.id)}
                    className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-white"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
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