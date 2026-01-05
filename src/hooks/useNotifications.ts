import { useEffect, useCallback } from 'react';

export const useNotifications = () => {
  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      console.log('Notifications already granted');
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission === 'granted';
    }

    console.log('Notifications denied');
    return false;
  }, []);

  // Show notification
  const showNotification = useCallback((title: string, body: string) => {
    console.log('Attempting to show notification:', title, body);
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `goal-reminder-${Date.now()}`,
          requireInteraction: true,
        });
        console.log('Notification shown successfully');
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    } else {
      console.log('Notification permission not granted');
    }
  }, []);

  // Parse time string to hours and minutes (handles both 24h and 12h formats)
  const parseTime = useCallback((timeStr: string): { hours: number; minutes: number } | null => {
    if (!timeStr) return null;
    
    // Check if it's 24-hour format (HH:MM)
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return { hours, minutes };
    }
    
    // Check if it's 12-hour format (HH:MM AM/PM)
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3].toUpperCase();
      
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return { hours, minutes };
    }
    
    console.log('Could not parse time:', timeStr);
    return null;
  }, []);

  // Format time for display
  const formatTime = useCallback((time: string) => {
    const parsed = parseTime(time);
    if (!parsed) return time;
    
    const { hours, minutes } = parsed;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }, [parseTime]);

  // Schedule notifications for goals and tasks
  const scheduleNotifications = useCallback(() => {
    const now = new Date();
    const today = now.getDay();
    const todayString = now.toISOString().split('T')[0];

    console.log('Checking notifications at:', now.toLocaleTimeString());

    // Notify for goals
    const savedGoals = localStorage.getItem('bestie-goals');
    if (savedGoals) {
      const goals = JSON.parse(savedGoals);
      goals.forEach((goal: any) => {
        if (!goal.isActive || !goal.scheduledTime || !goal.selectedDays?.includes(today)) {
          return;
        }

        const parsed = parseTime(goal.scheduledTime);
        if (!parsed) return;

        const goalTime = new Date();
        goalTime.setHours(parsed.hours, parsed.minutes, 0, 0);

        // Calculate notification time (1 hour before)
        const notificationTime = new Date(goalTime);
        notificationTime.setHours(notificationTime.getHours() - 1);

        // Check if we should notify now (within a 1-minute window)
        const timeDiff = Math.abs(now.getTime() - notificationTime.getTime());
        const notificationKey = `goal-notification-${goal.id}-${now.toDateString()}-${goal.scheduledTime}`;
        
        if (timeDiff <= 60000 && !localStorage.getItem(notificationKey)) {
          console.log('Sending 1-hour reminder for goal:', goal.title);
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
          console.log('Sending start notification for goal:', goal.title);
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

        const parsed = parseTime(task.scheduledTime);
        if (!parsed) return;

        const taskTime = new Date();
        taskTime.setHours(parsed.hours, parsed.minutes, 0, 0);

        // Calculate notification time (1 hour before)
        const notificationTime = new Date(taskTime);
        notificationTime.setHours(notificationTime.getHours() - 1);

        // Check if we should notify now (within a 1-minute window)
        const timeDiff = Math.abs(now.getTime() - notificationTime.getTime());
        const notificationKey = `task-notification-${task.id}-${todayString}`;
        
        if (timeDiff <= 60000 && !localStorage.getItem(notificationKey)) {
          console.log('Sending 1-hour reminder for task:', task.title);
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
          console.log('Sending start notification for task:', task.title);
          showNotification(
            `⏰ Task Now: ${task.title}`,
            `Your scheduled task "${task.title}" is starting now!`
          );
          localStorage.setItem(startNotificationKey, 'true');
        }
      });
    }
  }, [showNotification, formatTime, parseTime]);

  // Setup notification checking interval
  useEffect(() => {
    console.log('Initializing notifications...');
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
