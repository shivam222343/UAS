// NotificationPanel.jsx

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, limit, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Bell, Calendar as CalendarIcon, AlertTriangle, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './NotificationPanel.css';

const NotificationPanel = ({ isOpen, onClose, currentUser }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    if (!currentUser) return;

    const notificationsRef = collection(db, 'users', currentUser.uid, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(10));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid, 'notifications', id), { read: true });
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'notifications', id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.type === 'new_meeting') navigate(`/meetings`);
    else if (notification.type === 'attendance_warning') navigate('/analytics');
    onClose();
  };

  const formatNotificationDate = (date) => {
    if (!date) return '';
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hrs ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={notificationsRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed z-50 shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-secondary-800 rounded-lg ${
            isMobile ? 'w-[100%] bottom-0 rounded-b-none left-0 -translate-x-1/2' : 'top-16 right-8 w-96'
          }`}
        >
          <div className="flex flex-col border-t-2 border-blue-400  h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-secondary-800 sticky top-0 z-10 rounded-t-lg">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1 text-gray-100 hover:text-balck transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-[400px] border-t-2 border-blue-400 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-sm text-gray-100 dark:text-gray-400">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex mb-2 justify-between items-start dark:bg-blue-900/40 p-3 rounded-lg transition hover:shadow-md cursor-pointer ${
                      n.read
                        ? 'bg-gray-50 dark:bg-gray-800'
                        : 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      {n.type === 'new_meeting' ? (
                   <div className='w-10 h-auto'><CalendarIcon className="text-blue-500 w-5 h-5 mt-1" /></div>
                      ) : n.type === 'attendance_warning' ? (
                     <div className='w-10 h-auto'>   <AlertTriangle className="text-red-500 w-5 h-5 mt-1" /></div>
                      ) : (
                       <div className='w-10 h-auto'> <Bell className="text-gray-100 w-5 h-5 mt-1" /></div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{n.title}</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300">{n.message}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-3">
                      <span className="text-xs dark:text-gray-400 text-gray-700">{formatNotificationDate(n.createdAt)}</span>
                      <button
                        onClick={(e) => deleteNotification(n.id, e)}
                        className="text-blue-600 hover:text-blue-300 bg-transparent p-1 rounded-full transition-colors" 
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;
