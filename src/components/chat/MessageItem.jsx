import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Reply,
    Smile,
    Edit3,
    Trash2,
    Copy,
    Forward,
    MoreVertical,
    Check,
    CheckCheck
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MessageItem = ({
    message,
    currentUserId,
    onReply,
    onReact,
    onEdit,
    onDelete,
    onCopy,
    onForward
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const [longPressTimer, setLongPressTimer] = useState(null);
    const menuRef = useRef(null);
    const messageRef = useRef(null);

    const isOwnMessage = message.senderId === currentUserId;
    const isDeleted = message.deleted || message.deletedForEveryone;
    const isEdited = message.edited;

    // Close menu when clicking outside or when another menu opens
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) &&
                messageRef.current && !messageRef.current.contains(event.target)) {
                setShowMenu(false);
                setShowReactions(false);
            }
        };

        const handleGlobalMenuOpen = () => {
            // Close this menu when any other menu opens
            setShowMenu(false);
            setShowReactions(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        document.addEventListener('contextmenu', handleGlobalMenuOpen);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('contextmenu', handleGlobalMenuOpen);
        };
    }, []);

    // Long press handling for mobile
    const handleTouchStart = () => {
        const timer = setTimeout(() => {
            setShowMenu(true);
        }, 600); // 600ms long press
        setLongPressTimer(timer);
    };

    const handleTouchEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    // Right click handling for desktop
    const handleContextMenu = (e) => {
        e.preventDefault();
        setShowMenu(true);
    };

    // Format timestamp
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

        if (isToday(date)) {
            return format(date, 'HH:mm');
        } else if (isYesterday(date)) {
            return `Yesterday ${format(date, 'HH:mm')}`;
        } else {
            return format(date, 'MMM dd, HH:mm');
        }
    };

    // Check if edit/delete is allowed
    const canEdit = () => {
        if (!isOwnMessage || isDeleted) return false;
        const messageTime = message.createdAt?.toMillis() || 0;
        const now = Date.now();
        const editWindow = 15 * 60 * 1000; // 15 minutes
        return (now - messageTime) < editWindow;
    };

    const canDeleteForEveryone = () => {
        if (!isOwnMessage || isDeleted) return false;
        const messageTime = message.createdAt?.toMillis() || 0;
        const now = Date.now();
        const deleteWindow = 60 * 60 * 1000; // 1 hour
        return (now - messageTime) < deleteWindow;
    };

    // Render reactions
    const renderReactions = () => {
        if (!message.reactions || Object.keys(message.reactions).length === 0) return null;

        return (
            <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(message.reactions).map(([emoji, users]) => (
                    <div
                        key={emoji}
                        onClick={() => onReact(message.id, emoji)}
                        className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-colors cursor-pointer ${users.includes(currentUserId)
                            ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
                            : 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
                            }`}
                    >
                        <span>{emoji}</span>
                        <span className="text-gray-600 dark:text-gray-400">{users.length}</span>
                    </div>
                ))}
            </div>
        );
    };

    // Render read receipts
    const renderReadReceipts = () => {
        if (!isOwnMessage) return null;

        const isRead = message.readBy && message.readBy.length > 1;
        const isDelivered = message.deliveredTo && message.deliveredTo.length > 1;

        return (
            <div className="flex items-center gap-1 text-xs">
                {isRead ? (
                    <CheckCheck className="w-3 h-3 text-blue-500" />
                ) : isDelivered ? (
                    <CheckCheck className="w-3 h-3 text-gray-400" />
                ) : (
                    <Check className="w-3 h-3 text-gray-400" />
                )}
            </div>
        );
    };

    // Check if message is from Eta
    const isEtaMessage = message.senderName === 'Eta AI Assistant' || message.senderName === 'Eta';

    // Override isOwnMessage if it's an Eta message (to force left alignment)
    const effectiveIsOwnMessage = isOwnMessage && !isEtaMessage;

    // Render message bubble
    return (
        <div
            ref={messageRef}
            className={`flex ${effectiveIsOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onContextMenu={handleContextMenu}
        >
            <div className={`max-w-[70%] ${effectiveIsOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Sender name (for group chats) */}
                {!effectiveIsOwnMessage && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-2">
                        {message.senderName}
                    </span>
                )}

                {/* Reply preview */}
                {message.replyTo && (
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-t-lg px-3 py-2 border-l-4 border-blue-500 mb-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {message.replyTo.text}
                        </p>
                    </div>
                )}

                {/* Message bubble */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`relative px-4 py-2 rounded-lg shadow-sm ${effectiveIsOwnMessage
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : isEtaMessage
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-bl-none'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
                        } ${showMenu ? 'ring-2 ring-blue-400' : ''}`}
                >
                    {/* Message content */}
                    {isDeleted ? (
                        <p className="italic text-gray-400 dark:text-gray-500">
                            This message was deleted
                        </p>
                    ) : (
                        <>
                            {/* Image attachment */}
                            {message.type === 'image' && message.attachments && message.attachments.length > 0 && (
                                <div className="mb-2">
                                    <img
                                        src={message.attachments[0].url}
                                        alt="Attachment"
                                        className="rounded-lg max-w-full h-auto cursor-pointer"
                                        onClick={() => window.open(message.attachments[0].url, '_blank')}
                                    />
                                </div>
                            )}

                            {/* File attachment */}
                            {message.type === 'file' && message.attachments && message.attachments.length > 0 && (
                                <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded flex items-center gap-2">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium truncate">{message.attachments[0].name}</p>
                                        <p className="text-xs text-gray-500">
                                            {(message.attachments[0].size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                    <a
                                        href={message.attachments[0].url}
                                        download
                                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer"
                                    >
                                        Download
                                    </a>
                                </div>
                            )}

                            {/* Text content with Markdown support */}
                            <div className={`markdown-content ${isEtaMessage ? 'eta-message' : ''}`}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        // Custom styling for Eta's headings
                                        h1: ({ node, ...props }) => <h1 className={`text-xl font-bold mb-2 ${isEtaMessage ? 'text-emerald-800 dark:text-emerald-200' : 'text-gray-900 dark:text-white'}`} {...props} />,
                                        h2: ({ node, ...props }) => <h2 className={`text-lg font-bold mb-2 ${isEtaMessage ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-900 dark:text-white'}`} {...props} />,
                                        h3: ({ node, ...props }) => <h3 className={`text-base font-bold mb-1 ${isEtaMessage ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`} {...props} />,
                                        p: ({ node, ...props }) => <p className="mb-1 whitespace-pre-wrap break-words" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                                        li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                                        em: ({ node, ...props }) => <em className="italic" {...props} />,
                                        code: ({ node, inline, ...props }) => (
                                            inline
                                                ? <code className="bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 text-sm font-mono" {...props} />
                                                : <div className="bg-black/10 dark:bg-white/10 rounded p-2 my-2 overflow-x-auto"><code className="text-sm font-mono" {...props} /></div>
                                        ),
                                        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic my-2 text-gray-600 dark:text-gray-400" {...props} />,
                                        a: ({ node, ...props }) => <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                    }}
                                >
                                    {message.content}
                                </ReactMarkdown>
                            </div>
                        </>
                    )}

                    {/* Timestamp and status */}
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs opacity-70">
                            {formatTimestamp(message.createdAt)}
                        </span>
                        {isEdited && !isDeleted && (
                            <span className="text-xs opacity-70">edited</span>
                        )}
                        {renderReadReceipts()}
                    </div>

                    {/* Context menu button */}
                    <div
                        onClick={() => setShowMenu(!showMenu)}
                        className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10 cursor-pointer"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </div>
                </motion.div>

                {/* Reactions */}
                {renderReactions()}

                {/* Context menu */}
                <AnimatePresence>
                    {showMenu && (
                        <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`absolute z-50 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-[200px] ${isOwnMessage ? 'right-0' : 'left-0'
                                }`}
                        >
                            <div
                                onClick={() => {
                                    onReply(message);
                                    setShowMenu(false);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
                            >
                                <Reply className="w-4 h-4" />
                                Reply
                            </div>

                            <div
                                onClick={() => setShowReactions(!showReactions)}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
                            >
                                <Smile className="w-4 h-4" />
                                React
                            </div>

                            {canEdit() && (
                                <div
                                    onClick={() => {
                                        onEdit(message);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Edit
                                </div>
                            )}

                            <div
                                onClick={() => {
                                    onCopy(message.content);
                                    setShowMenu(false);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
                            >
                                <Copy className="w-4 h-4" />
                                Copy
                            </div>

                            <div
                                onClick={() => {
                                    onForward(message);
                                    setShowMenu(false);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
                            >
                                <Forward className="w-4 h-4" />
                                Forward
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                            <div
                                onClick={() => {
                                    onDelete(message.id, false);
                                    setShowMenu(false);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2 cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete for me
                            </div>

                            {canDeleteForEveryone() && (
                                <div
                                    onClick={() => {
                                        onDelete(message.id, true);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2 cursor-pointer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete for everyone
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Emoji picker for reactions */}
                <AnimatePresence>
                    {showReactions && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute z-50 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3"
                        >
                            <div className="flex gap-2">
                                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                                    <div
                                        key={emoji}
                                        onClick={() => {
                                            onReact(message.id, emoji);
                                            setShowReactions(false);
                                            setShowMenu(false);
                                        }}
                                        className="text-2xl hover:scale-125 transition-transform cursor-pointer"
                                    >
                                        {emoji}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MessageItem;
