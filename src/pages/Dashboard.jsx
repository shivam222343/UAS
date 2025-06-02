import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, where, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Loader from '../components/Loader';
import PublicAttendanceWarnings from '../components/club/PublicAttendanceWarnings';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMeetings: 0,
    upcomingMeetings: 0,
    totalMembers: 0,
    attendanceRate: 0
  });
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [approvedAbsences, setApprovedAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userClubs, setUserClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [userClubIds, setUserClubIds] = useState([]);
  const { currentUser } = useAuth();
  const [userAttendanceStats, setUserAttendanceStats] = useState({
    totalMeetings: 0,
    attended: 0,
    missed: 0,
    approved: 0,
    unauthorized: 0
  });
  const [attendancePieData, setAttendancePieData] = useState([]);
  const COLORS = ['#4ade80', '#f87171', '#facc15'];

  useEffect(() => {
    if (currentUser) {
      fetchUserClubs();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedClub) {
      fetchDashboardData();
      fetchApprovedAbsences();
      fetchUserAttendanceStats();
    }
  }, [selectedClub]);

  const fetchUserClubs = async () => {
    try {
      // Fetch user's clubs
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userClubsData = userDoc.data()?.clubsJoined || {};
      
      // Store club IDs for warnings display
      setUserClubIds(Object.keys(userClubsData));
      
      if (Object.keys(userClubsData).length === 0) {
        setLoading(false);
        return;
      }
      
      // Fetch all clubs details
      const clubsDetails = [];
      for (const clubId of Object.keys(userClubsData)) {
        const clubDoc = await getDoc(doc(db, 'clubs', clubId));
        if (clubDoc.exists()) {
          clubsDetails.push({
            id: clubId,
            name: clubDoc.data().name,
            ...clubDoc.data()
          });
        }
      }
      
      setUserClubs(clubsDetails);
      
      // Set the first club as selected by default
      if (clubsDetails.length > 0) {
        setSelectedClub(clubsDetails[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to fetch user clubs');
      setLoading(false);
      console.error(err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all clubs
      const clubsRef = collection(db, 'clubs');
      const clubsSnapshot = await getDocs(clubsRef);
      const clubsList = clubsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      let allMeetings = [];
      let memberCount = 0;
      
      // Get the selected club
      const clubId = selectedClub;
      
      // Fetch club's meetings
      const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
      const meetingsSnapshot = await getDocs(meetingsRef);
      const clubMeetings = meetingsSnapshot.docs.map(doc => ({
        id: doc.id,
        clubId: clubId,
        clubName: clubsList.find(club => club.id === clubId)?.name || 'Unknown Club',
        ...doc.data()
      }));
      
      // Add all meetings to the list
      allMeetings = [...allMeetings, ...clubMeetings];
      
      // Count members in this club
      const membersRef = collection(db, 'clubs', clubId, 'members');
      const membersSnapshot = await getDocs(membersRef);
      memberCount += membersSnapshot.size;
      
      // Calculate statistics
      const totalMeetings = allMeetings.length;
      const upcomingMeetings = allMeetings.filter(m => m.status === 'upcoming').length;
      const totalMembers = memberCount;
      
      // Calculate attendance rate
      let totalAttendance = 0;
      let attendanceCount = 0;
      
      for (const meeting of allMeetings) {
        if (meeting.attendanceMarked) {
          const attendeeCount = meeting.attendees ? Object.keys(meeting.attendees).length : 0;
          const membersRef = collection(db, 'clubs', meeting.clubId, 'members');
          const membersSnapshot = await getDocs(membersRef);
          const memberCount = membersSnapshot.size;
          
          if (memberCount > 0) {
            totalAttendance += (attendeeCount / memberCount) * 100;
            attendanceCount++;
          }
        }
      }
      
      const attendanceRate = attendanceCount > 0 
        ? Math.round(totalAttendance / attendanceCount) 
        : 0;

      // Sort meetings by date (newest first)
      allMeetings.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateB - dateA;
      });
      
      // Get recent meetings (5 most recent)
      const recentMeetingsList = allMeetings.slice(0, 5);

      setStats({
        totalMeetings,
        upcomingMeetings,
        totalMembers,
        attendanceRate
      });
      setRecentMeetings(recentMeetingsList);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      setLoading(false);
      console.error(err);
    }
  };

  const fetchApprovedAbsences = async () => {
    try {
      if (!currentUser) return;
      
      const clubId = selectedClub;
      let allApprovedAbsences = [];
      
      const clubDoc = await getDoc(doc(db, 'clubs', clubId));
      const clubName = clubDoc.exists() ? clubDoc.data().name : 'Unknown Club';
      
      // Get all meetings for this club
      const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
      const meetingsSnapshot = await getDocs(meetingsRef);
      
      // For each meeting, check for approved absences for this user
      for (const meetingDoc of meetingsSnapshot.docs) {
        const meetingId = meetingDoc.id;
        const meetingData = meetingDoc.data();
        
        // Check absences collection for this meeting
        const absencesRef = collection(db, 'clubs', clubId, 'meetings', meetingId, 'absences');
        const q = query(absencesRef, where('userId', '==', currentUser.uid), where('status', '==', 'approved'));
        const absencesSnapshot = await getDocs(q);
        
        if (!absencesSnapshot.empty) {
          // User has an approved absence for this meeting
          absencesSnapshot.forEach(absenceDoc => {
            allApprovedAbsences.push({
              id: absenceDoc.id,
              meetingId: meetingId,
              meetingName: meetingData.name,
              clubId: clubId,
              clubName: clubName,
              date: meetingData.date,
              time: meetingData.time,
              reason: absenceDoc.data().reason,
              approvedAt: absenceDoc.data().approvedAt?.toDate()
            });
          });
        }
      }
      
      // Sort by date (most recent first)
      allApprovedAbsences.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
      
      setApprovedAbsences(allApprovedAbsences);
    } catch (err) {
      console.error('Error fetching approved absences:', err);
    }
  };

  const fetchUserAttendanceStats = async () => {
    try {
      if (!currentUser || !selectedClub) return;
      
      const clubId = selectedClub;
      
      // Get all meetings for the club
      const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
      const meetingsSnapshot = await getDocs(meetingsRef);
      const totalMeetings = meetingsSnapshot.size;
      
      // Initialize statistics
      let attended = 0;
      let missed = 0;
      let approved = 0;
      let unauthorized = 0;
      
      // Process each meeting
      for (const meetingDoc of meetingsSnapshot.docs) {
        const meetingId = meetingDoc.id;
        const meetingData = meetingDoc.data();
        
        // Check attendance record
        if (meetingData.attendees && meetingData.attendees[currentUser.uid]) {
          attended++;
        } else {
          missed++;
          
          // Check if absence was approved
          const absenceRef = doc(db, 'clubs', clubId, 'meetings', meetingId, 'absences', currentUser.uid);
          const absenceDoc = await getDoc(absenceRef);
          
          if (absenceDoc.exists() && absenceDoc.data().status === 'approved') {
            approved++;
          } else {
            unauthorized++;
          }
        }
      }
      
      // Pie chart data
      const pieChartData = [
        { name: 'Attended', value: attended },
        { name: 'Unauthorized Absences', value: unauthorized },
        { name: 'Approved Absences', value: approved }
      ];
      
      setUserAttendanceStats({
        totalMeetings,
        attended,
        missed,
        approved,
        unauthorized
      });
      
      setAttendancePieData(pieChartData);
    } catch (err) {
      console.error('Error fetching user attendance stats:', err);
    }
  };

  if (loading) {
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
      className="p-1"
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0 dark:text-white">Dashboard</h1>
        
        {/* Club Selector */}
        {userClubs.length > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
            <select 
              value={selectedClub} 
              onChange={(e) => setSelectedClub(e.target.value)}
              className="w-full md:w-64 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {userClubs.map(club => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm dark:text-white text-gray-500">Total Meetings</p>
              <p className="text-2xl font-semibold dark:text-white">{stats.totalMeetings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm dark:text-white text-gray-500">Upcoming Meetings</p>
              <p className="text-2xl dark:text-white font-semibold">{stats.upcomingMeetings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm dark:text-white text-gray-500">Total Members</p>
              <p className="text-2xl dark:text-white font-semibold">{stats.totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm dark:text-white text-gray-500">Attendance Rate</p>
              <p className="text-2xl dark:text-white font-semibold">{stats.attendanceRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Attendance Stats */}
      {selectedClub && (
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 dark:text-white">My Attendance Stats</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Stats Cards */}
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">Total</h3>
                </div>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{userAttendanceStats.totalMeetings}</p>
                <p className="text-sm text-blue-600 dark:text-blue-300">meetings</p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Attended</h3>
                </div>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400">{userAttendanceStats.attended}</p>
                <p className="text-sm text-green-600 dark:text-green-300">
                  {userAttendanceStats.totalMeetings > 0 
                    ? `${Math.round((userAttendanceStats.attended / userAttendanceStats.totalMeetings) * 100)}%` 
                    : '0%'}
                </p>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Clock className="w-5 h-5 text-yellow-500 mr-2" />
                  <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">Approved</h3>
                </div>
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{userAttendanceStats.approved}</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-300">absences</p>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Missed</h3>
                </div>
                <p className="text-3xl font-bold text-red-700 dark:text-red-400">{userAttendanceStats.unauthorized}</p>
                <p className="text-sm text-red-600 dark:text-red-300">unauthorized</p>
              </div>
            </div>
            
            {/* Pie Chart */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Attendance Breakdown</h3>
              <div className="h-64">
                {attendancePieData.length > 0 && userAttendanceStats.totalMeetings > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendancePieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {attendancePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} meetings`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">No attendance data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Public Attendance Warnings */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Attendance Warnings</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The following members have missed 3 or more consecutive meetings in their clubs and have been notified:
        </p>
        
        {userClubIds.length > 0 ? (
          <div className="space-y-6">
            {selectedClub ? (
              <PublicAttendanceWarnings key={selectedClub} clubId={selectedClub} />
            ) : (
              userClubIds.map(clubId => (
                <PublicAttendanceWarnings key={clubId} clubId={clubId} />
              ))
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No Clubs Joined</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Join a club to see attendance warnings
            </p>
          </div>
        )}
      </div>

      {/* Recent Meetings */}
      <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-xl dark:text-white font-semibold mb-4">Recent Meetings</h2>
        <div className="space-y-4">
          {recentMeetings.map(meeting => (
            <div 
              key={meeting.id}
              className="flex items-center justify-between p-1 flex-wrap gap-2 md:p-4 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div>
                <h3 className="font-medium">{meeting.name}</h3>
                <div className="text-sm dark:text-white text-gray-500 flex items-center gap-2">
                  <span>{meeting.date} at {meeting.time}</span>
                  <span>•</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">{meeting.clubName}</span>
                </div>
                <div className="text-xs dark:text-white text-gray-500 mt-1">
                  {meeting.mode === 'offline' ? (
                    <span>Location: {meeting.location}{meeting.location === 'Classroom' && meeting.classroomNumber ? ` (${meeting.classroomNumber})` : ''}</span>
                  ) : (
                    <span>Platform: {meeting.platform}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  meeting.status === 'upcoming' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                    : meeting.status === 'cancelled'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                </span>
                <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                  {meeting.attendees ? Object.keys(meeting.attendees).length : 0} attendees
                </span>
              </div>
            </div>
          ))}

          {recentMeetings.length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-white">No meetings found</p>
            </div>
          )}
        </div>
      </div>

      {/* Approved Absences Section */}
      {approvedAbsences.length > 0 && (
        <div className="bg-white mt-5 dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="mr-2 text-amber-500" /> 
            Approved Absences
          </h2>
          
          <div className="space-y-4">
            {approvedAbsences.map(absence => (
              <div 
                key={absence.id}
                className="border-l-4 border-amber-500 pl-4 py-3 bg-amber-50 dark:bg-amber-900/20 rounded-r-md"
              >
                <div className="flex justify-between">
                  <h3 className="font-medium text-gray-800 dark:text-white">{absence.meetingName}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{absence.date}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Club: {absence.clubName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">"{absence.reason}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
} 