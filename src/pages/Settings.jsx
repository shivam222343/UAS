import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Users, Check } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Loader';
import { Link } from 'react-router-dom';
import {Info} from 'lucide-react';

const settingsSections = [
  {
    id: 'profile',
    title: 'Profile',
    icon: User,
    fields: [],
  },
  {
    id: 'club',
    title: 'Join Club',
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
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

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
      const clubsRef = collection(db, 'clubs');
      const clubsSnapshot = await getDocs(clubsRef);
      
      let foundClub = null;
      let foundKeyId = null;
      
      for (const clubDoc of clubsSnapshot.docs) {
        const clubId = clubDoc.id;
        const accessKeysRef = collection(db, 'clubs', clubId, 'accessKeys');
        const q = query(accessKeysRef, where('key', '==', accessKey.trim()), where('isUsed', '==', false));
        const keysSnapshot = await getDocs(q);
        
        if (!keysSnapshot.empty) {
          const keyDoc = keysSnapshot.docs[0];
          const keyData = keyDoc.data();
          
          const expiryDate = keyData.expiresAt?.toDate();
          if (expiryDate && expiryDate < new Date()) {
            setError('This access key has expired');
            setIsLoading(false);
            return;
          }
          
          foundClub = clubDoc;
          foundKeyId = keyDoc.id;
          break;
        }
      }
      
      if (!foundClub) {
        setError('Invalid or already used access key');
        setIsLoading(false);
        return;
      }
      
      if (currentUser) {
        const memberRef = doc(db, 'clubs', foundClub.id, 'members', currentUser.uid);
        await setDoc(memberRef, {
          userId: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          role: 'member',
          joinedAt: serverTimestamp()
        });
        
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const clubsJoined = userData.clubsJoined || {};
          
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
        
        const keyRef = doc(db, 'clubs', foundClub.id, 'accessKeys', foundKeyId);
        await updateDoc(keyRef, {
          isUsed: true,
          usedBy: currentUser.uid,
          usedAt: serverTimestamp()
        });

        setSuccessMessage(`🎉 Successfully joined ${foundClub.data().name}!`);
        setAccessKey('');
      }
    } catch (error) {
      console.error('Error joining club:', error);
      setError('❌ An error occurred. Please try again.');
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
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">
        ⚙️ User Settings
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div
          variants={item}
          className="lg:col-span-1 space-y-3"
        >
          {settingsSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeSection === section.id
                  ? 'bg-blue-500 text-white shadow-lg '
                  : 'bg-blue-300 text-blue-600 hover:bg-blue-400 dark:bg-blue-700 dark:text-white dark:hover:bg-blue-800'
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
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <motion.div
              variants={item}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center space-x-3 mb-6">
              
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  👤 Your Profile
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-transparent dark:bg-blue-900/30 flex items-center justify-center">
                    {currentUser?.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt="Profile" 
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                      {currentUser?.displayName || 'Anonymous User'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {currentUser?.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">🎯 Member Since</h4>
                    <p className="text-gray-500 dark:text-gray-400">
                      {new Date(currentUser?.metadata.creationTime).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">🔄 Last Login</h4>
                    <p className="text-gray-500 dark:text-gray-400">
                      {new Date(currentUser?.metadata.lastSignInTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Club Section */}
          {activeSection === 'club' && (
            <motion.div
              variants={item}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center space-x-3 mb-6">
                
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  🎪 Join a Club
                </h2>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center">
                  <span className="mr-2">⚠️</span>
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg flex items-center">
                  <Check className="h-5 w-5 mr-2" />
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleJoinClub} className="space-y-4">
                <div>
                  <label
                    htmlFor="accessKey"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    🔑 Enter Club Access Key
                  </label>
                  <input
                    type="text"
                    id="accessKey"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    placeholder="e.g. CLUB-1234-5678"
                    className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-70 flex items-center justify-center"
                >
                  {isLoading ? (
                    '⏳ Joining...'
                  ) : (
                    <>
                      <Users className="h-5 w-5 mr-2" />
                      Join Club
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className='flex justify-between'>
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">ℹ️ How to join a club</h3>
                   <Link to="/info"><div className='mt-2 dark:text-white text-blue-500 '>  <Info /></div></Link>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  1. Get an access key from your club admin<br />
                  2. Enter it in the field above<br />
                  3. Click "Join Club" to become a member
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;