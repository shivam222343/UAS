import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Search, Edit2, CheckCircle, AlertCircle, RefreshCw, UserCheck, Shield, UserX, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Loader from '../Loader';

const UserRoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { currentUser, updateUserRole } = useAuth();

  // Remove member modal state
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = users.filter(user => 
        user.displayName?.toLowerCase().includes(lowercasedSearch) || 
        user.email?.toLowerCase().includes(lowercasedSearch)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      setUsers(usersList);
      setFilteredUsers(usersList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
      setLoading(false);
    }
  };

  const handleEditRole = (user) => {
    setEditingUser(user);
    setSelectedRole(user.role || 'member');
  };

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };

  const handleUpdateRole = async () => {
    if (!editingUser || !selectedRole) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Update role using the Auth context function
      const success = await updateUserRole(editingUser.id, selectedRole);
      
      if (success) {
        // Update local users list
        setUsers(prevUsers => {
          return prevUsers.map(user => {
            if (user.id === editingUser.id) {
              return { ...user, role: selectedRole };
            }
            return user;
          });
        });
        
        setSuccess(`${editingUser.displayName || editingUser.email}'s role updated to ${selectedRole}`);
        setEditingUser(null);
      } else {
        setError('Failed to update user role. Please try again.');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      setError(error.message || 'Failed to update user role');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setSelectedRole('');
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'subadmin':
        return 'bg-orange-100 text-orange-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        const admins = users.filter(m => m.role === 'admin');
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
      setUsers(prevUsers => prevUsers.filter(user => user.id !== memberToRemove.id));
      
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

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center mb-4 md:mb-0">
          <Shield className="h-5 w-5 mr-2 text-blue-500" />
          User Role Management
        </h2>
        
        <div className="relative">
          <input 
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-4 py-2 pl-10 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2  text-gray-400" />
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <p>{success}</p>
          </div>
        </div>
      )}
      
      {editingUser && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
            Update Role for {editingUser.displayName || editingUser.email}
          </h3>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <select
                value={selectedRole}
                onChange={handleRoleChange}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="member">Member</option>
                <option value="moderator">Moderator</option>
                <option value="subadmin">Subadmin</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpdateRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Update Role
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                        <img 
                          src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=0A66C2&color=fff`} 
                          alt={user.displayName || 'User'} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.displayName || 'Unnamed User'}
                        </p>
                        {user.id === currentUser?.uid && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">(You)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role || 'member'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleEditRole(user)}
                      className="text-white hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenRemoveModal(user)}
                      disabled={user.id === currentUser.uid}
                      className={`text-red-100 hover:text-red-900  dark:text-red-400 dark:hover:text-red-300 
                        ${user.id === currentUser.uid ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No matching users found' : 'No users found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

export default UserRoleManagement; 