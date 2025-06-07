import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Meetings from './pages/Meetings';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import CalendarView from './pages/CalendarView';
import QRGenerator from './pages/QRGenerator';
import QRScanner from './pages/QRScanner';
import AdminDashboard from './pages/AdminDashboard';
import Mavericks from './pages/Mavericks';
import Info from './components/layout/Info';

import './styles/Forms.css';

// Firebase
import { auth, db } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/signin" />;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return !currentUser ? children : <Navigate to="/dashboard" />;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { currentUser, userRole } = useAuth();
  return currentUser && (userRole === 'admin' || userRole === 'subadmin')
    ? children
    : <Navigate to="/dashboard" />;
};

const App = () => {
  useEffect(() => {
    let uid;
    let userRef;
    let intervalId;

    const setOnlineStatus = async (status) => {
      if (userRef) {
        await updateDoc(userRef, {
          isOnline: status,
          lastSeen: serverTimestamp(),
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setOnlineStatus(false);
      } else if (document.visibilityState === 'visible') {
        setOnlineStatus(true);
      }
    };

    const handlePageUnload = () => {
      setOnlineStatus(false);
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        uid = user.uid;
        userRef = doc(db, 'users', uid);

        // Set online on load
        await setOnlineStatus(true);

        // Listen for tab visibility
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handlePageUnload);
        window.addEventListener('pagehide', handlePageUnload);

        // Ping every 20s
        intervalId = setInterval(() => {
          setOnlineStatus(true);
        }, 20000);
      }
    });

    return () => {
      if (userRef) setOnlineStatus(false);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handlePageUnload);
      window.removeEventListener('pagehide', handlePageUnload);
      unsubscribeAuth();
    };
  }, []);

  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/signin"
              element={
                <PublicRoute>
                  <SignIn />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignUp />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="members" element={<Members />} />
              <Route path="meetings" element={<Meetings />} />
              <Route path="calendar" element={<CalendarView />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="about" element={<Mavericks />} />
              <Route path="info" element={<Info />} />

              {/* QR Code Routes */}
              <Route
                path="generate-qr"
                element={
                  <AdminRoute>
                    <QRGenerator />
                  </AdminRoute>
                }
              />
              <Route path="scan-qr" element={<QRScanner />} />

              {/* Admin Dashboard */}
              <Route
                path="admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
            </Route>

            {/* Catch-all Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
