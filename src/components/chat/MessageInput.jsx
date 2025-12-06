import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import storageService from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';

const MessageInput = ({
    onSendMessage,
    onTyping,
    editingMessage,
    onCancelEdit,
    disabled = false
}) => {
    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const textareaRef = useRef(null);
    const imageInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const { currentUser } = useAuth();

    // Set editing message
    useEffect(() => {
        if (editingMessage) {
            setMessage(editingMessage.content);
            textareaRef.current?.focus();
        }
    }, [editingMessage]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            const maxHeight = 6 * 24; // 6 rows * 24px line height
            textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
        }
    }, [message]);

    // Handle typing indicator
    useEffect(() => {
        if (message.trim() && !editingMessage) {
            onTyping(true);
            const timeout = setTimeout(() => {
                onTyping(false);
            }, 3000);
            return () => clearTimeout(timeout);
        } else {
            onTyping(false);
        }
    }, [message, editingMessage, onTyping]);

    // Handle file upload
    const handleFileUpload = async (file, type) => {
        if (!currentUser?.uid) {
            alert('You must be logged in to upload files');
            return;
        }

        setUploading(true);
        try {
            let uploadedFile;
            if (type === 'image') {
                uploadedFile = await storageService.uploadImage(
                    file,
                    'temp',
                    (progress) => setUploadProgress(progress),
                    currentUser.uid
                );
            } else {
                uploadedFile = await storageService.uploadFile(
                    file,
                    'temp',
                    (progress) => setUploadProgress(progress),
                    currentUser.uid
                );
            }
            setAttachments([...attachments, uploadedFile]);
            setUploadProgress(0);
        } catch (error) {
            console.error('Upload error:', error);
            alert(error.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    // Handle image selection
    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file, 'image');
        }
    };

    // Handle file selection
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file, 'file');
        }
    };

    // Remove attachment
    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    // Handle send
    const handleSend = () => {
        if (!message.trim() && attachments.length === 0) return;
        if (uploading) return;

        const messageType = attachments.length > 0
            ? (attachments[0].type === 'image' ? 'image' : 'file')
            : 'text';

        onSendMessage(message, messageType, attachments.length > 0 ? attachments : null);
        setMessage('');
        setAttachments([]);
        textareaRef.current?.focus();
    };

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (editingMessage) {
                onSendMessage(message, 'text', null);
                setMessage('');
            } else {
                handleSend();
            }
        }
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setMessage('');
        onCancelEdit();
    };

    return (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            {/* Editing indicator */}
            {editingMessage && (
                <div className="mb-2 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-8 bg-blue-500 rounded"></div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Editing message</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-md">
                                {editingMessage.content}
                            </p>
                        </div>
                    </div>
                    <div
                        onClick={handleCancelEdit}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </div>
                </div>
            )}

            {/* Attachments preview */}
            {attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                    {attachments.map((attachment, index) => (
                        <div
                            key={index}
                            className="relative bg-gray-100 dark:bg-gray-700 rounded-lg p-2 flex items-center gap-2"
                        >
                            {attachment.type === 'image' ? (
                                <img
                                    src={attachment.url}
                                    alt="Preview"
                                    className="w-16 h-16 object-cover rounded"
                                />
                            ) : (
                                <div className="w-16 h-16 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded">
                                    <Paperclip className="w-6 h-6" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{attachment.name}</p>
                                <p className="text-xs text-gray-500">
                                    {storageService.formatFileSize(attachment.size)}
                                </p>
                            </div>
                            <div
                                onClick={() => removeAttachment(index)}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload progress */}
            {uploading && (
                <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Uploading... {Math.round(uploadProgress)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Input area */}
            <div className="flex items-end gap-2">
                {/* Attachment buttons */}
                <div className="flex gap-1 items-center">
                    {/* Eta Quick Action */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            setMessage((prev) => prev.startsWith('@Eta ') ? prev : '@Eta ' + prev);
                            textareaRef.current?.focus();
                        }}
                        className="p-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 rounded-md transition-colors mr-1"
                        title="Ask Eta AI"
                        disabled={disabled || uploading}
                    >
                        @Eta
                    </motion.button>

                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                    />
                    <div
                        onClick={() => !disabled && !uploading && imageInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Attach image"
                        style={{ opacity: disabled || uploading ? 0.5 : 1, pointerEvents: disabled || uploading ? 'none' : 'auto' }}
                    >
                        <ImageIcon className="w-5 h-5" />
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <div
                        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                        title="Attach file"
                        style={{ opacity: disabled || uploading ? 0.5 : 1, pointerEvents: disabled || uploading ? 'none' : 'auto' }}
                    >
                        <Paperclip className="w-5 h-5" />
                    </div>
                </div>

                {/* Formatting buttons */}
                <div className="flex gap-1 items-center mr-1 pb-1">
                    <button
                        onClick={() => {
                            const start = textareaRef.current.selectionStart;
                            const end = textareaRef.current.selectionEnd;
                            const selected = message.substring(start, end);
                            const newMessage = message.substring(0, start) + `**${selected || 'bold'}**` + message.substring(end);
                            setMessage(newMessage);
                            textareaRef.current.focus();
                        }}
                        className="p-1 px-2 text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Bold"
                        disabled={disabled || uploading}
                    >
                        B
                    </button>
                    <button
                        onClick={() => {
                            const start = textareaRef.current.selectionStart;
                            const end = textareaRef.current.selectionEnd;
                            const selected = message.substring(start, end);
                            const newMessage = message.substring(0, start) + `*${selected || 'italic'}*` + message.substring(end);
                            setMessage(newMessage);
                            textareaRef.current.focus();
                        }}
                        className="p-1 px-2 text-xs italic text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Italic"
                        disabled={disabled || uploading}
                    >
                        I
                    </button>
                </div>

                {/* Text input */}
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                    disabled={disabled || uploading}
                    className="flex-1 resize-none overflow-y-auto bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
                    rows={1}
                    style={{ minHeight: '40px', maxHeight: '144px' }}
                />

                {/* Send button */}
                <motion.div
                    whileHover={{ scale: disabled || uploading || (!message.trim() && attachments.length === 0) ? 1 : 1.05 }}
                    whileTap={{ scale: disabled || uploading || (!message.trim() && attachments.length === 0) ? 1 : 0.95 }}
                    onClick={() => !(disabled || uploading || (!message.trim() && attachments.length === 0)) && handleSend()}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                    style={{ opacity: disabled || uploading || (!message.trim() && attachments.length === 0) ? 0.5 : 1, cursor: disabled || uploading || (!message.trim() && attachments.length === 0) ? 'not-allowed' : 'pointer' }}
                >
                    <Send className="w-5 h-5" />
                </motion.div>
            </div>

        </div>
    );
};

export default MessageInput;
