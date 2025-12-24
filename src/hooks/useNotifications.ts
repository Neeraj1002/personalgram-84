import { useEffect, useCallback } from 'react';

interface ScheduledNotification {
  goalId: string;
  goalTitle: string;
  scheduledTime: string;
  description?: string;
}

export const useNotifications = () => {
  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  // Show notification
  const showNotification = useCallback((title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `goal-reminder-${Date.now()}`,
        requireInteraction: true,
      });
    }
  }, []);

  // Schedule notifications for goals
  const scheduleGoalNotifications = useCallback(() => {
    const savedGoals = localStorage.getItem('bestie-goals');
    if (!savedGoals) return;

    const goals = JSON.parse(savedGoals);
    const now = new Date();
    const today = now.getDay();

    goals.forEach((goal: any) => {
      if (!goal.isActive || !goal.scheduledTime || !goal.selectedDays.includes(today)) {
        return;
      }

      const [hours, minutes] = goal.scheduledTime.split(':').map(Number);
      const goalTime = new Date();
      goalTime.setHours(hours, minutes, 0, 0);

      // Calculate notification time (1 hour before)
      const notificationTime = new Date(goalTime);
      notificationTime.setHours(notificationTime.getHours() - 1);

      // Check if we should notify now (within a 1-minute window)
      const timeDiff = Math.abs(now.getTime() - notificationTime.getTime());
      const notificationKey = `goal-notification-${goal.id}-${now.toDateString()}-${goal.scheduledTime}`;
      
      // If within 1 minute of notification time and not already notified
      if (timeDiff <= 60000 && !localStorage.getItem(notificationKey)) {
        showNotification(
          `🔔 Goal Reminder: ${goal.title}`,
          `Starting in 1 hour at ${formatTime(goal.scheduledTime)}. ${goal.description || 'Get ready!'}`
        );
        localStorage.setItem(notificationKey, 'true');
      }

      // Also check if it's goal time
      const goalTimeDiff = Math.abs(now.getTime() - goalTime.getTime());
      const startNotificationKey = `goal-start-${goal.id}-${now.toDateString()}-${goal.scheduledTime}`;
      
      if (goalTimeDiff <= 60000 && !localStorage.getItem(startNotificationKey)) {
        showNotification(
          `⏰ It's time: ${goal.title}`,
          `Your goal "${goal.title}" is starting now!`
        );
        localStorage.setItem(startNotificationKey, 'true');
      }
    });
  }, [showNotification]);

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Setup notification checking interval
  useEffect(() => {
    requestPermission();
    
    // Check immediately
    scheduleGoalNotifications();
    
    // Check every minute
    const interval = setInterval(scheduleGoalNotifications, 60000);
    
    return () => clearInterval(interval);
  }, [requestPermission, scheduleGoalNotifications]);

  return {
    requestPermission,
    showNotification,
    scheduleGoalNotifications,
  };
};

export default useNotifications;
