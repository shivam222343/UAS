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

// Import global styles
import './styles/Forms.css';
import Mavericks from './pages/Mavericks';
import Info from './components/layout/Info';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/signin" />;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return !currentUser ? children : <Navigate to="/dashboard" />;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { currentUser, userRole } = useAuth();
  // Allow access only if user is logged in and has admin or subadmin role
  return currentUser && (userRole === 'admin' || userRole === 'subadmin') 
    ? children 
    : <Navigate to="/dashboard" />;
};

const App = () => {
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
              
              {/* Admin Route */}
              <Route 
                path="admin" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
