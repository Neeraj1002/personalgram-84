import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Settings, Clock } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { Goal } from './Dashboard';

interface ScheduledGoal extends Goal {
  scheduledTime?: string;
}

const ScheduleView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [goals, setGoals] = useState<ScheduledGoal[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Load goals from localStorage
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

  // Get week days starting from Sunday
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  // Get goals for selected date
  const goalsForSelectedDate = useMemo(() => {
    const dayOfWeek = selectedDate.getDay();
    return goals
      .filter(goal => goal.isActive && goal.selectedDays.includes(dayOfWeek))
      .sort((a, b) => {
        if (!a.scheduledTime && !b.scheduledTime) return 0;
        if (!a.scheduledTime) return 1;
        if (!b.scheduledTime) return -1;
        return a.scheduledTime.localeCompare(b.scheduledTime);
      });
  }, [goals, selectedDate]);

  // Check if goal is completed for a specific date
  const isGoalCompletedForDate = (goal: Goal, date: Date) => {
    return goal.completedDates.some(completedDate => {
      const cd = new Date(completedDate);
      cd.setHours(0, 0, 0, 0);
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return cd.getTime() === d.getTime();
    });
  };

  // Navigate weeks
  const goToPreviousWeek = () => {
    setCurrentDate(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentDate(prev => addDays(prev, 7));
  };

  // Get time display
  const getTimeDisplay = (time?: string) => {
    if (!time) return null;
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get goal color based on index
  const getGoalColor = (index: number) => {
    const colors = [
      'bg-teal-500/20 border-l-teal-500',
      'bg-rose-400/20 border-l-rose-400',
      'bg-amber-400/20 border-l-amber-400',
      'bg-violet-400/20 border-l-violet-400',
      'bg-sky-400/20 border-l-sky-400',
    ];
    return colors[index % colors.length];
  };

  // Get text color based on index
  const getTextColor = (index: number) => {
    const colors = [
      'text-teal-600',
      'text-rose-500',
      'text-amber-600',
      'text-violet-600',
      'text-sky-600',
    ];
    return colors[index % colors.length];
  };

  // Get icons for goals (simplified)
  const getGoalIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('work') || lowerTitle.includes('job')) return '💼';
    if (lowerTitle.includes('exercise') || lowerTitle.includes('gym') || lowerTitle.includes('workout')) return '🏋️';
    if (lowerTitle.includes('read') || lowerTitle.includes('book')) return '📚';
    if (lowerTitle.includes('meditat') || lowerTitle.includes('yoga')) return '🧘';
    if (lowerTitle.includes('water') || lowerTitle.includes('drink')) return '💧';
    if (lowerTitle.includes('sleep') || lowerTitle.includes('wake')) return '😴';
    if (lowerTitle.includes('walk') || lowerTitle.includes('run')) return '🚶';
    if (lowerTitle.includes('eat') || lowerTitle.includes('food') || lowerTitle.includes('meal')) return '🍽️';
    if (lowerTitle.includes('clean') || lowerTitle.includes('tidy')) return '🧹';
    if (lowerTitle.includes('study') || lowerTitle.includes('learn')) return '📖';
    if (lowerTitle.includes('shop') || lowerTitle.includes('buy')) return '🛒';
    return '🎯';
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-400 to-teal-500 text-white px-4 py-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {format(currentDate, 'MMMM yyyy')}
          </h1>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={goToPreviousWeek}
            className="text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex gap-2 flex-1 justify-center">
            {weekDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all ${
                    isSelected 
                      ? 'bg-white text-teal-500 shadow-lg' 
                      : isTodayDate
                        ? 'bg-white/30 text-white'
                        : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <span className="text-xs font-medium mb-1">
                    {format(day, 'EEE')}
                  </span>
                  <span className={`text-lg font-bold ${isSelected ? 'text-teal-500' : ''}`}>
                    {format(day, 'd')}
                  </span>
                </button>
              );
            })}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={goToNextWeek}
            className="text-white hover:bg-white/20"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Quick Goal Icons */}
        {goalsForSelectedDate.length > 0 && (
          <div className="flex gap-4 justify-center mt-4">
            {goalsForSelectedDate.slice(0, 5).map((goal, index) => (
              <div key={goal.id} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
                  {getGoalIcon(goal.title)}
                </div>
                <span className="text-xs text-white/80 truncate max-w-[60px]">
                  {goal.title.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {isToday(selectedDate) ? "Today's Schedule" : format(selectedDate, 'EEEE, MMM d')}
        </h2>

        {goalsForSelectedDate.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No goals scheduled for this day</p>
            <p className="text-sm mt-2">Add goals with times to see them here</p>
          </div>
        ) : (
          <div className="relative">
            {/* Time markers */}
            <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col">
              {goalsForSelectedDate.map((goal, index) => (
                <div key={`time-${goal.id}`} className="text-xs text-muted-foreground py-4">
                  {goal.scheduledTime ? getTimeDisplay(goal.scheduledTime) : ''}
                </div>
              ))}
            </div>

            {/* Goals timeline */}
            <div className="ml-16 space-y-3">
              {goalsForSelectedDate.map((goal, index) => {
                const isCompleted = isGoalCompletedForDate(goal, selectedDate);
                
                return (
                  <Card 
                    key={goal.id}
                    className={`p-4 border-l-4 ${getGoalColor(index)} ${
                      isCompleted ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {goal.scheduledTime && (
                            <span className={`text-sm font-medium ${getTextColor(index)}`}>
                              {getTimeDisplay(goal.scheduledTime)}
                            </span>
                          )}
                        </div>
                        <h3 className={`font-semibold text-foreground ${isCompleted ? 'line-through' : ''}`}>
                          {getGoalIcon(goal.title)} {goal.title}
                        </h3>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {goal.completedDates.length}/{goal.duration} days
                          </span>
                          {isCompleted && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              ✓ Done
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : 'bg-muted'
                      }`}>
                        {isCompleted ? '✓' : ''}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleView;
