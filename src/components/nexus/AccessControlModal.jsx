import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Shield, 
  Users, 
  Eye, 
  Download, 
  Upload, 
  Edit3,
  Trash2,
  Plus,
  Check,
  AlertTriangle
} from 'lucide-react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

const PERMISSION_LEVELS = {
  view: { name: 'View Only', icon: Eye, description: 'Can view resources' },
  download: { name: 'Download', icon: Download, description: 'Can view and download resources' },
  upload: { name: 'Upload', icon: Upload, description: 'Can upload new resources' },
  edit: { name: 'Edit', icon: Edit3, description: 'Can edit existing resources' },
  admin: { name: 'Admin', icon: Shield, description: 'Full access to domain' }
};

export default function AccessControlModal({ isOpen, onClose, domain }) {
  const { userProfile } = useAuth();
  const [members, setMembers] = useState([]);
  const [domainPermissions, setDomainPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('view');
  const [showAddForm, setShowAddForm] = useState(false);

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    if (isOpen && domain) {
      fetchData();
    }
  }, [isOpen, domain]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all club members
      const membersRef = collection(db, 'users');
      const membersSnapshot = await getDocs(membersRef);
      const membersList = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersList);

      // Fetch domain permissions
      const permissionsRef = collection(db, 'nexus', domain.id, 'permissions');
      const permissionsSnapshot = await getDocs(permissionsRef);
      const permissionsList = permissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDomainPermissions(permissionsList);

    } catch (error) {
      console.error('Error fetching access control data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermission = async () => {
    if (!selectedMember || !selectedPermission || !isAdmin) return;

    try {
      const member = members.find(m => m.id === selectedMember);
      if (!member) return;

      // Get user name from various possible fields with fallbacks
      const userName = member.name || member.displayName || member.fullName || member.email?.split('@')[0] || 'Unknown User';
      const userEmail = member.email || '';

      // Check if permission already exists
      const existingPermission = domainPermissions.find(p => p.userId === selectedMember);
      if (existingPermission) {
        // Update existing permission
        await updateDoc(doc(db, 'nexus', domain.id, 'permissions', existingPermission.id), {
          permission: selectedPermission,
          updatedAt: serverTimestamp(),
          updatedBy: {
            uid: userProfile.uid,
            name: userProfile.name || userProfile.displayName || 'Admin'
          }
        });
      } else {
        // Add new permission
        await addDoc(collection(db, 'nexus', domain.id, 'permissions'), {
          userId: selectedMember,
          userName: userName,
          userEmail: userEmail,
          permission: selectedPermission,
          createdAt: serverTimestamp(),
          createdBy: {
            uid: userProfile.uid,
            name: userProfile.name || userProfile.displayName || 'Admin'
          }
        });
      }

      setSelectedMember('');
      setSelectedPermission('view');
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error('Error adding permission:', error);
    }
  };

  const handleRemovePermission = async (permissionId) => {
    if (!isAdmin) return;

    try {
      await deleteDoc(doc(db, 'nexus', domain.id, 'permissions', permissionId));
      fetchData();
    } catch (error) {
      console.error('Error removing permission:', error);
    }
  };

  const handleUpdatePermission = async (permissionId, newPermission) => {
    if (!isAdmin) return;

    try {
      await updateDoc(doc(db, 'nexus', domain.id, 'permissions', permissionId), {
        permission: newPermission,
        updatedAt: serverTimestamp(),
        updatedBy: {
          uid: userProfile.uid,
          name: userProfile.name
        }
      });
      fetchData();
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  const getPermissionColor = (permission) => {
    switch (permission) {
      case 'view': return 'gray';
      case 'download': return 'blue';
      case 'upload': return 'green';
      case 'edit': return 'yellow';
      case 'admin': return 'red';
      default: return 'gray';
    }
  };

  const availableMembers = members.filter(member => 
    !domainPermissions.some(p => p.userId === member.id)
  );

  if (!isOpen || !domain) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Shield className={`h-6 w-6 text-${domain.color}-500`} />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Access Control - {domain.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Manage member permissions for this domain
                </p>
              </div>
            </div>
            <div
              onClick={onClose}
              className="p-2 cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {!isAdmin ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Admin Access Required
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Only administrators can manage domain access controls.
                </p>
              </div>
            ) : (
              <>
                {/* Permission Levels Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Permission Levels
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(PERMISSION_LEVELS).map(([key, level]) => (
                      <div key={key} className="flex items-center gap-2">
                        <level.icon className={`h-4 w-4 text-${getPermissionColor(key)}-500`} />
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {level.name}
                          </span>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {level.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Permission Button */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Current Permissions ({domainPermissions.length})
                  </h3>
                  <div
                    onClick={() => setShowAddForm(true)}
                    className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                 <div className='hidden md:block'> Add Permission</div>
                  </div>
                </div>

                {/* Add Permission Form */}
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6"
                  >
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                      Add New Permission
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <select
                        value={selectedMember}
                        onChange={(e) => setSelectedMember(e.target.value)}
                        className="px-3 bg-white py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">Select Member</option>
                        {availableMembers.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name} ({member.email})
                          </option>
                        ))}
                      </select>
                      
                      <select
                        value={selectedPermission}
                        onChange={(e) => setSelectedPermission(e.target.value)}
                        className="px-3 bg-white py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        {Object.entries(PERMISSION_LEVELS).map(([key, level]) => (
                          <option key={key} value={key}>{level.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div
                        onClick={handleAddPermission}
                        disabled={!selectedMember}
                        className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        Add Permission
                      </div>
                      
                      <div
                        onClick={() => {
                          setShowAddForm(false);
                          setSelectedMember('');
                          setSelectedPermission('view');
                        }}
                        className="px-4 py-2 rounded-md bg-gray-400 text-white hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        Cancel
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Permissions List */}
                <div className="space-y-3">
                  {domainPermissions.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Permissions Set
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Add permissions to control who can access this domain.
                      </p>
                    </div>
                  ) : (
                    domainPermissions.map((permission) => {
                      const PermissionIcon = PERMISSION_LEVELS[permission.permission]?.icon || Eye;
                      const permissionColor = getPermissionColor(permission.permission);
                      
                      return (
                        <motion.div
                          key={permission.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 bg-${permissionColor}-100 dark:bg-${permissionColor}-900 rounded-lg`}>
                                <PermissionIcon className={`h-5 w-5 text-${permissionColor}-600`} />
                              </div>
                              <div>
                                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                                  {permission.userName}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {permission.userEmail}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <select
                                value={permission.permission}
                                onChange={(e) => handleUpdatePermission(permission.id, e.target.value)}
                                className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                              >
                                {Object.entries(PERMISSION_LEVELS).map(([key, level]) => (
                                  <option key={key} value={key}>{level.name}</option>
                                ))}
                              </select>
                              
                              <button
                                onClick={() => handleRemovePermission(permission.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          {permission.updatedAt && (
                            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                              Last updated by {permission.updatedBy?.name} on{' '}
                              {new Date(permission.updatedAt.toDate()).toLocaleDateString()}
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
