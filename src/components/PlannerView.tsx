import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Clock, Trash2, CheckCircle, Pencil, Target, PenTool, CalendarDays } from 'lucide-react';
import { format, addDays, isSameDay, isToday, isBefore, startOfDay, subYears, addYears, startOfWeek, addMonths } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Goal, Note } from './Dashboard';
import { GoalCard } from './GoalCard';
import { NoteCard } from './NoteCard';
import AddScheduleTaskDialog, { ScheduleTask } from './AddScheduleTaskDialog';
import EditScheduleTaskDialog from './EditScheduleTaskDialog';
import { AddGoalDialog } from './AddGoalDialog';
import { AddNoteDialog } from './AddNoteDialog';
import { EditNoteDialog } from './EditNoteDialog';

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

interface PlannerViewProps {
  onViewGoalDetail?: (goalId: string) => void;
  onViewGoalChat?: (goalId: string) => void;
  onViewNote?: (note: Note) => void;
  addMenuRequest?: number;
}

const PlannerView = ({ onViewGoalDetail, onViewGoalChat, onViewNote, addMenuRequest }: PlannerViewProps) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'goals' | 'notes'>('schedule');
  const [showFabMenu, setShowFabMenu] = useState(false);

  // Allow the footer “Add” button to open the same 3-option menu
  useEffect(() => {
    if (addMenuRequest === 0) {
      setShowFabMenu(false);
    } else if (addMenuRequest && addMenuRequest > 0) {
      setShowFabMenu(true);
    }
  }, [addMenuRequest]);
  // Schedule state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddTask, setShowAddTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduleTask | null>(null);
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  
  // Goals state
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'active' | 'completed' | 'inactive'>('active');
  
  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showEditNote, setShowEditNote] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

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
      const oneYearAgo = subYears(new Date(), 1);
      const parsedTasks = JSON.parse(savedTasks)
        .map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
        }))
        .filter((task: ScheduleTask) => {
          const taskDate = new Date(task.date);
          return taskDate >= oneYearAgo;
        });
      setTasks(parsedTasks);
      localStorage.setItem('bestie-schedule-tasks', JSON.stringify(parsedTasks));
    }
  }, []);

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem('companion-notes');
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt)
      }));
      setNotes(parsedNotes);
    }
  }, []);

  // Listen for edit-note events from NoteDetailView
  useEffect(() => {
    const handleEditNote = (event: CustomEvent<Note>) => {
      setActiveTab('notes');
      setEditingNote(event.detail);
      setShowEditNote(true);
    };

    window.addEventListener('edit-note', handleEditNote as EventListener);
    return () => {
      window.removeEventListener('edit-note', handleEditNote as EventListener);
    };
  }, []);

  // Save goals to localStorage
  useEffect(() => {
    if (goals.length > 0) {
      const updatedGoals = goals.map(goal => ({
        ...goal,
        state: calculateGoalState(goal)
      }));
      localStorage.setItem('bestie-goals', JSON.stringify(updatedGoals));
    }
  }, [goals]);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem('companion-notes', JSON.stringify(notes));
  }, [notes]);

  const calculateGoalState = (goal: Goal): 'active' | 'inactive' | 'completed' => {
    const daysSinceCreated = Math.floor(
      (new Date().getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const requiredCompletions = Math.floor((goal.duration / 7) * goal.selectedDays.length);
    const currentCompletions = goal.completedDates.length;
    
    if (currentCompletions >= requiredCompletions) return 'completed';
    if (daysSinceCreated >= goal.duration) return 'inactive';
    return 'active';
  };

  // Task functions
  const saveTasks = (updatedTasks: ScheduleTask[]) => {
    localStorage.setItem('bestie-schedule-tasks', JSON.stringify(updatedTasks));
    setTasks(updatedTasks);
  };

  const handleTaskAdded = (task: ScheduleTask) => {
    saveTasks([...tasks, task]);
  };

  const handleMultipleTasksAdded = (newTasks: ScheduleTask[]) => {
    saveTasks([...tasks, ...newTasks]);
  };

  const handleTaskUpdated = (updatedTask: ScheduleTask) => {
    saveTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
  };

  const toggleTaskComplete = (taskId: string) => {
    saveTasks(tasks.map(task => task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task));
  };

  const deleteTask = (taskId: string) => {
    saveTasks(tasks.filter(task => task.id !== taskId));
  };

  const isTaskPast = (task: ScheduleTask) => {
    const taskDateTime = new Date(`${task.date}T${task.scheduledTime}`);
    return isBefore(taskDateTime, new Date());
  };

  const openEditTask = (task: ScheduleTask) => {
    setEditingTask(task);
    setShowEditTask(true);
  };

  // Goal functions
  const addGoal = (goalData: Omit<Goal, 'id' | 'streak' | 'completedDates' | 'createdAt' | 'isActive' | 'state'>) => {
    const activeGoalsCount = goals.filter(g => g.isActive).length;
    if (activeGoalsCount >= 3) return;
    
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
    setGoals(prev => prev.map(goal => goal.id === goalId ? { ...goal, ...updates } : goal));
  };

  const deleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
  };

  // Note functions
  const addNote = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      ...noteData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const updateNote = (noteId: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(note => note.id === noteId ? { ...note, ...updates, updatedAt: new Date() } : note));
  };

  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowEditNote(true);
  };

  // Schedule helpers
  // Generate 21 days starting from Sunday of the week containing `currentDate`
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
    return Array.from({ length: 21 }, (_, i) => addDays(start, i));
  }, [currentDate]);
  
  // Function to navigate back to today
  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentDate(today);
  };
  
  // State for controlling calendar popover
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Get dates that have tasks for calendar highlighting
  const datesWithTasks = useMemo(() => {
    const dateSet = new Set<string>();
    tasks.forEach(task => {
      dateSet.add(task.date);
    });
    // Also add goal days
    goals.filter(g => g.isActive).forEach(goal => {
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const checkDate = addDays(today, i);
        if (goal.selectedDays.includes(checkDate.getDay())) {
          dateSet.add(checkDate.toISOString().split('T')[0]);
        }
      }
    });
    return dateSet;
  }, [tasks, goals]);


  const isGoalCompletedForDate = (goal: Goal, date: Date) => {
    return goal.completedDates.some(completedDate => {
      const cd = new Date(completedDate);
      cd.setHours(0, 0, 0, 0);
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return cd.getTime() === d.getTime();
    });
  };

  const scheduleItems = useMemo(() => {
    const dayOfWeek = selectedDate.getDay();
    const dateString = selectedDate.toISOString().split('T')[0];
    
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

    return [...goalsForDay, ...tasksForDay].sort((a, b) => {
      if (!a.scheduledTime && !b.scheduledTime) return 0;
      if (!a.scheduledTime) return 1;
      if (!b.scheduledTime) return -1;
      return a.scheduledTime.localeCompare(b.scheduledTime);
    });
  }, [goals, tasks, selectedDate]);

  // Auto-scroll to selected date when it changes
  useEffect(() => {
    // Update currentDate to keep the selected date in view
    const diffDays = Math.floor((selectedDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    if (Math.abs(diffDays) > 7) {
      setCurrentDate(selectedDate);
    }
  }, [selectedDate]);

  const getTimeDisplay = (time?: string) => {
    if (!time) return null;
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const getItemColor = (item: ScheduleItem, index: number) => {
    if (item.type === 'task') return 'bg-primary/20 border-l-primary';
    const colors = ['bg-accent/30 border-l-accent', 'bg-rose-400/20 border-l-rose-400', 'bg-amber-400/20 border-l-amber-400'];
    return colors[index % colors.length];
  };

  const getItemIcon = (item: ScheduleItem) => {
    if (item.type === 'task') {
      const lowerTitle = item.title.toLowerCase();
      if (lowerTitle.includes('wake')) return '⏰';
      if (lowerTitle.includes('morning')) return '🌅';
      if (lowerTitle.includes('shop') || lowerTitle.includes('buy')) return '🛒';
      if (lowerTitle.includes('meet')) return '👥';
      return '📋';
    }
    return '🎯';
  };

  // Goals helpers
  const getFilteredGoals = () => {
    switch (activeFilter) {
      case 'active': return goals.filter(goal => goal.state === 'active');
      case 'completed': return goals.filter(goal => goal.state === 'completed');
      case 'inactive': return goals.filter(goal => goal.state === 'inactive');
      default: return goals.filter(goal => goal.state === 'active');
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
      
      let scheduledDays = 0;
      const currentDateIter = new Date(createdAt);
      const daysElapsed = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const effectiveDays = Math.min(daysElapsed, goal.duration);
      
      for (let i = 0; i <= effectiveDays; i++) {
        if (goal.selectedDays.includes(currentDateIter.getDay())) scheduledDays++;
        currentDateIter.setDate(currentDateIter.getDate() + 1);
      }
      
      if (scheduledDays === 0) return 0;
      return Math.min((goal.completedDates.length / scheduledDays) * 100, 100);
    });
    
    return Math.round(consistencies.reduce((sum, val) => sum + val, 0) / activeGoals.length);
  };

  const filteredGoals = getFilteredGoals();
  const isGoalActiveToday = (goal: Goal) => goal.selectedDays.includes(new Date().getDay());
  const isGoalCompletedToday = (goal: Goal) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return goal.completedDates.some(date => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
  };
  const activeGoalsCount = goals.filter(goal => goal.isActive && isGoalActiveToday(goal) && !isGoalCompletedToday(goal)).length;

  // Handle FAB action
  const handleFabAction = (action: 'task' | 'goal' | 'note') => {
    setShowFabMenu(false);
    if (action === 'task') {
      setActiveTab('schedule');
      setShowAddTask(true);
    } else if (action === 'goal') {
      setActiveTab('goals');
      setShowAddGoal(true);
    } else {
      setActiveTab('notes');
      setShowAddNote(true);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header with Tabs */}
      <div className="bg-muted/50 pt-2 px-4">
        <div className="flex bg-muted rounded-xl p-1 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'schedule' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Schedule
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'goals' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Goals
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'notes' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Notes
          </button>
        </div>
      </div>

      {/* Schedule Tab Content */}
      {activeTab === 'schedule' && (
        <>
          {/* Calendar Header */}
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-foreground">
                {format(currentDate, 'MMMM yyyy')}
              </h1>
              <div className="flex items-center gap-1">
                {!isToday(selectedDate) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={goToToday}
                    className="text-primary text-xs font-medium"
                  >
                    Today
                  </Button>
                )}
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                      <CalendarDays className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                <PopoverContent className="w-[90vw] max-w-[360px] p-0 overflow-hidden" align="end">
                  <div className="overflow-x-auto max-h-[350px]" style={{ scrollbarWidth: 'thin' }}>
                    <div className="w-max">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        defaultMonth={new Date()}
                        numberOfMonths={24}
                        onSelect={(date) => {
                          if (date) {
                            setSelectedDate(date);
                            setCurrentDate(date);
                            setIsCalendarOpen(false);
                            // Only open add task if selecting a future date without existing tasks
                            const dateStr = date.toISOString().split('T')[0];
                            if (!isBefore(startOfDay(date), startOfDay(new Date())) && !datesWithTasks.has(dateStr)) {
                              setShowAddTask(true);
                            }
                          }
                        }}
                        disabled={(date) =>
                          isBefore(date, addYears(new Date(), -1)) || date > addYears(new Date(), 5)
                        }
                        modifiers={{
                          hasTasks: (date) => datesWithTasks.has(date.toISOString().split('T')[0]),
                        }}
                        modifiersClassNames={{
                          hasTasks: 'bg-accent/40 font-bold text-accent-foreground',
                        }}
                        classNames={{
                          nav: 'hidden',
                          months: 'flex flex-row gap-4 px-2',
                          month: 'space-y-4 min-w-[280px]',
                        }}
                        initialFocus
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </div>
                  </div>
                </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Scrollable Dates */}
            <div 
              className="flex gap-1 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {weekDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "flex flex-col items-center py-2 px-3 rounded-xl transition-all min-w-[48px] flex-shrink-0",
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold"
                        : isTodayDate
                          ? "bg-muted text-foreground font-bold ring-2 ring-primary"
                          : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span className="text-[10px] font-medium mb-1">
                      {format(day, 'EEE')}
                    </span>
                    <span className="text-lg font-bold">
                      {format(day, 'd')}
                    </span>
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full mt-1",
                        isSelected ? "bg-accent-foreground" : isTodayDate ? "bg-primary" : "bg-transparent"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeline */}
          <div className="px-4 py-2">
            {scheduleItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No items scheduled for this day</p>
                <p className="text-sm mt-2">Tap + to add tasks</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduleItems.map((item, index) => {
                  return (
                    <div key={item.id} className="flex gap-3 items-stretch">
                      <div className="w-16 flex-shrink-0 flex items-center justify-end pr-2">
                        <span className="text-xs text-muted-foreground font-medium">
                          {item.scheduledTime ? getTimeDisplay(item.scheduledTime) : ''}
                        </span>
                      </div>

                      <Card 
                        className={`flex-1 p-4 border-l-4 ${getItemColor(item, index)} ${item.isCompleted ? 'opacity-60' : ''} ${item.type === 'goal' ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                        onClick={() => {
                          if (item.type === 'goal' && item.goalData) {
                            onViewGoalChat?.(item.goalData.id);
                          }
                        }}
                      >
                        <div className="flex flex-col h-full">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{getItemIcon(item)}</span>
                                {item.taskData?.recurrence && item.taskData.recurrence !== 'none' && (
                                  <span className="text-xs">🔄</span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">
                                {item.scheduledTime ? getTimeDisplay(item.scheduledTime) : 'No time set'}
                              </p>
                              <h3 className={`font-semibold text-foreground ${item.isCompleted ? 'line-through' : ''}`}>
                                {item.title}
                              </h3>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                              )}
                            </div>
                            {item.type === 'task' && item.taskData && (
                              <div className="flex items-center gap-4">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditTask(item.taskData!);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-8 w-8 rounded-full ${
                                    item.isCompleted ? 'bg-primary' : 'bg-muted'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTaskComplete(item.taskData!.id);
                                  }}
                                >
                                  <CheckCircle className={`h-5 w-5 ${
                                    item.isCompleted ? 'text-primary-foreground' : 'text-muted-foreground/50'
                                  }`} />
                                </Button>
                              </div>
                            )}
                          </div>
                          {item.type === 'task' && item.taskData && (
                            <div className="flex justify-end mt-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTask(item.taskData!.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Goals Tab Content */}
      {activeTab === 'goals' && (
        <div className="px-4 py-4">
          {/* Progress Overview */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-muted-foreground mb-4">Your Progress</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center bg-muted/30 rounded-xl p-4">
                <div className="text-2xl mb-1">🏆</div>
                <div className="text-2xl font-bold text-foreground">{goals.filter(g => g.isActive).length}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center bg-muted/30 rounded-xl p-4">
                <div className="text-2xl mb-1">⚡</div>
                <div className="text-2xl font-bold text-foreground">{activeGoalsCount}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
              <div className="text-center bg-muted/30 rounded-xl p-4">
                <div className="text-2xl mb-1">📊</div>
                <div className="text-2xl font-bold text-foreground">{getConsistencyPercentage()}%</div>
                <div className="text-xs text-muted-foreground">Consistency</div>
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['active', 'completed', 'inactive'] as const).map(filter => (
              <Button
                key={filter}
                variant={activeFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className="rounded-full capitalize"
              >
                {filter}
              </Button>
            ))}
          </div>

          {/* Goals List */}
          <div className="space-y-4">
            {filteredGoals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No goals found</p>
                <p className="text-sm mt-2">Tap + to add a goal</p>
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

          {goals.filter(g => g.isActive).length >= 3 && (
            <div className="mt-6 text-center py-4 border-t">
              <p className="text-muted-foreground text-sm">Goal limit reached (3 active)</p>
            </div>
          )}
        </div>
      )}

      {/* Notes Tab Content */}
      {activeTab === 'notes' && (
        <div className="px-4 py-4">
          {notes.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-6 rounded-full bg-muted/50 mb-6 w-fit mx-auto">
                <PenTool className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-medium text-foreground mb-2">Your Notes</h2>
              <p className="text-muted-foreground mb-4">Capture your thoughts and ideas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map(note => (
                <Card key={note.id} className="p-4 bg-card/80">
                  <NoteCard 
                    note={note} 
                    onUpdate={updateNote}
                    onDelete={deleteNote}
                    onEdit={handleEditNote}
                    onView={onViewNote}
                  />
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4 z-40">
        {showFabMenu && (
          <div className="absolute bottom-16 right-0 bg-card rounded-xl shadow-lg border p-2 min-w-[160px]">
            <button
              onClick={() => handleFabAction('task')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-lg transition-colors"
            >
              <CalendarDays className="h-5 w-5 text-primary" />
              <span className="font-medium">Add Task</span>
            </button>
            <button
              onClick={() => handleFabAction('goal')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-lg transition-colors"
            >
              <Target className="h-5 w-5 text-primary" />
              <span className="font-medium">Add Goal</span>
            </button>
            <button
              onClick={() => handleFabAction('note')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-lg transition-colors"
            >
              <PenTool className="h-5 w-5 text-primary" />
              <span className="font-medium">Add Note</span>
            </button>
          </div>
        )}
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          onClick={() => setShowFabMenu(!showFabMenu)}
        >
          <Plus className={`h-6 w-6 transition-transform ${showFabMenu ? 'rotate-45' : ''}`} />
        </Button>
      </div>

      {/* Click outside to close FAB menu */}
      {showFabMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowFabMenu(false)}
        />
      )}

      {/* Dialogs */}
      <AddScheduleTaskDialog
        open={showAddTask}
        onOpenChange={setShowAddTask}
        selectedDate={selectedDate}
        onTaskAdded={handleTaskAdded}
        onMultipleTasksAdded={handleMultipleTasksAdded}
      />

      <EditScheduleTaskDialog
        open={showEditTask}
        onOpenChange={setShowEditTask}
        task={editingTask}
        onTaskUpdated={handleTaskUpdated}
      />

      <AddGoalDialog 
        open={showAddGoal} 
        onOpenChange={setShowAddGoal}
        onAdd={addGoal}
      />

      <AddNoteDialog 
        open={showAddNote} 
        onOpenChange={setShowAddNote}
        onAdd={addNote}
      />

      <EditNoteDialog
        open={showEditNote}
        onOpenChange={setShowEditNote}
        note={editingNote}
        onUpdate={updateNote}
      />
    </div>
  );
};

export default PlannerView;
