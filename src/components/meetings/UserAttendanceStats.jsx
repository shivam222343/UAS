import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

const UserAttendanceStats = ({ clubId }) => {
  const [stats, setStats] = useState({
    totalMeetings: 0,
    attended: 0,
    missed: 0,
    approved: 0,
    unauthorized: 0
  });
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  
  const COLORS = ['#4ade80', '#f87171', '#facc15'];

  useEffect(() => {
    if (currentUser && clubId) {
      fetchAttendanceStats();
    }
  }, [currentUser, clubId]);

  const fetchAttendanceStats = async () => {
    try {
      setLoading(true);
      
      // Get all meetings for the club
      const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
      const meetingsSnapshot = await getDocs(meetingsRef);
      const totalMeetings = meetingsSnapshot.size;
      
      // Initialize statistics
      let attended = 0;
      let missed = 0;
      let approved = 0;
      let unauthorized = 0;
      
      // Month-based data for the bar chart
      const monthData = {};
      
      // Process each meeting
      for (const meetingDoc of meetingsSnapshot.docs) {
        const meetingId = meetingDoc.id;
        const meetingData = meetingDoc.data();
        const meetingDate = new Date(meetingData.date);
        const monthYear = `${meetingDate.toLocaleString('default', { month: 'short' })} ${meetingDate.getFullYear()}`;
        
        // Initialize month data if not exists
        if (!monthData[monthYear]) {
          monthData[monthYear] = { attended: 0, total: 0 };
        }
        
        monthData[monthYear].total++;
        
        // Check attendance record
        if (meetingData.attendees && meetingData.attendees[currentUser.uid]) {
          attended++;
          monthData[monthYear].attended++;
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
      
      // Format chart data
      const chartDataArray = Object.keys(monthData).map(month => ({
        month,
        attended: monthData[month].attended,
        total: monthData[month].total,
        percentage: monthData[month].total > 0 
          ? Math.round((monthData[month].attended / monthData[month].total) * 100) 
          : 0
      }));
      
      // Sort by date (assuming month is in "MMM YYYY" format)
      chartDataArray.sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA - dateB;
      });
      
      // Pie chart data
      const pieChartData = [
        { name: 'Attended', value: attended },
        { name: 'Unauthorized Absences', value: unauthorized },
        { name: 'Approved Absences', value: approved }
      ];
      
      setStats({
        totalMeetings,
        attended,
        missed,
        approved,
        unauthorized
      });
      
      setChartData(chartDataArray);
      setPieData(pieChartData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching attendance stats:', err);
      setError('Failed to load attendance statistics');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 rounded">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 dark:text-white rounded-lg shadow-md p-6 mt-6">
      <h2 className="text-2xl font-bold mb-6">My Attendance Stats</h2>
      
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Calendar className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">Total</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700">{stats.totalMeetings}</p>
          <p className="text-sm text-blue-600">meetings</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-800">Attended</h3>
          </div>
          <p className="text-3xl font-bold text-green-700">{stats.attended}</p>
          <p className="text-sm text-green-600">
            {stats.totalMeetings > 0 
              ? `${Math.round((stats.attended / stats.totalMeetings) * 100)}%` 
              : '0%'}
          </p>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Clock className="w-5 h-5 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold dark:text-yellow-600 text-yellow-800">Approved</h3>
          </div>
          <p className="text-3xl font-bold text-yellow-700">{stats.approved}</p>
          <p className="text-sm text-yellow-600 ">absences</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold  text-red-800 dark:text-red-800">Missed</h3>
          </div>
          <p className="text-3xl font-bold text-red-700">{stats.unauthorized}</p>
          <p className="text-sm text-red-600">unauthorized</p>
        </div>
      </div>
      
      {/* Bar Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Attendance History</h3>
        <div className="h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'percentage') return [`${value}%`, 'Attendance Rate'];
                    return [value, name === 'attended' ? 'Meetings Attended' : 'Total Meetings'];
                  }}
                />
                <Legend />
                <Bar dataKey="attended" name="Attended" fill="#4ade80" />
                <Bar dataKey="total" name="Total" fill="#93c5fd" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
              <p className="text-gray-500">No attendance history available</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Pie Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Attendance Breakdown</h3>
        <div className="h-80">
          {pieData.length > 0 && stats.totalMeetings > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} meetings`, '']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
              <p className="text-gray-500">No attendance data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAttendanceStats; 