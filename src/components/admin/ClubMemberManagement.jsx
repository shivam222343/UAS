import { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { User, UserX, AlertTriangle, Shield, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import Loader from '../Loader';

const ClubMemberManagement = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState('');
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { currentUser } = useAuth();
  
  // Remove member modal state
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    if (selectedClub) {
      fetchClubMembers();
    } else {
      setMembers([]);
    }
  }, [selectedClub]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const clubsRef = collection(db, 'clubs');
      const clubsSnapshot = await getDocs(clubsRef);
      
      const clubsList = clubsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      
      setClubs(clubsList);
      
      // If there's only one club, select it automatically
      if (clubsList.length === 1) {
        setSelectedClub(clubsList[0].id);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching clubs:', err);
      setError('Failed to fetch clubs');
      setLoading(false);
    }
  };

  const fetchClubMembers = async () => {
    try {
      setLoading(true);
      
      // Get all members for this club
      const membersRef = collection(db, 'clubs', selectedClub, 'members');
      const membersSnapshot = await getDocs(membersRef);
      
      const membersPromises = membersSnapshot.docs.map(async memberDoc => {
        const memberId = memberDoc.id;
        const memberData = memberDoc.data();
        
        // Get user details from users collection
        let userDetails = {
          id: memberId,
          displayName: memberData.displayName || 'Unknown User',
          email: memberData.email || 'No email available',
          photoURL: null,
          role: memberData.role || 'member',
          joinedAt: memberData.joinedAt?.toDate() || null,
          missedMeetingCount: memberData.missedMeetingCount || 0,
          warningEmailSent: memberData.warningEmailSent || false
        };
        
        // Try to get additional user details if available
        try {
          const userDoc = await getDoc(doc(db, 'users', memberId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userDetails = {
              ...userDetails,
              displayName: userData.displayName || userDetails.displayName,
              email: userData.email || userDetails.email,
              photoURL: userData.photoURL || null
            };
          }
        } catch (err) {
          console.error(`Error fetching user details for ${memberId}:`, err);
        }
        
        return userDetails;
      });
      
      const membersList = await Promise.all(membersPromises);
      
      // Sort by role (admin first, then subadmin, then member)
      membersList.sort((a, b) => {
        const roleOrder = { admin: 0, subadmin: 1, member: 2 };
        if (roleOrder[a.role] !== roleOrder[b.role]) {
          return roleOrder[a.role] - roleOrder[b.role];
        }
        return (a.displayName || '').localeCompare(b.displayName || '');
      });
      
      setMembers(membersList);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching club members:', err);
      setError('Failed to fetch club members');
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      // Update role in club member subcollection
      await updateDoc(doc(db, 'clubs', selectedClub, 'members', userId), {
        role: newRole
      });
      
      // Update role in user's clubsJoined field
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.clubsJoined && userData.clubsJoined[selectedClub]) {
          await updateDoc(doc(db, 'users', userId), {
            [`clubsJoined.${selectedClub}.role`]: newRole
          });
        }
      }
      
      // Update UI
      setMembers(prevMembers => 
        prevMembers.map(member => 
          member.id === userId ? { ...member, role: newRole } : member
        )
      );
      
      setSuccess(`Updated role for ${members.find(m => m.id === userId)?.displayName || 'user'}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error updating role:', err);
      setError('Failed to update role');
    }
  };

  // Handle opening remove member modal
  const handleOpenRemoveModal = (member) => {
    setMemberToRemove(member);
    setShowRemoveModal(true);
  };

  // Handle removing a member from club
  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    try {
      // First check if this is the last admin - don't allow removing the last admin
      if (memberToRemove.role === 'admin') {
        const admins = members.filter(m => m.role === 'admin');
        if (admins.length <= 1) {
          setError('Cannot remove the last admin of this club');
          setShowRemoveModal(false);
          return;
        }
      }
      
      // 1. Remove from club members collection
      await deleteDoc(doc(db, 'clubs', selectedClub, 'members', memberToRemove.id));
      
      // 2. Update user's clubsJoined field
      const userDoc = await getDoc(doc(db, 'users', memberToRemove.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.clubsJoined && userData.clubsJoined[selectedClub]) {
          // Create a copy of clubsJoined without the current club
          const updatedClubsJoined = { ...userData.clubsJoined };
          delete updatedClubsJoined[selectedClub];
          
          await updateDoc(doc(db, 'users', memberToRemove.id), {
            clubsJoined: updatedClubsJoined
          });
        }
      }
      
      // Update UI
      setMembers(prevMembers => prevMembers.filter(member => member.id !== memberToRemove.id));
      
      setSuccess(`Removed ${memberToRemove.displayName} from the club`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
      setShowRemoveModal(false);
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member');
      setShowRemoveModal(false);
    }
  };

  if (loading && !selectedClub) {
    return (
      <div className="flex justify-center py-8">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
        <Users className="h-5 w-5 inline mr-2" />
        Club Member Management
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg dark:bg-green-900/20 dark:text-green-400">
          {success}
        </div>
      )}
      
      {/* Club selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Club</label>
        <select
          value={selectedClub}
          onChange={(e) => setSelectedClub(e.target.value)}
          className="w-full md:w-1/3 border border-gray-300 rounded-md px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a club</option>
          {clubs.map(club => (
            <option key={club.id} value={club.id}>{club.name}</option>
          ))}
        </select>
      </div>
      
      {/* Members list */}
      {selectedClub ? (
        loading ? (
          <div className="flex justify-center py-8">
            <Loader size="medium" />
          </div>
        ) : members.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Joined
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Missed
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {members.map(member => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {member.photoURL ? (
                            <img 
                              className="h-10 w-10 rounded-full" 
                              src={member.photoURL} 
                              alt={member.displayName} 
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <User className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.displayName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {member.joinedAt ? (
                          member.joinedAt.toLocaleDateString()
                        ) : (
                          'Unknown'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        disabled={member.id === currentUser.uid} // Can't change own role
                        className={`text-sm rounded-full px-3 py-1 
                          ${member.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                            member.role === 'subadmin' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : 
                            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          }
                          ${member.id === currentUser.uid ? 'cursor-not-allowed opacity-70' : ''}
                        `}
                      >
                        <option value="admin">Admin</option>
                        <option value="subadmin">Sub-Admin</option>
                        <option value="member">Member</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${
                          member.missedMeetingCount >= 3 ? 'text-red-600 dark:text-red-400' :
                          member.missedMeetingCount > 0 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {member.missedMeetingCount || 0}
                        </span>
                        {member.warningEmailSent && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            Warning Sent
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleOpenRemoveModal(member)}
                        disabled={member.id === currentUser.uid} // Can't remove yourself
                        className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 
                          ${member.id === currentUser.uid ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <UserX className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No members found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This club doesn't have any members yet.
            </p>
          </div>
        )
      ) : (
        <div className="text-center py-8">
          <Shield className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Select a club</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Please select a club to manage its members
          </p>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {showRemoveModal && memberToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4"
          >
            <div className="text-center mb-4">
              <AlertTriangle className="h-12 w-12 mx-auto text-red-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                Remove Member
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to remove <span className="font-semibold">{memberToRemove.displayName}</span> from this club? 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRemoveModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ClubMemberManagement; 