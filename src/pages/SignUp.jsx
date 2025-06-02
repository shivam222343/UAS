import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth';
import { db } from '../services/firebase';
import { useTheme } from '../contexts/ThemeContext';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAccessKeyModal, setShowAccessKeyModal] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState('');
  const [tempUser, setTempUser] = useState(null);
  const { darkMode } = useTheme();
  
  const { createUser, loginWithGoogle, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [verificationSent, setVerificationSent] = useState(false);

  const fetchClubs = async () => {
    try {
      const clubsRef = collection(db, 'clubs');
      const querySnapshot = await getDocs(clubsRef);
      
      const clubsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setClubs(clubsList);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const validateAccessKey = async (clubId, key) => {
    try {
      // Check if the access key exists and is valid
      const accessKeysRef = collection(db, 'clubs', clubId, 'accessKeys');
      const q = query(accessKeysRef, where('key', '==', key), where('isUsed', '==', false));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { valid: false, error: 'Invalid or already used access key.' };
      }
      
      // Check if the key is expired
      const keyDoc = querySnapshot.docs[0];
      const keyData = keyDoc.data();
      
      const expiryDate = keyData.expiresAt?.toDate();
      if (expiryDate && expiryDate < new Date()) {
        return { valid: false, error: 'This access key has expired.' };
      }
      
      return { valid: true, keyId: keyDoc.id };
    } catch (error) {
      console.error('Error validating access key:', error);
      return { valid: false, error: 'Failed to validate access key. Please try again.' };
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    
    // Reset error
    setError('');
    
    // Validate password match
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    setLoading(true);
    
    try {
      // Create the user first
      const userCredential = await createUser(email, password);
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      setVerificationSent(true);
      
      // Show access key modal after creating user
      setTempUser(userCredential.user);
      await fetchClubs();
      setShowAccessKeyModal(true);
      
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);
    
    try {
      // Login with Google
      const result = await loginWithGoogle();
      
      // Show access key modal after Google login
      setTempUser(result.user);
      await fetchClubs();
      setShowAccessKeyModal(true);
      
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleAccessKeySubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedClub) {
      return setError('Please select a club');
    }
    
    if (!accessKey) {
      return setError('Please enter an access key');
    }
    
    setLoading(true);
    
    try {
      // Validate the access key
      const validation = await validateAccessKey(selectedClub, accessKey);
      
      if (!validation.valid) {
        setError(validation.error);
        setLoading(false);
        return;
      }
      
      // Update the user profile with display name
      await updateUserProfile(tempUser, { displayName: name || tempUser.displayName });
      
      // Mark the access key as used
      const keyRef = doc(db, 'clubs', selectedClub, 'accessKeys', validation.keyId);
      await updateDoc(keyRef, {
        isUsed: true,
        usedBy: tempUser.uid,
        usedAt: serverTimestamp()
      });
      
      // Create a member document in the club
      const memberRef = doc(db, 'clubs', selectedClub, 'members', tempUser.uid);
      await setDoc(memberRef, {
        uid: tempUser.uid,
        displayName: name || tempUser.displayName || tempUser.email,
        email: tempUser.email,
        photoURL: tempUser.photoURL,
        role: 'member',
        joinedAt: serverTimestamp(),
        accessKey: accessKey,
        isActive: true
      });
      
      // Create a user profile document
      const userRef = doc(db, 'users', tempUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: tempUser.uid,
          displayName: name || tempUser.displayName || tempUser.email,
          email: tempUser.email,
          photoURL: tempUser.photoURL,
          clubs: [selectedClub],
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
      } else {
        // Update the existing user document
        const userData = userDoc.data();
        const clubs = userData.clubs || [];
        if (!clubs.includes(selectedClub)) {
          clubs.push(selectedClub);
        }
        
        await updateDoc(userRef, {
          clubs: clubs,
          lastLogin: serverTimestamp()
        });
      }
      
      // Redirect to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error in sign up process:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create an account</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Join Team Mavericks!</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {verificationSent && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
            A verification email has been sent to your email address. Please verify your email to complete the registration process.
          </div>
        )}

        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="Enter your full name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Create a password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              placeholder="Confirm your password"
              required
            />
          </div>
          <button
            type="submit"
            className="form-btn form-btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/signin" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Access Key Modal */}
      {showAccessKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md w-full relative z-10"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Join a Club
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              To complete your registration, please select a club and enter an access key.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleAccessKeySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Club
                </label>
                <select
                  value={selectedClub}
                  onChange={(e) => setSelectedClub(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">Select a club</option>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Access Key
                </label>
                <input
                  type="text"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                  className="form-input"
                  placeholder="Enter your access key"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="submit"
                  className="form-btn form-btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Validating...' : 'Continue'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}