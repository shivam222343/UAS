// src/App.jsx
import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { GalleryProvider } from './contexts/GalleryContext';
import { PresenceProvider } from './contexts/PresenceContext';
import Layout from './components/layout/Layout';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Meetings from './pages/Meetings';
import Members from './pages/Members';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AIChatbot from './pages/AIChatbot';
import CalendarView from './pages/CalendarView';
import Analytics from './pages/Analytics';
import TeamGallary from './pages/TeamGallary';
import Nexus from './pages/Nexus';
import { Toaster, toast } from 'react-hot-toast';
import { TaskReminderProcessor } from './services/taskReminderProcessor';
import QRGenerator from './pages/QRGenerator';
import QRScanner from './pages/QRScanner';
import AdminDashboard from './pages/AdminDashboard';
import Mavericks from './pages/Mavericks';
import Info from './components/layout/Info';
import Panel from './pages/Panel';
import { useAuth } from './contexts/AuthContext';

import './styles/Forms.css';

// ✅ Route protection
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/signin" />;
};

const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return !currentUser ? children : <Navigate to="/dashboard" />;
};

const AdminRoute = ({ children }) => {
  const { currentUser, userRole } = useAuth();
  return currentUser && (userRole === 'admin' || userRole === 'subadmin')
    ? children
    : <Navigate to="/dashboard" />;
};

// ✅ ToastQueue component inside App
const ToastQueue = () => {
  const [queue, setQueue] = useState([]);
  const isShowing = useRef(false);

  useEffect(() => {
    if (queue.length > 0 && !isShowing.current) {
      isShowing.current = true;
      const { message, duration = 3000 } = queue[0];

      toast(message, {
        duration,
        onClose: () => {
          setQueue((prev) => prev.slice(1)); // remove first toast
          isShowing.current = false;
        }
      });
    }
  }, [queue]);

  // Expose global function to add toast to queue
  window.showToast = (msg, duration) => {
    setQueue((prev) => [...prev, { message: msg, duration }]);
  };

  return null;
};

const App = () => {
  useEffect(() => {
    // Initialize task reminder processor
    const cleanupProcessor = TaskReminderProcessor.startProcessor();
    
    return () => {
      cleanupProcessor && cleanupProcessor();
    };
  }, []);

  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <PresenceProvider>
            <GalleryProvider> 
            {/* ✅ Toast system */}
            <Toaster position="top-right" />
            <ToastQueue />

            <Routes>
              {/* Public Routes */}
              <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
              <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />

              {/* Protected Routes */}
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="members" element={<Members />} />
                <Route path="meetings" element={<Meetings />} />
                <Route path="calendar" element={<CalendarView />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="about" element={<Mavericks />} />
                <Route path="panel" element={<Panel />} />
                <Route path="info" element={<Info />} />
                <Route path="teamgallary" element={<TeamGallary />} /> {/* TeamGallary is now inside GalleryProvider */}
                <Route path="nexus" element={<Nexus />} />
                <Route path="ai-chat" element={<AIChatbot />} />
                <Route path="generate-qr" element={<AdminRoute><QRGenerator /></AdminRoute>} />
                <Route path="scan-qr" element={<QRScanner />} />
                <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </GalleryProvider>
          </PresenceProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;