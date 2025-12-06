import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

class MessagingService {
    // Create a new conversation (1:1 or group)
    async createConversation(participants, clubId, type = 'direct', name = null, createdBy) {
        try {
            const conversationData = {
                type,
                participants,
                clubId,
                createdBy,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastMessage: null,
                settings: {}
            };

            // Initialize settings for each participant
            participants.forEach(userId => {
                conversationData.settings[userId] = {
                    muted: false,
                    archived: false,
                    lastRead: null
                };
            });

            // Add group-specific fields
            if (type === 'group') {
                conversationData.name = name || 'New Group';
                conversationData.avatar = null;
                conversationData.admins = [createdBy];
            }

            const conversationRef = await addDoc(collection(db, 'conversations'), conversationData);
            return conversationRef.id;
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
    }

    // Get or create a direct conversation between two users
    async getOrCreateDirectConversation(userId1, userId2, clubId) {
        try {
            // Check if conversation already exists
            const conversationsRef = collection(db, 'conversations');
            const q = query(
                conversationsRef,
                where('type', '==', 'direct'),
                where('participants', 'array-contains', userId1)
            );

            const snapshot = await getDocs(q);
            const existingConversation = snapshot.docs.find(doc => {
                const data = doc.data();
                return data.participants.includes(userId2) && data.clubId === clubId;
            });

            if (existingConversation) {
                return existingConversation.id;
            }

            // Create new conversation
            return await this.createConversation([userId1, userId2], clubId, 'direct', null, userId1);
        } catch (error) {
            console.error('Error getting/creating conversation:', error);
            throw error;
        }
    }

    // Send a message
    async sendMessage(conversationId, senderId, senderName, senderAvatar, content, type = 'text', attachments = null, replyTo = null) {
        try {
            const messageData = {
                conversationId,
                senderId,
                senderName,
                senderAvatar,
                type,
                content,
                attachments,
                replyTo,
                reactions: {},
                edited: false,
                deleted: false,
                deletedForEveryone: false,
                deletedFor: {},
                deliveredTo: [senderId],
                readBy: [senderId],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Add message to subcollection
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            const messageRef = await addDoc(messagesRef, messageData);

            // Update conversation's last message
            const conversationRef = doc(db, 'conversations', conversationId);
            await updateDoc(conversationRef, {
                lastMessage: {
                    text: type === 'text' ? content : `[${type}]`,
                    senderId,
                    timestamp: serverTimestamp()
                },
                updatedAt: serverTimestamp()
            });

            return messageRef.id;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    // Edit a message
    async editMessage(conversationId, messageId, newContent, userId) {
        try {
            const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
            const messageDoc = await getDoc(messageRef);

            if (!messageDoc.exists()) {
                throw new Error('Message not found');
            }

            const messageData = messageDoc.data();

            // Verify ownership
            if (messageData.senderId !== userId) {
                throw new Error('You can only edit your own messages');
            }

            // Check edit time window (15 minutes)
            const messageTime = messageData.createdAt?.toMillis() || 0;
            const now = Date.now();
            const editWindow = 15 * 60 * 1000; // 15 minutes

            if (now - messageTime > editWindow) {
                throw new Error('Edit time window has expired');
            }

            // Add to edit history
            const editHistory = messageData.editHistory || [];
            editHistory.push({
                content: messageData.content,
                editedAt: serverTimestamp()
            });

            await updateDoc(messageRef, {
                content: newContent,
                edited: true,
                editedAt: serverTimestamp(),
                editHistory,
                updatedAt: serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Error editing message:', error);
            throw error;
        }
    }

    // Delete a message
    async deleteMessage(conversationId, messageId, userId, forEveryone = false) {
        try {
            const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
            const messageDoc = await getDoc(messageRef);

            if (!messageDoc.exists()) {
                throw new Error('Message not found');
            }

            const messageData = messageDoc.data();

            if (forEveryone) {
                // Verify ownership
                if (messageData.senderId !== userId) {
                    throw new Error('You can only delete your own messages for everyone');
                }

                // Check delete time window (1 hour)
                const messageTime = messageData.createdAt?.toMillis() || 0;
                const now = Date.now();
                const deleteWindow = 60 * 60 * 1000; // 1 hour

                if (now - messageTime > deleteWindow) {
                    throw new Error('Delete time window has expired');
                }

                // Mark as deleted for everyone
                await updateDoc(messageRef, {
                    deleted: true,
                    deletedForEveryone: true,
                    deletedBy: userId,
                    deletedAt: serverTimestamp(),
                    content: 'This message was deleted',
                    attachments: null,
                    updatedAt: serverTimestamp()
                });
            } else {
                // Delete for me only
                await updateDoc(messageRef, {
                    [`deletedFor.${userId}`]: true,
                    updatedAt: serverTimestamp()
                });
            }

            return true;
        } catch (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    }

    // React to a message
    async reactToMessage(conversationId, messageId, userId, emoji) {
        try {
            const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
            const messageDoc = await getDoc(messageRef);

            if (!messageDoc.exists()) {
                throw new Error('Message not found');
            }

            const messageData = messageDoc.data();
            const reactions = messageData.reactions || {};

            // Toggle reaction
            if (reactions[emoji] && reactions[emoji].includes(userId)) {
                // Remove reaction
                reactions[emoji] = reactions[emoji].filter(id => id !== userId);
                if (reactions[emoji].length === 0) {
                    delete reactions[emoji];
                }
            } else {
                // Add reaction
                if (!reactions[emoji]) {
                    reactions[emoji] = [];
                }
                reactions[emoji].push(userId);
            }

            await updateDoc(messageRef, {
                reactions,
                updatedAt: serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Error reacting to message:', error);
            throw error;
        }
    }

    // Mark messages as read
    async markAsRead(conversationId, messageIds, userId) {
        try {
            const batch = [];

            for (const messageId of messageIds) {
                const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
                batch.push(
                    updateDoc(messageRef, {
                        readBy: arrayUnion(userId),
                        deliveredTo: arrayUnion(userId)
                    })
                );
            }

            await Promise.all(batch);

            // Update user's last read timestamp
            const conversationRef = doc(db, 'conversations', conversationId);
            await updateDoc(conversationRef, {
                [`settings.${userId}.lastRead`]: serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Error marking as read:', error);
            throw error;
        }
    }

    // Set typing status
    async setTyping(conversationId, userId, userName, isTyping) {
        try {
            const typingRef = doc(db, 'conversations', conversationId, 'typing', userId);

            if (isTyping) {
                const typingData = {
                    userName,
                    timestamp: serverTimestamp()
                };

                await updateDoc(typingRef, typingData).catch(async () => {
                    // Document doesn't exist, create it with setDoc
                    const { setDoc } = await import('firebase/firestore');
                    await setDoc(typingRef, typingData);
                });
            } else {
                await deleteDoc(typingRef).catch(() => {
                    // Document doesn't exist, ignore
                });
            }

            return true;
        } catch (error) {
            console.error('Error setting typing status:', error);
            throw error;
        }
    }

    // Subscribe to conversations
    subscribeToConversations(userId, clubId, callback) {
        const conversationsRef = collection(db, 'conversations');
        const q = query(
            conversationsRef,
            where('participants', 'array-contains', userId),
            where('clubId', '==', clubId)
        );

        return onSnapshot(q, (snapshot) => {
            const conversations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort by updatedAt client-side
            conversations.sort((a, b) => {
                const aTime = a.updatedAt?.toMillis() || 0;
                const bTime = b.updatedAt?.toMillis() || 0;
                return bTime - aTime;
            });

            callback(conversations);
        });
    }

    // Subscribe to messages
    subscribeToMessages(conversationId, limitCount = 50, callback) {
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(
            messagesRef,
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .reverse(); // Reverse to show oldest first
            callback(messages);
        });
    }

    // Subscribe to typing indicators
    subscribeToTyping(conversationId, callback) {
        const typingRef = collection(db, 'conversations', conversationId, 'typing');

        return onSnapshot(typingRef, (snapshot) => {
            const typingUsers = snapshot.docs.map(doc => ({
                userId: doc.id,
                ...doc.data()
            }));
            callback(typingUsers);
        });
    }

    // Add member to group
    async addGroupMember(conversationId, userId, addedBy) {
        try {
            const conversationRef = doc(db, 'conversations', conversationId);
            const conversationDoc = await getDoc(conversationRef);

            if (!conversationDoc.exists()) {
                throw new Error('Conversation not found');
            }

            const conversationData = conversationDoc.data();

            if (conversationData.type !== 'group') {
                throw new Error('Not a group conversation');
            }

            if (!conversationData.admins.includes(addedBy)) {
                throw new Error('Only admins can add members');
            }

            await updateDoc(conversationRef, {
                participants: arrayUnion(userId),
                [`settings.${userId}`]: {
                    muted: false,
                    archived: false,
                    lastRead: null
                },
                updatedAt: serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Error adding group member:', error);
            throw error;
        }
    }

    // Remove member from group
    async removeGroupMember(conversationId, userId, removedBy) {
        try {
            const conversationRef = doc(db, 'conversations', conversationId);
            const conversationDoc = await getDoc(conversationRef);

            if (!conversationDoc.exists()) {
                throw new Error('Conversation not found');
            }

            const conversationData = conversationDoc.data();

            if (conversationData.type !== 'group') {
                throw new Error('Not a group conversation');
            }

            if (!conversationData.admins.includes(removedBy) && removedBy !== userId) {
                throw new Error('Only admins can remove members');
            }

            await updateDoc(conversationRef, {
                participants: arrayRemove(userId),
                updatedAt: serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Error removing group member:', error);
            throw error;
        }
    }

    // Update group info
    async updateGroupInfo(conversationId, userId, updates) {
        try {
            const conversationRef = doc(db, 'conversations', conversationId);
            const conversationDoc = await getDoc(conversationRef);

            if (!conversationDoc.exists()) {
                throw new Error('Conversation not found');
            }

            const conversationData = conversationDoc.data();

            if (conversationData.type !== 'group') {
                throw new Error('Not a group conversation');
            }

            if (!conversationData.admins.includes(userId)) {
                throw new Error('Only admins can update group info');
            }

            await updateDoc(conversationRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Error updating group info:', error);
            throw error;
        }
    }
}

export const messagingService = new MessagingService();
export default messagingService;
