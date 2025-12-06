import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User } from 'lucide-react';

const ForwardMessageModal = ({ isOpen, onClose, message, members, onForward, currentUserId }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter out current user and filter by search
    const filteredMembers = members.filter(member => {
        if (member.id === currentUserId) return false;
        const matchesSearch = member.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const handleForward = (memberId) => {
        onForward(memberId, message);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/50"
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Forward Message
                        </h3>
                        <div
                            onClick={onClose}
                            className="p-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                    </div>

                    {/* Search */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search members..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Message Preview */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Forwarding:</p>
                        <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                {message.content}
                            </p>
                        </div>
                    </div>

                    {/* Members List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {filteredMembers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No members found
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredMembers.map((member) => (
                                    <div
                                        key={member.id}
                                        onClick={() => handleForward(member.id)}
                                        className="w-full flex items-center cursor-pointer gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-200 font-semibold">
                                            {member.photoURL ? (
                                                <img
                                                    src={member.photoURL}
                                                    alt={member.displayName}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            ) : (
                                                <User className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {member.displayName || 'Unknown User'}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {member.email}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ForwardMessageModal;
