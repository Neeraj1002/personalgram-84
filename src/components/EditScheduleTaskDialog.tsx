import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ScheduleTask } from './AddScheduleTaskDialog';

interface EditScheduleTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: ScheduleTask | null;
  onTaskUpdated: (task: ScheduleTask) => void;
}

const EditScheduleTaskDialog = ({ open, onOpenChange, task, onTaskUpdated }: EditScheduleTaskDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [isReminder, setIsReminder] = useState(true);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setScheduledTime(task.scheduledTime);
      setIsReminder(task.isReminder);
    }
  }, [task]);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!scheduledTime) {
      toast.error('Please set a time');
      return;
    }

    if (!task) return;

    const updatedTask: ScheduleTask = {
      ...task,
      title: title.trim(),
      description: description.trim() || undefined,
      scheduledTime,
      isReminder,
    };

    onTaskUpdated(updatedTask);
    onOpenChange(false);
    toast.success('Task updated');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              placeholder="Meeting, Task, Reminder..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description (optional)</Label>
            <Textarea
              id="edit-description"
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-time">Time</Label>
            <Input
              id="edit-time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="edit-reminder">Set Reminder</Label>
              <p className="text-xs text-muted-foreground">
                Get notified 1 hour before
              </p>
            </div>
            <Switch
              id="edit-reminder"
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
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditScheduleTaskDialog;
