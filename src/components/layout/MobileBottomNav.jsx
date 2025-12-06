import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import {
  Users,
  Calendar,
  ClipboardCheck,
  BarChart2,
  User
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import './MobileBottomNav.css';

const MobileBottomNav = ({ toggleSidebar, toggleNotifications }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLabels, setShowLabels] = useState(false);
  const [ripple, setRipple] = useState({ show: false, x: 0, y: 0, item: null });

  // Get unread message count
  const unreadMessageCount = useUnreadCount(currentUser?.uid, 'default');

  // Refs for each nav item
  const navItemsRef = useRef({});

  // Determine active tab based on current location
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/members')) setActiveTab('members');
    else if (path.includes('/meetings')) setActiveTab('meetings');
    else if (path.includes('/scan-qr')) setActiveTab('attendance');
    else if (path.includes('/analytics')) setActiveTab('analytics');
    else if (path.includes('/profile')) setActiveTab('profile');
    else setActiveTab('');
  }, [location]);

  // Fetch unread notification count
  useEffect(() => {
    if (!currentUser) return;

    const notificationsRef = collection(db, 'users', currentUser.uid, 'notifications');
    const q = query(notificationsRef, where('read', '==', false));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Navigation items with equal styling
  const navItems = [
    {
      name: 'Members',
      path: '/members',
      icon: Users,
      id: 'members',
      color: '#10b981' // green
    },
    {
      name: 'Meetings',
      path: '/meetings',
      icon: Calendar,
      id: 'meetings',
      color: '#f59e0b' // amber
    },
    {
      name: 'Attendance',
      path: '/scan-qr',
      icon: ClipboardCheck,
      id: 'attendance',
      color: '#3b82f6' // blue
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: BarChart2,
      id: 'analytics',
      color: '#ec4899' // pink
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: User,
      id: 'profile',
      color: '#8b5cf6' // violet
    }
  ];

  // Animation variants for the navbar
  const navVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    }
  };

  // Item hover animation variants - same for all items
  const itemVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1, y: -5 },
    tap: { scale: 0.95 }
  };

  // Icon color animation variants
  const iconColorVariants = {
    inactive: {
      scale: 1,
      transition: { duration: 0.3 }
    },
    active: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 0.5,
        times: [0, 0.5, 1],
        ease: "easeInOut"
      }
    }
  };

  // Handle ripple effect on click
  const handleItemClick = (itemId, path, e) => {
    // Get position for ripple effect
    const rect = navItemsRef.current[itemId].getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setRipple({ show: true, x, y, item: itemId });
    setActiveTab(itemId);

    // Navigate to the path
    navigate(path);

    // Hide ripple after animation completes
    setTimeout(() => {
      setRipple({ show: false, x: 0, y: 0, item: null });
    }, 600);
  };

  // Show bottom nav only on mobile
  if (window.innerWidth > 768) return null;

  return (
    <motion.div
      variants={navVariants}
      initial="hidden"
      animate="visible"
      className="fixed bottom-0 left-0 right-0 z-40"
    >
      <div className={`px-2 py-3 bg-slate-100 bg-opacity-95 dark:bg-opacity-95 text-black shadow-black shadow-lg rounded-t-xl dark:bg-slate-800`}>
        <div className="flex justify-around blur-none items-center">
          {/* Main navigation items */}
          {navItems.map((item, index) => (
            <div
              key={item.id}
              onClick={(e) => handleItemClick(item.id, item.path, e)}
              className="relative bottom-nav-item"
              ref={el => navItemsRef.current[item.id] = el}
            >
              <motion.div
                variants={itemVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                onHoverStart={() => setShowLabels(true)}
                onHoverEnd={() => setShowLabels(false)}
                className="relative flex flex-col items-center justify-center p-3 rounded-xl"
              >
                {/* Ripple effect */}
                {ripple.show && ripple.item === item.id && (
                  <span
                    className="bottom-nav-ripple"
                    style={{
                      left: ripple.x,
                      top: ripple.y,
                      backgroundColor: `${item.color}40` // 25% opacity
                    }}
                  />
                )}

                <motion.div
                  variants={iconColorVariants}
                  animate={activeTab === item.id ? "active" : "inactive"}
                  className="icon-wrapper relative"
                >
                  <item.icon
                    size={24}
                    className="bottom-nav-icon"
                    style={{
                      color: activeTab === item.id ? item.color :
                        darkMode ? '#9ca3af' : '#6b7280',
                      transition: 'color 0.3s ease'
                    }}
                  />
                  {/* New message badge for Members */}
                  {item.id === 'members' && unreadMessageCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full animate-pulse">
                      New
                    </span>
                  )}
                </motion.div>

                <AnimatePresence>
                  {(activeTab === item.id || showLabels) && (
                    <motion.span
                      initial={{ opacity: 0, y: 10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: 10, height: 0 }}
                      className="text-xs mt-1 font-medium"
                      style={{
                        color: activeTab === item.id ? item.color :
                          darkMode ? '#9ca3af' : '#6b7280'
                      }}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default MobileBottomNav;