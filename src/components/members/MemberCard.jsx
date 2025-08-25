import { motion } from 'framer-motion';
import { User, Mail, Clock, Wifi, WifiOff, Shield, Award } from 'lucide-react';
import { usePresence } from '../../contexts/PresenceContext';

const MemberCard = ({ member, onClick, isAdmin, onMarkOffline, clubId }) => {
  const { isMemberOnline } = usePresence();
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    
    const date = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen.seconds * 1000);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleMarkOffline = (e) => {
    e.stopPropagation();
    onMarkOffline(member.id);
  };

  return (
    <motion.li
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer border-l-4 border-transparent hover:border-blue-500"
      onClick={() => onClick(member)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gray-200 dark:ring-gray-600">
              <img
                src={
                  member.photoURL ||
                  `https://ui-avatars.com/api/?name=${member.displayName || 'User'}&background=0A66C2&color=fff`
                }
                alt={member.displayName || 'User'}
                className="h-full w-full object-cover"
              />
            </div>
            {/* Online status indicator */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
              isMemberOnline(clubId, member.id) ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {member.displayName || 'Unknown User'}
              </p>
              {member.role === 'admin' && (
                <Shield className="h-4 w-4 text-yellow-500" title="Admin" />
              )}
            </div>
            
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3 text-gray-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {member.email || 'No email'}
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isMemberOnline(clubId, member.id) ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">Online</span>
                  ) : (
                    <span>Last seen: {formatLastSeen(member.lastSeen)}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Online/Offline status with icon */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isMemberOnline(clubId, member.id)
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {isMemberOnline(clubId, member.id) ? (
              <>
                <Wifi className="h-3 w-3" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Offline
              </>
            )}
          </div>

          {/* Admin actions */}
          {isAdmin && isMemberOnline(clubId, member.id) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleMarkOffline}
              className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              title="Mark as offline"
            >
              Set Offline
            </motion.button>
          )}
        </div>
      </div>
    </motion.li>
  );
};

export default MemberCard;
