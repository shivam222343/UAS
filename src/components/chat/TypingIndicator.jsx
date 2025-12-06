import { motion } from 'framer-motion';

const TypingIndicator = ({ typingUsers }) => {
    if (!typingUsers || typingUsers.length === 0) return null;

    const getTypingText = () => {
        if (typingUsers.length === 1) {
            return `${typingUsers[0].userName} is typing`;
        } else if (typingUsers.length === 2) {
            return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing`;
        } else if (typingUsers.length === 3) {
            return `${typingUsers[0].userName}, ${typingUsers[1].userName}, and ${typingUsers[2].userName} are typing`;
        } else {
            return `${typingUsers.length} people are typing`;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400"
        >
            <div className="flex gap-1">
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                    className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
                />
            </div>
            <span>{getTypingText()}</span>
        </motion.div>
    );
};

export default TypingIndicator;
