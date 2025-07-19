import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  ClipboardList,
  Calendar,
  Clock,
  Check,
  X,
  ChevronDown,
  List,
  User,
  Mail,
  Phone,
  Bookmark,
  Users2,
  PanelRightOpen,
  Info,
  RefreshCw
} from 'lucide-react';
import Loader from '../components/Loader';

const PanelView = () => {
  const [loading, setLoading] = useState(true);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [error, setError] = useState('');
  const [userClubs, setUserClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [panels, setPanels] = useState([]);
  const [selectedPanel, setSelectedPanel] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [members, setMembers] = useState([]);
  const [panelDetails, setPanelDetails] = useState(null);
  const [sortOption, setSortOption] = useState('dateTime');
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      setTimeoutReached(true);
    }, 10000);
    return () => clearTimeout(loadingTimeout);
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUserClubs();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedClub) {
      fetchEvents(selectedClub);
    } else {
      setEvents([]);
      setPanels([]);
      setCandidates([]);
      setPanelDetails(null);
    }
    setSelectedEvent('');
    setSelectedPanel('');
  }, [selectedClub]);

  useEffect(() => {
    if (selectedClub && selectedEvent) {
      fetchPanels(selectedClub, selectedEvent);
    } else {
      setPanels([]);
      setCandidates([]);
      setPanelDetails(null);
    }
    setSelectedPanel('');
  }, [selectedClub, selectedEvent]);

  useEffect(() => {
    if (selectedClub && selectedEvent && selectedPanel) {
      fetchCandidates(selectedClub, selectedEvent, selectedPanel);
      fetchPanelDetails(selectedClub, selectedEvent, selectedPanel);
    } else {
      setCandidates([]);
      setPanelDetails(null);
    }
  }, [selectedClub, selectedEvent, selectedPanel]);

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

  const fetchMembers = async (clubId) => {
    try {
      if (!clubId) {
        setMembers([]);
        return;
      }
      
      const querySnapshot = await getDocs(collection(db, 'clubs', clubId, 'members'));
      const membersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
        role: doc.data().role || '',
        ...doc.data()
      }));
      setMembers(membersList);
    } catch (err) {
      setError('Failed to fetch members');
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedClub) {
      fetchEvents(selectedClub);
      fetchMembers(selectedClub);
    } else {
      setEvents([]);
      setMembers([]);
    }
  }, [selectedClub]);

  const fetchEvents = async (clubId) => {
    try {
      setLoading(true);
      const eventsRef = collection(db, 'clubs', clubId, 'events');
      const querySnapshot = await getDocs(eventsRef);

      const eventsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        clubId: clubId,
        ...doc.data()
      }));

      setEvents(eventsList);

      if (eventsList.length === 1) {
        setSelectedEvent(eventsList[0].id);
      }
    } catch (err) {
      setError('Failed to fetch events: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPanels = async (clubId, eventId) => {
    try {
      if (!clubId || !eventId) {
        setPanels([]);
        return;
      }

      const querySnapshot = await getDocs(collection(db, 'clubs', clubId, 'events', eventId, 'panels'));
      const panelsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    
      setPanels(panelsList);
    } catch (err) {
      setError('Failed to fetch panels');
      console.error(err);
    }
  };

  const fetchPanelDetails = async (clubId, eventId, panelId) => {
    try {
      setLoading(true);
      const panelRef = doc(db, 'clubs', clubId, 'events', eventId, 'panels', panelId);
      const panelDoc = await getDoc(panelRef);

      if (panelDoc.exists()) {
        setPanelDetails({
          id: panelDoc.id,
          ...panelDoc.data()
        });
      }
    } catch (err) {
      setError('Failed to fetch panel details: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sortCandidates = (candidates, option) => {
    return [...candidates].sort((a, b) => {
      switch (option) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'dateTime':
        default:
          const dateA = a.interviewDate ? new Date(a.interviewDate).getTime() : Infinity;
          const dateB = b.interviewDate ? new Date(b.interviewDate).getTime() : Infinity;
          
          if (dateA !== dateB) return dateA - dateB;
          
          const timeA = a.interviewTime || '';
          const timeB = b.interviewTime || '';
          return timeA.localeCompare(timeB);
      }
    });
  };

  const fetchCandidates = async (clubId, eventId, panelId) => {
    try {
      setLoading(true);
      const candidatesRef = collection(db, 'clubs', clubId, 'events', eventId, 'panels', panelId, 'candidates');
      const querySnapshot = await getDocs(candidatesRef);

      let candidatesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        panelId: panelId,
        ...doc.data()
      }));

      candidatesList = sortCandidates(candidatesList, sortOption);
      setCandidates(candidatesList);
    } catch (err) {
      setError('Failed to fetch candidates: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCandidates = () => {
    if (selectedClub && selectedEvent && selectedPanel) {
      fetchCandidates(selectedClub, selectedEvent, selectedPanel);
    }
  };

  const handleSortChange = (e) => {
    const newSortOption = e.target.value;
    setSortOption(newSortOption);
    setCandidates(sortCandidates(candidates, newSortOption));
  };

  const getStatusBadge = (status, interviewDone) => {
    const statusConfig = {
      pending: {
        icon: <Clock className="w-4 h-4 mr-1" />,
        color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
        text: 'Pending'
      },
      scheduled: {
        icon: <Calendar className="w-4 h-4 mr-1" />,
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
        text: 'Scheduled'
      },
      selected: {
        icon: <Check className="w-4 h-4 mr-1" />,
        color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
        text: 'Selected'
      },
      rejected: {
        icon: <X className="w-4 h-4 mr-1" />,
        color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
        text: 'Rejected'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <div className="flex items-center">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
          {config.icon}
          {config.text}
        </span>
        {interviewDone && (
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
            <Check className="w-3 h-3 mr-1" />
            Interviewed
          </span>
        )}
      </div>
    );
  };

  if (loading && !timeoutReached) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-64 mt-10"
      >
        <Loader size="large" />
        <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg">Loading panels...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container mx-auto p-4"
    >
      <h1 className="text-3xl font-bold mb-6 dark:text-white">Interview Panel Dashboard</h1>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6 rounded">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Club
          </label>
          <select
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
            className="w-full md:w-1/2 border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select a club</option>
            {userClubs.map(club => (
              <option key={club.id} value={club.id}>{club.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Event
          </label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full md:w-1/2 border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            disabled={!selectedClub}
          >
            <option value="">Select an event</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Panel
          </label>
          <select
            value={selectedPanel}
            onChange={(e) => setSelectedPanel(e.target.value)}
            className="w-full md:w-1/2 border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            disabled={!selectedEvent}
          >
            <option value="">Select a panel</option>
            {panels.map(panel => (
              <option key={panel.id} value={panel.id}>{panel.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedClub && userClubs.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-4 mb-6 rounded">
          <p>Please select a club to view panels</p>
        </div>
      )}

      {userClubs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-4 mb-6 rounded"
        >
          <h3 className="font-bold text-lg mb-2">No Clubs Joined</h3>
          <p>You haven't joined any clubs yet. Please join a club to view panels.</p>
        </motion.div>
      )}

      {selectedClub && events.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 dark:bg-slate-800 p-8 rounded-lg text-center"
        >
          <List className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Events Available</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            There are no events in this club that you can access.
          </p>
        </motion.div>
      )}

      {selectedEvent && panels.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 dark:bg-slate-800 p-8 rounded-lg text-center"
        >
          <Users className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Panels Available</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            You are not assigned to any interview panels for this event.
          </p>
        </motion.div>
      )}

      {!selectedPanel && panels.length > 0 && 
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 dark:bg-slate-800 p-8 rounded-lg text-center"
        >
          <Users className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Please select panel</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            You are not selected any panel for this event.
          </p>
        </motion.div>
      }

      {selectedClub && selectedEvent && selectedPanel && panelDetails && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold dark:text-white flex items-center">
                <PanelRightOpen className="h-6 w-6 mr-2" />
                {panelDetails.name}
              </h2>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                  <Users2 className="w-4 h-4 mr-1" />
                  {Object.keys(panelDetails.members || {}).filter(id => panelDetails.members[id]).length} <span className='hidden lg:block ml-1'>Members</span>
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                  <ClipboardList className="w-4 h-4 mr-1" />
                  {candidates.length} <span className='hidden lg:block ml-1'>Candidates</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold dark:text-gray-300 mb-3 flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Panel Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-24">Created:</span>
                    <span className="text-sm dark:text-gray-200">
                      {panelDetails.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-24">Event:</span>
                    <span className="text-sm dark:text-gray-200">
                      {events.find(e => e.id === selectedEvent)?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-24">Club:</span>
                    <span className="text-sm dark:text-gray-200">
                      {userClubs.find(c => c.id === selectedClub)?.name || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold dark:text-gray-300 mb-3 flex items-center">
                  <Users2 className="h-5 w-5 mr-2" />
                  Panel Members
                </h3>
                <div className="max-h-48 overflow-y-auto">
                  {panelDetails.members ? (
                    <ul className="space-y-2">
                      {Object.entries(panelDetails.members)
                        .filter(([_, isMember]) => isMember)
                        .map(([memberId]) => {
                          const member = members.find(m => m.id === memberId);
                          return (
                            <li key={memberId} className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2">
                                <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </div>
                              <span className="text-sm dark:text-gray-200">
                                {memberId === currentUser.uid
                                  ? 'You'
                                  : member
                                    ? `${member.displayName || member.name || 'Member'}${member.role ? ` (${member.role})` : ''}`
                                    : `Member ${memberId.substring(0, 6)}`}
                              </span>
                            </li>
                          );
                        })}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No members assigned</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex md:flex-row flex-col items-center md:justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center dark:text-white">
                <Users className="h-5 w-5 mr-2" />
                Candidates for {panelDetails.name}
              </h2>
              <div className="flex mt-5 md:mt-none items-center space-x-2">
                <select
                  value={sortOption}
                  onChange={handleSortChange}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700"
                >
                  <option value="dateTime ">Sort by Date & Time</option>
                  <option value="name">Sort by Name</option>
                  <option value="status">Sort by Status</option>
                </select>
                <button
                  onClick={handleRefreshCandidates}
                  className="p-2 rounded-full hover:animate-spin hover:bg-blue-400 dark:hover:bg-slate-700 transition-colors"
                  title="Refresh candidates list"
                >
                  <RefreshCw className="h-5 w-5 text-white  dark:text-gray-300" />
                </button>
              </div>
            </div>

            {candidates.length === 0 ? (
              <div className="bg-gray-50 dark:bg-slate-800 p-8 rounded-lg text-center">
                <ClipboardList className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Candidates</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  No candidates have been assigned to this panel yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto shadow-md rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Candidate
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          Contact
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Interview
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Bookmark className="h-4 w-4 mr-1" />
                          Status
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center">
                          <ClipboardList className="h-4 w-4 mr-1" />
                          Notes
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {candidates.map(candidate => (
                      <tr key={candidate.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{candidate.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-200">{candidate.email}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{candidate.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {candidate.interviewDate ? (
                            <div className="text-sm">
                              <div className="flex items-center text-gray-900 dark:text-gray-200">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(candidate.interviewDate).toLocaleDateString()}
                              </div>
                              {candidate.interviewTime && (
                                <div className="flex items-center text-gray-500 dark:text-gray-400 mt-1">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {candidate.interviewTime}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">Not scheduled</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(candidate.status, candidate.interviewDone)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                            {candidate.notes || 'No notes'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PanelView;