import { useState } from 'react';
import { collection, query, where, getDocs, getDoc, updateDoc, doc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Key, ArrowRight } from 'lucide-react';
import JoinedClubsList from './JoinedClubsList';

const JoinClub = () => {
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { currentUser } = useAuth();

  const handleJoinClub = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!accessKey.trim()) {
      setError('Please enter an access key');
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if the access key exists and is valid
      const keysRef = collection(db, 'accessKeys');
      const q = query(keysRef, where('key', '==', accessKey.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('Invalid access key. Please check and try again.');
        setLoading(false);
        return;
      }
      
      const keyDoc = querySnapshot.docs[0];
      const keyData = keyDoc.data();
      
      // Check if the key has already been used
      if (keyData.used) {
        setError('This access key has already been used.');
        setLoading(false);
        return;
      }
      
      // Check if the key has expired
      if (keyData.expiry && new Date(keyData.expiry) < new Date()) {
        setError('This access key has expired.');
        setLoading(false);
        return;
      }
      
      // Get the club details
      const clubId = keyData.clubId;
      if (!clubId) {
        setError('Access key is not associated with any club.');
        setLoading(false);
        return;
      }
      
      const clubDoc = await getDoc(doc(db, 'clubs', clubId));
      if (!clubDoc.exists()) {
        setError('The club associated with this key no longer exists.');
        setLoading(false);
        return;
      }
      
      const clubName = clubDoc.data().name;
      
      // Check if user is already a member of this club
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      
      if (userData.clubsJoined && userData.clubsJoined[clubId]) {
        setError(`You are already a member of ${clubName}.`);
        setLoading(false);
        return;
      }
      
      // Add user to club members collection
      await updateDoc(doc(db, 'clubs', clubId, 'members', currentUser.uid), {
        userId: currentUser.uid,
        displayName: userData.displayName || 'Unknown User',
        email: userData.email || 'No email',
        role: 'member',
        joinedAt: serverTimestamp()
      });
      
      // Update user's clubsJoined field
      await updateDoc(doc(db, 'users', currentUser.uid), {
        [`clubsJoined.${clubId}`]: {
          joinedAt: serverTimestamp(),
          role: 'member'
        }
      });
      
      // Mark the access key as used
      await updateDoc(doc(db, 'accessKeys', keyDoc.id), {
        used: true,
        usedBy: currentUser.uid,
        usedAt: serverTimestamp()
      });
      
      setSuccess(`Successfully joined ${clubName}!`);
      setAccessKey('');
      setLoading(false);
      
      // Reload joined clubs
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error joining club:', err);
      setError('Failed to join club: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Join Club Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Join a Club</h2>
        
        <form onSubmit={handleJoinClub} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Access Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter access key"
              />
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-green-100 text-green-700 rounded-md dark:bg-green-900/20 dark:text-green-400">
              {success}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining...' : (
              <>
                Join Club <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
      
      {/* Joined Clubs List */}
      <JoinedClubsList />
    </div>
  );
};

export default JoinClub; 