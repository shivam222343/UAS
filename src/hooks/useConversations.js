import { useState, useEffect } from 'react';
import { messagingService } from '../services/messagingService';

export const useConversations = (userId, clubId) => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId || !clubId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // Subscribe to conversations
        const unsubscribe = messagingService.subscribeToConversations(
            userId,
            clubId,
            (updatedConversations) => {
                setConversations(updatedConversations);
                setLoading(false);
            }
        );

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [userId, clubId]);

    // Get unread count for a conversation
    const getUnreadCount = (conversation) => {
        if (!conversation || !conversation.settings || !conversation.settings[userId]) {
            return 0;
        }

        const lastRead = conversation.settings[userId].lastRead;
        if (!lastRead) {
            return conversation.messageCount || 0;
        }

        // This is a simplified version - in production, you'd query messages
        return 0;
    };

    // Create a new conversation
    const createConversation = async (participants, type = 'direct', name = null) => {
        try {
            const conversationId = await messagingService.createConversation(
                participants,
                clubId,
                type,
                name,
                userId
            );
            return conversationId;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Get or create direct conversation
    const getOrCreateDirectConversation = async (otherUserId) => {
        try {
            const conversationId = await messagingService.getOrCreateDirectConversation(
                userId,
                otherUserId,
                clubId
            );
            return conversationId;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    return {
        conversations,
        loading,
        error,
        getUnreadCount,
        createConversation,
        getOrCreateDirectConversation
    };
};

export default useConversations;
