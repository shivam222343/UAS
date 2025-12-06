import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Notification service for chat messages
 * Sends smart notifications - only for new messages, not for bulk/old messages
 */

// Track last notification time per conversation to avoid spam
const lastNotificationTime = new Map();
const NOTIFICATION_COOLDOWN = 3000; // 3 seconds between notifications

/**
 * Request notification permission
 */
export const requestNotificationPermission = async () => {
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
};

/**
 * Send a notification for a new message
 * @param {Object} message - The message object
 * @param {string} conversationId - The conversation ID
 * @param {string} currentUserId - Current user's ID
 * @param {Object} senderData - Sender's user data
 * @param {boolean} isConversationActive - Whether the conversation is currently active/visible
 */
export const sendMessageNotification = async (
    message,
    conversationId,
    currentUserId,
    senderData,
    isConversationActive = false
) => {
    // Don't notify if:
    // 1. User sent the message themselves
    // 2. Conversation is currently active/visible
    // 3. Browser doesn't support notifications
    // 4. Permission not granted
    if (
        message.senderId === currentUserId ||
        isConversationActive ||
        !('Notification' in window) ||
        Notification.permission !== 'granted'
    ) {
        return;
    }

    // Check if message is recent (within last 30 seconds)
    const messageTime = message.createdAt?.toMillis() || Date.now();
    const now = Date.now();
    const messageAge = now - messageTime;

    // Don't notify for old messages (more than 30 seconds old)
    // This prevents notifications when loading message history
    if (messageAge > 30000) {
        return;
    }

    // Check cooldown to avoid notification spam
    const lastNotif = lastNotificationTime.get(conversationId) || 0;
    if (now - lastNotif < NOTIFICATION_COOLDOWN) {
        return;
    }

    // Update last notification time
    lastNotificationTime.set(conversationId, now);

    // Prepare notification content
    const title = senderData?.displayName || 'New Message';
    let body = message.content || '';

    // Handle different message types
    if (message.type === 'image') {
        body = '📷 Sent an image';
    } else if (message.type === 'file') {
        body = '📎 Sent a file';
    } else if (message.content.length > 100) {
        body = message.content.substring(0, 100) + '...';
    }

    // Create notification
    try {
        const notification = new Notification(title, {
            body,
            icon: senderData?.photoURL || '/default-avatar.png',
            badge: '/chat-badge.png',
            tag: conversationId, // Prevents duplicate notifications for same conversation
            requireInteraction: false,
            silent: false
        });

        // Handle notification click - focus window and open conversation
        notification.onclick = () => {
            window.focus();
            notification.close();
            // You can add custom logic here to navigate to the conversation
            // For example: window.location.href = `/messages?conversation=${conversationId}`;
        };

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
    } catch (error) {
        console.error('Error showing notification:', error);
    }
};

/**
 * Clear notification cooldown for a conversation
 * Call this when user opens a conversation
 */
export const clearNotificationCooldown = (conversationId) => {
    lastNotificationTime.delete(conversationId);
};

/**
 * Check if notifications are enabled
 */
export const areNotificationsEnabled = () => {
    return 'Notification' in window && Notification.permission === 'granted';
};
