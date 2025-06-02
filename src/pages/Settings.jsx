import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Lock,
  Globe,
  Sun,
  Moon,
  Users,
} from 'lucide-react';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Loader';

const settingsSections = [
  {
    id: 'profile',
    title: 'Profile',
    icon: User,
    fields: [
      {
        id: 'name',
        label: 'Full Name',
        type: 'text',
        value: 'John Doe',
      },
      {
        id: 'email',
        label: 'Email',
        type: 'email',
        value: 'john@example.com',
      },
      {
        id: 'phone',
        label: 'Phone',
        type: 'tel',
        value: '+1 234 567 890',
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    fields: [
      {
        id: 'email_notifications',
        label: 'Email Notifications',
        type: 'toggle',
        value: true,
      },
      {
        id: 'push_notifications',
        label: 'Push Notifications',
        type: 'toggle',
        value: true,
      },
      {
        id: 'sms_notifications',
        label: 'SMS Notifications',
        type: 'toggle',
        value: false,
      },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    icon: Lock,
    fields: [
      {
        id: 'two_factor',
        label: 'Two-Factor Authentication',
        type: 'toggle',
        value: false,
      },
      {
        id: 'password',
        label: 'Change Password',
        type: 'button',
        value: 'Change Password',
      },
    ],
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Globe,
    fields: [
      {
        id: 'theme',
        label: 'Theme',
        type: 'select',
        value: 'system',
        options: [
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'system', label: 'System' },
        ],
      },
      {
        id: 'language',
        label: 'Language',
        type: 'select',
        value: 'en',
        options: [
          { value: 'en', label: 'English' },
          { value: 'es', label: 'Spanish' },
          { value: 'fr', label: 'French' },
        ],
      },
    ],
  },
  {
    id: 'club',
    title: 'Club',
    icon: Users,
    fields: [],
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const Settings = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
  };

  const handleJoinClub = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    if (!accessKey.trim()) {
      setError('Please enter an access key');
      setIsLoading(false);
      return;
    }

    try {
      // First, fetch all clubs to check each club's access keys
      const clubsRef = collection(db, 'clubs');
      const clubsSnapshot = await getDocs(clubsRef);
      
      let foundClub = null;
      let foundKeyId = null;
      let foundKeyData = null;
      
      // Search through each club's access keys collection
      for (const clubDoc of clubsSnapshot.docs) {
        const clubId = clubDoc.id;
        const accessKeysRef = collection(db, 'clubs', clubId, 'accessKeys');
        const q = query(accessKeysRef, where('key', '==', accessKey.trim()), where('isUsed', '==', false));
        const keysSnapshot = await getDocs(q);
        
        if (!keysSnapshot.empty) {
          const keyDoc = keysSnapshot.docs[0];
          const keyData = keyDoc.data();
          
          // Check if the key is expired
          const expiryDate = keyData.expiresAt?.toDate();
          if (expiryDate && expiryDate < new Date()) {
            setError('This access key has expired');
            setIsLoading(false);
            return;
          }
          
          foundClub = clubDoc;
          foundKeyId = keyDoc.id;
          foundKeyData = keyData;
          break;
        }
      }
      
      if (!foundClub) {
        setError('Invalid or already used access key');
        setIsLoading(false);
        return;
      }
      
      // Access key is valid, add the user to the club
      if (currentUser) {
        // 1. Add the user to the club's members collection
        const memberRef = doc(db, 'clubs', foundClub.id, 'members', currentUser.uid);
        await setDoc(memberRef, {
          userId: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          role: 'member',
          joinedAt: serverTimestamp()
        });
        
        // 2. Update the user's profile to include this club
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const clubsJoined = userData.clubsJoined || {};
          
          // Add this club to user's clubsJoined map
          await updateDoc(userRef, {
            clubsJoined: {
              ...clubsJoined,
              [foundClub.id]: {
                joinedAt: serverTimestamp(),
                name: foundClub.data().name
              }
            }
          });
        }
        
        // 3. Mark the access key as used
        const keyRef = doc(db, 'clubs', foundClub.id, 'accessKeys', foundKeyId);
        await updateDoc(keyRef, {
          isUsed: true,
          usedBy: currentUser.uid,
          usedAt: serverTimestamp()
        });

        setSuccessMessage(`Successfully joined ${foundClub.data().name}!`);
        setAccessKey('');
      }
    } catch (error) {
      console.error('Error joining club:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[50vh]"
      >
        <Loader size="large" />
        <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg">Loading settings...</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-secondary-900 dark:text-white">
          Settings
        </h1>
       
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div
          variants={item}
          className="lg:col-span-1 space-y-2"
        >
          {settingsSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-primary-50 text-primary-600 hover:bg-blue-100 duration-200 dark:bg-primary-900/20 dark:text-primary-100'
                  : 'text-white hover:text-blue-500 bg-blue-500 hover:bg-blue-100 duration-200 bg-blue-00 dark:text-white dark:hover:bg-secondary-700/50'
              }`}
            >
              <section.icon className="h-5 w-5" />
              <span className="font-medium">{section.title}</span>
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="lg:col-span-3 space-y-6"
        >
          {settingsSections.slice(0, 4).map((section) => (
            <motion.div
              key={section.id}
              variants={item}
              className={`bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-card hover:shadow-hover transition-shadow ${
                activeSection === section.id ? 'block' : 'hidden'
              }`}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <section.icon className="h-6 w-6 text-primary-500 dark:text-primary-400" />
                  <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
                    {section.title}
                  </h2>
                </div>

                {section.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label
                      htmlFor={field.id}
                      className="block text-sm font-medium text-secondary-700 dark:text-secondary-300"
                    >
                      {field.label}
                    </label>
                    {field.type === 'toggle' ? (
                      <div className="flex items-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={field.value}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            field.value
                              ? 'bg-primary-500'
                              : 'bg-secondary-200 dark:bg-secondary-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              field.value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ) : field.type === 'select' ? (
                      <select
                        id={field.id}
                        value={field.value}
                        className="w-full p-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {field.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'button' ? (
                      <button
                        type="button"
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        {field.value}
                      </button>
                    ) : (
                      <input
                        type={field.type}
                        id={field.id}
                        value={field.value}
                        className="w-full p-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    )}
                  </div>
                ))}

                <div className="pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          ))}

          {/* Club section */}
          <motion.div
            variants={item}
            className={`bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-card hover:shadow-hover transition-shadow ${
              activeSection === 'club' ? 'block' : 'hidden'
            }`}
          >
            <div className="flex items-center space-x-3 mb-6">
              <Users className="h-6 w-6 text-primary-500 dark:text-primary-400" />
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
                Join a Club
              </h2>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleJoinClub} className="space-y-4">
              <div>
                <label
                  htmlFor="accessKey"
                  className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1"
                >
                  Access Key
                </label>
                <input
                  type="text"
                  id="accessKey"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Enter club access key"
                  className="w-full p-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-70"
              >
                {isLoading ? 'Joining...' : 'Join Club'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings; 