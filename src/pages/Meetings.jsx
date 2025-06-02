import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, Users, MapPin, Laptop, FileText, Check, X, UserX } from 'lucide-react';
import AbsenceRequestModal from '../components/meetings/AbsenceRequestModal';
import Loader from '../components/Loader';

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userClubs, setUserClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState('');
  const { currentUser, userProfile } = useAuth();
  
  // State for absence request modal
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [selectedMeetingForAbsence, setSelectedMeetingForAbsence] = useState(null);
  const [userAbsenceRequests, setUserAbsenceRequests] = useState({});
  
  // Add these new state variables
  const [showAbsentMembers, setShowAbsentMembers] = useState(false);
  const [absentMembers, setAbsentMembers] = useState({});
  const [clubMembers, setClubMembers] = useState({});

  useEffect(() => {
    if (currentUser) {
      fetchUserClubs();
      fetchUserAbsenceRequests();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedClub) {
      fetchMeetings(selectedClub);
    }
  }, [selectedClub]);
  
  // Add this useEffect inside the component
  useEffect(() => {
    if (selectedClub) {
      fetchClubMembers(selectedClub);
    }
  }, [selectedClub]);

  const fetchUserClubs = async () => {
    try {
      // Fetch the clubs the user has joined - check all possible data structures
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      
      let clubIds = [];
      
      // Check different possible data structures
      if (userData?.clubsJoined && Object.keys(userData.clubsJoined).length > 0) {
        // Format: { clubId1: {data}, clubId2: {data} }
        clubIds = Object.keys(userData.clubsJoined);
      } else if (userData?.clubs && Array.isArray(userData.clubs)) {
        // Format: ['clubId1', 'clubId2']
        clubIds = userData.clubs;
      } else {
        // Fallback: search club members collections
        console.log("No clubs found in user document, searching club members collections...");
        const clubsRef = collection(db, 'clubs');
        const clubsSnapshot = await getDocs(clubsRef);
        
        for (const clubDoc of clubsSnapshot.docs) {
          const memberRef = doc(db, 'clubs', clubDoc.id, 'members', currentUser.uid);
          const memberDoc = await getDoc(memberRef);
          if (memberDoc.exists()) {
            clubIds.push(clubDoc.id);
          }
        }
      }
      
      const clubDetails = [];
      
      // Fetch details for each club
      for (const clubId of clubIds) {
        const clubDocRef = doc(db, 'clubs', clubId);
        const clubDoc = await getDoc(clubDocRef);
        
        if (clubDoc.exists()) {
          clubDetails.push({
            id: clubDoc.id,
            name: clubDoc.data().name
          });
        }
      }
      
      console.log("Found clubs for user:", clubDetails.length);
      setUserClubs(clubDetails);
      
      // If there's only one club, select it automatically
      if (clubDetails.length === 1) {
        setSelectedClub(clubDetails[0].id);
      }
    } catch (err) {
      setError('Failed to fetch user clubs: ' + err.message);
      console.error(err);
    }
  };

  const fetchMeetings = async (clubId) => {
    try {
      setLoading(true);
      
      // Get all club's meetings - we don't need to check for access key anymore,
      // all club members should see all meetings
      const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
      const querySnapshot = await getDocs(meetingsRef);
      
      const meetingsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        clubId: clubId,
        ...doc.data()
      }));
      
      console.log(`Found ${meetingsList.length} meetings for club ${clubId}`);
      
      // Sort meetings by date and time
      meetingsList.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        
        // Put upcoming meetings first, then sort by date
        if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
        if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;
        
        return dateA - dateB;
      });
      
      setMeetings(meetingsList);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch meetings: ' + err.message);
      setLoading(false);
      console.error(err);
    }
  };

  const fetchUserAbsenceRequests = async () => {
    try {
      if (!currentUser) return;
      
      // Fetch user's clubs
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userClubs = userDoc.data()?.clubsJoined || {};
      
      let absenceRequestsMap = {};
      
      // For each club the user is part of, fetch meetings and check for absence requests
      for (const clubId of Object.keys(userClubs)) {
        // Get all meetings for this club
        const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
        const meetingsSnapshot = await getDocs(meetingsRef);
        
        // For each meeting, check if the user has an absence request
        for (const meetingDoc of meetingsSnapshot.docs) {
          const meetingId = meetingDoc.id;
          
          // Check absences collection for this meeting
          const absencesRef = collection(db, 'clubs', clubId, 'meetings', meetingId, 'absences');
          const q = query(absencesRef, where('userId', '==', currentUser.uid));
          const absencesSnapshot = await getDocs(q);
          
          if (!absencesSnapshot.empty) {
            // User has an absence request for this meeting
            absenceRequestsMap[meetingId] = {
              status: absencesSnapshot.docs[0].data().status,
              requestId: absencesSnapshot.docs[0].id
            };
          }
        }
      }
      
      setUserAbsenceRequests(absenceRequestsMap);
    } catch (err) {
      console.error('Error fetching user absence requests:', err);
    }
  };

  const handleRequestAbsence = (meeting) => {
    setSelectedMeetingForAbsence({
      id: meeting.id,
      clubId: selectedClub,
      name: meeting.name
    });
    setShowAbsenceModal(true);
  };

  // Function to close the absence modal and refresh absence requests
  const handleCloseAbsenceModal = () => {
    setShowAbsenceModal(false);
    fetchUserAbsenceRequests();
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-64 mt-10"
      >
        <Loader size="large" />
        <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg">Loading meetings...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container mx-auto p-1"
    >
      <h1 className="text-3xl font-bold mb-6">Meetings</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p>{error}</p>
        </div>
      )}
      
      {/* Club selection dropdown */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Club
        </label>
        <select
          value={selectedClub}
          onChange={(e) => setSelectedClub(e.target.value)}
          className="block w-full md:w-1/3 p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a club</option>
          {userClubs.map(club => (
            <option key={club.id} value={club.id}>{club.name}</option>
          ))}
        </select>
      </div>
      
      {/* Show message when user hasn't selected a club */}
      {!selectedClub && userClubs.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-4 mb-6 rounded">
          <p>Please select a club to view meetings.</p>
        </div>
      )}
      
      {/* Show message when user hasn't joined any clubs */}
      {userClubs.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-4 mb-6 rounded"
        >
          <h3 className="font-bold text-lg mb-2">No Clubs Joined</h3>
          <p>You haven't joined any clubs yet. Please join a club to view meetings.</p>
        </motion.div>
      )}
      
      {/* Show message when club is selected but no meetings exist */}
      {selectedClub && meetings.length === 0 && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center"
        >
          <Calendar className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Meetings Available</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            There are no meetings scheduled for this club at the moment. Check back later for updates.
          </p>
        </motion.div>
      )}
      
      {/* Meetings grid */}
      {selectedClub && meetings.length > 0 && (
        <div className="space-y-8">
          {/* Upcoming Meetings */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Upcoming Meetings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meetings.filter(m => m.status === 'upcoming').map(meeting => (
                <div
                  key={meeting.id}
                  className={`bg-white dark:bg-gray-900 dark:text-white border-bottom border-2 border-gray-500 rounded-lg shadow-md p-6 ${
                    meeting.status === 'cancelled' ? 'border-l-4 border-red-500 bg-red-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold dark:text-white">{meeting.name}</h2>
                    {/* Delete button can go here if needed */}
                  </div>
                  
                  {/* Description below heading */}
                  <div className="flex items-start text-gray-600 dark:text-gray-300 mb-4">
                    <FileText className="w-5 h-5 mr-2 mt-1 flex-shrink-0" />
                    <p className="text-sm">{meeting.description}</p>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center dark:text-white text-gray-600">
                      <Calendar className="w-5 h-5 mr-2" />
                      <span>{meeting.date}</span>
                    </div>
                    <div className="flex items-center dark:text-white text-gray-600">
                      <Clock className="w-5 h-5 mr-2 dark:text-white" />
                      <span>{meeting.time}</span>
                    </div>
                    
                    {/* Meeting Mode - Online/Offline */}
                    <div className="flex dark:text-white items-center text-gray-600">
                      {meeting.mode === 'offline' ? (
                        <>
                          <MapPin className="w-5 h-5 mr-2 dark:text-white" />
                          <span>
                            {meeting.location}
                            {meeting.location === 'Classroom' && meeting.classroomNumber && ` (${meeting.classroomNumber})`}
                          </span>
                        </>
                      ) : (
                        <>
                          <Laptop className="w-5 h-5 mr-2 dark:text-white" />
                          <span>{meeting.platform}</span>
                        </>
                      )}
                    </div>
                    
                    {/* Absence Request Status if exists */}
                    {userAbsenceRequests[meeting.id] && (
                      <div className={`mt-2 px-3 py-2 rounded-md text-sm ${
                        userAbsenceRequests[meeting.id].status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : userAbsenceRequests[meeting.id].status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        <div className="flex items-center">
                          {userAbsenceRequests[meeting.id].status === 'approved' 
                            ? <Check className="w-4 h-4 mr-1" /> 
                            : userAbsenceRequests[meeting.id].status === 'rejected'
                            ? <X className="w-4 h-4 mr-1" />
                            : <Clock className="w-4 h-4 mr-1" />
                          }
                          <span>Absence request: <strong>{userAbsenceRequests[meeting.id].status}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Don't show request absence button if user already has an absence request */}
                  {!userAbsenceRequests[meeting.id] && (
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => handleRequestAbsence(meeting)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                      >
                        Request Absence
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {meetings.filter(m => m.status === 'upcoming').length === 0 && (
                <div className="col-span-full text-center py-6">
                  <p className="text-gray-500">No upcoming meetings found</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Past Meetings */}
          {meetings.filter(m => m.status === 'past').length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Past Meetings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetings.filter(m => m.status === 'past').map(meeting => (
                  <div
                    key={meeting.id}
                    className="bg-white dark:bg-gray-800 dark:text-white rounded-lg border-l-4 border-gray-300 shadow-md p-6"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-xl font-semibold">{meeting.name}</h2>
                      {/* Delete button can go here if needed */}
                    </div>
                    
                    {/* Description below heading */}
                    <div className="flex items-start dark:text-gray-300 text-gray-600 mb-4">
                      <FileText className="w-5 h-5 mr-2 mt-1 flex-shrink-0" />
                      <p className="text-sm">{meeting.description}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center dark:text-gray-300 text-gray-600">
                        <Calendar className="w-5 h-5 mr-2" />
                        <span>{meeting.date}</span>
                      </div>
                      
                      {meeting.attendees && (
                        <div className="flex items-center dark:text-gray-300 text-gray-600">
                          <Users className="w-5 h-5 mr-2" />
                          <span>{Object.keys(meeting.attendees).length} attendees</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Cancelled Meetings */}
          {meetings.filter(m => m.status === 'cancelled').length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Cancelled Meetings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetings.filter(m => m.status === 'cancelled').map(meeting => (
                  <div
                    key={meeting.id}
                    className="bg-white dark:bg-gray-900 dark:text-white border-bottom border-2 border-gray-500 rounded-lg border-l-4 border-red-500 shadow-md p-6 bg-red-50"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-xl dark:text-white font-semibold">{meeting.name}</h2>
                      {/* Delete button can go here if needed */}
                    </div>
                    
                    {/* Description below heading */}
                    <div className="flex items-start dark:text-white text-gray-600 mb-4">
                      <FileText className="w-5 h-5 mr-2 mt-1 flex-shrink-0" />
                      <p className="text-sm dark:text-white">{meeting.description}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center dark:text-white text-gray-600">
                        <Calendar className="w-5 h-5 mr-2 dark:text-white" />
                        <span>{meeting.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Absence Request Modal */}
      {showAbsenceModal && selectedMeetingForAbsence && (
        <AbsenceRequestModal
          isOpen={showAbsenceModal}
          onClose={handleCloseAbsenceModal}
          meetingId={selectedMeetingForAbsence.id}
          clubId={selectedMeetingForAbsence.clubId}
          meetingName={selectedMeetingForAbsence.name}
        />
      )}
    </motion.div>
  );
}

const fetchClubMembers = async (clubId) => {
  try {
    const membersRef = collection(db, 'clubs', clubId, 'members');
    const membersSnapshot = await getDocs(membersRef);
    
    const members = {};
    membersSnapshot.docs.forEach(doc => {
      members[doc.id] = {
        id: doc.id,
        ...doc.data(),
        displayName: doc.data().displayName || 'Unknown User'
      };
    });
    
    setClubMembers(members);
  } catch (err) {
    console.error('Error fetching club members:', err);
  }
};

const fetchAbsentMembers = async (meetingId) => {
  try {
    if (!selectedClub || !meetingId) return;
    
    // Get all approved absence requests for this meeting
    const absencesRef = collection(db, 'clubs', selectedClub, 'meetings', meetingId, 'absences');
    const q = query(absencesRef, where('status', '==', 'approved'));
    const absencesSnapshot = await getDocs(q);
    
    const absences = {};
    absencesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      absences[data.userId] = {
        id: doc.id,
        ...data,
        reason: data.reason || 'No reason provided'
      };
    });
    
    setAbsentMembers(prev => ({
      ...prev,
      [meetingId]: absences
    }));
  } catch (err) {
    console.error('Error fetching absent members:', err);
  }
};

const toggleAbsentMembers = async (meetingId) => {
  // If we're showing absent members and don't have them loaded yet, fetch them
  if (!absentMembers[meetingId]) {
    await fetchAbsentMembers(meetingId);
  }
  
  setShowAbsentMembers(prev => !prev);
};