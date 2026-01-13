import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock } from 'lucide-react';
import { Goal } from './Dashboard';

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (goal: Omit<Goal, 'id' | 'streak' | 'completedDates' | 'createdAt' | 'isActive' | 'state'>) => void;
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export const AddGoalDialog = ({ open, onOpenChange, onAdd }: AddGoalDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [duration, setDuration] = useState<string>('30');
  const [scheduledTime, setScheduledTime] = useState<string>('');

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedDays.length < 3) {
      alert('Please fill in the title and select at least 3 days');
      return;
    }

    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      selectedDays,
      duration: parseInt(duration),
      scheduledTime: scheduledTime || undefined
    });

    // Reset form
    setTitle('');
    setDescription('');
    setSelectedDays([]);
    setDuration('30');
    setScheduledTime('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 bg-card/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-companion-green-dark">
            Add New Goal
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Goal Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like to achieve?"
              className="bg-background/50 border-companion-green-light focus:border-companion-green"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about your goal..."
              className="bg-background/50 border-companion-green-light focus:border-companion-green min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Days of the Week
            </Label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((day, index) => (
                <Button
                  key={index}
                  type="button"
                  variant={selectedDays.includes(index) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDay(index)}
                  className="w-10 h-10 p-0"
                >
                  {day}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Please select at least 3 days {selectedDays.length > 0 && `(${selectedDays.length} selected)`}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-sm font-medium">
              Duration (Days)
            </Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="bg-background/50 border-companion-green-light focus:border-companion-green">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="45">45 Days</SelectItem>
                <SelectItem value="60">60 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledTime" className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scheduled Time <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="scheduledTime"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="bg-background/50 border-companion-green-light focus:border-companion-green"
            />
            <p className="text-xs text-muted-foreground">
              Set a time to receive reminders 1 hour before
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-companion-green-light hover:bg-companion-green-light"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Add Goal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};