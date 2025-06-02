import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, AlertCircle } from 'lucide-react';

const AdminAuth = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { authenticateAdmin } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!password) {
      setError('Please enter the admin password');
      setLoading(false);
      return;
    }

    const isAuthenticated = authenticateAdmin(password);
    
    if (isAuthenticated) {
      if (onAuthenticated) {
        onAuthenticated();
      }
    } else {
      setError('Invalid password. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <Lock className="h-8 w-8 text-blue-500 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Authentication</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-center">
            Please enter the admin password to access this area
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Admin Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter admin password"
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full form-btn form-btn-primary"
          >
            {loading ? 'Authenticating...' : 'Access Admin Area'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminAuth; 