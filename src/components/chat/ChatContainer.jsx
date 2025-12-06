import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConversations } from '../../hooks/useConversations';
import { useMessages } from '../../hooks/useMessages';
import { useTyping } from '../../hooks/useTyping';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import ForwardMessageModal from './ForwardMessageModal';
import { toast } from 'react-hot-toast';
import { fetchUserData, getOtherParticipant } from '../../services/userService';
import { sendMessageNotification, requestNotificationPermission, clearNotificationCooldown } from '../../services/notificationService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { groqService } from '../../services/groqService';
import { messagingService } from '../../services/messagingService';

const ChatContainer = ({
    initialConversationId = null,
    initialUserId = null,
    clubId,
    onClose = null,
    isPanel = false
}) => {
    const { currentUser } = useAuth();
    const [selectedConversationId, setSelectedConversationId] = useState(initialConversationId);
    const [editingMessage, setEditingMessage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [otherUserData, setOtherUserData] = useState(null);
    const [forwardingMessage, setForwardingMessage] = useState(null);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [clubMembers, setClubMembers] = useState([]);

    const {
        conversations,
        loading: conversationsLoading,
        getOrCreateDirectConversation
    } = useConversations(currentUser?.uid, clubId);

    const {
        messages,
        loading: messagesLoading,
        sendMessage,
        editMessage,
        deleteMessage,
        reactToMessage,
        markAsRead
    } = useMessages(selectedConversationId, currentUser?.uid);

    const {
        typingUsers,
        setTyping,
        getTypingText
    } = useTyping(selectedConversationId, currentUser?.uid, currentUser?.displayName || 'User');

    // Create direct conversation if initialUserId is provided
    useEffect(() => {
        if (initialUserId && currentUser?.uid && clubId) {
            getOrCreateDirectConversation(initialUserId).then(conversationId => {
                setSelectedConversationId(conversationId);
            });
        }
    }, [initialUserId, currentUser?.uid, clubId]);

    // Request notification permission on mount
    useEffect(() => {
        requestNotificationPermission();
    }, []);

    // Mark messages as read when conversation is selected
    useEffect(() => {
        if (selectedConversationId && messages.length > 0) {
            const unreadMessageIds = messages
                .filter(msg => !msg.readBy?.includes(currentUser?.uid))
                .map(msg => msg.id);

            if (unreadMessageIds.length > 0) {
                markAsRead(unreadMessageIds);
            }

            // Clear notification cooldown when opening conversation
            clearNotificationCooldown(selectedConversationId);
        }
    }, [selectedConversationId, messages, currentUser?.uid]);

    // Handle new message notifications
    useEffect(() => {
        if (!messages || messages.length === 0) return;

        const latestMessage = messages[messages.length - 1];

        // Only notify for messages from other users
        if (latestMessage && latestMessage.senderId !== currentUser?.uid) {
            // Fetch sender data and send notification
            fetchUserData(latestMessage.senderId).then(senderData => {
                sendMessageNotification(
                    latestMessage,
                    selectedConversationId,
                    currentUser?.uid,
                    senderData,
                    true // Conversation is active since we're viewing it
                );
            });
        }
    }, [messages, currentUser?.uid, selectedConversationId]);

    // Fetch club members for forwarding
    useEffect(() => {
        if (!clubId) return;

        const fetchMembers = async () => {
            try {
                const membersRef = collection(db, 'clubs', clubId, 'members');
                const snapshot = await getDocs(membersRef);
                const membersList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setClubMembers(membersList);
            } catch (error) {
                console.error('Error fetching members:', error);
            }
        };

        fetchMembers();
    }, [clubId]);

    // Get selected conversation
    const selectedConversation = conversations.find(c => c.id === selectedConversationId);

    // Fetch other user data for direct conversations
    useEffect(() => {
        if (selectedConversation && selectedConversation.type === 'direct') {
            const otherUserId = getOtherParticipant(selectedConversation.participants, currentUser?.uid);
            if (otherUserId) {
                fetchUserData(otherUserId).then(userData => {
                    setOtherUserData(userData);
                });
            }
        } else {
            setOtherUserData(null);
        }
    }, [selectedConversation, currentUser?.uid]);

    // Handle send message
    const handleSendMessage = async (content, type = 'text', attachments = null) => {
        if (!selectedConversationId) return;

        try {
            if (editingMessage) {
                // Edit existing message
                await editMessage(editingMessage.id, content);
                setEditingMessage(null);
                toast.success('Message edited');
            } else {
                // Check if message starts with @Eta
                const isEtaMessage = content.trim().startsWith('@Eta');

                // Send new message
                await sendMessage(
                    content,
                    type,
                    attachments,
                    replyingTo ? {
                        messageId: replyingTo.id,
                        text: replyingTo.content,
                        senderId: replyingTo.senderId
                    } : null,
                    currentUser?.displayName || 'User',
                    currentUser?.photoURL || null
                );
                setReplyingTo(null);

                // If message starts with @Eta, get AI response
                if (isEtaMessage) {
                    try {
                        // Extract the actual message without @Eta prefix
                        const etaQuery = content.replace(/^@Eta\s*/i, '').trim();

                        // Show typing indicator
                        toast.loading('Eta is thinking...', { id: 'eta-thinking' });

                        // Prepare participants context
                        const participantsContext = {
                            user1: currentUser?.displayName || 'User',
                            user1Data: {
                                name: currentUser?.displayName,
                                bio: currentUser?.bio
                            },
                            user2: otherUserData?.displayName || 'Other User',
                            user2Data: {
                                name: otherUserData?.displayName,
                                bio: otherUserData?.bio
                            }
                        };

                        // Prepare chat history (last 20 messages)
                        const history = messages.slice(-20).map(msg => ({
                            role: (msg.senderName === 'Eta AI Assistant' || msg.senderName === 'Eta') ? 'assistant' : 'user',
                            content: msg.content
                        }));

                        // Get response from Groq service
                        const response = await groqService.sendMessage(etaQuery, history, participantsContext);

                        // Dismiss loading toast
                        toast.dismiss('eta-thinking');

                        // Send Eta's response to the chat
                        if (response && response.success) {
                            await sendMessage(
                                `🤖 Eta: ${response.message}`,
                                'text',
                                null,
                                {
                                    messageId: null,
                                    text: content,
                                    senderId: currentUser?.uid
                                },
                                'Eta AI Assistant',
                                null
                            );
                            toast.success('Eta responded!');
                        } else {
                            throw new Error(response.message || response.error || 'No response from Eta');
                        }
                    } catch (etaError) {
                        console.error('Error getting Eta response:', etaError);
                        toast.dismiss('eta-thinking');
                        toast.error('Eta is currently unavailable. Please try again later.');

                        // Send error message to chat
                        await sendMessage(
                            `🤖 Eta: I'm sorry, I'm currently experiencing technical difficulties. Please try again later.`,
                            'text',
                            null,
                            {
                                messageId: null,
                                text: content,
                                senderId: currentUser?.uid
                            },
                            'Eta AI Assistant',
                            null
                        );
                    }
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error(error.message || 'Failed to send message');
        }
    };

    // Handle reply
    const handleReply = (message) => {
        setReplyingTo(message);
    };

    // Handle edit
    const handleEdit = (message) => {
        setEditingMessage(message);
    };

    // Handle delete
    const handleDelete = async (messageId, forEveryone) => {
        try {
            await deleteMessage(messageId, forEveryone);
            toast.success(forEveryone ? 'Message deleted for everyone' : 'Message deleted');
        } catch (error) {
            console.error('Error deleting message:', error);
            toast.error(error.message || 'Failed to delete message');
        }
    };

    // Handle react
    const handleReact = async (messageId, emoji) => {
        try {
            await reactToMessage(messageId, emoji);
        } catch (error) {
            console.error('Error reacting to message:', error);
            toast.error(error.message || 'Failed to react to message');
        }
    };

    // Handle copy
    const handleCopy = (message) => {
        navigator.clipboard.writeText(message.content);
        toast.success('Message copied');
    };

    // Handle forward
    const handleForward = (message) => {
        setForwardingMessage(message);
        setShowForwardModal(true);
    };

    // Handle forward action
    const handleForwardAction = async (targetUserId, message) => {
        try {
            // Get conversation ID (direct conversation)
            const conversationId = await getOrCreateDirectConversation(targetUserId);

            // Send message
            await messagingService.sendMessage(
                conversationId,
                currentUser?.uid,
                currentUser?.displayName || 'User',
                currentUser?.photoURL || null,
                message.content,
                message.type || 'text',
                message.attachments || null
            );

            toast.success('Message forwarded');
            setShowForwardModal(false);
            setForwardingMessage(null);
        } catch (error) {
            console.error('Error forwarding message:', error);
            toast.error('Failed to forward message');
        }
    };

    return (
        <div className={`flex ${isPanel ? 'h-full' : 'h-[100dvh]'} bg-white dark:bg-gray-900 overflow-hidden`}>
            {/* Conversation List - Hidden on mobile when conversation is selected */}
            {!isPanel && (
                <div className={`${selectedConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-auto flex-col border-r border-gray-200 dark:border-gray-700`}>
                    <ConversationList
                        conversations={conversations}
                        currentUserId={currentUser?.uid}
                        selectedConversationId={selectedConversationId}
                        onSelectConversation={setSelectedConversationId}
                        onCreateGroup={() => toast.info('Group creation coming soon')}
                    />
                </div>
            )}

            {/* Chat Area */}
            {selectedConversationId ? (
                <div className="flex-1 flex flex-col w-full min-w-0">
                    {/* Chat Header */}
                    <div className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-4 shrink-0">
                        <div className="flex items-center gap-3">
                            {/* Back Button (Mobile only) */}
                            <div
                                onClick={() => setSelectedConversationId(null)}
                                className="md:hidden cursor-pointer p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </div>

                            {/* Avatar */}
                            {selectedConversation?.type === 'group' ? (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                    {selectedConversation.name?.charAt(0).toUpperCase()}
                                </div>
                            ) : otherUserData?.photoURL ? (
                                <img
                                    src={otherUserData.photoURL}
                                    alt={otherUserData.displayName}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                    {otherUserData?.displayName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}

                            {/* Name and status */}
                            <div className="min-w-0">
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {selectedConversation?.type === 'group'
                                        ? selectedConversation.name
                                        : otherUserData?.displayName || 'Loading...'}
                                </h3>
                                {typingUsers.length > 0 ? (
                                    <p className="text-sm text-blue-500 truncate">{getTypingText()}</p>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {selectedConversation?.participants?.length || 0} members
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer hidden sm:block">
                                <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer hidden sm:block">
                                <Video className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
                                <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            {onClose && (
                                <div
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Messages */}
                    <ChatWindow
                        messages={messages}
                        currentUserId={currentUser?.uid}
                        loading={messagesLoading}
                        typingUsers={typingUsers}
                        onReply={handleReply}
                        onReact={handleReact}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onCopy={handleCopy}
                        onForward={handleForward}
                    />

                    {/* Reply preview */}
                    <AnimatePresence>
                        {replyingTo && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-1 h-10 bg-blue-500 rounded shrink-0"></div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Replying to {replyingTo.senderName}
                                            </p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-md">
                                                {replyingTo.content}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => setReplyingTo(null)}
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Message Input */}
                    <MessageInput
                        onSendMessage={handleSendMessage}
                        onTyping={setTyping}
                        editingMessage={editingMessage}
                        onCancelEdit={() => setEditingMessage(null)}
                    />
                </div>
            ) : (
                <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <div className="text-center">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Select a conversation
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Choose a conversation from the list to start messaging
                        </p>
                    </div>
                </div>
            )}

            {/* Forward Message Modal */}
            {forwardingMessage && (
                <ForwardMessageModal
                    isOpen={showForwardModal}
                    onClose={() => {
                        setShowForwardModal(false);
                        setForwardingMessage(null);
                    }}
                    message={forwardingMessage}
                    members={clubMembers}
                    onForward={handleForwardAction}
                    currentUserId={currentUser?.uid}
                />
            )}
        </div>
    );
};

export default ChatContainer;
