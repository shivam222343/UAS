import { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Calendar, Clock, Shield } from 'lucide-react';
import Loader from '../Loader';

const JoinedClubsList = () => {
  const [loading, setLoading] = useState(true);
  const [clubs, setClubs] = useState([]);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchJoinedClubs();
    }
  }, [currentUser]);

  const fetchJoinedClubs = async () => {
    try {
      setLoading(true);
      
      // Get current user's joined clubs - check multiple possible data structures
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists()) {
        setLoading(false);
        setError('User profile not found');
        return;
      }
      
      const userData = userDoc.data();
      
      let userClubIds = [];
      
      // Handle different possible data structures for club storage
      if (userData?.clubsJoined && Object.keys(userData.clubsJoined).length > 0) {
        // Format: { clubId1: {data}, clubId2: {data} }
        userClubIds = Object.keys(userData.clubsJoined);
      } else if (userData?.clubs && Array.isArray(userData.clubs) && userData.clubs.length > 0) {
        // Format: ['clubId1', 'clubId2']
        userClubIds = userData.clubs;
      } else {
        // Fallback - fetch all clubs where user is a member
        console.log("No clubs found in user document, searching club members collections...");
        const clubsRef = collection(db, 'clubs');
        const clubsSnapshot = await getDocs(clubsRef);
        
        for (const clubDoc of clubsSnapshot.docs) {
          const memberRef = doc(db, 'clubs', clubDoc.id, 'members', currentUser.uid);
          const memberDoc = await getDoc(memberRef);
          if (memberDoc.exists()) {
            userClubIds.push(clubDoc.id);
          }
        }
      }
      
      // Get details for each club
      const clubsData = [];
      for (const clubId of userClubIds) {
        const clubDoc = await getDoc(doc(db, 'clubs', clubId));
        if (clubDoc.exists()) {
          // Get member count
          const membersRef = collection(db, 'clubs', clubId, 'members');
          const membersSnapshot = await getDocs(membersRef);
          
          // Get upcoming meetings count
          const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
          const meetingsSnapshot = await getDocs(meetingsRef);
          const upcomingMeetings = meetingsSnapshot.docs.filter(doc => 
            doc.data().status === 'upcoming'
          ).length;
          
          // Check if user is admin
          let userRole = 'member';
          if (userData.clubsJoined && userData.clubsJoined[clubId]) {
            userRole = userData.clubsJoined[clubId].role || 'member';
          } else {
            // Try to find in members collection
            const memberRef = doc(db, 'clubs', clubId, 'members', currentUser.uid);
            const memberSnap = await getDoc(memberRef);
            if (memberSnap.exists()) {
              userRole = memberSnap.data().role || 'member';
            }
          }
          
          // Calculate join date
          let joinedAt = null;
          if (userData.clubsJoined && userData.clubsJoined[clubId] && userData.clubsJoined[clubId].joinedAt) {
            joinedAt = userData.clubsJoined[clubId].joinedAt.toDate();
          }
          
          clubsData.push({
            id: clubId,
            name: clubDoc.data().name,
            description: clubDoc.data().description || 'No description available',
            memberCount: membersSnapshot.size,
            upcomingMeetings: upcomingMeetings,
            userRole: userRole,
            joinedAt: joinedAt
          });
        }
      }
      
      setClubs(clubsData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching joined clubs:', err);
      setError('Failed to fetch joined clubs: ' + err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader size="medium" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <Shield className="h-12 w-12 mx-auto text-gray-400" />
        <h2 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No clubs joined</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          You haven't joined any clubs yet. Use an access key to join a club.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold dark:text-white">Your Clubs</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map(club => (
          <div key={club.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{club.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  club.userRole === 'admin' ? 'bg-red-100 text-red-800' :
                  club.userRole === 'subadmin' ? 'bg-orange-100 text-orange-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {club.userRole}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">{club.description}</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{club.memberCount} members</span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{club.upcomingMeetings} upcoming</span>
                </div>
                
                {club.joinedAt && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Joined: {club.joinedAt.toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JoinedClubsList; 