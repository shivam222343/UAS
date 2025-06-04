import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';


import {
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  LayoutDashboard,
  Users,
  Calendar,
  BarChart2,
  Settings,
  User,
  LogOut,
  Shield,
  Scan
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Meetings', href: '/meetings', icon: Calendar },
  { name: 'Analytics', href: '/analytics', icon: BarChart2 },
];

const Navbar = ({ toggleSidebar, isDarkMode, toggleDarkMode, toggleNotifications }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const { currentUser, logout, userRole } = useAuth();
  const { darkMode } = useTheme();

  const isAdmin = userRole === 'admin' || userRole === 'subadmin';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  console.log(currentUser);
  

  // Fetch only unread notification count
  useEffect(() => {
    if (!currentUser) return;

    const notificationsRef = collection(db, 'users', currentUser.uid, 'notifications');
    const q = query(notificationsRef, where('read', '==', false));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 shadow-sm"
      >
        <div className="max-w-7xl mx-auto pr-4 sm:px-1 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center lg:hidden ">
              <div className="flex items-center">
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-lg text-secondary-800 bg-transparent  hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200   transition-colors"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>

              <Link to="/" className="flex items-center">
               
                <span className="ml-2 text-lg font-semibold text-blue-700 flex gap-1 dark:text-primary-400">
             <span className='font-semibold text-md text-blue-700 dark:text-primary-400'>Team</span>
             <span className='font-semibold text-md text-blue-700 dark:text-primary-400'>Mavericks</span>
              </span>

              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:ml-96 items-center space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.href
                    ? 'text-primary-500 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700/50'
                    }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Admin Dashboard Link - only shown to admins */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${location.pathname === '/admin-dashboard'
                    ? 'text-primary-500 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700/50'
                    }`}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Admin
                </Link>
              )}

              {/* QR Scanner Link */}
              <Link
                to="/scan-qr"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${location.pathname === '/qr-scanner'
                  ? 'text-primary-500 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700/50'
                  }`}
              >
                <Scan className="h-4 w-4 mr-1" />
                Scanner
              </Link>
            </div>

            <div className="flex items-center gap-1">
              {/* QR Scanner Icon for Mobile */}

              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-white hover:dark:bg-secondary-800 bg-white dark:bg-secondary-800"
              >
                {darkMode ? <Sun className="h-5 w-5 dark:text-blue-500 text-blue-700" /> : <Moon className="h-5 w-5 text-blue-500 bg-white dark:bg-secondary-800" />}
              </button>

              <div className="relative">
                <button
                  onClick={toggleNotifications}
                  className="p-2 rounded-lg hover:bg-white hover:dark:bg-secondary-800 bg-white dark:bg-secondary-800"
                >
                  <Bell className="h-5 w-5 text-blue-700 dark:text-blue-500" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">{unreadCount}</span>
                  )}
                </button>
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex ml-2 items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-900 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                >
                  <img
                    className="h-8 w-8 rounded-full"
                    src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.displayName || 'User'}&background=0A66C2&color=fff`}
                    alt="Profile"
                  />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-secondary-800 rounded-xl shadow-card border border-secondary-200 dark:border-secondary-700"
                    >
                      <div className="py-1 flex gap-1 flex-col justify-start items-start pb-2">
                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{currentUser?.displayName || 'User'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser?.email}</p>
                        </div>
                        <Link
                          to="/profile"
                          className="flex items-start px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <User className="h-4 w-4 mr-2 mt-[2px]" />
                          Your Profile
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-start px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Settings className="h-4 w-4 mr-2 mt-[2px]" />
                          Settings
                        </Link>
                        <div className='w-full flex justify-start items-start px-4 py-2'>
                          <button
                            onClick={handleLogout}
                            className="flex items-start bg-red-100  w-full text-left px-2 max-w-[80%] py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors ${location.pathname === item.href
                      ? 'text-primary-500 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700/50'
                      }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                ))}

                {/* Admin Dashboard Link for mobile - only shown to admins */}
                {isAdmin && (
                  <Link
                    to="/admin-dashboard"
                    className={`flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors ${location.pathname === '/admin-dashboard'
                      ? 'text-primary-500  dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'text-secondary-600  hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700/50'
                      }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Shield className="h-5 w-5 mr-3" />
                    Admin Dashboard
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
};

export default Navbar; 