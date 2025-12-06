import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import NotificationPanel from '../NotificationPanel';
import OnlineMembersIndicator from '../common/OnlineMembersIndicator';
import { useAuth } from '../../contexts/AuthContext';
import { useClubMemberUpdates } from '../../hooks/useClubMemberUpdates';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false); // Track if theme is loaded
  const location = useLocation();
  const { currentUser } = useAuth();

  // Auto-reload when new member joins club
  useClubMemberUpdates('default'); // Replace 'default' with actual clubId if available

  // Load theme from localStorage or system preference
  useEffect(() => {
    const loadTheme = () => {
      // Check for saved theme preference
      const savedTheme = localStorage.getItem('theme');

      if (savedTheme) {
        // Use the user's saved preference
        setIsDarkMode(savedTheme === 'dark');
      } else {
        // No saved preference - use system preference
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(systemPrefersDark);
      }
      setThemeLoaded(true);
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      loadTheme();
    }
  }, []);

  // Apply theme changes and save to localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !themeLoaded) return;

    // Apply the theme class to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Save the preference to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode, themeLoaded]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Handle sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  // Optional: Listen for system theme changes (if you want to respect system changes)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      // Only update if user hasn't explicitly set a preference
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  if (!themeLoaded) {
    // Optional: Show loading state or blank screen while theme loads
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary-100 dark:bg-secondary-900">
      <Navbar
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        toggleNotifications={toggleNotifications}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="lg:pl-64 pt-16 pb-24 md:pb-0">
        <div className="max-w-7xl mx-[2px] px-[2px] sm:px-6 md:px-2 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <MobileBottomNav
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        toggleNotifications={toggleNotifications}
      />

      <NotificationPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        currentUser={currentUser}
      />

      {/* Online Members Indicator */}
      <OnlineMembersIndicator clubName="Team Mavericks 2025-26" />
    </div>
  );
};

export default Layout;