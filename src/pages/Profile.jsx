import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Award,
  Shield,
  Camera,
  Save,
  Edit,
  Cross
} from 'lucide-react';
import UserAttendanceStats from '../components/meetings/UserAttendanceStats';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import Loader from '../components/Loader';

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

const Profile = () => {
  const { currentUser, updateUserProfile, updateUserEmail } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedClub, setSelectedClub] = useState('');
  const [userClubs, setUserClubs] = useState([]);

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    position: 'Member',
    department: 'Engineering',
    joinDate: '2023-01-15',
    bio: ''
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        phone: currentUser.phoneNumber || '',
        position: 'Member',
        department: 'Engineering',
        joinDate: '2023-01-15',
        bio: ''
      });
      fetchUserClubs();
    }

    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentUser]);

  const fetchUserClubs = async () => {
    try {
      // Fetch the clubs the user has joined
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);



      if (userDoc.exists() && userDoc.data().clubsJoined) {
        const clubsJoined = userDoc.data().clubsJoined;
        const clubDetails = [];

        // Fetch details for each club
        for (const clubId of Object.keys(clubsJoined)) {
          const clubDocRef = doc(db, 'clubs', clubId);
          const clubDoc = await getDoc(clubDocRef);



          if (clubDoc.exists()) {
            clubDetails.push({
              id: clubDoc.id,
              name: clubDoc.data().name
            });
          }
        }

        setUserClubs(clubDetails);

        // If there's only one club, select it automatically
        if (clubDetails.length === 1) {
          setSelectedClub(clubDetails[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user clubs:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Update profile
      await updateUserProfile(currentUser, {
        displayName: formData.displayName
      });

      // Update email (requires recent login)
      if (formData.email !== currentUser.email) {
        await updateUserEmail(currentUser, formData.email);
      }

      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  console.log(currentUser?.photoURL);


  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[50vh]"
      >
        <Loader size="large" />
        <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg">Loading profile data...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-1 lg:p-8"
    >
      <div className="space-y-6">


        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {message && (
          <div className="p-4 bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400 rounded-lg">
            {message}
          </div>
        )}

        {/* Profile Tabs */}
        <div className="flex border-b gap-4  border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium mb-5 text-sm border-b-2 ${activeTab === 'profile'
                ? 'dark:text-white hover:text-white hover:bg-gray-400 dark:bg-gray-800 bg-gray-100 text-black'
                : 'dark:text-white hover:text-white hover:bg-gray-400 text-gray-500 dark:bg-gray-800 bg-gray-100'
              }`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`py-2 px-4 font-medium  mb-5 text-sm border-b-2 ${activeTab === 'attendance'
                ? 'dark:text-white hover:text-white hover:bg-gray-400 dark:bg-gray-800 bg-gray-100 text-black'
                : 'dark:text-white hover:text-white hover:bg-gray-400 text-gray-500 dark:bg-gray-800 bg-gray-100'
              }`}
            onClick={() => setActiveTab('attendance')}
          >
            Attendance
          </button>
        </div>

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Profile Image */}
            <motion.div
              variants={item}
              className="md:col-span-1"
            >
              <div className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-card hover:shadow-hover transition-shadow">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-semibold text-secondary-900 dark:text-white">
                    My Profile
                  </h1>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 flex text-md gap-2 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    {
                      isEditing && <div className='rotate-45'><Cross /></div>
                    }
                    {

                      !isEditing && <Edit />
                    }
                    <div className='hidden md:block'>{isEditing ? 'Cancel' : 'Edit Profile'}</div>
                  </button>
                </div>
                <div className="flex mt-4 flex-col items-center text-center">
                  <div className="relative mb-4">
                    <img
                      src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${formData.displayName || 'User'}&size=200&background=0A66C2&color=fff`}
                      alt="Profile"
                      className="h-32 w-32 rounded-full object-cover border-4 border-white dark:border-secondary-700 shadow-md"
                    />
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors">
                        <Camera className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">
                    {formData.displayName || 'User'}
                  </h2>
                  <p className="text-secondary-500 dark:text-secondary-400">
                    {formData.position} - {formData.department}
                  </p>
                  <div className="flex items-center mt-3">
                    <Award className="h-5 w-5 text-primary-500 dark:text-primary-400 mr-2" />
                    <span className="text-secondary-600 dark:text-secondary-300">Top Performer</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Profile Details */}
            <motion.div
              variants={item}
              className="md:col-span-2"
            >
              <div className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-card hover:shadow-hover transition-shadow">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300">
                          <User className="h-4 w-4 mr-2" />
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="displayName"
                          value={formData.displayName}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full p-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300">
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full p-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300">
                          <Phone className="h-4 w-4 mr-2" />
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full p-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300">
                          <Shield className="h-4 w-4 mr-2" />
                          Position
                        </label>
                        <select
                          name="position"
                          value={formData.position}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full p-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <option value="Admin">Admin</option>
                          <option value="Subadmin">Subadmin</option>
                          <option value="Member">Member</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300">
                          <Calendar className="h-4 w-4 mr-2" />
                          Join Date
                        </label>
                        <input
                          type="date"
                          name="joinDate"
                          value={formData.joinDate}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full p-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="flex items-center text-sm font-medium text-secondary-700 dark:text-secondary-300">
                          Bio
                        </label>
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          disabled={!isEditing}
                          rows={4}
                          className="w-full p-2 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Saving...' : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Attendance Stats Tab Content */}
        {activeTab === 'attendance' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Attendance</h2>

            {userClubs.length === 0 ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <p className="text-yellow-700">
                  You haven't joined any clubs yet. Join a club to view your attendance statistics.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Club</label>
                  <select
                    value={selectedClub}
                    onChange={(e) => setSelectedClub(e.target.value)}
                    className="w-full bg-white text-gray-900 md:w-1/3 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a club</option>
                    {userClubs.map(club => (
                      <option key={club.id} value={club.id}>{club.name}</option>
                    ))}
                  </select>
                </div>

                {selectedClub ? (
                  <UserAttendanceStats clubId={selectedClub} />
                ) : (
                  <div className="bg-gray-50  p-8 text-center rounded-lg">
                    <p className="text-gray-500">Select a club to view your attendance statistics</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Profile; 