import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export interface ScheduleTask {
  id: string;
  title: string;
  description?: string;
  scheduledTime: string;
  date: string; // ISO date string
  isReminder: boolean;
  isCompleted: boolean;
  createdAt: Date;
}

interface AddScheduleTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onTaskAdded: (task: ScheduleTask) => void;
}

const AddScheduleTaskDialog = ({ open, onOpenChange, selectedDate, onTaskAdded }: AddScheduleTaskDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [isReminder, setIsReminder] = useState(true);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!scheduledTime) {
      toast.error('Please set a time');
      return;
    }

    const newTask: ScheduleTask = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim() || undefined,
      scheduledTime,
      date: selectedDate.toISOString().split('T')[0],
      isReminder,
      isCompleted: false,
      createdAt: new Date(),
    };

    onTaskAdded(newTask);
    
    // Reset form
    setTitle('');
    setDescription('');
    setScheduledTime('09:00');
    setIsReminder(true);
    onOpenChange(false);
    
    toast.success('Task added to schedule');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Schedule</DialogTitle>
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
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full"
            />
          </div>

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
          <Button onClick={handleSubmit} className="flex-1">
            Add Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddScheduleTaskDialog;
