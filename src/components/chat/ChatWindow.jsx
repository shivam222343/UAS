import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import MessageItem from './MessageItem';
import TypingIndicator from './TypingIndicator';
import { Loader2 } from 'lucide-react';

const ChatWindow = ({
    messages,
    currentUserId,
    loading,
    typingUsers,
    onReply,
    onReact,
    onEdit,
    onDelete,
    onCopy,
    onForward,
    onLoadMore
}) => {
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle scroll to show/hide scroll button
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isNearBottom);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToBottom = (smooth = true) => {
        messagesEndRef.current?.scrollIntoView({
            behavior: smooth ? 'smooth' : 'auto'
        });
    };

    // Group messages by date
    const groupMessagesByDate = () => {
        const groups = [];
        let currentGroup = null;

        messages.forEach((message) => {
            const messageDate = message.createdAt?.toDate() || new Date();

            if (!currentGroup || !isSameDay(currentGroup.date, messageDate)) {
                currentGroup = {
                    date: messageDate,
                    messages: []
                };
                groups.push(currentGroup);
            }

            currentGroup.messages.push(message);
        });

        return groups;
    };

    // Format date separator
    const formatDateSeparator = (date) => {
        if (isToday(date)) {
            return 'Today';
        } else if (isYesterday(date)) {
            return 'Yesterday';
        } else {
            return format(date, 'MMMM dd, yyyy');
        }
    };

    const messageGroups = groupMessagesByDate();

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
                </div>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-2">No messages yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        Start the conversation by sending a message
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 relative bg-gray-50 dark:bg-gray-900">
            {/* Messages container */}
            <div
                ref={messagesContainerRef}
                className="absolute inset-0 overflow-y-auto px-6 py-6"
                style={{ scrollBehavior: 'smooth' }}
            >
                {messageGroups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                        {/* Date separator */}
                        <div className="flex justify-center my-4">
                            <div className="bg-white dark:bg-gray-800 px-4 py-1 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {formatDateSeparator(group.date)}
                                </span>
                            </div>
                        </div>

                        {/* Messages */}
                        {group.messages.map((message) => (
                            <MessageItem
                                key={message.id}
                                message={message}
                                currentUserId={currentUserId}
                                onReply={onReply}
                                onReact={onReact}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onCopy={onCopy}
                                onForward={onForward}
                            />
                        ))}
                    </div>
                ))}

                {/* Typing indicator */}
                <AnimatePresence>
                    {typingUsers && typingUsers.length > 0 && (
                        <TypingIndicator typingUsers={typingUsers} />
                    )}
                </AnimatePresence>

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            <AnimatePresence>
                {showScrollButton && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        onClick={() => scrollToBottom()}
                        className="absolute bottom-4 right-4 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatWindow;
