import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Background service to process scheduled task reminders
 * This should be run periodically (e.g., every 15 minutes) to check for due reminders
 */
export class TaskReminderProcessor {
  static async processScheduledReminders() {
    try {
      console.log('Processing scheduled task reminders...');

      const now = new Date();
      const currentTimestamp = now.getTime();

      // Query for unsent reminders only (to avoid composite index requirement)
      // Then filter by scheduledFor in memory
      const remindersRef = collection(db, 'taskReminders');
      const dueRemindersQuery = query(
        remindersRef,
        where('sent', '==', false)
      );

      const snapshot = await getDocs(dueRemindersQuery);

      // Filter in memory for reminders that are due
      const dueReminders = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.scheduledFor <= currentTimestamp;
      });

      if (dueReminders.length === 0) {
        console.log('No due reminders found');
        return;
      }

      console.log(`Found ${dueReminders.length} due reminders to process`);

      const processPromises = dueReminders.map(async (reminderDoc) => {
        const reminderData = reminderDoc.data();

        try {
          // Send the notification
          await this.sendReminderNotification(reminderData);

          // Mark as sent
          await updateDoc(doc(db, 'taskReminders', reminderDoc.id), {
            sent: true,
            sentAt: currentTimestamp
          });

          console.log(`Sent reminder: ${reminderData.type} for task ${reminderData.taskId}`);

        } catch (error) {
          console.error(`Failed to send reminder ${reminderDoc.id}:`, error);

          // Mark as failed and increment retry count
          const retryCount = (reminderData.retryCount || 0) + 1;
          const maxRetries = 3;

          if (retryCount >= maxRetries) {
            // Delete failed reminder after max retries
            await deleteDoc(doc(db, 'taskReminders', reminderDoc.id));
            console.log(`Deleted failed reminder ${reminderDoc.id} after ${maxRetries} retries`);
          } else {
            // Schedule retry in 30 minutes
            await updateDoc(doc(db, 'taskReminders', reminderDoc.id), {
              scheduledFor: currentTimestamp + (30 * 60 * 1000), // 30 minutes from now
              retryCount: retryCount,
              lastError: error.message
            });
            console.log(`Scheduled retry ${retryCount} for reminder ${reminderDoc.id}`);
          }
        }
      });

      await Promise.all(processPromises);
      console.log('Finished processing scheduled reminders');

    } catch (error) {
      console.error('Error processing scheduled reminders:', error);
    }
  }

  static async sendReminderNotification(reminderData) {
    const { userId, taskData, type } = reminderData;

    let title, message;

    switch (type) {
      case '1_day':
        title = '📅 Task Due Tomorrow';
        message = `Task "${taskData.title}" from ${taskData.meetingName} is due tomorrow!`;
        break;
      case '10_hours':
        title = '⏰ Task Due in 10 Hours';
        message = `Task "${taskData.title}" from ${taskData.meetingName} is due in 10 hours.`;
        break;
      case '5_hours':
        title = '🚨 Task Due in 5 Hours';
        message = `Task "${taskData.title}" from ${taskData.meetingName} is due in 5 hours!`;
        break;
      case '2_hours':
        title = '⚠️ Task Due Soon!';
        message = `Task "${taskData.title}" from ${taskData.meetingName} is due in 2 hours!`;
        break;
      default:
        title = '📋 Task Reminder';
        message = `Don't forget about task "${taskData.title}" from ${taskData.meetingName}`;
    }

    // Create notification in user's subcollection
    await addDoc(collection(db, 'users', userId, 'notifications'), {
      title: title,
      message: message,
      type: 'task_reminder',
      taskTitle: taskData.title,
      meetingName: taskData.meetingName,
      dueDate: taskData.dueDate,
      link: '/meetings',
      priority: type === '2_hours' ? 'high' : type === '5_hours' ? 'medium' : 'normal',
      createdAt: serverTimestamp(),
      read: false,
      data: {
        taskId: reminderData.taskId,
        taskTitle: taskData.title,
        dueDate: taskData.dueDate,
        reminderType: type
      }
    });

    // Also try to send browser notification if supported
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body: message,
            icon: '/logo.png',
            tag: `task-reminder-${reminderData.taskId}-${type}`,
            requireInteraction: type === '2_hours' // Keep urgent reminders visible
          });
        }
      } catch (error) {
        console.log('Browser notification failed:', error);
      }
    }
  }

  /**
   * Clean up old sent reminders (older than 7 days)
   */
  static async cleanupOldReminders() {
    try {
      const sevenDaysAgo = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);

      const remindersRef = collection(db, 'taskReminders');
      const oldRemindersQuery = query(
        remindersRef,
        where('sent', '==', true),
        where('sentAt', '<', sevenDaysAgo)
      );

      const snapshot = await getDocs(oldRemindersQuery);

      const deletePromises = snapshot.docs.map(doc =>
        deleteDoc(doc.ref)
      );

      await Promise.all(deletePromises);

      if (snapshot.size > 0) {
        console.log(`Cleaned up ${snapshot.size} old task reminders`);
      }

    } catch (error) {
      console.error('Error cleaning up old reminders:', error);
    }
  }

  /**
   * Initialize the reminder processor with periodic execution
   * This should be called when the app starts
   */
  static startProcessor() {
    // Only start in browser environment
    if (typeof window === 'undefined') {
      return () => { }; // Return empty cleanup function for server-side
    }

    // Process reminders immediately (but don't await to avoid blocking)
    this.processScheduledReminders().catch(console.error);

    // Then process every 15 minutes
    const intervalId = setInterval(() => {
      this.processScheduledReminders().catch(console.error);
    }, 15 * 60 * 1000); // 15 minutes

    // Clean up old reminders once per day
    const cleanupIntervalId = setInterval(() => {
      this.cleanupOldReminders().catch(console.error);
    }, 24 * 60 * 60 * 1000); // 24 hours

    console.log('Task reminder processor started');

    // Return cleanup function
    return () => {
      clearInterval(intervalId);
      clearInterval(cleanupIntervalId);
      console.log('Task reminder processor stopped');
    };
  }
}

// Export for manual initialization only
