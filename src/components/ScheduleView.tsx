import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Plus, Clock, Trash2, CheckCircle } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { Goal } from './Dashboard';
import AddScheduleTaskDialog, { ScheduleTask } from './AddScheduleTaskDialog';

interface ScheduleItem {
  id: string;
  title: string;
  description?: string;
  scheduledTime?: string;
  type: 'goal' | 'task';
  isCompleted: boolean;
  goalData?: Goal;
  taskData?: ScheduleTask;
}

const ScheduleView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddTask, setShowAddTask] = useState(false);

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

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('bestie-schedule-tasks');
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks).map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt)
      }));
      setTasks(parsedTasks);
    }
  }, []);

  // Save tasks to localStorage
  const saveTasks = (updatedTasks: ScheduleTask[]) => {
    localStorage.setItem('bestie-schedule-tasks', JSON.stringify(updatedTasks));
    setTasks(updatedTasks);
  };

  // Add new task
  const handleTaskAdded = (task: ScheduleTask) => {
    const updatedTasks = [...tasks, task];
    saveTasks(updatedTasks);
  };

  // Toggle task completion
  const toggleTaskComplete = (taskId: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
    );
    saveTasks(updatedTasks);
  };

  // Delete task
  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    saveTasks(updatedTasks);
  };

  // Get week days starting from Sunday
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

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

  // Combine goals and tasks for selected date
  const scheduleItems = useMemo(() => {
    const dayOfWeek = selectedDate.getDay();
    const dateString = selectedDate.toISOString().split('T')[0];
    
    // Get goals for this day
    const goalsForDay: ScheduleItem[] = goals
      .filter(goal => goal.isActive && goal.selectedDays.includes(dayOfWeek))
      .map(goal => ({
        id: `goal-${goal.id}`,
        title: goal.title,
        description: goal.description,
        scheduledTime: goal.scheduledTime,
        type: 'goal' as const,
        isCompleted: isGoalCompletedForDate(goal, selectedDate),
        goalData: goal,
      }));

    // Get tasks for this date
    const tasksForDay: ScheduleItem[] = tasks
      .filter(task => task.date === dateString)
      .map(task => ({
        id: `task-${task.id}`,
        title: task.title,
        description: task.description,
        scheduledTime: task.scheduledTime,
        type: 'task' as const,
        isCompleted: task.isCompleted,
        taskData: task,
      }));

    // Combine and sort by time
    return [...goalsForDay, ...tasksForDay].sort((a, b) => {
      if (!a.scheduledTime && !b.scheduledTime) return 0;
      if (!a.scheduledTime) return 1;
      if (!b.scheduledTime) return -1;
      return a.scheduledTime.localeCompare(b.scheduledTime);
    });
  }, [goals, tasks, selectedDate]);

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

  // Get item color based on type and index
  const getItemColor = (item: ScheduleItem, index: number) => {
    if (item.type === 'task') {
      return 'bg-purple-500/20 border-l-purple-500';
    }
    const colors = [
      'bg-teal-500/20 border-l-teal-500',
      'bg-rose-400/20 border-l-rose-400',
      'bg-amber-400/20 border-l-amber-400',
      'bg-violet-400/20 border-l-violet-400',
      'bg-sky-400/20 border-l-sky-400',
    ];
    return colors[index % colors.length];
  };

  // Get text color based on type and index
  const getTextColor = (item: ScheduleItem, index: number) => {
    if (item.type === 'task') {
      return 'text-purple-600';
    }
    const colors = [
      'text-teal-600',
      'text-rose-500',
      'text-amber-600',
      'text-violet-600',
      'text-sky-600',
    ];
    return colors[index % colors.length];
  };

  // Get icons for items
  const getItemIcon = (item: ScheduleItem) => {
    if (item.type === 'task') {
      const lowerTitle = item.title.toLowerCase();
      if (lowerTitle.includes('meet') || lowerTitle.includes('call')) return '📞';
      if (lowerTitle.includes('remind')) return '⏰';
      if (lowerTitle.includes('shop') || lowerTitle.includes('buy')) return '🛒';
      if (lowerTitle.includes('doctor') || lowerTitle.includes('appointment')) return '🏥';
      if (lowerTitle.includes('pay') || lowerTitle.includes('bill')) return '💳';
      return '📋';
    }
    const lowerTitle = item.title.toLowerCase();
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
          <Button 
            onClick={() => setShowAddTask(true)}
            size="icon" 
            className="bg-white/20 hover:bg-white/30 text-white"
          >
            <Plus className="h-5 w-5" />
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

        {/* Quick Icons */}
        {scheduleItems.length > 0 && (
          <div className="flex gap-4 justify-center mt-4">
            {scheduleItems.slice(0, 5).map((item) => (
              <div key={item.id} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
                  {getItemIcon(item)}
                </div>
                <span className="text-xs text-white/80 truncate max-w-[60px]">
                  {item.title.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {isToday(selectedDate) ? "Today's Schedule" : format(selectedDate, 'EEEE, MMM d')}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddTask(true)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {scheduleItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No items scheduled for this day</p>
            <p className="text-sm mt-2">Tap + to add tasks or set times for your goals</p>
            <Button
              onClick={() => setShowAddTask(true)}
              className="mt-4"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduleItems.map((item, index) => (
              <div key={item.id} className="flex gap-3 items-stretch">
                {/* Time column - fixed width, vertically centered */}
                <div className="w-16 flex-shrink-0 flex items-center justify-end pr-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    {item.scheduledTime ? getTimeDisplay(item.scheduledTime) : ''}
                  </span>
                </div>
                
                {/* Card */}
                <Card 
                  className={`flex-1 p-4 border-l-4 ${getItemColor(item, index)} ${
                    item.isCompleted ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          item.type === 'goal' 
                            ? 'bg-teal-100 text-teal-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {item.type === 'goal' ? '🎯 Goal' : '📋 Task'}
                        </span>
                      </div>
                      <h3 className={`font-semibold text-foreground ${item.isCompleted ? 'line-through' : ''}`}>
                        {getItemIcon(item)} {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      )}
                      {item.type === 'goal' && item.goalData && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {item.goalData.completedDates.length}/{item.goalData.duration} days
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {item.type === 'task' && item.taskData && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleTaskComplete(item.taskData!.id)}
                          >
                            <CheckCircle className={`h-5 w-5 ${
                              item.isCompleted ? 'text-green-500 fill-green-500' : 'text-muted-foreground'
                            }`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteTask(item.taskData!.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {item.type === 'goal' && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          item.isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-muted'
                        }`}>
                          {item.isCompleted ? '✓' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddScheduleTaskDialog
        open={showAddTask}
        onOpenChange={setShowAddTask}
        selectedDate={selectedDate}
        onTaskAdded={handleTaskAdded}
      />
    </div>
  );
};

export default ScheduleView;
