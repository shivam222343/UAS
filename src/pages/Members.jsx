import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, UserCheck, Calendar, Search, Shield, Users, Eye, X, BarChart2, Award, Clock, Check, XCircle } from 'lucide-react';
import Loader from '../components/Loader';
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



export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const [clubs, setClubs] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberAnalytics, setMemberAnalytics] = useState(null);
  const { currentUser } = useAuth();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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

  const fetchUserClubs = async () => {
    try {
      setLoading(true);

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      let userClubIds = [];

      if (userData?.clubsJoined && Object.keys(userData.clubsJoined).length > 0) {
        userClubIds = Object.keys(userData.clubsJoined);
      } else if (userData?.clubs && Array.isArray(userData.clubs) && userData.clubs.length > 0) {
        userClubIds = userData.clubs;
      } else {
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

      setClubs(clubsData);

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

      const membersRef = collection(db, 'clubs', clubId, 'members');
      const membersSnapshot = await getDocs(membersRef);

      const memberPromises = membersSnapshot.docs.map(async (memberDoc) => {
        const userId = memberDoc.data().userId || memberDoc.data().uid || memberDoc.id;
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (!userDoc.exists()) {
          return {
            id: userId,
            displayName: memberDoc.data().displayName || 'Unknown User',
            email: memberDoc.data().email || 'No email',
            memberSince: memberDoc.data().joinedAt?.toDate(),
            role: memberDoc.data().role || 'member',
            attendanceRate: 0,
            attendedCount: 0,
            totalMeetings: 0
          };
        }

        const userData = userDoc.data();
        const hasJoinedViaAccessKey = memberDoc.data().joinedAt !== undefined;

        if (hasJoinedViaAccessKey) {
          return {
            id: userId,
            ...userData,
            memberSince: memberDoc.data().joinedAt?.toDate(),
            role: memberDoc.data().role || 'member',
            attendanceRate: 0,
            attendedCount: 0,
            totalMeetings: 0
          };
        }
        return null;
      });

      const membersList = (await Promise.all(memberPromises)).filter(member => member !== null);
      membersList.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));

      // Fetch analytics for each member
      const membersWithAnalytics = await Promise.all(membersList.map(async member => {
        const analytics = await fetchMemberAnalytics(member.id, clubId);
        return { ...member, analytics };
      }));

      setMembers(membersWithAnalytics);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Failed to fetch members');
      setLoading(false);
    }
  };

  const formatLastSeen = (timestamp) => {
  if (!timestamp) return 'Never';
  
  const now = new Date();
  const lastSeen = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffInSeconds = Math.floor((now - lastSeen) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return lastSeen.toLocaleDateString();
};

  const fetchMemberAnalytics = async (memberId, clubId) => {
    try {
      const memberRef = doc(db, 'clubs', clubId, 'members', memberId);
      const memberDoc = await getDoc(memberRef);

      if (!memberDoc.exists()) {
        return null;
      }

      const memberData = memberDoc.data();
      
      // Get meetings data
      const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
      const meetingsSnapshot = await getDocs(meetingsRef);
      const meetings = meetingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const totalMeetings = meetings.length;
      const attendedMeetings = meetings.filter(meeting => 
        meeting.attendees && meeting.attendees[memberId]
      ).length;
      const attendanceRate = totalMeetings > 0 
        ? Math.round((attendedMeetings / totalMeetings) * 100) 
        : 0;

      // Get monthly attendance data
      const monthlyData = {};
      const today = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

      for (let d = new Date(sixMonthsAgo); d <= today; d.setMonth(d.getMonth() + 1)) {
        const month = d.toLocaleString('default', { month: 'short' });
        monthlyData[month] = { attended: 0, total: 0 };
      }

      meetings.forEach(meeting => {
        const meetingDate = new Date(meeting.date);
        if (meetingDate >= sixMonthsAgo && meetingDate <= today) {
          const month = meetingDate.toLocaleString('default', { month: 'short' });
          if (monthlyData[month]) {
            monthlyData[month].total += 1;
            const didAttend = meeting.attendees && meeting.attendees[memberId];
            if (didAttend) {
              monthlyData[month].attended += 1;
            }
            monthlyData[month].missed = monthlyData[month].total - monthlyData[month].attended;
          }
        }
      });

      const monthlyAttendance = Object.entries(monthlyData).map(([month, data]) => ({
        name: month,
        attendanceRate: data.total > 0 ? Math.round((data.attended / data.total) * 100) : 0,
        attended: data.attended,
        missed: data.missed,
        total: data.total
      }));

      return {
        totalMeetings,
        attendedMeetings,
        attendanceRate,
        missedMeetings: totalMeetings - attendedMeetings,
        monthlyAttendance,
        warningsReceived: memberData.warningEmailSent || false,
        lastActive: memberData.lastSeen?.toDate() || null
      };
    } catch (err) {
      console.error('Error fetching member analytics:', err);
      return null;
    }
  };

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setMemberAnalytics(member.analytics);
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
      className="p-1 relative"
    >
      <div className='flex md:flex-row md:justify-between flex-col justify-between items-center mb-4'>
        <h1 className="text-3xl font-bold mb-2 md:mb-8">Club Members</h1>
        <div className="flex md:flex-row min-w-20 h-auto md:items-center md:justify-between mb-8">
          <div className="relative *:flex-1 md:flex-none">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Members</label>
            <div className='relative'>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Search members..."
                className="px-4 py-2 pl-10 border dark:bg-gray-800 dark:text-white bg-white text-black rounded-lg w-[90vw] md:w-64"
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

      {selectedClub ? (
        loading ? (
          <div className="flex py-12">
            <Loader size="medium" />
          </div>
        ) : filteredMembers.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 px-2 py-4">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
                <div className='w-16'> <Users className="h-7 w-7 ml-4 text-blue-500" /></div>
                <div className='text-center'> Members who joined via access key</div>
                <span className="ml-2 text-sm mr-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  {filteredMembers.length}
                </span>
              </h2>
            </div>

            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMembers.map((member) => (
                <li
                  key={member.uid || member.id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => handleMemberClick(member)}
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src={
                          member.photoURL ||
                          `https://ui-avatars.com/api/?name=${member.displayName || 'User'}&background=0A66C2&color=fff`
                        }
                        alt={member.displayName || 'User profile'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className='w-full h-auto flex justify-between items-center'>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {member.displayName || 'Unnamed User'}
                          </h3>
                          <div className='min-w-20 flex items-center justify-end gap-2'>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${member.isOnline === true
                                ? 'bg-transperent font-semibold text-green-500'
                                : member.isOnline === false
                                  ? 'bg-transperent font-semibold text-gray-600 dark:text-gray-300'
                                  : 'bg-transperent font-semibold text-yellow-600'
                                }`}
                            >
                              {member.isOnline === true
                                ? 'Online'
                                : member.isOnline === false
                                  ? 'Offline'
                                  : ' '}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${member.role === 'admin'
                                ? 'bg-red-100 text-red-800'
                                : member.role === 'subadmin'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-green-100 text-green-800'
                                }`}
                            >
                              {member.role || 'member'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                        <Mail className="h-4 w-4 mr-1" />
                        {member.email || 'No email'}
                      </p>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Joined:{" "}
                        {member.memberSince
                          ? member.memberSince.toLocaleDateString()
                          : 'Unknown'}
                      </div>
                      <span
                        className={`flex items-center text-sm rounded-full ${member.isOnline === true
                            ? 'bg-transparent font-semibold text-green-500'
                            : member.isOnline === false
                              ? 'bg-transparent font-semibold text-gray-600 dark:text-gray-300'
                              : 'bg-transparent font-semibold text-yellow-600'
                          }`}
                      >
                     {
                      member.isOnline !== true &&    <Eye className="h-4 w-4 mr-1" />
                     }
                        {member.isOnline === false
                          ? member.lastSeen
                            ? `Last seen: ${new Date(member.lastSeen.seconds * 1000).toLocaleString()}`
                            : 'Offline'
                          : ''}
                      </span>
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

      {/* Member Profile Popup */}
      <AnimatePresence>
        {selectedMember && (
          <>
            {/* Mobile Popup */}
            <motion.div
              className="fixed md:hidden inset-0 z-50 flex items-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setSelectedMember(null)}
              />
              <motion.div
                className="relative w-full bg-white overflow-hidden dark:bg-gray-800 rounded-t-3xl shadow-xl"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30 }}
                style={{ height: '75vh' }}
              >
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
                  <div className="relative">
                    <div className="h-32 w-32 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden">
                      <img
                        src={
                          selectedMember.photoURL ||
                          `https://ui-avatars.com/api/?name=${selectedMember.displayName || 'User'}&background=0A66C2&color=fff`
                        }
                        alt={selectedMember.displayName || 'User profile'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-20 pb-4 px-6 h-full overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-center w-full">
                      {selectedMember.displayName || 'Unnamed User'}
                    </h2>
                    <button
                      onClick={() => setSelectedMember(null)}
                      className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="text-center mb-6">
                    <p className="text-gray-500 dark:text-gray-400">
                      {selectedMember.email || 'No email'}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${selectedMember.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : selectedMember.role === 'subadmin'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                          }`}
                      >
                        {selectedMember.role || 'member'}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${selectedMember.isOnline === true
                          ? 'bg-transperent font-semibold text-green-500'
                          : selectedMember.isOnline === false
                            ? 'bg-transperent font-semibold text-gray-600 dark:text-gray-300'
                            : 'bg-transperent font-semibold text-yellow-600'
                          }`}
                      >
                        {selectedMember.isOnline === true
                          ? 'Online'
                          : selectedMember.isOnline === false
                            ? 'Offline'
                            : ' '}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                      <p className="font-semibold">
                        {selectedMember.memberSince
                          ? selectedMember.memberSince.toLocaleDateString()
                          : 'Unknown'}
                      </p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Last Active</p>
                      <p className="font-semibold">
                        {selectedMember.lastSeen
                          ? new  Date(selectedMember.lastSeen.seconds * 1000).toLocaleString()
                          : 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {memberAnalytics && (
                    <>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <BarChart2 className="mr-2" /> Attendance Analytics
                      </h3>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <p className="text-sm text-blue-600 dark:text-blue-300">Total Meetings</p>
                          <p className="font-semibold text-2xl">{memberAnalytics.totalMeetings}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                          <p className="text-sm text-green-600 dark:text-green-300">Attended</p>
                          <p className="font-semibold text-2xl">{memberAnalytics.attendedMeetings}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                          <p className="text-sm text-purple-600 dark:text-purple-300">Attendance Rate</p>
                          <p className="font-semibold text-2xl">{memberAnalytics.attendanceRate}%</p>
                        </div>
                        <div className={`p-4 rounded-lg ${memberAnalytics.missedMeetings >= 3 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
                          <p className={`text-sm ${memberAnalytics.missedMeetings >= 3 ? 'text-red-600 dark:text-red-300' : 'text-yellow-600 dark:text-yellow-300'}`}>Missed</p>
                          <p className="font-semibold text-2xl">{memberAnalytics.missedMeetings}</p>
                          {memberAnalytics.warningsReceived && (
                            <p className="text-xs mt-1 text-red-500 dark:text-red-400">Warning Sent</p>
                          )}
                        </div>
                      </div>

                      <div className="mb-6">
                        <h4 className="text-md font-medium mb-2">Monthly Attendance</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={memberAnalytics.monthlyAttendance}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis domain={[0, 100]} />
                              <Tooltip />
                              <Bar dataKey="attendanceRate" name="Attendance %" fill="#8884d8" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h4 className="text-md font-medium mb-2">Attendance Breakdown</h4>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Attended', value: memberAnalytics.attendedMeetings },
                                  { name: 'Missed', value: memberAnalytics.missedMeetings }
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                <Cell fill="#22C55E" />
                                <Cell fill="#EF4444" />
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Desktop Popup */}
            <motion.div
              className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setSelectedMember(null)}
              />
              <motion.div
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 30 }}
              >
                <div className="absolute top-20 left-36 transform -translate-x-1/2">
                  <div className="relative">
                    <div className="h-32 w-32 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden">
                      <img
                        src={
                          selectedMember.photoURL ||
                          `https://ui-avatars.com/api/?name=${selectedMember.displayName || 'User'}&background=0A66C2&color=fff`
                        }
                        alt={selectedMember.displayName || 'User profile'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-24 pb-6 px-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-center w-full">
                      {selectedMember.displayName || 'Unnamed User'}
                    </h2>
                    <button
                      onClick={() => setSelectedMember(null)}
                      className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="text-center mb-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      {selectedMember.email || 'No email'}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${selectedMember.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : selectedMember.role === 'subadmin'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                          }`}
                      >
                        {selectedMember.role || 'member'}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${selectedMember.isOnline === true
                          ? 'bg-transperent font-semibold text-green-500'
                          : selectedMember.isOnline === false
                            ? 'bg-transperent font-semibold text-gray-600 dark:text-gray-300'
                            : 'bg-transperent font-semibold text-yellow-600'
                          }`}
                      >
                        {selectedMember.isOnline === true
                          ? 'Online'
                          : selectedMember.isOnline === false
                            ? 'Offline'
                            : ' '}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                      <p className="font-semibold">
                        {selectedMember.memberSince
                          ? selectedMember.memberSince.toLocaleDateString()
                          : 'Unknown'}
                      </p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Last Active</p>
                      <p className="font-semibold">
                        {selectedMember.lastSeen
                          ? new Date(selectedMember.lastSeen.seconds * 1000).toLocaleString()
                          : 'Unknown'}
                      </p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                      <p className="font-semibold flex items-center justify-center">
                        {selectedMember.isOnline ? (
                          <>
                            <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                            Online
                          </>
                        ) : (
                          <>
                            <span className="h-2 w-2 rounded-full bg-gray-500 mr-2"></span>
                            Offline
                          </>
                        )}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${memberAnalytics?.warningsReceived ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Warnings</p>
                      <p className="font-semibold flex items-center justify-center">
                        {memberAnalytics?.warningsReceived ? (
                          <>
                            <XCircle className="h-4 w-4 mr-1 text-red-500" />
                            Received
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1 text-green-500" />
                            None
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {memberAnalytics && (
                    <>
                      <h3 className="text-lg font-semibold mb-6 flex items-center">
                        <BarChart2 className="mr-2" /> Attendance Analytics
                      </h3>

                      <div className="grid grid-cols-2 gap-6 mb-8">
                        <div>
                          <h4 className="text-md font-medium mb-4">Monthly Attendance</h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={memberAnalytics.monthlyAttendance}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Bar dataKey="attendanceRate" name="Attendance %" fill="#8884d8" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-md font-medium mb-4">Attendance Breakdown</h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'Attended', value: memberAnalytics.attendedMeetings },
                                    { name: 'Missed', value: memberAnalytics.missedMeetings }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                  <Cell fill="#22C55E" />
                                  <Cell fill="#EF4444" />
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <p className="text-sm text-blue-600 dark:text-blue-300">Total Meetings</p>
                          <p className="font-semibold text-2xl">{memberAnalytics.totalMeetings}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                          <p className="text-sm text-green-600 dark:text-green-300">Attended</p>
                          <p className="font-semibold text-2xl">{memberAnalytics.attendedMeetings}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                          <p className="text-sm text-purple-600 dark:text-purple-300">Attendance Rate</p>
                          <p className="font-semibold text-2xl">{memberAnalytics.attendanceRate}%</p>
                        </div>
                        <div className={`p-4 rounded-lg ${memberAnalytics.missedMeetings >= 3 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
                          <p className={`text-sm ${memberAnalytics.missedMeetings >= 3 ? 'text-red-600 dark:text-red-300' : 'text-yellow-600 dark:text-yellow-300'}`}>Missed</p>
                          <p className="font-semibold text-2xl">{memberAnalytics.missedMeetings}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}