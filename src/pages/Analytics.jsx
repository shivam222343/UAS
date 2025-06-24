import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
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
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Download, Calendar, Users, TrendingUp, User, Clock, AlertTriangle, Trophy, Crown, Award } from 'lucide-react';
import AnalyticalLoader from '../components/AnalyticalLoader';
import Loader from '../components/Loader';
import MobileProgressLoader from '../components/MobileProgressLoader';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [personalStats, setPersonalStats] = useState({
    totalMeetings: 0,
    attendedMeetings: 0,
    attendanceRate: 0,
    ranking: 0
  });
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [allMembersRanking, setAllMembersRanking] = useState([]);
  const [showFullRanking, setShowFullRanking] = useState(false);
  const { currentUser } = useAuth();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    if (currentUser) {
      fetchPersonalAnalytics();
    }
  }, [currentUser]);

  const fetchPersonalAnalytics = async () => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        setError('User data not found');
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      const userAttendedMeetings = userData.attendedMeetings || [];
      const userClubs = userData.clubsJoined || {};

      const joinedClubs = Object.keys(userClubs).filter(clubId =>
        userClubs[clubId].joinedAt !== undefined
      );

      let allMeetings = [];

      if (joinedClubs.length > 0) {
        for (const clubId of joinedClubs) {
          const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
          const meetingsSnapshot = await getDocs(meetingsRef);

          const clubMeetings = meetingsSnapshot.docs.map(doc => ({
            id: doc.id,
            clubId: clubId,
            ...doc.data()
          }));

          allMeetings = [...allMeetings, ...clubMeetings];
        }
      } else {
        const meetingsRef = collection(db, 'meetings');
        const meetingsSnapshot = await getDocs(meetingsRef);
        allMeetings = meetingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      const totalMeetings = allMeetings.length;
      const attendedMeetings = userAttendedMeetings.length;
      const attendanceRate = totalMeetings > 0
        ? Math.round((attendedMeetings / totalMeetings) * 100)
        : 0;

      let totalMissedMeetings = 0;
      let warningsSent = false;

      for (const clubId of joinedClubs) {
        try {
          const memberRef = doc(db, 'clubs', clubId, 'members', currentUser.uid);
          const memberDoc = await getDoc(memberRef);

          if (memberDoc.exists()) {
            const memberData = memberDoc.data();
            totalMissedMeetings += memberData.missedMeetingCount || 0;

            if (memberData.warningEmailSent) {
              warningsSent = true;
            }
          }
        } catch (err) {
          console.error(`Error fetching missed meetings for club ${clubId}:`, err);
        }
      }

      const monthlyData = {};
      const today = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

      for (let d = new Date(sixMonthsAgo); d <= today; d.setMonth(d.getMonth() + 1)) {
        const month = d.toLocaleString('default', { month: 'short' });
        monthlyData[month] = { attended: 0, total: 0 };
      }

      allMeetings.forEach(meeting => {
        const meetingDate = new Date(meeting.date);
        if (meetingDate >= sixMonthsAgo && meetingDate <= today) {
          const month = meetingDate.toLocaleString('default', { month: 'short' });
          if (monthlyData[month]) {
            monthlyData[month].total += 1;
            const didAttend = meeting.attendees && meeting.attendees[currentUser.uid];
            if (didAttend) {
              monthlyData[month].attended += 1;
            }
            monthlyData[month].missed = monthlyData[month].total - monthlyData[month].attended;
          }
        }
      });

      const monthlyAttendanceData = Object.entries(monthlyData).map(([month, data]) => ({
        name: month,
        attendanceRate: data.total > 0 ? Math.round((data.attended / data.total) * 100) : 0,
        attended: data.attended,
        missed: data.missed,
        total: data.total
      }));

      const recentAttendedMeetings = allMeetings
        .filter(meeting => meeting.attendees && meeting.attendees[currentUser.uid])
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      // Enhanced member ranking calculation
      let allClubMembers = [];
      let memberAttendanceData = {};

      for (const clubId of joinedClubs) {
        const membersRef = collection(db, 'clubs', clubId, 'members');
        const membersSnapshot = await getDocs(membersRef);

        // Get user details for each member
        for (const memberDoc of membersSnapshot.docs) {
          const memberId = memberDoc.data().userId || memberDoc.id;
          const userRef = doc(db, 'users', memberId);
          const userDoc = await getDoc(userRef);
          
          const displayName = userDoc.exists() 
            ? userDoc.data().displayName || 'Anonymous'
            : memberDoc.data().displayName || 'Anonymous';

          allClubMembers.push({
            id: memberId,
            displayName,
            photoURL: userDoc.exists() ? userDoc.data().photoURL : null
          });

          if (!memberAttendanceData[memberId]) {
            memberAttendanceData[memberId] = {
              attended: 0,
              total: 0,
              clubs: new Set()
            };
          }
          memberAttendanceData[memberId].clubs.add(clubId);
        }

        const clubMeetings = allMeetings.filter(meeting => meeting.clubId === clubId);

        for (const member of allClubMembers) {
          memberAttendanceData[member.id].total += clubMeetings.length;

          const attendedCount = clubMeetings.filter(meeting =>
            meeting.attendees && meeting.attendees[member.id]
          ).length;

          memberAttendanceData[member.id].attended += attendedCount;
        }
      }

      const userAttendanceRates = Object.entries(memberAttendanceData).map(([userId, data]) => {
        const member = allClubMembers.find(m => m.id === userId) || { displayName: 'Anonymous' };
        return {
          id: userId,
          name: member.displayName,
          photoURL: member.photoURL,
          attendanceRate: data.total > 0 ? (data.attended / data.total) * 100 : 0,
          attended: data.attended,
          total: data.total,
          clubsCount: data.clubs.size
        };
      });

      userAttendanceRates.sort((a, b) => b.attendanceRate - a.attendanceRate);

      const userRanking = userAttendanceRates.findIndex(user => user.id === currentUser.uid) + 1;

      // Set full members ranking
      setAllMembersRanking(userAttendanceRates.map((user, index) => ({
        ...user,
        rank: index + 1,
        isCurrentUser: user.id === currentUser.uid
      })));

      const topUsers = userAttendanceRates.slice(0, 5).map(user => ({
        name: user.id === currentUser.uid ? 'You' : user.name,
        attendanceRate: Math.round(user.attendanceRate),
        totalAttended: user.attended,
        totalMeetings: user.total,
        isCurrentUser: user.id === currentUser.uid
      }));

      setPersonalStats({
        totalMeetings,
        attendedMeetings,
        attendanceRate,
        ranking: userRanking || allClubMembers.length,
        missedMeetings: totalMissedMeetings,
        warningsReceived: warningsSent,
        totalMembers: allClubMembers.length
      });

      setMonthlyAttendance(monthlyAttendanceData);
      setRecentMeetings(recentAttendedMeetings);
      setComparisonData(topUsers);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch personal analytics data');
      setLoading(false);
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-10 items-center justify-center min-h-screen">
        <Loader />
        <div className='lg:hidden'><MobileProgressLoader /></div>
        <div className='hidden lg:block'><AnalyticalLoader size="large" /></div>
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
      className="p-2"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl w-full font-bold text-center md:text-left">My Analytics</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Meetings</p>
              <p className="text-2xl font-semibold">{personalStats.totalMeetings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Meetings Attended</p>
              <p className="text-2xl font-semibold">{personalStats.attendedMeetings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Attendance Rate</p>
              <p className="text-2xl font-semibold">{personalStats.attendanceRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <User className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Your Ranking</p>
              <p className="text-2xl font-semibold">#{personalStats.ranking} of {personalStats.totalMembers}</p>
            </div>
          </div>
        </div>

        <div className={`bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md p-6 ${personalStats.warningsReceived ? 'border-2 border-red-400' : ''}`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${personalStats.missedMeetings >= 3 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertTriangle className={`w-6 h-6 ${personalStats.missedMeetings >= 3 ? 'text-red-600' : 'text-gray-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Missed Meetings</p>
              <div className="flex items-center">
                <p className={`text-2xl font-semibold ${personalStats.missedMeetings >= 3 ? 'text-red-600 dark:text-red-400' : ''}`}>
                  {personalStats.missedMeetings}
                </p>
                {personalStats.warningsReceived && (
                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                    Warning Sent
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Recent Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Attendance Chart */}
        <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Monthly Attendance</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyAttendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="attended" name="Attended" fill="#22C55E" stackId="a" />
                <Bar dataKey="missed" name="Missed" fill="#EF4444" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Top Attendance Ranking</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar
                  dataKey="attendanceRate"
                  name="Attendance Rate %"
                  fill="#3B82F6"
                  radius={[0, 4, 4, 0]}
                  label={{ position: 'right', formatter: (value) => `${value}%` }}
                >
                  {comparisonData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isCurrentUser ? '#22C55E' : '#3B82F6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Full Members Ranking Section */}
      <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Trophy className="mr-2 text-yellow-500" />
            Members Ranking
          </h2>
          <button 
            onClick={() => setShowFullRanking(!showFullRanking)}
            className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
          >
            {showFullRanking ? 'Top' : 'All'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium dark:text-white text-gray-500 uppercase tracking-wider">Rank</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium dark:text-white text-gray-500 uppercase tracking-wider">Member</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium dark:text-white text-gray-500 uppercase tracking-wider">Attendance</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium dark:text-white text-gray-500 uppercase tracking-wider">Meetings</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium dark:text-white text-gray-500 uppercase tracking-wider">Clubs</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {(showFullRanking ? allMembersRanking : allMembersRanking.slice(0, 5)).map((member) => (
                <tr 
                  key={member.id} 
                  className={`${member.isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {member.rank <= 3 ? (
                        <>
                          {member.rank === 1 && <Crown className="text-yellow-500 mr-2" size={16} />}
                          {member.rank === 2 && <Award className="text-gray-400 mr-2" size={16} />}
                          {member.rank === 3 && <Award className="text-amber-600 mr-2" size={16} />}
                        </>
                      ) : null}
                      <span className={`font-medium ${member.rank <= 3 ? 'text-lg' : ''}`}>
                        {member.rank}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {member.photoURL ? (
                        <img className="h-8 w-8 rounded-full mr-3" src={member.photoURL} alt={member.name} />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                          <User size={16} className="text-gray-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{member.name}</div>
                        {member.isCurrentUser && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-24 mr-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full" 
                            style={{ 
                              width: `${member.attendanceRate}%`,
                              backgroundColor: member.attendanceRate >= 80 ? '#10B981' : 
                                             member.attendanceRate >= 50 ? '#F59E0B' : '#EF4444'
                            }}
                          ></div>
                        </div>
                      </div>
                      <span>{Math.round(member.attendanceRate)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.attended}/{member.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.clubsCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Attended Meetings */}
      <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Attended Meetings</h2>
        <div className="space-y-4">
          {recentMeetings.length > 0 ? (
            recentMeetings.map(meeting => (
              <div
                key={meeting.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div>
                  <h3 className="font-medium">{meeting.topic}</h3>
                  <p className="text-sm text-gray-500">
                    {meeting.date} at {meeting.time}
                  </p>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`}>
                    Attended
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No attended meetings found</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}