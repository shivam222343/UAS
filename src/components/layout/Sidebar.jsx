import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart2,
  Settings,
  User,
  LogOut,
  X,
  CalendarClock,
  QrCode,
  Scan,
  BadgeInfo ,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';
const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { currentUser, logout, userRole } = useAuth();
  
  const isAdmin = userRole === 'admin' || userRole === 'subadmin';

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Members', href: '/members', icon: Users },
    { name: 'Meetings', href: '/meetings', icon: Calendar },
    { name: 'Calendar', href: '/calendar', icon: CalendarClock },
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
    // Admin dashboard - only for admins
    { name: 'Admin Dashboard', href: '/admin', icon: Shield, adminOnly: true },
    // QR code features
    { name: 'Generate QR', href: '/generate-qr', icon: QrCode, adminOnly: true },
    { name: 'Mark Attendance', href: '/scan-qr', icon: Scan },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Mavericks Corner', href: '/about-teammavericks', icon: BadgeInfo  },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  );

 

  return (
    <>
      {/* Mobile backdrop */}
    <AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.5 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-secondary-900 bg-opacity-50 lg:hidden z-40"
      onClick={onClose}
    />
  )}
</AnimatePresence>


      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-200 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-200 dark:border-secondary-700">
            <Link to="/" className="flex items-center">
              <img
                className="h-8 w-auto rounded-full"
                src="/logo.png"
                alt="Attendance System"
              />
              <span className="ml-2 text-lg font-semibold text-blue-700 flex gap-1 dark:text-primary-400">
             <span className='font-semibold text-md text-blue-700 dark:text-primary-400'>Team</span>
             <span className='font-semibold text-md text-blue-700 dark:text-primary-400'>Mavericks</span>
              </span>
             
            </Link>
            <button
              onClick={onClose}
              className="p-1 bg-white dark:bg-gray-900 hover:bg-white text-blue-600 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 lg:hidden"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 px-2 py-4 overflow-y-auto">
            <nav className="space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                
              return (
                <Link
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-500 dark:text-primary-400'
                        : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 hover:text-secondary-900 dark:hover:text-secondary-200'
                  }`}
                >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                </Link>
              );
            })}
          </nav>
          </div>

          {/* Footer with User Info and Logout */}
          {currentUser && (
          <div className="p-4 border-t border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center mb-4">
                <img
                  className="h-10 w-10 rounded-full mr-3"
                  src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || 'User'}&size=40&background=0A66C2&color=fff`}
                  alt="Profile"
                />
                <div>
                  <p className="text-sm font-medium text-secondary-900 dark:text-white">
                    {currentUser.displayName || 'User'}
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full bg-red-50 items-center px-4  dark:bg-gray-700 py-2 text-sm font-medium hover:text-red-800 text-red-600 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-200 dark:hover:text-red-800 transition-colors"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign Out
            </button>
          </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar; 