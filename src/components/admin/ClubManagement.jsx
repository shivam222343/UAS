import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, Trash2, Key, Copy, Check, AlertTriangle } from 'lucide-react';
import '../../styles/Forms.css';
import Loader from '../../components/Loader';

const ClubManagement = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccessKeyModalOpen, setIsAccessKeyModalOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [accessKeys, setAccessKeys] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    maxMembers: 50,
    isPublic: false
  });
  const [accessKeyCount, setAccessKeyCount] = useState(1);
  const [accessKeyExpiration, setAccessKeyExpiration] = useState(30); // Days
  const [keyMessage, setKeyMessage] = useState('');
  const [keyMessageType, setKeyMessageType] = useState(''); // 'success' or 'error'
  const [copiedKeyId, setCopiedKeyId] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clubToDelete, setClubToDelete] = useState(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const { currentUser } = useAuth();

  // Fetch clubs and access keys
  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const clubsRef = collection(db, 'clubs');
      const querySnapshot = await getDocs(clubsRef);

      const clubsList = [];
      for (const clubDoc of querySnapshot.docs) {
        const clubData = {
          id: clubDoc.id,
          ...clubDoc.data(),
          createdAt: clubDoc.data().createdAt?.toDate() || new Date()
        };

        // Get member count
        const membersRef = collection(db, 'clubs', clubDoc.id, 'members');
        const membersSnapshot = await getDocs(membersRef);
        clubData.memberCount = membersSnapshot.size;

        clubsList.push(clubData);
      }

      setClubs(clubsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      setLoading(false);
    }
  };

  const fetchAccessKeys = async (clubId) => {
    try {
      const keysRef = collection(db, 'clubs', clubId, 'accessKeys');
      const querySnapshot = await getDocs(keysRef);

      const keysList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiresAt: doc.data().expiresAt?.toDate()
      }));

      // Sort by created date (newest first)
      keysList.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB - dateA;
      });

      setAccessKeys(keysList);
    } catch (error) {
      console.error('Error fetching access keys:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const clubData = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        maxMembers: parseInt(formData.maxMembers),
        isPublic: formData.isPublic,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (selectedClub) {
        // Update existing club
        const clubRef = doc(db, 'clubs', selectedClub.id);
        await updateDoc(clubRef, {
          ...clubData,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new club
        await addDoc(collection(db, 'clubs'), clubData);
      }

      // Reset form and refresh clubs
      setFormData({
        name: '',
        description: '',
        location: '',
        maxMembers: 50,
        isPublic: false
      });
      setIsModalOpen(false);
      setSelectedClub(null);
      fetchClubs();
    } catch (error) {
      console.error('Error saving club:', error);
    }
  };



  const handleDeleteClick = (club) => {
    setClubToDelete(club);
    setDeleteConfirmationText('');
    setShowDeleteConfirm(true);
  };

  const handleDeleteClub = async () => {
    if (deleteConfirmationText === `Delete ${clubToDelete.name}`) {
      try {
        await deleteDoc(doc(db, 'clubs', clubToDelete.id));
        fetchClubs();
        setShowDeleteConfirm(false);
      } catch (error) {
        console.error('Error deleting club:', error);
        alert('Failed to delete club. Please try again.');
      }
    } else {
      alert(`Please type "Delete ${clubToDelete.name}" to confirm deletion.`);
    }
  };

  const handleEditClub = (club) => {
    setSelectedClub(club);
    setFormData({
      name: club.name,
      description: club.description || '',
      location: club.location || '',
      maxMembers: club.maxMembers || 50,
      isPublic: club.isPublic || false
    });
    setIsModalOpen(true);
  };

  const handleGenerateAccessKeys = async (club) => {
    setSelectedClub(club);
    await fetchAccessKeys(club.id);
    setIsAccessKeyModalOpen(true);
  };

  const generateAccessKeys = async () => {
    try {
      setKeyMessage('');
      setKeyMessageType('');

      if (accessKeyCount <= 0 || accessKeyCount > 50) {
        setKeyMessage('Please enter a valid number of keys (1-50)');
        setKeyMessageType('error');
        return;
      }

      const keysToGenerate = [];
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + accessKeyExpiration);

      for (let i = 0; i < accessKeyCount; i++) {
        // Generate a random 8-character key
        const key = Math.random().toString(36).substring(2, 10).toUpperCase();

        keysToGenerate.push({
          key,
          createdAt: serverTimestamp(),
          createdBy: currentUser.uid,
          expiresAt: Timestamp.fromDate(expirationDate),
          isUsed: false
        });
      }

      // Add keys to Firestore
      for (const keyData of keysToGenerate) {
        await addDoc(collection(db, 'clubs', selectedClub.id, 'accessKeys'), keyData);
      }

      // Refresh access keys
      await fetchAccessKeys(selectedClub.id);

      setKeyMessage(`Successfully generated ${accessKeyCount} access key${accessKeyCount > 1 ? 's' : ''}`);
      setKeyMessageType('success');
    } catch (error) {
      console.error('Error generating access keys:', error);
      setKeyMessage('Failed to generate access keys');
      setKeyMessageType('error');
    }
  };

  const deleteAccessKey = async (keyId) => {
    try {
      await deleteDoc(doc(db, 'clubs', selectedClub.id, 'accessKeys', keyId));
      await fetchAccessKeys(selectedClub.id);
    } catch (error) {
      console.error('Error deleting access key:', error);
    }
  };

  // Function to copy access key to clipboard
  const copyToClipboard = (key) => {
    navigator.clipboard.writeText(key.key).then(
      () => {
        setCopiedKeyId(key.id);
        setTimeout(() => setCopiedKeyId(null), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  // Function to format expiration date
  const formatExpirationDate = (date) => {
    if (!date) return 'No expiration';

    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffDays} days`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader size="medium" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 dark:text-white">Club Management</h2>
        <button
          onClick={() => {
            setSelectedClub(null);
            setFormData({
              name: '',
              description: '',
              location: '',
              maxMembers: 50,
              isPublic: false
            });
            setIsModalOpen(true);
          }}
          className="form-btn form-btn-primary flex items-center space-x-1"
        >
          <Plus className="h-4 w-4 dark:text-white " />
          <span className='dark:text-white '>Create Club</span>
        </button>
      </div>

      {clubs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Members</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {clubs.map((club) => (
                <tr key={club.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{club.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{club.description}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{club.memberCount} / {club.maxMembers}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{club.location || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(club.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleGenerateAccessKeys(club)}
                      className="form-btn form-btn-secondary text-xs px-2 py-1"
                    >
                      <Key className="h-3 w-3 inline mr-1" />
                      Access Keys
                    </button>
                    <button
                      onClick={() => handleEditClub(club)}
                      className="form-btn form-btn-secondary text-xs px-2 py-1"
                    >
                      <Edit2 className="h-3 w-3 inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(club)}
                      className="form-btn form-btn-danger text-xs px-2 py-1"
                    >
                      <Trash2 className="h-3 w-3 inline mr-1" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No clubs created yet. Create a club to get started.</p>
        </div>
      )}

      {/* Club Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 relative z-10">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {selectedClub ? 'Edit Club' : 'Create Club'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Club Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="form-input"
                  rows="3"
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Maximum Members</label>
                <input
                  type="number"
                  name="maxMembers"
                  value={formData.maxMembers}
                  onChange={handleChange}
                  className="form-input"
                  min="1"
                  max="1000"
                />
              </div>

              <div className="form-group">
                <label className="form-checkbox-label">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleChange}
                    className="form-checkbox"
                  />
                  <span>Public Club (Anyone can join)</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="form-btn form-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="form-btn form-btn-primary"
                >
                  {selectedClub ? 'Update Club' : 'Create Club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Access Keys Modal */}
      {isAccessKeyModalOpen && selectedClub && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsAccessKeyModalOpen(false)}></div>
          <div className="bg-white dark:bg-gray-800 rounded-lg w-[90vw] max-w-2xl p-6 relative z-10 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Access Keys for {selectedClub.name}
            </h3>

            <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Generate New Access Keys</h4>
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="form-label text-sm">Number of Keys</label>
                  <input
                    type="number"
                    value={accessKeyCount}
                    onChange={(e) => setAccessKeyCount(parseInt(e.target.value) || 1)}
                    min="1"
                    max="50"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label text-sm">Expiration (days)</label>
                  <input
                    type="number"
                    value={accessKeyExpiration}
                    onChange={(e) => setAccessKeyExpiration(parseInt(e.target.value) || 30)}
                    min="1"
                    max="365"
                    className="form-input"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={generateAccessKeys}
                    className="form-btn form-btn-primary"
                  >
                    Generate Keys
                  </button>
                </div>
              </div>

              {keyMessage && (
                <div className={`mt-3 p-2 rounded-md ${keyMessageType === 'success'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                  {keyMessageType === 'success' ? <Check className="h-4 w-4 inline mr-1" /> : <AlertTriangle className="h-4 w-4 inline mr-1" />}
                  {keyMessage}
                </div>
              )}
            </div>

            <div className="mb-4 ">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Access Keys</h4>
              {accessKeys.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No access keys available</p>
              ) : (
                <div className="border overflow-x-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-blue-100 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Key
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Expiration
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {accessKeys.map(key => (
                        <tr key={key.id} className={key.isUsed ? 'bg-gray-50 dark:bg-gray-700/50' : ''}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`font-mono font-medium ${key.isUsed ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                {key.key}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${key.isUsed
                              ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              }`}>
                              {key.isUsed ? 'Used' : 'Available'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`text-sm ${!key.expiresAt ? 'text-gray-500 dark:text-gray-400' :
                              key.expiresAt < new Date() ? 'text-red-600 dark:text-red-400' :
                                'text-gray-600 dark:text-gray-300'
                              }`}>
                              {formatExpirationDate(key.expiresAt)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-2">
                            {!key.isUsed && (
                              <>
                                <button
                                  onClick={() => copyToClipboard(key)}
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 focus:outline-none"
                                >
                                  {copiedKeyId === key.id ? (
                                    <Check className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Copy className="h-3 w-3 mr-1" />
                                  )}
                                  {copiedKeyId === key.id ? 'Copied' : 'Copy'}
                                </button>
                                <button
                                  onClick={() => deleteAccessKey(key.id)}
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-300 dark:bg-red-900/30 dark:hover:bg-red-800/50 focus:outline-none"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsAccessKeyModalOpen(false)}
                className="form-btn form-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && clubToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(false)}></div>
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 relative z-10">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Delete Club
            </h3>
            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Are you sure you want to delete <span className="font-semibold">{clubToDelete.name}</span>?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                This action cannot be undone. All club data will be permanently removed.
              </p>
              <div className="form-group">
                <label className="form-label">
                  Type <span className="font-mono"> @Secrete_Code {clubToDelete.name}</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="form-input"
                  placeholder={`@Secrete_Code ${clubToDelete.name}`}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="form-btn form-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClub}
                className={`form-btn form-btn-danger relative ${deleteConfirmationText !== `Delete ${clubToDelete.name}`
                    ? 'opacity-70 cursor-not-allowed'
                    : ''
                  }`}
                disabled={deleteConfirmationText !== `Delete ${clubToDelete.name}`}
              >
                <span className="flex items-center justify-center">
                  Delete Club
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubManagement; 