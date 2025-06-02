import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, UserCheck, Calendar, Search, Shield, Users } from 'lucide-react';
import Loader from '../components/Loader';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const [clubs, setClubs] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchUserClubs();
  }, []);

  useEffect(() => {
    if (selectedClub) {
      fetchMembers(selectedClub);
    } else {
      setMembers([]);
    }
  }, [selectedClub]);

  // Fetch user's clubs
  const fetchUserClubs = async () => {
    try {
      setLoading(true);

      // Get current user's joined clubs - check multiple possible data structures
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
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

      console.log("User club IDs found:", userClubIds);

      // Get details for each club
      const clubsData = [];
      for (const clubId of userClubIds) {
        const clubDoc = await getDoc(doc(db, 'clubs', clubId));
        if (clubDoc.exists()) {
          clubsData.push({
            id: clubId,
            name: clubDoc.data().name,
            ...clubDoc.data()
          });
        }
      }

      console.log("Clubs data loaded:", clubsData.length, "clubs");
      setClubs(clubsData);

      // If there's only one club, select it automatically
      if (clubsData.length === 1) {
        setSelectedClub(clubsData[0].id);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching clubs:', err);
      setError('Failed to fetch clubs: ' + err.message);
      setLoading(false);
    }
  };

  const fetchMembers = async (clubId) => {
    try {
      setLoading(true);
      setMembers([]);
      setError('');

      // Get club members who joined via access key
      const membersRef = collection(db, 'clubs', clubId, 'members');
      const membersSnapshot = await getDocs(membersRef);

      const memberPromises = membersSnapshot.docs.map(async (memberDoc) => {
        // Use the correct ID field - it could be either userId or uid
        const userId = memberDoc.data().userId || memberDoc.data().uid || memberDoc.id;

        // Get user details
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          console.log(`User document not found for ID: ${userId}`);
          // Return basic info from the member document if user doc doesn't exist
          return {
            id: userId,
            displayName: memberDoc.data().displayName || 'Unknown User',
            email: memberDoc.data().email || 'No email',
            memberSince: memberDoc.data().joinedAt?.toDate(),
            role: memberDoc.data().role || 'member',
            // Add attendance stats
            attendanceRate: 0,
            attendedCount: 0,
            totalMeetings: 0
          };
        }

        const userData = userDoc.data();

        // Check if user joined via access key by checking if they have joinedAt in club data
        const hasJoinedViaAccessKey = memberDoc.data().joinedAt !== undefined;

        if (hasJoinedViaAccessKey) {
          return {
            id: userId,
            ...userData,
            memberSince: memberDoc.data().joinedAt?.toDate(),
            role: memberDoc.data().role || 'member',
            // Add attendance stats
            attendanceRate: 0, // This would need to be calculated from actual attendance data
            attendedCount: 0,
            totalMeetings: 0
          };
        }
        return null;
      });

      const membersList = (await Promise.all(memberPromises)).filter(member => member !== null);

      // Sort by name
      membersList.sort((a, b) => {
        return (a.displayName || '').localeCompare(b.displayName || '');
      });

      setMembers(membersList);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Failed to fetch members');
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (member.displayName && member.displayName.toLowerCase().includes(searchTermLower)) ||
      (member.email && member.email.toLowerCase().includes(searchTermLower))
    );
  });

  if (loading && clubs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="large" />
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-1"
    >


      <div className='flex md:flex-row md:justify-between flex-col justify-between items-center mb-4'>
        <h1 className="text-3xl font-bold mb-2 md:mb-8">Club Members</h1>
        <div className="flex md:flex-row min-w-20 h-auto md:items-center md:justify-between mb-8">
          <div className="relative *:flex-1 md:flex-none">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Memebrs</label>
            <div className='relative'>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Search members..."
                className="px-4 py-2 pl-10 border dark:bg-gray-800 dark:text-white bg-white text-black rounded-lg w-[90vw]  md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

            </div>
          </div>

        </div>
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Club</label>
          <select
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
            className="w-[90vw] md:max-w-96 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            <option className='items-end' value="">Select a club</option>
            {clubs.map(club => (
              <option key={club.id} value={club.id}>{club.name}</option>
            ))}
          </select>
        </div>

      </div>
      {/* Club selector */}

      {selectedClub ? (
        loading ? (
          <div className="flex py-12">
            <Loader size="medium" />
          </div>
        ) : filteredMembers.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 px-2 py-4">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
                <div className='w-16'> <Users className="h-7 w-7 mr-2 text-blue-500" /></div>
                <div className='text-center'> Members who joined via access key</div>
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  {filteredMembers.length}
                </span>
              </h2>
            </div>

            <ul className="divide-y divide-gray-200  dark:divide-gray-700">
              {filteredMembers.map((member) => (
                <li key={member.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src={member.photoURL || `https://ui-avatars.com/api/?name=${member.displayName || 'User'}&background=0A66C2&color=fff`}
                        alt={member.displayName || 'User profile'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{member.displayName || 'Unnamed User'}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${member.role === 'admin' ? 'bg-red-100 text-red-800' :
                            member.role === 'subadmin' ? 'bg-orange-100 text-orange-800' :
                              'bg-green-100 text-green-800'
                          }`}>
                          {member.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {member.email}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-1" />
                        Joined: {member.memberSince ? member.memberSince.toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <Users className="h-12 w-12 mx-auto text-gray-400" />
            <h2 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No members found</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No members match your search' : 'There are no members who joined this club via access key'}
            </p>
          </div>
        )
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <Shield className="h-12 w-12 mx-auto text-gray-400" />
          <h2 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Select a club</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Please select a club to view its members
          </p>
        </div>
      )}
    </motion.div>
  );
}