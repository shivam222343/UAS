import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Wifi, WifiOff, Check } from 'lucide-react';

const BulkActionsBar = ({ 
  totalMembers, 
  onlineMembers, 
  onMarkAllOffline, 
  isAdmin, 
  loading 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMarkAllOffline = async () => {
    if (onlineMembers === 0 || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onMarkAllOffline();
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Members: {totalMembers}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Online: {onlineMembers}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Offline: {totalMembers - onlineMembers}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total Members: {totalMembers}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Online: {onlineMembers}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Offline: {totalMembers - onlineMembers}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleMarkAllOffline}
          disabled={onlineMembers === 0 || isProcessing || loading}
          className={`
            flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
            ${onlineMembers === 0 || isProcessing || loading
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md'
            }
          `}
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              Mark All Offline ({onlineMembers})
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default BulkActionsBar;
