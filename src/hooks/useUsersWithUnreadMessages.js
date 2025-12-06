import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Hook to get list of users with unread messages
 * @param {string} currentUserId - Current user's ID
 * @param {string} clubId - Club ID
 * @returns {Set<string>} Set of user IDs who have sent unread messages
 */
export const useUsersWithUnreadMessages = (currentUserId, clubId) => {
    const [usersWithUnread, setUsersWithUnread] = useState(new Set());

    useEffect(() => {
        if (!currentUserId || !clubId) {
            setUsersWithUnread(new Set());
            return;
        }

        // Query conversations where user is a participant
        const conversationsRef = collection(db, 'conversations');
        const q = query(
            conversationsRef,
            where('participants', 'array-contains', currentUserId),
            where('clubId', '==', clubId),
            where('type', '==', 'direct')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const unreadUsers = new Set();

            for (const doc of snapshot.docs) {
                const conversation = doc.data();
                const conversationId = doc.id;
                const participants = conversation.participants || [];

                // Get the other user in the conversation
                const otherUserId = participants.find(id => id !== currentUserId);
                if (!otherUserId) continue;

                // Get user's last read timestamp
                const userSettings = conversation.settings?.[currentUserId];
                const lastRead = userSettings?.lastRead?.toMillis() || 0;

                // Check for unread messages from this user
                const messagesRef = collection(db, 'conversations', conversationId, 'messages');
                const messagesQuery = query(messagesRef);

                const messagesSnapshot = await new Promise((resolve) => {
                    const unsub = onSnapshot(messagesQuery, (snap) => {
                        unsub();
                        resolve(snap);
                    });
                });

                const hasUnreadFromUser = messagesSnapshot.docs.some(msgDoc => {
                    const message = msgDoc.data();
                    const messageTime = message.createdAt?.toMillis() || 0;
                    return messageTime > lastRead && message.senderId === otherUserId;
                });

                if (hasUnreadFromUser) {
                    unreadUsers.add(otherUserId);
                }
            }

            setUsersWithUnread(unreadUsers);
        });

        return () => unsubscribe();
    }, [currentUserId, clubId]);

    return usersWithUnread;
};
