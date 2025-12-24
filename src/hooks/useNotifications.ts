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

  // Schedule notifications for goals and tasks
  const scheduleNotifications = useCallback(() => {
    const now = new Date();
    const today = now.getDay();
    const todayString = now.toISOString().split('T')[0];

    // Notify for goals
    const savedGoals = localStorage.getItem('bestie-goals');
    if (savedGoals) {
      const goals = JSON.parse(savedGoals);
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
    }

    // Notify for schedule tasks
    const savedTasks = localStorage.getItem('bestie-schedule-tasks');
    if (savedTasks) {
      const tasks = JSON.parse(savedTasks);
      tasks.forEach((task: any) => {
        if (task.isCompleted || !task.isReminder || task.date !== todayString || !task.scheduledTime) {
          return;
        }

        const [hours, minutes] = task.scheduledTime.split(':').map(Number);
        const taskTime = new Date();
        taskTime.setHours(hours, minutes, 0, 0);

        // Calculate notification time (1 hour before)
        const notificationTime = new Date(taskTime);
        notificationTime.setHours(notificationTime.getHours() - 1);

        // Check if we should notify now (within a 1-minute window)
        const timeDiff = Math.abs(now.getTime() - notificationTime.getTime());
        const notificationKey = `task-notification-${task.id}-${todayString}`;
        
        if (timeDiff <= 60000 && !localStorage.getItem(notificationKey)) {
          showNotification(
            `🔔 Task Reminder: ${task.title}`,
            `Scheduled for ${formatTime(task.scheduledTime)}. ${task.description || ''}`
          );
          localStorage.setItem(notificationKey, 'true');
        }

        // Also check if it's task time
        const taskTimeDiff = Math.abs(now.getTime() - taskTime.getTime());
        const startNotificationKey = `task-start-${task.id}-${todayString}`;
        
        if (taskTimeDiff <= 60000 && !localStorage.getItem(startNotificationKey)) {
          showNotification(
            `⏰ Task Now: ${task.title}`,
            `Your scheduled task "${task.title}" is starting now!`
          );
          localStorage.setItem(startNotificationKey, 'true');
        }
      });
    }
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
    scheduleNotifications();
    
    // Check every minute
    const interval = setInterval(scheduleNotifications, 60000);
    
    return () => clearInterval(interval);
  }, [requestPermission, scheduleNotifications]);

  return {
    requestPermission,
    showNotification,
    scheduleNotifications,
  };
};

export default useNotifications;
