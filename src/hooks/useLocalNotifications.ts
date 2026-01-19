import { useEffect, useCallback } from 'react';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

interface Goal {
  id: string;
  title: string;
  description?: string;
  scheduledTime?: string;
  selectedDays?: number[];
  isActive: boolean;
}

interface ScheduleTask {
  id: string;
  title: string;
  description?: string;
  scheduledTime?: string;
  date: string;
  isCompleted: boolean;
  isReminder: boolean;
  reminderMinutes?: number;
}

export const useLocalNotifications = () => {
  // Check if running on native platform
  const isNative = Capacitor.isNativePlatform();

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isNative) {
      console.log('Not on native platform, skipping Capacitor notifications');
      return false;
    }

    try {
      const { display } = await LocalNotifications.checkPermissions();
      
      if (display === 'granted') {
        console.log('Local notifications already granted');
        return true;
      }

      if (display !== 'denied') {
        const result = await LocalNotifications.requestPermissions();
        console.log('Local notification permission:', result.display);
        return result.display === 'granted';
      }

      console.log('Local notifications denied');
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isNative]);

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

  // Format time for display in notifications
  const formatTime = useCallback((time: string) => {
    const parsed = parseTime(time);
    if (!parsed) return time;
    
    const { hours, minutes } = parsed;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }, [parseTime]);

  // Cancel all pending notifications
  const cancelAllNotifications = useCallback(async () => {
    if (!isNative) return;

    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
        console.log('Cancelled', pending.notifications.length, 'pending notifications');
      }
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }, [isNative]);

  // Schedule notifications for all goals and tasks
  const scheduleAllNotifications = useCallback(async () => {
    if (!isNative) {
      console.log('Not on native platform, using browser notifications');
      return;
    }

    try {
      // Cancel existing notifications first
      await cancelAllNotifications();

      const notifications: ScheduleOptions['notifications'] = [];
      let notificationId = 1;

      const now = new Date();
      const today = now.getDay();
      const todayString = now.toISOString().split('T')[0];

      // Schedule goal notifications
      const savedGoals = localStorage.getItem('bestie-goals');
      if (savedGoals) {
        const goals: Goal[] = JSON.parse(savedGoals);
        
        goals.forEach((goal) => {
          if (!goal.isActive || !goal.scheduledTime || !goal.selectedDays?.includes(today)) {
            return;
          }

          const parsed = parseTime(goal.scheduledTime);
          if (!parsed) return;

          const goalTime = new Date();
          goalTime.setHours(parsed.hours, parsed.minutes, 0, 0);

          // Only schedule if the time is in the future
          if (goalTime.getTime() <= now.getTime()) {
            return;
          }

          // Schedule 1-hour reminder
          const reminderTime = new Date(goalTime);
          reminderTime.setHours(reminderTime.getHours() - 1);
          
          if (reminderTime.getTime() > now.getTime()) {
            notifications.push({
              id: notificationId++,
              title: `🔔 Goal Reminder: ${goal.title}`,
              body: `Starting in 1 hour at ${formatTime(goal.scheduledTime)}. ${goal.description || 'Get ready!'}`,
              schedule: { at: reminderTime },
              sound: 'default',
              smallIcon: 'ic_stat_icon',
              largeIcon: 'ic_launcher',
            });
          }

          // Schedule at-time notification
          notifications.push({
            id: notificationId++,
            title: `⏰ It's time: ${goal.title}`,
            body: `Your goal "${goal.title}" is starting now!`,
            schedule: { at: goalTime },
            sound: 'default',
            smallIcon: 'ic_stat_icon',
            largeIcon: 'ic_launcher',
          });
        });
      }

      // Schedule task notifications
      const savedTasks = localStorage.getItem('bestie-schedule-tasks');
      if (savedTasks) {
        const tasks: ScheduleTask[] = JSON.parse(savedTasks);
        
        tasks.forEach((task) => {
          if (task.isCompleted || !task.isReminder || task.date !== todayString || !task.scheduledTime) {
            return;
          }

          const parsed = parseTime(task.scheduledTime);
          if (!parsed) return;

          const taskTime = new Date();
          taskTime.setHours(parsed.hours, parsed.minutes, 0, 0);

          // Only schedule if the time is in the future
          if (taskTime.getTime() <= now.getTime()) {
            return;
          }

          // Schedule reminder based on user preference (default 60 minutes)
          const reminderMinutes = task.reminderMinutes || 60;
          const reminderTime = new Date(taskTime);
          reminderTime.setMinutes(reminderTime.getMinutes() - reminderMinutes);
          
          // Format reminder text
          const reminderText = reminderMinutes >= 60 
            ? `${reminderMinutes / 60} hour${reminderMinutes > 60 ? 's' : ''}` 
            : `${reminderMinutes} minute${reminderMinutes > 1 ? 's' : ''}`;
          
          if (reminderTime.getTime() > now.getTime()) {
            notifications.push({
              id: notificationId++,
              title: `🔔 Task Reminder: ${task.title}`,
              body: `Starting in ${reminderText} at ${formatTime(task.scheduledTime)}. ${task.description || ''}`,
              schedule: { at: reminderTime },
              sound: 'default',
              smallIcon: 'ic_stat_icon',
              largeIcon: 'ic_launcher',
            });
          }

          // Schedule at-time notification
          notifications.push({
            id: notificationId++,
            title: `⏰ Task Now: ${task.title}`,
            body: `Your scheduled task "${task.title}" is starting now!`,
            schedule: { at: taskTime },
            sound: 'default',
            smallIcon: 'ic_stat_icon',
            largeIcon: 'ic_launcher',
          });
        });
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log('Scheduled', notifications.length, 'local notifications');
      } else {
        console.log('No notifications to schedule');
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }, [isNative, parseTime, formatTime, cancelAllNotifications]);

  // Setup notification listeners and initial scheduling
  useEffect(() => {
    if (!isNative) return;

    console.log('Initializing Capacitor local notifications...');
    
    // Request permission and schedule
    const init = async () => {
      const granted = await requestPermission();
      if (granted) {
        await scheduleAllNotifications();
      }
    };
    
    init();

    // Listen for notification events
    const receivedListener = LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('Notification received:', notification);
    });

    const actionListener = LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      console.log('Notification action performed:', action);
    });

    return () => {
      receivedListener.then(l => l.remove());
      actionListener.then(l => l.remove());
    };
  }, [isNative, requestPermission, scheduleAllNotifications]);

  return {
    isNative,
    requestPermission,
    scheduleAllNotifications,
    cancelAllNotifications,
  };
};

export default useLocalNotifications;
