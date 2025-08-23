import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Send a notification to a user.
 * @param {Object} params
 * @param {string} params.toUserId - The user ID to send notification to.
 * @param {string} params.title - Notification title.
 * @param {string} params.message - Notification message.
 * @param {string} [params.link] - Optional link for notification click.
 * @param {string} [params.type] - Notification type (e.g., 'task_assigned').
 * @param {Object} [params.extra] - Any extra fields.
 */
export async function sendNotification({
  toUserId,
  title,
  message,
  link = '',
  type = 'task_assigned',
  extra = {}
}) {
  if (!toUserId) throw new Error('toUserId is required for notification');
  const notif = {
    title,
    message,
    link,
    type,
    read: false,
    createdAt: serverTimestamp(),
    ...extra
  };
  await addDoc(collection(db, 'users', toUserId, 'notifications'), notif);
}