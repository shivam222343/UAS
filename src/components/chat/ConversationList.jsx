import { motion } from 'framer-motion';
import { Search, MessageSquare } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { useState } from 'react';

const ConversationList = ({
    conversations,
    currentUserId,
    selectedConversationId,
    onSelectConversation,
    onCreateGroup
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter conversations by search term
    const filteredConversations = conversations.filter(conv => {
        const searchLower = searchTerm.toLowerCase();

        if (conv.type === 'group') {
            return conv.name?.toLowerCase().includes(searchLower);
        } else {
            // For direct messages, search by participant name (would need user data)
            return true;
        }
    });

    // Format last message time
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

        if (isToday(date)) {
            return format(date, 'HH:mm');
        } else if (isYesterday(date)) {
            return 'Yesterday';
        } else {
            return format(date, 'MMM dd');
        }
    };

    // Get conversation name
    const getConversationName = (conversation) => {
        if (conversation.type === 'group') {
            return conversation.name || 'Unnamed Group';
        } else {
            // For direct messages, show other participant's name
            // This would need user data lookup
            return 'Direct Message';
        }
    };

    // Get unread count
    const getUnreadCount = (conversation) => {
        // Simplified - would need actual unread message count
        return 0;
    };

    return (
        <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Messages
                    </h2>
                    <div
                        onClick={onCreateGroup}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm cursor-pointer"
                    >
                        New Group
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                            No conversations yet
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                            Start a conversation from the members page
                        </p>
                    </div>
                ) : (
                    <div>
                        {filteredConversations.map((conversation) => {
                            const isSelected = conversation.id === selectedConversationId;
                            const unreadCount = getUnreadCount(conversation);

                            return (
                                <motion.div
                                    key={conversation.id}
                                    whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                                    onClick={() => onSelectConversation(conversation.id)}
                                    className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors ${isSelected
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                            {getConversationName(conversation).charAt(0).toUpperCase()}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                    {getConversationName(conversation)}
                                                </h3>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                                    {formatTime(conversation.lastMessage?.timestamp)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                    {conversation.lastMessage?.text || 'No messages yet'}
                                                </p>
                                                {unreadCount > 0 && (
                                                    <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full flex-shrink-0">
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConversationList;
