import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, addDoc, deleteDoc, doc, getDocs, updateDoc, getDoc, Timestamp, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  Calendar, 
  Users, 
  Key, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Download,
  Bell,
  BarChart2,
  CheckSquare,
  Map,
  Laptop,
  Video,
  FileText,
  Plus,
  Clock,
  User
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import ClubManagement from '../components/admin/ClubManagement';
import AbsenceRequestModal from '../components/meetings/AbsenceRequestModal';
import AttendanceChart from '../components/admin/AttendanceChart';
import UserRoleManagement from '../components/admin/UserRoleManagement';
import ClubMemberManagement from '../components/admin/ClubMemberManagement';
import AttendanceMarker from '../components/admin/AttendanceMarker';
import AttendanceWarnings from '../components/admin/AttendanceWarnings';
import Loader from '../components/Loader';

const AdminDashboard = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [clubs, setClubs] = useState([]);
  const [users, setUsers] = useState([]);
  const [newClub, setNewClub] = useState('');
  const [newAccessKey, setNewAccessKey] = useState('');
  const [keyClubId, setKeyClubId] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // State for meetings
  const [meetings, setMeetings] = useState([]);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [newMeeting, setNewMeeting] = useState({
    name: '',
    date: '',
    time: '',
    mode: 'offline',
    location: '',
    classroomNumber: '',
    platform: '',
    description: '',
    status: 'upcoming',
    clubId: ''
  });

  // State for access keys
  const [accessKeys, setAccessKeys] = useState([
    { id: 1, key: 'ABC123', expiry: '2024-03-25', used: false },
    { id: 2, key: 'DEF456', expiry: '2024-03-22', used: true }
  ]);
  const [showKeyModal, setShowKeyModal] = useState(false);

  // State for members
  const [members, setMembers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'member' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'subadmin' }
  ]);

  // State for absence requests
  const [absenceRequests, setAbsenceRequests] = useState([
    { id: 1, name: 'Alice Brown', reason: 'Medical appointment', date: '2024-03-20' },
    { id: 2, name: 'Bob Wilson', reason: 'Family emergency', date: '2024-03-21' }
  ]);

  // Analytics data
  const attendanceData = [
    { name: 'Jan', attendance: 85 },
    { name: 'Feb', attendance: 90 },
    { name: 'Mar', attendance: 88 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const pieData = [
    { name: 'Present', value: 75 },
    { name: 'Absent', value: 15 },
    { name: 'Excused', value: 10 }
  ];

  const [stats, setStats] = useState({
    clubs: 0,
    members: 0,
    meetings: 0,
    attendance: 0
  });
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // State for absence request modal
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [selectedMeetingForAbsence, setSelectedMeetingForAbsence] = useState(null);

  // State for active tab
  const [activeTab, setActiveTab] = useState('meetings');
  const [analyticsClubId, setAnalyticsClubId] = useState('');

  // Attendance state is now managed in the AttendanceMarker component

  // Fetch meetings from Firestore specific to the selected club
  const fetchMeetings = async (clubId) => {
    try {
      if (!clubId) {
        setMeetings([]);
        return;
      }
      
      const querySnapshot = await getDocs(collection(db, 'clubs', clubId, 'meetings'));
      const meetingsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMeetings(meetingsList);
    } catch (err) {
      setError('Failed to fetch meetings');
      console.error(err);
    }
  };

  // Create new meeting for a specific club
  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    
    if (!newMeeting.clubId) {
      setError('Please select a club');
      return;
    }
    
    try {
      // Create a meeting object with only the necessary fields based on mode
      const meetingData = {
        name: newMeeting.name,
        date: newMeeting.date,
        time: newMeeting.time,
        mode: newMeeting.mode,
        description: newMeeting.description,
        status: newMeeting.status,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        attendees: {},
        attendanceMarked: false
      };
      
      // Add mode-specific fields
      if (newMeeting.mode === 'offline') {
        meetingData.location = newMeeting.location;
        
        // Only include classroom number if location is 'Classroom'
        if (newMeeting.location === 'Classroom') {
          meetingData.classroomNumber = newMeeting.classroomNumber;
        }
      } else {
        // Online meeting
        meetingData.platform = newMeeting.platform;
      }
      
      // Add the meeting to the selected club's meetings collection
      const meetingRef = await addDoc(collection(db, 'clubs', newMeeting.clubId, 'meetings'), meetingData);
      
      // Get club name for notification
      const clubDoc = await getDoc(doc(db, 'clubs', newMeeting.clubId));
      const clubName = clubDoc.exists() ? clubDoc.data().name : 'Unknown Club';
      
      // Create notification for all club members
      await addNotificationForClubMembers(newMeeting.clubId, {
        type: 'new_meeting',
        title: 'New Meeting',
        message: `A new meeting "${newMeeting.name}" has been scheduled for ${newMeeting.date} at ${newMeeting.time} in ${clubName}.`,
        meetingId: meetingRef.id,
        clubId: newMeeting.clubId,
        createdAt: serverTimestamp()
      });
      
      // Reset form and close modal
      setShowMeetingModal(false);
      setNewMeeting({
        name: '',
        date: '',
        time: '',
        mode: 'offline',
        location: '',
        classroomNumber: '',
        platform: '',
        description: '',
        status: 'upcoming',
        clubId: newMeeting.clubId // Keep the selected club for convenience
      });
      
      // Refresh meetings list
      fetchMeetings(newMeeting.clubId);
      setSuccess('Meeting created successfully');
    } catch (err) {
      setError('Failed to create meeting');
      console.error(err);
    }
  };

  // Function to add notification for all club members
  const addNotificationForClubMembers = async (clubId, notificationData) => {
    try {
      // Get all members of the club
      const membersRef = collection(db, 'clubs', clubId, 'members');
      const membersSnapshot = await getDocs(membersRef);
      
      // For each member, add a notification to their user document
      for (const memberDoc of membersSnapshot.docs) {
        const userId = memberDoc.data().userId;
        
        // Add notification to user's notifications subcollection
        await addDoc(collection(db, 'users', userId, 'notifications'), {
          ...notificationData,
          read: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error('Error adding notifications:', err);
    }
  };

  // Delete meeting
  const handleDeleteMeeting = async (meetingId, clubId) => {
    try {
      await deleteDoc(doc(db, 'clubs', clubId, 'meetings', meetingId));
      fetchMeetings(clubId);
      setSuccess('Meeting deleted successfully');
    } catch (err) {
      setError('Failed to delete meeting');
      console.error(err);
    }
  };

  // Update meeting status
  const handleUpdateMeetingStatus = async (meetingId, clubId, newStatus) => {
    try {
      await updateDoc(doc(db, 'clubs', clubId, 'meetings', meetingId), {
        status: newStatus
      });
      fetchMeetings(clubId);
      setSuccess('Meeting status updated successfully');
    } catch (err) {
      setError('Failed to update meeting status');
      console.error(err);
    }
  };

  // Attendance marking is now handled by the AttendanceMarker component

  useEffect(() => {
    fetchClubs();
    fetchAccessKeys();
    fetchUsers();
    fetchAdminData();
  }, []);

  // Add an effect to fetch meetings when a club is selected
  useEffect(() => {
    if (selectedClub) {
      fetchMeetings(selectedClub);
    }
  }, [selectedClub]);

  const fetchClubs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'clubs'));
      const clubsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClubs(clubsList);
      
      // If there are clubs and no club is selected for analytics, select the first one
      if (clubsList.length > 0 && !analyticsClubId) {
        setAnalyticsClubId(clubsList[0].id);
      }
    } catch (err) {
      setError('Failed to fetch clubs');
      console.error(err);
    }
  };

  const fetchAccessKeys = async () => {
    const querySnapshot = await getDocs(collection(db, 'accessKeys'));
    const keysList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAccessKeys(keysList);
  };

  const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setUsers(usersList);
  };

  const handleCreateClub = async () => {
    if (!newClub) {
      setError('Please enter a club name');
      return;
    }
    try {
      await addDoc(collection(db, 'clubs'), { name: newClub });
      setNewClub('');
      fetchClubs();
      setSuccess('Club created successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteClub = async (clubId) => {
    try {
      await deleteDoc(doc(db, 'clubs', clubId));
      fetchClubs();
      setSuccess('Club deleted successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGenerateAccessKey = async () => {
    if (!newAccessKey) {
      setError('Please enter an access key');
      return;
    }

    if (!keyClubId) {
      setError('Please select a club for this access key');
      return;
    }

    try {
      await addDoc(collection(db, 'accessKeys'), { 
        key: newAccessKey, 
        used: false,
        clubId: keyClubId,
        createdAt: new Date()
      });
      setNewAccessKey('');
      setKeyClubId('');
      fetchAccessKeys();
      setSuccess('Access key generated successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedClub || !selectedUser || !selectedRole) {
      setError('Please select a club, user, and role');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', selectedUser), { role: selectedRole, club: selectedClub });
      fetchUsers();
      setSuccess('Role assigned successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveUser = async (userId) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      fetchUsers();
      setSuccess('User removed successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  // Get club name by ID
  const getClubName = (clubId) => {
    const club = clubs.find(club => club.id === clubId);
    return club ? club.name : 'Unknown Club';
  };

  const handleInputChange = (e) => {
  const { name, value } = e.target;
  setNewMeeting((prev) => ({
    ...prev,
    [name]: value,
  }));
};


 

  // Update the MeetingModal component to have horizontal layout and blue borders
  const MeetingModal = () => (
    <div className="fixed inset-0 bg-black  bg-opacity-50 flex items-center justify-center z-50">
    <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-4xl m-4"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">Create New Meeting</h2>
        
        <form onSubmit={handleCreateMeeting} className="max-h-[80vh] overflow-y-auto space-y-6">
          {/* Club Selection - Full Width */}
          <div>
            <label className="block  text-sm font-medium text-gray-700 mb-1">Select Club</label>
            <select
              name="clubId"
              value={newMeeting.clubId}
              onChange={handleInputChange}
              className="w-full border border-blue-200 dark:bg-gray-800 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              required
            >
              <option value="">Select a club</option>
              {clubs.map(club => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </select>
          </div>
          
          {/* Meeting Name, Date & Time in a row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Name</label>
          <input
            type="text"
                name="name"
                value={newMeeting.name}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                className="w-full border border-blue-200 dark:bg-gray-800 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="Enter meeting name"
              required
            />
          </div>
            
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input 
              type="date" 
                name="date"
              value={newMeeting.date}
                onChange={handleInputChange}
                className="w-full border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              required
            />
          </div>
            
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input 
              type="time" 
                name="time"
              value={newMeeting.time}
                onChange={handleInputChange}
                className="w-full border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              required
            />
          </div>
          </div>
          
          {/* Mode & Location/Platform */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
              <select
                name="mode"
                value={newMeeting.mode}
                onChange={handleInputChange}
                className="w-full border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                <option value="offline">Offline</option>
                <option value="online">Online</option>
              </select>
            </div>
            
            {/* Conditional fields based on mode */}
            {newMeeting.mode === 'offline' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  name="location"
                  value={newMeeting.location}
                  onChange={handleInputChange}
                  className="w-full border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="">Select location</option>
                  <option value="South Enclave">South Enclave</option>
                  <option value="OAT">OAT</option>
                  <option value="Classroom">Classroom</option>
                  <option value="Food Court">Food Court</option>
                  <option value="Library">Library</option>
                  <option value="North Enclave">North Enclave</option>
                   <option value="Classroom">Biotech</option>
                    <option value="Other">Other</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select
                  name="platform"
                  value={newMeeting.platform}
                  onChange={handleInputChange}
                  className="w-full border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="">Select platform</option>
                  <option value="Discord">Discord</option>
                  <option value="Google Meet">Google Meet</option>
                  <option value="Zoom">Zoom</option>
                </select>
              </div>
            )}
          </div>

           {/* Location name - Conditional */}
          {newMeeting.mode === 'offline' && newMeeting.location === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
              <input
                type="text"
                name="locationname"
                value={newMeeting.locationname}
                onChange={handleInputChange}
                className="w-full border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="enter location name"
                required
              />
            </div>
          )}
          
          {/* Classroom Number - Conditional */}
          {newMeeting.mode === 'offline' && newMeeting.location === 'Classroom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Classroom Number</label>
              <input
                type="text"
                name="classroomNumber"
                value={newMeeting.classroomNumber}
                onChange={handleInputChange}
                className="w-full border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="e.g., AB1-201"
                required
              />
            </div>
          )}
         
          
          {/* Description with quick fill */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={newMeeting.description}
                onChange={handleInputChange}
                className="w-full border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                rows="4"
                placeholder="Enter meeting description"
                required
              ></textarea>
            </div>
            
            <div className="flex flex-col justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quick fill options:</label>
                <select 
                  className="w-full border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  onChange={(e) => {
                    if (e.target.value) {
                      setNewMeeting(prev => ({
                        ...prev,
                        description: e.target.value
                      }));
                    }
                  }}
                >
                  <option value="">Select a template...</option>
                  <option value="General meeting to discuss future planning">General meeting to discuss future planning</option>
                  <option value="Brainstorming session for upcoming event">Brainstorming session for upcoming event</option>
                  <option value="Member feedback & improvement planning">Member feedback & improvement planning</option>
                  <option value="Workshop prep discussion">Workshop prep discussion</option>
                  <option value="Guest speaker prep meet">Guest speaker prep meet</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={newMeeting.status}
                  onChange={handleInputChange}
                  className="w-full border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button 
              type="button"
              onClick={() => setShowMeetingModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create Meeting
          </button>
        </div>
        </form>
      </motion.div>
    </div>
  );

  // Using the extracted AttendanceMarker component
  const AttendanceModal = () => {
    if (!selectedMeeting) {
      return null;
    }
    
    return (
      <AttendanceMarker 
        meeting={selectedMeeting}
        clubId={selectedMeeting.clubId}
        onClose={() => setShowAttendanceModal(false)}
        onSuccess={(message) => {
          setSuccess(message);
          fetchMeetings(selectedMeeting.clubId);
        }}
      />
    );
  };

  // Key Generation Modal
  const KeyModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg p-6 w-96"
      >
        <h3 className="text-xl font-semibold mb-4">Generate Access Key</h3>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
            <input type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div className="flex justify-end space-x-2">
            <button 
              onClick={() => setShowKeyModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Generate
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Get club count
      const clubsRef = collection(db, 'clubs');
      const clubsSnapshot = await getDocs(clubsRef);
      const clubCount = clubsSnapshot.size;
      
      // Get member count across all clubs
      let totalMembers = 0;
      for (const clubDoc of clubsSnapshot.docs) {
        const membersRef = collection(db, 'clubs', clubDoc.id, 'members');
        const membersSnapshot = await getDocs(membersRef);
        totalMembers += membersSnapshot.size;
      }
      
      // Get meeting count
      let totalMeetings = 0;
      for (const clubDoc of clubsSnapshot.docs) {
        const meetingsRef = collection(db, 'clubs', clubDoc.id, 'meetings');
        const meetingsSnapshot = await getDocs(meetingsRef);
        totalMeetings += meetingsSnapshot.size;
      }
      
      // Calculate attendance rate based on meeting data
      let attendanceRate = 0;
      let meetingCount = 0;
      
      for (const clubDoc of clubsSnapshot.docs) {
        const meetingsRef = collection(db, 'clubs', clubDoc.id, 'meetings');
        const meetingsSnapshot = await getDocs(meetingsRef);
        
        for (const meetingDoc of meetingsSnapshot.docs) {
          const meetingData = meetingDoc.data();
          if (meetingData.attendanceMarked) {
            const membersRef = collection(db, 'clubs', clubDoc.id, 'members');
            const membersSnapshot = await getDocs(membersRef);
            const totalMembers = membersSnapshot.size;
            
            if (totalMembers > 0) {
              const attendeesCount = meetingData.attendees ? Object.keys(meetingData.attendees).length : 0;
              attendanceRate += (attendeesCount / totalMembers) * 100;
              meetingCount++;
            }
          }
        }
      }
      
      // Calculate average attendance rate
      const avgAttendanceRate = meetingCount > 0 ? Math.round(attendanceRate / meetingCount) : 0;
      
      setStats({
        clubs: clubCount,
        members: totalMembers,
        meetings: totalMeetings,
        attendance: avgAttendanceRate
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setLoading(false);
    }
  };

  // Update the meetings section to display meetings and allow absence requests
  const renderMeetings = () => (
    <div className="bg-white rounded-lg dark:bg-gray-700 shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Club Meetings</h2>
        <button
          onClick={() => setShowMeetingModal(true)}
          className="px-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
        >
          <Plus className="w-4 h-5 mr-1 font-bold" /> Create Meeting
        </button>
      </div>

      {/* Club selector for meetings */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Club</label>
        <select
          value={selectedClub}
          onChange={(e) => setSelectedClub(e.target.value)}
          className="w-full md:w-1/2 border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Select a club</option>
          {clubs.map(club => (
            <option key={club.id} value={club.id}>{club.name}</option>
          ))}
        </select>
      </div>

      {!selectedClub ? (
        <p className="text-center bg-white dark:bg-gray-800 text-gray-500 py-4">Please select a club to view meetings</p>
      ) : meetings.length === 0 ? (
        <p className="text-center bg-white text-gray-500 py-4">No meetings found for this club</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map(meeting => (
            <div
              key={meeting.id}
              className={`bg-white dark:bg-gray-800 dark:text-white border rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow ${
                meeting.status === 'cancelled' ? 'border-red-300 bg-red-50' :
                meeting.status === 'past' ? 'border-gray-300 bg-gray-50' :
                'border-green-300 bg-green-50'
              }`}
            >
              <div className="flex flex-col gap-2 items-start mb-3">
                <h3 className="text-lg font-semibold">{meeting.name}</h3>
             
                <div className="flex space-x-1">
                  <span className={`text-xs font-medium px-1 py-1 justify-center items-center rounded-full ${
                    meeting.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                    meeting.status === 'past' ? 'bg-gray-100  text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                  </span>
                  
                  {meeting.attendanceMarked && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full  bg-blue-100 text-blue-800">
                      Attendance Marked
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center dark:text-white text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm dark:text-white">{meeting.date}</span>
                </div>
                <div className="flex items-center dark:text-white text-gray-600">
                  <Clock className="w-4 h-4 dark:text-white mr-2" />
                  <span className="text-sm dark:text-white">{meeting.time}</span>
                </div>
                
                {/* Show location or platform based on mode */}
                <div className="flex items-center dark:text-white text-gray-600">
                  {meeting.mode === 'offline' ? (
                    <>
                      <Map className="w-4 h-4 mr-2" />
                      <span className="text-sm dark:text-white">
                        {meeting.location}
                        {meeting.location === 'Classroom' && meeting.classroomNumber && ` (${meeting.classroomNumber})`}
                      </span>
                    </>
                  ) : (
                    <>
                      <Laptop className="w-4 h-4 mr-2" />
                      <span className="text-sm dark:text-white">{meeting.platform}</span>
                    </>
                  )}
                </div>
                
                {/* Description */}
                <div className="flex items-start text-gray-600">
                  <FileText className="w-4 h-4 mr-2 mt-1 dark:text-white" />
                  <span className="text-sm dark:text-white">{meeting.description}</span>
                </div>
                
                {/* Attendance Stats */}
                {meeting.attendanceMarked && meeting.attendees && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-white">Attendance:</span>
                      <span className="font-semibold text-blue-600">
                        {Object.keys(meeting.attendees).length} members present
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleMarkAttendance(meeting)}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center"
                  >
                    <CheckSquare className="w-3 h-3 mr-1" />
                    Mark Attendance
                  </button>
                  
                  <button
                    onClick={() => handleViewAbsenceRequests(meeting.id, selectedClub)}
                    className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 flex items-center"
                  >
                    <Users className="w-3 h-3 mr-1" />
                    View Absences
                  </button>
                </div>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleDeleteMeeting(meeting.id, selectedClub)}
                    className="text-xs p-1 text-red-500 bg-blue-200 hover:bg-red-100 rounded-md"
                    title="Delete Meeting"
                  >
                    <Trash2 className="w-4 h-4 " />
                  </button>
                  
                  <button
                    onClick={() => handleUpdateMeetingStatus(meeting.id, selectedClub, 
                      meeting.status === 'upcoming' ? 'past' : 
                      meeting.status === 'past' ? 'cancelled' : 'upcoming'
                    )}
                    className="text-xs p-1 text-white hover:bg-blue-100 rounded-md"
                    title="Change Status"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Handle viewing absence requests for a meeting
  const handleViewAbsenceRequests = async (meetingId, clubId) => {
    try {
      // Get meeting details
      const meetingDoc = await getDoc(doc(db, 'clubs', clubId, 'meetings', meetingId));
      
      if (meetingDoc.exists()) {
        const meetingData = {
          id: meetingDoc.id,
          ...meetingDoc.data()
        };
        
        setSelectedMeetingForAbsence({
          id: meetingId,
          clubId: clubId,
          name: meetingData.name
        });
        
        setShowAbsenceModal(true);
      } else {
        setError('Meeting not found');
      }
    } catch (err) {
      setError('Failed to fetch meeting details');
      console.error(err);
    }
  };

  // Handle marking attendance for a meeting
  const handleMarkAttendance = (meeting) => {
    
    if (!meeting || !meeting.id) {
      console.error('Invalid meeting data:', meeting);
      setError('Cannot mark attendance: Invalid meeting data');
      return;
    }
    
    // Set the selected meeting with all necessary data
    setSelectedMeeting({
      id: meeting.id,
      name: meeting.name || 'Unnamed Meeting',
      date: meeting.date || 'No date',
      time: meeting.time || 'No time',
      clubId: selectedClub,
      mode: meeting.mode || 'offline',
      location: meeting.location || '',
      platform: meeting.platform || '',
      status: meeting.status || 'upcoming',
      description: meeting.description || '',
      attendees: meeting.attendees || {}
    });
    
    setError(''); // Clear any previous errors
    setShowAttendanceModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-1 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen"
    >
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
          </div>
      )}
      
      {/* Admin Dashboard Tabs */}
   <motion.div
  initial={{ y: -20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.3 }}
  className="flex justify-center mb-8 sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-2 rounded-xl shadow-md"
>
  <nav className="flex items-center gap-1 lg:gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-2 py-1 shadow-inner">
    {[
      { key: 'meetings', icon: <Calendar className="w-5 h-5 mr-1" />, label: 'Meetings', color: 'bg-blue-600' },
      { key: 'clubs', icon: <Users className="w-5 h-5 mr-1" />, label: 'Clubs', color: 'bg-purple-600' },
      { key: 'members', icon: <User className="w-5 h-5 mr-1" />, label: 'Members', color: 'bg-green-600' },
      { key: 'analytics', icon: <BarChart2 className="w-5 h-5 mr-1" />, label: 'Analysis', color: 'bg-orange-600' },
    ].map(({ key, icon, label, color }) => {
      const isActive = activeTab === key;
      return (
        <motion.button
          key={key}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab(key)}
          className={`relative px-4 py-2 font-medium text-sm rounded-full transition-all duration-200 flex items-center justify-center
            ${isActive
              ? `${color} text-white shadow-lg ml-1`
              : 'bg-white hover:bg-blue-100 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-500 dark:text-blue-300'}
          `}
        >
          {icon}
          {/* Show label always if active, else only on md+ screens */}
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: isActive || window.innerWidth >= 768 ? 1 : 0, x: isActive ? 0 : -8 }}
            className={`ml-2 ${
              isActive ? '' : 'hidden md:inline-block'
            } whitespace-nowrap transition-opacity duration-200`}
          >
            {label}
          </motion.span>
        </motion.button>
      );
    })}
  </nav>
</motion.div>


        
      {/* Content based on active tab */}
      {activeTab === 'meetings' && renderMeetings()}
      
      {activeTab === 'clubs' && (
      <ClubManagement />
      )}
      
      {activeTab === 'members' && (
        <>
          <ClubMemberManagement />
          <div className="mt-8">
            <UserRoleManagement />
          </div>
        </>
      )}
      
      {/* Analytics Section */}
      {activeTab === 'analytics' && (
        <div className="mt-6">
          <div className="bg-white p-2 dark:bg-gray-800 rounded-xl shadow lg:p-6">
            <h2 className="text-xl dark:text-white ml-2 dark:bg-gray-800 font-bold text-secondary-900 mb-6">Club Analytics</h2>
            
            {/* Club Selection Dropdown */}
            <div className="mb-6">
              <label htmlFor="analyticsClub" className="block bg-white ml-2 dark:bg-gray-800 dark:text-white text-sm font-medium text-gray-700 mb-2">
                Select Club for Analysis
              </label>
              <select
                id="analyticsClub"
                value={analyticsClubId}
                onChange={(e) => setAnalyticsClubId(e.target.value)}
                className="block w-full md:w-1/3 bg-white dark:bg-gray-800 dark:text-white  rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Select a club</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
            
            {analyticsClubId ? (
              <AttendanceChart clubId={analyticsClubId} />
            ) : (
              <div className="bg-yellow-50 dark:bg-gray-800 text-yellow-800 p-4 rounded-md">
                Please select a club to view analytics
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modals */}
      {showMeetingModal && <MeetingModal />}
      {showAttendanceModal && <AttendanceModal />}
      {showKeyModal && <KeyModal />}
      
      {/* Absence Request Modal */}
      {showAbsenceModal && selectedMeetingForAbsence && (
        <AbsenceRequestModal
          isOpen={showAbsenceModal}
          onClose={() => setShowAbsenceModal(false)}
          meetingId={selectedMeetingForAbsence.id}
          clubId={selectedMeetingForAbsence.clubId}
          meetingName={selectedMeetingForAbsence.name}
        />
      )}
      
    </motion.div>
  );
};

export default AdminDashboard;