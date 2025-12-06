import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Hook to get total unread message count for a user
 * @param {string} userId - Current user's ID
 * @param {string} clubId - Club ID to filter conversations
 * @returns {number} Total unread message count
 */
export const useUnreadCount = (userId, clubId) => {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!userId || !clubId) {
            setUnreadCount(0);
            return;
        }

        // Query conversations where user is a participant
        const conversationsRef = collection(db, 'conversations');
        const q = query(
            conversationsRef,
            where('participants', 'array-contains', userId),
            where('clubId', '==', clubId)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            let totalUnread = 0;

            for (const doc of snapshot.docs) {
                const conversation = doc.data();
                const conversationId = doc.id;

                // Get user's last read timestamp from settings
                const userSettings = conversation.settings?.[userId];
                const lastRead = userSettings?.lastRead?.toMillis() || 0;

                // Count messages after last read
                const messagesRef = collection(db, 'conversations', conversationId, 'messages');
                const messagesQuery = query(messagesRef);

                // Subscribe to messages for this conversation
                const messagesSnapshot = await new Promise((resolve) => {
                    const unsub = onSnapshot(messagesQuery, (snap) => {
                        unsub();
                        resolve(snap);
                    });
                });

                const unreadInConversation = messagesSnapshot.docs.filter(msgDoc => {
                    const message = msgDoc.data();
                    const messageTime = message.createdAt?.toMillis() || 0;

                    // Count if message is after last read and not sent by current user
                    return messageTime > lastRead && message.senderId !== userId;
                }).length;

                totalUnread += unreadInConversation;
            }

            setUnreadCount(totalUnread);
        });

        return () => unsubscribe();
    }, [userId, clubId]);

    return unreadCount;
};
