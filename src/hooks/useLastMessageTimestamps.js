import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Hook to get last message timestamp for each user
 * @param {string} currentUserId - Current user's ID
 * @param {string} clubId - Club ID
 * @returns {Map<string, number>} Map of userId to last message timestamp
 */
export const useLastMessageTimestamps = (currentUserId, clubId) => {
    const [lastMessageTimes, setLastMessageTimes] = useState(new Map());

    useEffect(() => {
        if (!currentUserId || !clubId) {
            setLastMessageTimes(new Map());
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
            const timestampMap = new Map();

            for (const doc of snapshot.docs) {
                const conversation = doc.data();
                const conversationId = doc.id;
                const participants = conversation.participants || [];

                // Get the other user in the conversation
                const otherUserId = participants.find(id => id !== currentUserId);
                if (!otherUserId) continue;

                // Get last message in this conversation (from ANYONE - sent or received)
                const messagesRef = collection(db, 'conversations', conversationId, 'messages');
                const messagesQuery = query(
                    messagesRef,
                    orderBy('createdAt', 'desc'),
                    limit(1)
                );

                try {
                    const messagesSnapshot = await new Promise((resolve) => {
                        const unsub = onSnapshot(messagesQuery, (snap) => {
                            unsub();
                            resolve(snap);
                        });
                    });

                    if (!messagesSnapshot.empty) {
                        const lastMessage = messagesSnapshot.docs[0].data();
                        const timestamp = lastMessage.createdAt?.toMillis() || 0;
                        timestampMap.set(otherUserId, timestamp);
                    }
                } catch (error) {
                    console.error('Error fetching messages:', error);
                }
            }

            setLastMessageTimes(timestampMap);
        });

        return () => unsubscribe();
    }, [currentUserId, clubId]);

    return lastMessageTimes;
};
