import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [isReminder, setIsReminder] = useState(true);

  const convertFrom24Hour = (time: string): { hour: string; minute: string; period: 'AM' | 'PM' } => {
    const [h, m] = time.split(':').map(Number);
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    return {
      hour: hour12.toString().padStart(2, '0'),
      minute: m.toString().padStart(2, '0'),
      period,
    };
  };

  const convertTo24Hour = (h: string, m: string, p: 'AM' | 'PM'): string => {
    let hour24 = parseInt(h, 10);
    if (p === 'AM') {
      if (hour24 === 12) hour24 = 0;
    } else {
      if (hour24 !== 12) hour24 += 12;
    }
    return `${hour24.toString().padStart(2, '0')}:${m}`;
  };

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      const { hour: h, minute: m, period: p } = convertFrom24Hour(task.scheduledTime);
      setHour(h);
      setMinute(m);
      setPeriod(p);
      setIsReminder(task.isReminder);
    }
  }, [task]);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!task) return;

    const scheduledTime = convertTo24Hour(hour, minute, period);

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

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

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
