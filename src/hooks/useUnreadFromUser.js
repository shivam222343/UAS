import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Hook to get unread message status for a specific user
 * @param {string} currentUserId - Current user's ID
 * @param {string} otherUserId - Other user's ID to check
 * @param {string} clubId - Club ID
 * @returns {boolean} Whether there are unread messages from this user
 */
export const useUnreadFromUser = (currentUserId, otherUserId, clubId) => {
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        if (!currentUserId || !otherUserId || !clubId) {
            setHasUnread(false);
            return;
        }

        // Find conversation between these two users
        const conversationsRef = collection(db, 'conversations');
        const q = query(
            conversationsRef,
            where('participants', 'array-contains', currentUserId),
            where('clubId', '==', clubId),
            where('type', '==', 'direct')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            for (const doc of snapshot.docs) {
                const conversation = doc.data();
                const participants = conversation.participants || [];

                // Check if this conversation includes the other user
                if (participants.includes(otherUserId)) {
                    const conversationId = doc.id;
                    const userSettings = conversation.settings?.[currentUserId];
                    const lastRead = userSettings?.lastRead?.toMillis() || 0;

                    console.log(`[Unread Check] User: ${otherUserId}, LastRead: ${new Date(lastRead).toLocaleString()}`);

                    // Check for unread messages
                    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
                    const messagesQuery = query(messagesRef);

                    const messagesSnapshot = await new Promise((resolve) => {
                        const unsub = onSnapshot(messagesQuery, (snap) => {
                            unsub();
                            resolve(snap);
                        });
                    });

                    const hasUnreadMessages = messagesSnapshot.docs.some(msgDoc => {
                        const message = msgDoc.data();
                        const messageTime = message.createdAt?.toMillis() || 0;
                        const isUnread = messageTime > lastRead && message.senderId === otherUserId;

                        if (isUnread) {
                            console.log(`[Unread Found] From: ${otherUserId}, Time: ${new Date(messageTime).toLocaleString()}`);
                        }

                        return isUnread;
                    });

                    console.log(`[Unread Result] User: ${otherUserId}, HasUnread: ${hasUnreadMessages}`);
                    setHasUnread(hasUnreadMessages);
                    return;
                }
            }
            setHasUnread(false);
        });

        return () => unsubscribe();
    }, [currentUserId, otherUserId, clubId]);

    return hasUnread;
};
