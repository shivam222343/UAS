import { useState, useEffect, useCallback, useRef } from 'react';
import { messagingService } from '../services/messagingService';

export const useTyping = (conversationId, userId, userName) => {
    const [typingUsers, setTypingUsers] = useState([]);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        if (!conversationId) return;

        // Subscribe to typing indicators
        const unsubscribe = messagingService.subscribeToTyping(
            conversationId,
            (users) => {
                // Filter out current user and stale typing indicators (>5 seconds old)
                const now = Date.now();
                const activeTypingUsers = users.filter(user => {
                    if (user.userId === userId) return false;
                    const timestamp = user.timestamp?.toMillis() || 0;
                    return (now - timestamp) < 5000; // 5 seconds
                });
                setTypingUsers(activeTypingUsers);
            }
        );

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
            // Clear typing status on unmount
            messagingService.setTyping(conversationId, userId, userName, false);
        };
    }, [conversationId, userId, userName]);

    // Set typing status
    const setTyping = useCallback((isTyping) => {
        if (!conversationId) return;

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        if (isTyping) {
            // Set typing status
            messagingService.setTyping(conversationId, userId, userName, true);

            // Auto-clear after 3 seconds
            typingTimeoutRef.current = setTimeout(() => {
                messagingService.setTyping(conversationId, userId, userName, false);
            }, 3000);
        } else {
            // Clear typing status
            messagingService.setTyping(conversationId, userId, userName, false);
        }
    }, [conversationId, userId, userName]);

    // Get typing status text
    const getTypingText = useCallback(() => {
        if (typingUsers.length === 0) return '';
        if (typingUsers.length === 1) return `${typingUsers[0].userName} is typing...`;
        if (typingUsers.length === 2) return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing...`;
        if (typingUsers.length === 3) return `${typingUsers[0].userName}, ${typingUsers[1].userName}, and ${typingUsers[2].userName} are typing...`;
        return `${typingUsers.length} people are typing...`;
    }, [typingUsers]);

    return {
        typingUsers,
        setTyping,
        getTypingText,
        isTyping: typingUsers.length > 0
    };
};

export default useTyping;
