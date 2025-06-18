import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
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
  Cell,
  LineChart,
  Line
} from 'recharts';
import { CheckCircle, XCircle, Clock, AlertTriangle, Users, Download, FileText } from 'lucide-react';
import Loader from '../../components/Loader';

// Try to import packages, but don't fail if they're not available
let XLSX, jsPDF, html2canvas;
try {
  XLSX = require('xlsx');
} catch (e) {
  console.warn('XLSX package not available, export to Excel disabled');
}

try {
  jsPDF = require('jspdf').jsPDF;
} catch (e) {
  console.warn('jsPDF package not available, export to PDF disabled');
}

try {
  html2canvas = require('html2canvas');
} catch (e) {
  console.warn('html2canvas package not available, export to PDF disabled');
}

const AttendanceChart = ({ clubId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendanceData, setAttendanceData] = useState({
    overview: {
      totalMeetings: 0,
      totalMembers: 0,
      averageAttendance: 0,
      lowAttendanceMembers: []
    },
    meetings: [],
    members: [],
    trend: []
  });
  
  const trendChartRef = useRef(null);
  const meetingChartRef = useRef(null);
  const memberChartRef = useRef(null);

  const COLORS = ['#4ade80', '#f87171', '#facc15', '#60a5fa', '#c084fc'];

  useEffect(() => {
    if (clubId) {
      fetchAttendanceData();
    }
  }, [clubId]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch meetings for this club
      const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
      const meetingsSnapshot = await getDocs(meetingsRef);
      const meetingsList = meetingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      
      // Get all members for this club
      const membersRef = collection(db, 'clubs', clubId, 'members');
      const membersSnapshot = await getDocs(membersRef);
      const membersList = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Process attendance data for each meeting
      const processedMeetings = meetingsList.map(meeting => {
        const attendees = meeting.attendees || {};
        const attendeeCount = Object.keys(attendees).length;
        const attendanceRate = membersList.length > 0 
          ? (attendeeCount / membersList.length) * 100 
          : 0;
          
        return {
          id: meeting.id,
          name: meeting.name,
          date: new Date(meeting.date),
          attendees: attendeeCount,
          total: membersList.length,
          rate: Math.round(attendanceRate)
        };
      });
      
      // Sort meetings by date
      processedMeetings.sort((a, b) => a.date - b.date);
      
      // Create attendance trend data
      const trendData = processedMeetings.map(meeting => ({
        name: meeting.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rate: meeting.rate
      }));
      
      // Calculate member attendance rates
      const memberAttendance = [];
      for (const member of membersList) {
        // Get user details
        const userDoc = await getDoc(doc(db, 'users', member.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Count meetings attended
          let attended = 0;
          meetingsList.forEach(meeting => {
            if (meeting.attendees && meeting.attendees[member.userId]) {
              attended++;
            }
          });
          
          const attendanceRate = meetingsList.length > 0 
            ? (attended / meetingsList.length) * 100 
            : 0;
            
          memberAttendance.push({
            id: member.userId,
            name: userData.displayName || 'User',
            email: userData.email,
            attended: attended,
            total: meetingsList.length,
            rate: Math.round(attendanceRate)
          });
        }
      }
      
      // Sort members by attendance rate (descending)
      memberAttendance.sort((a, b) => b.rate - a.rate);
      
      // Find members with poor attendance (< 60%)
      const lowAttendanceMembers = memberAttendance.filter(member => 
        member.rate < 60 && member.total >= 3
      );
      
      // Calculate average attendance rate
      const totalAttendanceRate = memberAttendance.reduce((sum, member) => sum + member.rate, 0);
      const averageAttendance = memberAttendance.length > 0 
        ? Math.round(totalAttendanceRate / memberAttendance.length) 
        : 0;
      
      setAttendanceData({
        overview: {
          totalMeetings: meetingsList.length,
          totalMembers: membersList.length,
          averageAttendance: averageAttendance,
          lowAttendanceMembers: lowAttendanceMembers
        },
        meetings: processedMeetings,
        members: memberAttendance,
        trend: trendData
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError('Failed to load attendance statistics');
      setLoading(false);
    }
  };

  // Export chart as SVG
  const exportAsSVG = (chartRef, fileName) => {
    if (!chartRef.current) return;
    
    const svgElement = chartRef.current.querySelector('svg');
    if (!svgElement) {
      alert('No SVG element found to export');
      return;
    }
    
    // Get SVG source
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);
    
    // Add namespace
    if(!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    
    // Add XML declaration
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    
    // Convert SVG source to URI data scheme
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    
    // Create download link
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `${fileName}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Export chart as PDF
  const exportAsPDF = async (chartRef, fileName) => {
    if (!jsPDF || !html2canvas) {
      alert('PDF export is not available. Required packages are not installed.');
      return;
    }
    
    if (!chartRef.current) return;
    
    try {
      const canvas = await html2canvas(chartRef.current);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again later.');
    }
  };

  // Export members list as Excel
  const exportMembersToExcel = () => {
    if (!XLSX) {
      alert('Excel export is not available. Required packages are not installed.');
      return;
    }
    
    try {
      // Create worksheet data
      const worksheetData = [
        // Header row
        ['Name', 'Email', 'Meetings Attended', 'Total Meetings', 'Attendance Rate (%)']
      ];
      
      // Add member data rows
      attendanceData.members.forEach(member => {
        worksheetData.push([
          member.name,
          member.email,
          member.attended,
          member.total,
          member.rate
        ]);
      });
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Member Attendance');
      
      // Write workbook and trigger download
      XLSX.writeFile(wb, 'members_attendance.xlsx');
    } catch (error) {
      console.error('Error generating Excel file:', error);
      alert('Failed to generate Excel file. Please try again later.');
    }
  };

  // Alternative CSV export function that works without xlsx library
  const exportMembersToCSV = () => {
    try {
      // Create CSV data
      const header = ['Name', 'Email', 'Meetings Attended', 'Total Meetings', 'Attendance Rate (%)'];
      const rows = attendanceData.members.map(member => [
        member.name,
        member.email,
        member.attended,
        member.total,
        member.rate
      ]);
      
      // Convert to CSV string
      const csvContent = [
        header.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'members_attendance.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating CSV file:', error);
      alert('Failed to generate CSV file. Please try again later.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="medium" />
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 lg:p-3 ">
      <div className="flex p-1 justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Attendance Analytics</h2>
        
        <button 
          onClick={XLSX ? exportMembersToExcel : exportMembersToCSV}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
        >
          <FileText className="w-4 h-4 mr-2 " />
         <div className='hidden md:block'> Export </div>
        </button>
      </div>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50  dark:bg-blue-900 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Clock className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold dark:text-blue-500 text-blue-800">Meetings</h3>
          </div>
          <p className="text-3xl font-bold dark:text-blue-200 text-blue-700">{attendanceData.overview.totalMeetings}</p>
          <p className="text-sm text-blue-600">total meetings</p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Users className="w-5 h-5 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold dark:text-green-500 text-green-800">Members</h3>
          </div>
          <p className="text-3xl font-bold dark:text-green-200 text-green-700">{attendanceData.overview.totalMembers}</p>
          <p className="text-sm dark:text-green-500 text-green-600">total members</p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-5 h-5 text-purple-500 mr-2" />
            <h3 className="text-lg font-semibold dark:text-purple-500 text-purple-800">Attendance</h3>
          </div>
          <p className="text-3xl font-bold dark:text-purple-200 text-purple-700">{attendanceData.overview.averageAttendance}%</p>
          <p className="text-sm text-purple-600">average attendance</p>
        </div>
        
        <div className="bg-yellow-50  dark:bg-yellow-900 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold dark:text-yellow-500 text-yellow-800">Low Attendance</h3>
          </div>
          <p className="text-3xl font-bold  dark:text-yellow-200 text-yellow-700">{attendanceData.overview.lowAttendanceMembers.length}</p>
          <p className="text-sm text-yellow-600">members below 60%</p>
        </div>
      </div>
      
      {/* Attendance Trend Line Chart */}
      <div className="mb-8" ref={trendChartRef}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Attendance Trend</h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => exportAsSVG(trendChartRef, 'attendance_trend')}
              className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center text-sm"
            >
              <Download className="w-3 h-3 mr-1" />
              SVG
            </button>
            <button 
              onClick={() => exportAsPDF(trendChartRef, 'attendance_trend')}
              className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center text-sm"
            >
              <Download className="w-3 h-3 mr-1" />
              PDF
            </button>
          </div>
        </div>
        <div className="h-64">
          {attendanceData.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={attendanceData.trend}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value}%`, 'Attendance Rate']} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
              <p className="text-gray-500">No attendance trend data available</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Meeting Attendance Bar Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Meeting Attendance</h3>
        <div className="h-64">
          {attendanceData.meetings.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={attendanceData.meetings.slice(-10)} // Show last 10 meetings
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={props => (
                    <text {...props} fill="#666" fontSize={10} textAnchor="end" angle={-45} dy={10} dx={-10}>
                      {props.payload.value.length > 12 
                        ? `${props.payload.value.substring(0, 12)}...` 
                        : props.payload.value}
                    </text>
                  )}
                  height={60}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'rate') return [`${value}%`, 'Attendance Rate'];
                    if (name === 'attendees') return [value, 'Members Present'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar dataKey="attendees" name="Attendees" fill="#4ade80" />
                <Bar dataKey="rate" name="Attendance Rate (%)" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
              <p className="text-gray-500">No meeting attendance data available</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Members with Low Attendance */}
      {attendanceData.overview.lowAttendanceMembers.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg dark:text-white font-semibold mb-4">Members with Low Attendance</h3>
          <div className="bg-yellow-50 dark:bg-yellow-900 dark:text-white p-4 rounded-lg">
            <ul className="divide-y divide-yellow-200">
              {attendanceData.overview.lowAttendanceMembers.map(member => (
                <li key={member.id} className="py-3 flex-wrap flex justify-between items-center">
                  <div>
                    <p className="font-medium dark:text-white text-black">{member.name}</p>
                    <p className="text-sm dark:text-gray-200 text-gray-600">{member.email}</p>
                  </div>
                  <div className="text-right w-full">
                    <p className="text-lg font-bold dark:text-yellow-200 text-yellow-700">{member.rate}%</p>
                    <p className="text-sm dark:text-gray-200 text-gray-600">
                      {member.attended} / {member.total} meetings
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceChart; 