import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { isBefore, startOfDay, addDays, addWeeks } from 'date-fns';

export interface ScheduleTask {
  id: string;
  title: string;
  description?: string;
  scheduledTime: string;
  date: string; // ISO date string
  isReminder: boolean;
  isCompleted: boolean;
  createdAt: Date;
  recurrence?: 'none' | 'daily' | 'weekly';
  recurrenceEndDate?: string;
}

interface AddScheduleTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onTaskAdded: (task: ScheduleTask) => void;
  onMultipleTasksAdded?: (tasks: ScheduleTask[]) => void;
}

const AddScheduleTaskDialog = ({ open, onOpenChange, selectedDate, onTaskAdded, onMultipleTasksAdded }: AddScheduleTaskDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [isReminder, setIsReminder] = useState(true);
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly'>('none');
  const [recurrenceWeeks, setRecurrenceWeeks] = useState('4');

  // Check if selected date is in the past
  const isPastDate = isBefore(startOfDay(selectedDate), startOfDay(new Date()));

  // Reset form when dialog opens/closes or selectedDate changes
  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setHour('09');
      setMinute('00');
      setPeriod('AM');
      setIsReminder(true);
      setRecurrence('none');
      setRecurrenceWeeks('4');
    }
  }, [open, selectedDate]);

  const convertTo24Hour = (h: string, m: string, p: 'AM' | 'PM'): string => {
    let hour24 = parseInt(h, 10);
    if (p === 'AM') {
      if (hour24 === 12) hour24 = 0;
    } else {
      if (hour24 !== 12) hour24 += 12;
    }
    return `${hour24.toString().padStart(2, '0')}:${m}`;
  };

  const handleSubmit = () => {
    if (isPastDate) {
      toast.error('Cannot add tasks to past dates');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const scheduledTime = convertTo24Hour(hour, minute, period);
    const baseTask = {
      title: title.trim(),
      description: description.trim() || undefined,
      scheduledTime,
      isReminder,
      isCompleted: false,
      createdAt: new Date(),
      recurrence,
    };

    if (recurrence === 'none') {
      const newTask: ScheduleTask = {
        ...baseTask,
        id: Date.now().toString(),
        date: selectedDate.toISOString().split('T')[0],
      };
      onTaskAdded(newTask);
      toast.success('Task added to schedule');
    } else {
      // Create recurring tasks
      const tasks: ScheduleTask[] = [];
      const weeks = parseInt(recurrenceWeeks, 10);
      const totalDays = recurrence === 'daily' ? weeks * 7 : weeks;
      
      for (let i = 0; i < totalDays; i++) {
        const taskDate = recurrence === 'daily' 
          ? addDays(selectedDate, i) 
          : addWeeks(selectedDate, i);
        
        // Skip past dates
        if (isBefore(startOfDay(taskDate), startOfDay(new Date()))) continue;
        
        tasks.push({
          ...baseTask,
          id: `${Date.now()}-${i}`,
          date: taskDate.toISOString().split('T')[0],
          recurrenceEndDate: recurrence === 'daily' 
            ? addDays(selectedDate, weeks * 7 - 1).toISOString().split('T')[0]
            : addWeeks(selectedDate, weeks - 1).toISOString().split('T')[0],
        });
      }
      
      if (onMultipleTasksAdded && tasks.length > 0) {
        onMultipleTasksAdded(tasks);
        toast.success(`${tasks.length} recurring tasks added`);
      } else if (tasks.length > 0) {
        // Fallback: add tasks one by one
        tasks.forEach(task => onTaskAdded(task));
        toast.success(`${tasks.length} recurring tasks added`);
      }
    }
    
    onOpenChange(false);
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add to Schedule</DialogTitle>
          {isPastDate && (
            <p className="text-sm text-destructive mt-1">
              Cannot add tasks to past dates. Please select a future date.
            </p>
          )}
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Meeting, Task, Reminder..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Time</Label>
            <div className="flex gap-2">
              <Select value={hour} onValueChange={setHour}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="flex items-center text-lg font-medium">:</span>
              <Select value={minute} onValueChange={setMinute}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={period} onValueChange={(v) => setPeriod(v as 'AM' | 'PM')}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="AM/PM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Repeat</Label>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as 'none' | 'daily' | 'weekly')}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recurrence !== 'none' && (
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={recurrenceWeeks} onValueChange={setRecurrenceWeeks}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 week</SelectItem>
                  <SelectItem value="2">2 weeks</SelectItem>
                  <SelectItem value="4">4 weeks</SelectItem>
                  <SelectItem value="8">8 weeks</SelectItem>
                  <SelectItem value="12">12 weeks</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {recurrence === 'daily' 
                  ? `Creates ${parseInt(recurrenceWeeks) * 7} tasks over ${recurrenceWeeks} weeks`
                  : `Creates ${recurrenceWeeks} weekly tasks`
                }
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reminder">Set Reminder</Label>
              <p className="text-xs text-muted-foreground">
                Get notified 1 hour before
              </p>
            </div>
            <Switch
              id="reminder"
              checked={isReminder}
              onCheckedChange={setIsReminder}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isPastDate}>
            Add Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddScheduleTaskDialog;
