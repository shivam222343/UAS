import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, Users, MapPin, Laptop, FileText, Check, X, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import AbsenceRequestModal from '../components/meetings/AbsenceRequestModal';
import TaskModal from '../components/meetings/TaskModal';
import Loader from '../components/Loader';

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [error, setError] = useState('');
  const [userClubs, setUserClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState('');
  const { currentUser, userProfile } = useAuth();

  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [selectedMeetingForAbsence, setSelectedMeetingForAbsence] = useState(null);
  const [userAbsenceRequests, setUserAbsenceRequests] = useState({});

  const [showAbsentMembers, setShowAbsentMembers] = useState(false);
  const [absentMembers, setAbsentMembers] = useState({});
  const [clubMembers, setClubMembers] = useState({});

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedMeetingForTask, setSelectedMeetingForTask] = useState(null);
  const [meetingTasks, setMeetingTasks] = useState({});
  const [showAllTasks, setShowAllTasks] = useState({});

  // New state for tasks popup
  const [showAllTasksPopup, setShowAllTasksPopup] = useState(false);
  const [selectedMeetingForTasksPopup, setSelectedMeetingForTasksPopup] = useState(null);

  // New: Sort order state
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      setTimeoutReached(true);
    }, 10000);
    return () => clearTimeout(loadingTimeout);
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUserClubs();
      fetchUserAbsenceRequests();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedClub) {
      fetchMeetings(selectedClub);
      fetchClubMembers(selectedClub);
    }
    // eslint-disable-next-line
  }, [selectedClub, sortOrder]);

  const fetchUserClubs = async () => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      let clubIds = [];

      if (userData?.clubsJoined && Object.keys(userData.clubsJoined).length > 0) {
        clubIds = Object.keys(userData.clubsJoined);
      } else if (userData?.clubs && Array.isArray(userData.clubs)) {
        clubIds = userData.clubs;
      } else {
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

      setUserClubs(clubDetails);

      if (clubDetails.length === 1) {
        setSelectedClub(clubDetails[0].id);
      }
    } catch (err) {
      setError('Failed to fetch user clubs: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Updated: fetchMeetings with sortOrder
  const fetchMeetings = async (clubId) => {
    try {
      setLoading(true);
      const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
      const querySnapshot = await getDocs(meetingsRef);

      let meetingsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        clubId: clubId,
        ...doc.data()
      }));

      meetingsList.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);

        if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
        if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;

        // Sort by date based on sortOrder
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });

      setMeetings(meetingsList);
      meetingsList.forEach(meeting => {
        fetchMeetingTasks(meeting.id);
      });
    } catch (err) {
      setError('Failed to fetch meetings: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAbsenceRequests = async () => {
    try {
      if (!currentUser) return;

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userClubs = userDoc.data()?.clubsJoined || {};

      let absenceRequestsMap = {};

      for (const clubId of Object.keys(userClubs)) {
        const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
        const meetingsSnapshot = await getDocs(meetingsRef);

        for (const meetingDoc of meetingsSnapshot.docs) {
          const meetingId = meetingDoc.id;

          const absencesRef = collection(db, 'clubs', clubId, 'meetings', meetingId, 'absences');
          const q = query(absencesRef, where('userId', '==', currentUser.uid));
          const absencesSnapshot = await getDocs(q);

          if (!absencesSnapshot.empty) {
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

  const fetchMeetingTasks = async (meetingId) => {
    try {
      if (!selectedClub || !meetingId) return;

      const tasksRef = collection(db, 'clubs', selectedClub, 'meetings', meetingId, 'tasks');
      const tasksSnapshot = await getDocs(tasksRef);

      const tasks = {};
      tasksSnapshot.docs.forEach(doc => {
        tasks[doc.id] = {
          id: doc.id,
          ...doc.data()
        };
      });

      setMeetingTasks(prev => ({
        ...prev,
        [meetingId]: tasks
      }));
    } catch (err) {
      console.error('Error fetching meeting tasks:', err);
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

  const handleCloseAbsenceModal = () => {
    setShowAbsenceModal(false);
    fetchUserAbsenceRequests();
  };

  const handleManageTasks = (meeting) => {
    setSelectedMeetingForTask({
      id: meeting.id,
      clubId: selectedClub,
      name: meeting.name
    });
    setShowTaskModal(true);
  };

  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
    if (selectedMeetingForTask) {
      fetchMeetingTasks(selectedMeetingForTask.id);
    }
  };

  const toggleAbsentMembers = async (meetingId) => {
    if (!absentMembers[meetingId]) {
      await fetchAbsentMembers(meetingId);
    }
    setShowAbsentMembers(prev => !prev);
  };

  const toggleShowAllTasks = (meetingId) => {
    setShowAllTasks(prev => ({
      ...prev,
      [meetingId]: !prev[meetingId]
    }));
  };

  const handleShowAllTasks = (meeting) => {
    setSelectedMeetingForTasksPopup({
      id: meeting.id,
      name: meeting.name,
      date: meeting.date
    });
    setShowAllTasksPopup(true);
  };

  const handleTaskStatusChange = async (meetingId, taskId, userId, isCompleted) => {
    try {
      const taskRef = doc(db, 'clubs', selectedClub, 'meetings', meetingId, 'tasks', taskId);

      await updateDoc(taskRef, {
        [`completion.${userId}`]: isCompleted
      });

      fetchMeetingTasks(meetingId);
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  // NEW: Admin can change meeting status
  const handleMeetingStatusChange = async (meetingId, newStatus) => {
    try {
      const meetingRef = doc(db, 'clubs', selectedClub, 'meetings', meetingId);
      await updateDoc(meetingRef, { status: newStatus });
      fetchMeetings(selectedClub);
    } catch (err) {
      setError('Failed to update meeting status: ' + err.message);
    }
  };

  if (loading && !timeoutReached) {
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

  // Function to render text with preserved formatting
  const renderFormattedText = (text) => {
    if (!text) return null;
    
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        <br />
      </span>
    ));
  };

  // Function to render task description with limited lines
  const renderTaskDescriptionPreview = (description) => {
    if (!description) return null;
    
    const lines = description.split('\n');
    const previewLines = lines.slice(0, 2); // Show first 2 lines
    
    return (
      <>
        {previewLines.map((line, i) => (
          <span key={i}>
            {line}
            <br />
          </span>
        ))}
        {lines.length > 2 && <span className="text-gray-500">...</span>}
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container mx-auto p-2"
    >
      <h1 className="text-3xl font-bold mb-6">Meetings</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p>{error}</p>
        </div>
      )}

      {/* Sort Option */}
      <div className="flex items-center mb-4">
        <label className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
        <select
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value)}
          className="p-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

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

      {!selectedClub && userClubs.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-4 mb-6 rounded">
          <p>Please select a club to view meetings.</p>
        </div>
      )}

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

      {selectedClub && meetings.length > 0 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Upcoming Meetings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meetings.filter(m => m.status === 'upcoming').map(meeting => (
                <div
                  key={meeting.id}
                  className={`bg-white dark:bg-gray-900 dark:text-white border-bottom border-2 border-gray-500 rounded-lg shadow-md p-6 ${meeting.status === 'cancelled' ? 'border-l-4 border-red-500 bg-red-50' : ''
                    }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold dark:text-white">{meeting.name}</h2>
                    {/* Admin status change dropdown */}
                    {userProfile?.role === 'admin' && (
                      <select
                        value={meeting.status}
                        onChange={e => handleMeetingStatusChange(meeting.id, e.target.value)}
                        className="ml-2 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white dark:bg-gray-800"
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="past">Past</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                  </div>

                  <div className="flex items-start text-gray-600 dark:text-gray-300 mb-4">
                    <FileText className="w-5 h-5 mr-2 mt-1 flex-shrink-0" />
                    <p className="text-sm whitespace-pre-wrap">{renderFormattedText(meeting.description)}</p>
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

                    {userAbsenceRequests[meeting.id] && (
                      <div className={`mt-2 px-3 py-2 rounded-md text-sm ${userAbsenceRequests[meeting.id].status === 'approved'
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

                  <div className="flex justify-end space-x-2 mt-4">
                    {!userAbsenceRequests[meeting.id] && (
                      <button
                        onClick={() => handleRequestAbsence(meeting)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                      >
                        Request Absence
                      </button>
                    )}
                    {userProfile?.role === 'admin' && (
                      <button
                        onClick={() => handleManageTasks(meeting)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Tasks
                      </button>
                    )}
                  </div>

                  {(meetingTasks[meeting.id] && Object.keys(meetingTasks[meeting.id]).length > 0) && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
                          Tasks ({Object.keys(meetingTasks[meeting.id]).length})
                        </h3>
                        <button
                          onClick={() => handleShowAllTasks(meeting)}
                          className="text-blue-600 dark:text-blue-400 text-sm flex items-center"
                        >
                          <ChevronDown className="w-4 h-4 mr-1 text-white" />
                          <div className='text-white'> Show All</div>
                        </button>
                      </div>

                      <ul className="space-y-2">
                        {Object.values(meetingTasks[meeting.id])
                          .slice(0, 1)
                          .map(task => (
                            <li key={task.id} className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <div className="flex justify-between">
                                <span className="font-medium">{task.title}</span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                {renderTaskDescriptionPreview(task.description)}
                              </p>

                              {task.assignedTo && Object.keys(task.assignedTo).length > 0 && (
                                <div className="mt-2 space-y-2">
                                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Assigned Members:
                                  </h4>
                                  <ul className="space-y-1">
                                    {Object.entries(task.assignedTo).map(([userId, isAssigned]) => {
                                      if (!isAssigned) return null;
                                      const member = clubMembers[userId];
                                      if (!member) return null;

                                      const isAssignedToCurrentUser = userId === currentUser.uid;
                                      const isCompleted = task.completion?.[userId] || false;

                                      return (
                                        <li key={userId} className="flex items-center justify-between">
                                          <span className="text-sm">
                                            {member.displayName}
                                            {isAssignedToCurrentUser && (
                                              <span className="ml-1 text-xs text-blue-500">(You)</span>
                                            )}
                                          </span>
                                          {isAssignedToCurrentUser && (
                                            <button
                                              onClick={() => handleTaskStatusChange(
                                                meeting.id,
                                                task.id,
                                                userId,
                                                !isCompleted
                                              )}
                                              className={`px-2 py-0.5 rounded text-xs ${isCompleted
                                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                }`}
                                            >
                                              {isCompleted ? 'Completed' : 'Pending'}
                                            </button>
                                          )}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              )}

                              <div className="flex justify-between text-xs mt-2">
                                {task.dueDate && (
                                  <span className="text-gray-500 dark:text-gray-400">
                                    Due: {task.dueDate}
                                  </span>
                                )}
                              </div>
                            </li>
                          ))}
                      </ul>
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
                      {/* Admin status change dropdown */}
                      {userProfile?.role === 'admin' && (
                        <select
                          value={meeting.status}
                          onChange={e => handleMeetingStatusChange(meeting.id, e.target.value)}
                          className="ml-2 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white dark:bg-gray-800"
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="past">Past</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}
                    </div>

                    <div className="flex items-start dark:text-gray-300 text-gray-600 mb-4">
                      <FileText className="w-5 h-5 mr-2 mt-1 flex-shrink-0" />
                      <p className="text-sm whitespace-pre-wrap">{renderFormattedText(meeting.description)}</p>
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

                    {(meetingTasks[meeting.id] && Object.keys(meetingTasks[meeting.id]).length > 0) && (
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
                            Tasks ({Object.keys(meetingTasks[meeting.id]).length})
                          </h3>
                          <div
                            onClick={() => handleShowAllTasks(meeting)}
                            className="bg-transparent text-blue-500 dark:text-blue-400 text-sm flex items-center"
                          >
                            <ChevronDown className="w-4 h-4 mr-1 dark:text-white cursor-pointer" />
                            <div className='dark:text-white cursor-pointer text-blue-500'> Show All</div>
                          </div>
                        </div>

                        <ul className="space-y-2">
                          {Object.values(meetingTasks[meeting.id])
                            .slice(0, 1)
                            .map(task => (
                              <li key={task.id} className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                <div className="flex justify-between">
                                  <span className="font-medium">{task.title}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                  {renderTaskDescriptionPreview(task.description)}
                                </p>

                                {task.assignedTo && Object.keys(task.assignedTo).length > 0 && (
                                  <div className="mt-2 space-y-2">
                                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                      Assigned Members:
                                    </h4>
                                    <ul className="space-y-1">
                                      {Object.entries(task.assignedTo).map(([userId, isAssigned]) => {
                                        if (!isAssigned) return null;
                                        const member = clubMembers[userId];
                                        if (!member) return null;

                                        const isAssignedToCurrentUser = userId === currentUser.uid;
                                        const isCompleted = task.completion?.[userId] || false;

                                        return (
                                          <li key={userId} className="flex items-center justify-between">
                                            <span className="text-sm">
                                              {member.displayName}
                                              {userId === currentUser.uid && (
                                                <span className="ml-1 text-xs text-blue-500">(You)</span>
                                              )}
                                            </span>
                                            {isAssignedToCurrentUser ? (
                                              <button
                                                onClick={() => handleTaskStatusChange(
                                                  meeting.id,
                                                  task.id,
                                                  userId,
                                                  !isCompleted
                                                )}
                                                className={`px-2 py-0.5 rounded text-xs ${isCompleted
                                                    ? 'bg-green-100 text-green-800 hover:text-white dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-yellow-100 text-yellow-800 hover:text-white dark:bg-yellow-900 dark:text-yellow-200'
                                                  }`}
                                              >
                                                {isCompleted ? 'Completed' : 'Pending'}
                                              </button>
                                            ) : (
                                              <span className={`px-2 py-0.5 rounded text-xs ${isCompleted
                                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                }`}>
                                                {isCompleted ? 'Completed' : 'Pending'}
                                              </span>
                                            )}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                )}

                                <div className="flex justify-between text-xs mt-2">
                                  {task.dueDate && (
                                    <span className="text-gray-500 dark:text-gray-400">
                                      Due: {task.dueDate}
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {meetings.filter(m => m.status === 'cancelled').length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Cancelled Meetings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetings.filter(m => m.status === 'cancelled').map(meeting => (
                  <div
                    key={meeting.id}
                    className="bg-white dark:bg-gray-900 dark:text-white border-bottom border-2 rounded-lg border-l-4 border-red-500 shadow-md p-6 "
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-xl dark:text-white font-semibold">{meeting.name}</h2>
                      {/* Admin status change dropdown */}
                      {userProfile?.role === 'admin' && (
                        <select
                          value={meeting.status}
                          onChange={e => handleMeetingStatusChange(meeting.id, e.target.value)}
                          className="ml-2 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white dark:bg-gray-800"
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="past">Past</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}
                    </div>

                    <div className="flex items-start dark:text-white text-gray-600 mb-4">
                      <FileText className="w-5 h-5 mr-2 mt-1 flex-shrink-0" />
                      <p className="text-sm dark:text-white whitespace-pre-wrap">{renderFormattedText(meeting.description)}</p>
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

      {showAbsenceModal && selectedMeetingForAbsence && (
        <AbsenceRequestModal
          isOpen={showAbsenceModal}
          onClose={handleCloseAbsenceModal}
          meetingId={selectedMeetingForAbsence.id}
          clubId={selectedMeetingForAbsence.clubId}
          meetingName={selectedMeetingForAbsence.name}
        />
      )}

      {showTaskModal && selectedMeetingForTask && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={handleCloseTaskModal}
          meetingId={selectedMeetingForTask.id}
          clubId={selectedMeetingForTask.clubId}
          meetingName={selectedMeetingForTask.name}
          clubMembers={clubMembers}
        />
      )}

      {/* All Tasks Popup */}
      <AnimatePresence>
        {showAllTasksPopup && selectedMeetingForTasksPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold dark:text-white">
                    All Tasks for {selectedMeetingForTasksPopup.name}
                  </h3>
                  <button
                    onClick={() => setShowAllTasksPopup(false)}
                    className="text-gray-500 hover:text-gray-700 bg-transparent hover:bg-transparent dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-6 w-6 text-blue-500 hover:text-purple-600 bg-transparent" />
                  </button>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Meeting Date: {selectedMeetingForTasksPopup.date}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {meetingTasks[selectedMeetingForTasksPopup.id] ? (
                  Object.values(meetingTasks[selectedMeetingForTasksPopup.id]).length > 0 ? (
                    <ul className="space-y-4">
                      {Object.values(meetingTasks[selectedMeetingForTasksPopup.id]).map((task) => {
                        // Get emoji based on task status
                        let emoji = '📝'; // Default emoji
                        const assignedToCurrentUser = task.assignedTo?.[currentUser.uid];
                        const isCompleted = task.completion?.[currentUser.uid];

                        if (assignedToCurrentUser) {
                          emoji = isCompleted ? '✅' : '⏳';
                        } else if (Object.values(task.completion || {}).some(c => c)) {
                          emoji = '👍';
                        } else if (task.dueDate && new Date(task.dueDate) < new Date()) {
                          emoji = '⚠️';
                        }

                        return (
                          <motion.li
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                          >
                            <div className="flex items-start">
                              <span className="text-2xl mr-3">{emoji}</span>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium text-lg dark:text-white">{task.title}</h4>
                                  {task.dueDate && (
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      Due: {task.dueDate}
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                                  {renderFormattedText(task.description)}
                                </p>

                                {task.assignedTo && Object.keys(task.assignedTo).length > 0 && (
                                  <div className="mt-3">
                                    <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                      Assigned Members:
                                    </h5>
                                    <ul className="space-y-2">
                                      {Object.entries(task.assignedTo)
                                        // Filter out unassigned members
                                        .filter(([userId, isAssigned]) => isAssigned && clubMembers[userId])
                                        // Sort members alphabetically by displayName
                                        .sort(([userIdA], [userIdB]) => {
                                          const memberA = clubMembers[userIdA];
                                          const memberB = clubMembers[userIdB];
                                          return memberA.displayName.localeCompare(memberB.displayName);
                                        })
                                        // Map through sorted members
                                        .map(([userId, isAssigned]) => {
                                          const member = clubMembers[userId];
                                          const isAssignedToCurrentUser = userId === currentUser.uid;
                                          const isCompleted = task.completion?.[userId] || false;
                                          const memberEmoji = isCompleted ? '✅' : '⌛';

                                          return (
                                            <li key={userId} className="flex items-center justify-between">
                                              <span className="text-sm dark:text-gray-200">
                                                {memberEmoji} {member.displayName}
                                                {userId === currentUser.uid && (
                                                  <span className="ml-1 text-xs text-blue-500">(You)</span>
                                                )}
                                              </span>
                                              {isAssignedToCurrentUser ? (
                                                <button
                                                  onClick={() => handleTaskStatusChange(
                                                    selectedMeetingForTasksPopup.id,
                                                    task.id,
                                                    userId,
                                                    !isCompleted
                                                  )}
                                                  className={`px-2 py-0.5 rounded text-xs ${isCompleted
                                                      ? 'bg-green-100 text-green-800 hover:text-white dark:bg-green-900 dark:text-green-200'
                                                      : 'bg-yellow-100 text-yellow-800 hover:text-white dark:bg-yellow-900 dark:text-yellow-200'
                                                    }`}
                                                >
                                                  {isCompleted ? 'Completed' : 'Pending'}
                                                </button>
                                              ) : (
                                                <span className={`px-2 py-0.5 rounded text-xs ${isCompleted
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                  }`}>
                                                  {isCompleted ? 'Completed' : 'Pending'}
                                                </span>
                                              )}
                                            </li>
                                          );
                                        })}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No tasks found for this meeting</p>
                    </div>
                  )
                ) : (
                  <div className="flex justify-center py-8">
                    <Loader size="medium" />
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => setShowAllTasksPopup(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}