import { 
  collection, 
  addDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export class TaskNotificationService {
  // Send immediate notification for task assignment
  static async sendTaskAssignmentNotification(userId, taskData) {
    try {
      const { id, title, description, dueDate, meetingName, clubId } = taskData;

      await addDoc(collection(db, 'users', userId, 'notifications'), {
        type: 'task_assignment',
        title: 'New Task Assigned',
        message: `You have been assigned a new task: "${title}" for meeting "${meetingName}"`,
        taskTitle: title,
        meetingName: meetingName,
        dueDate: dueDate,
        link: '/meetings',
        data: {
          taskId: id,
          taskTitle: title,
          meetingName,
          dueDate,
          clubId
        },
        read: false,
        createdAt: serverTimestamp(),
        priority: 'normal'
      });

      console.log(`Task assignment notification sent to user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending task assignment notification:', error);
      throw error;
    }
  }

  // Schedule reminder notifications for a task
  static async scheduleTaskReminders(taskId, taskData) {
    try {
      const { title, dueDate, meetingName, assignedUsers } = taskData;
      
      if (!dueDate) {
        console.log('No due date provided, skipping reminder scheduling');
        return { success: true };
      }

      const dueDateTime = new Date(dueDate);
      const now = new Date();

      // Define reminder intervals (in milliseconds before due date)
      const reminderIntervals = [
        { type: '1_day', ms: 24 * 60 * 60 * 1000 },
        { type: '10_hours', ms: 10 * 60 * 60 * 1000 },
        { type: '5_hours', ms: 5 * 60 * 60 * 1000 },
        { type: '2_hours', ms: 2 * 60 * 60 * 1000 }
      ];

      const remindersCollection = collection(db, 'taskReminders');

      for (const interval of reminderIntervals) {
        const reminderTime = new Date(dueDateTime.getTime() - interval.ms);
        
        // Only schedule if reminder time is in the future
        if (reminderTime > now) {
          for (const userId of assignedUsers) {
            await addDoc(remindersCollection, {
              taskId: taskId,
              userId: userId,
              type: interval.type,
              scheduledFor: reminderTime.getTime(),
              taskData: {
                title,
                dueDate,
                meetingName
              },
              sent: false,
              createdAt: serverTimestamp()
            });
          }
        }
      }

      console.log(`Scheduled reminders for task ${taskId}`);
      return { success: true };
    } catch (error) {
      console.error('Error scheduling task reminders:', error);
      throw error;
    }
  }
}
