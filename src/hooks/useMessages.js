import { useState, useEffect, useCallback } from 'react';
import { messagingService } from '../services/messagingService';

export const useMessages = (conversationId, userId) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!conversationId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // Subscribe to messages
        const unsubscribe = messagingService.subscribeToMessages(
            conversationId,
            50,
            (updatedMessages) => {
                // Filter out messages deleted for this user
                const filteredMessages = updatedMessages.filter(msg => {
                    return !msg.deletedFor || !msg.deletedFor[userId];
                });
                setMessages(filteredMessages);
                setLoading(false);
            }
        );

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [conversationId, userId]);

    // Send a message
    const sendMessage = useCallback(async (content, type = 'text', attachments = null, replyTo = null, senderName, senderAvatar) => {
        if (!conversationId || !content.trim()) return;

        setSending(true);
        try {
            const messageId = await messagingService.sendMessage(
                conversationId,
                userId,
                senderName,
                senderAvatar,
                content,
                type,
                attachments,
                replyTo
            );
            setSending(false);
            return messageId;
        } catch (err) {
            setError(err.message);
            setSending(false);
            throw err;
        }
    }, [conversationId, userId]);

    // Edit a message
    const editMessage = useCallback(async (messageId, newContent) => {
        try {
            await messagingService.editMessage(conversationId, messageId, newContent, userId);
            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [conversationId, userId]);

    // Delete a message
    const deleteMessage = useCallback(async (messageId, forEveryone = false) => {
        try {
            await messagingService.deleteMessage(conversationId, messageId, userId, forEveryone);
            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [conversationId, userId]);

    // React to a message
    const reactToMessage = useCallback(async (messageId, emoji) => {
        try {
            await messagingService.reactToMessage(conversationId, messageId, userId, emoji);
            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [conversationId, userId]);

    // Mark messages as read
    const markAsRead = useCallback(async (messageIds) => {
        try {
            await messagingService.markAsRead(conversationId, messageIds, userId);
            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [conversationId, userId]);

    return {
        messages,
        loading,
        error,
        sending,
        sendMessage,
        editMessage,
        deleteMessage,
        reactToMessage,
        markAsRead
    };
};

export default useMessages;
