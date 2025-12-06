import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, X } from 'lucide-react';
import { usePresence } from '../../contexts/PresenceContext';

const OnlineMembersIndicator = ({ clubName = 'Team Mavericks 2025-26' }) => {
    const [showPopup, setShowPopup] = useState(false);
    const { getAllMembersForClub } = usePresence();

    // Get online members
    const onlineMembers = getAllMembersForClub('default').filter(member => member.isOnline);

    if (onlineMembers.length === 0) return null;

    return (
        <>
            {/* 3-Dot Indicator */}
            <div
                onClick={() => setShowPopup(true)}
                className="fixed bottom-6 right-6 z-40 cursor-pointer group"
                title={`${onlineMembers.length} member${onlineMembers.length > 1 ? 's' : ''} online`}
            >
                <div className="relative">
                    {/* Pulsing background */}
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>

                    {/* Main container */}
                    <div className="relative bg-green-500 hover:bg-green-600 text-white rounded-full p-3 shadow-lg transition-all duration-300 group-hover:scale-110">
                        <div className="flex items-center gap-1">
                            {/* Animated dots */}
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>

                        {/* Count badge */}
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {onlineMembers.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Online Members Popup */}
            <AnimatePresence>
                {showPopup && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPopup(false)}
                            className="fixed inset-0 bg-black/50 z-50"
                        />

                        {/* Popup */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed bottom-24 right-6 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-80 max-h-96 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="bg-green-500 text-white p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    <div>
                                        <h3 className="font-semibold">Online Members</h3>
                                        <p className="text-xs opacity-90">{clubName}</p>
                                    </div>
                                </div>
                                <div
                                    onClick={() => setShowPopup(false)}
                                    className="p-1 hover:bg-green-600 rounded-lg cursor-pointer transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </div>
                            </div>

                            {/* Members List */}
                            <div className="overflow-y-auto max-h-80 scrollbar-thin">
                                {onlineMembers.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No members online</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {onlineMembers.map((member) => (
                                            <motion.div
                                                key={member.uid}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Avatar */}
                                                    <div className="relative">
                                                        <img
                                                            src={member.photoURL || `https://ui-avatars.com/api/?name=${member.displayName}&size=40&background=10B981&color=fff`}
                                                            alt={member.displayName}
                                                            className="w-10 h-10 rounded-full"
                                                        />
                                                        {/* Online indicator */}
                                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 dark:text-white truncate">
                                                            {member.displayName}
                                                        </p>
                                                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                            Online now
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default OnlineMembersIndicator;
