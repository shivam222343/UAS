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
  LineChart,
  Line
} from 'recharts';
import { CheckCircle, XCircle, Clock, AlertTriangle, Users, Download, FileText, ChevronDown } from 'lucide-react';
import AnalyticalLoader from "../AnalyticalLoader";

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

// Color themes for export options matching the Excel format
const COLOR_THEMES = {
  default: {
    primary: '#4f46e5',
    secondary: '#10b981',
    accent: '#f59e0b',
    text: '#1f2937',
    background: '#ffffff',
    headerBg: '#4472C4',       // Dark blue header background
    headerText: '#FFFFFF',     // White header text
    presentBg: '#C6E0B4',      // Light green for present
    absentBg: '#F8CBAD',       // Light orange for absent
    summaryHeaderBg: '#70AD47', // Green summary header
    alternateRowBg: '#E9E9E9'  // Light gray for alternate rows
  }
};

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
  const [exportOptions, setExportOptions] = useState({
    format: XLSX ? 'excel' : 'csv',
    timeRange: 'overall',
    colorTheme: 'default',
    showExportModal: false
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
      const meetingsList = meetingsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate?.() || new Date(data.date),
          createdAt: data.createdAt?.toDate?.() || new Date()
        };
      });
      
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
          date: meeting.date,
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
          const memberMeetings = [];
          meetingsList.forEach(meeting => {
            const isAttended = meeting.attendees && meeting.attendees[member.userId];
            if (isAttended) {
              attended++;
            }
            memberMeetings.push({
              meetingId: meeting.id,
              meetingName: meeting.name,
              date: meeting.date,
              status: isAttended ? 'Present' : 'Absent'
            });
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
            rate: Math.round(attendanceRate),
            meetings: memberMeetings
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

  // Filter meetings based on selected time range
  const filterMeetingsByTimeRange = (meetings, timeRange) => {
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (timeRange) {
      case 'lastMonth':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'lastTwoMonths':
        cutoffDate.setMonth(now.getMonth() - 2);
        break;
      case 'lastSixMonths':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case 'lastYear':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'overall':
      default:
        return meetings; // Return all meetings
    }
    
    return meetings.filter(meeting => new Date(meeting.date) >= cutoffDate);
  };

  // Export attendance data with detailed format matching the Excel example
  const exportAttendanceData = () => {
    const { format, timeRange, colorTheme } = exportOptions;
    const theme = COLOR_THEMES[colorTheme] || COLOR_THEMES.default;
    
    // Filter meetings based on time range
    const filteredMeetings = filterMeetingsByTimeRange(attendanceData.meetings, timeRange);
    
    if (format === 'excel' && XLSX) {
      exportAttendanceToExcel(filteredMeetings, theme);
    } else {
      exportAttendanceToCSV(filteredMeetings, theme);
    }
    
    setExportOptions(prev => ({ ...prev, showExportModal: false }));
  };

  // Export to Excel with detailed format matching the example
  const exportAttendanceToExcel = (filteredMeetings, theme) => {
    try {
      // Create worksheet data for detailed attendance
      const detailedData = [];
      
      // Title row
      detailedData.push(['Detailed Attendance', '', '', '', '']);
      
      // Header row with styling matching the Excel example
      detailedData.push([
        { v: 'Name', t: 's', s: { 
          font: { bold: true, color: { rgb: theme.headerText } }, 
          fill: { fgColor: { rgb: theme.headerBg } },
          alignment: { horizontal: 'center' }
        }},
        { v: 'Email', t: 's', s: { 
          font: { bold: true, color: { rgb: theme.headerText } }, 
          fill: { fgColor: { rgb: theme.headerBg } },
          alignment: { horizontal: 'center' }
        }},
        { v: 'Meeting Name', t: 's', s: { 
          font: { bold: true, color: { rgb: theme.headerText } }, 
          fill: { fgColor: { rgb: theme.headerBg } },
          alignment: { horizontal: 'center' }
        }},
        { v: 'Date', t: 's', s: { 
          font: { bold: true, color: { rgb: theme.headerText } }, 
          fill: { fgColor: { rgb: theme.headerBg } },
          alignment: { horizontal: 'center' }
        }},
        { v: 'Status', t: 's', s: { 
          font: { bold: true, color: { rgb: theme.headerText } }, 
          fill: { fgColor: { rgb: theme.headerBg } },
          alignment: { horizontal: 'center' }
        }}
      ]);
      
      // Add member attendance data with conditional formatting
      let currentName = '';
      attendanceData.members.forEach((member, memberIndex) => {
        member.meetings.forEach((meeting, meetingIndex) => {
          if (filteredMeetings.some(m => m.id === meeting.meetingId)) {
            const meetingDate = meeting.date instanceof Date ? meeting.date : new Date(meeting.date);
            
            // Only include name and email for first row of each member
            const name = meetingIndex === 0 ? member.name : '';
            const email = meetingIndex === 0 ? member.email : '';
            
            // Determine cell background based on status
            const statusBg = meeting.status === 'Present' ? theme.presentBg : theme.absentBg;
            
            detailedData.push([
              { v: name, t: 's', s: { 
                fill: { fgColor: { rgb: memberIndex % 2 === 0 ? theme.background : theme.alternateRowBg } }
              }},
              { v: email, t: 's', s: { 
                fill: { fgColor: { rgb: memberIndex % 2 === 0 ? theme.background : theme.alternateRowBg } }
              }},
              meeting.meetingName,
              meetingDate.toLocaleDateString(),
              { v: meeting.status, t: 's', s: { 
                fill: { fgColor: { rgb: statusBg } },
                alignment: { horizontal: 'center' }
              }}
            ]);
            
            currentName = member.name;
          }
        });
      });
      
      // Add empty rows before summary
      detailedData.push(['', '', '', '', '']);
      detailedData.push(['', '', '', '', '']);
      
      // Create summary sheet matching the Excel example
      const summaryData = [
        ['Summary', '', '', '', ''],
        ['Name', 'Email', 'Meetings Attended', 'Total Meetings', 'Attendance Percentage'],
        ...attendanceData.members.map((member, index) => [
          member.name,
          member.email,
          member.attended,
          member.total,
          member.total > 0 ? (member.attended / member.total) : 0  // As decimal for percentage formatting
        ])
      ];
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add sheets with styles
      const detailedWs = XLSX.utils.aoa_to_sheet(detailedData);
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Apply column widths
      detailedWs['!cols'] = [
        { wch: 25 }, // Name
        { wch: 30 }, // Email
        { wch: 30 }, // Meeting Name
        { wch: 15 }, // Date
        { wch: 12 }  // Status
      ];
      
      summaryWs['!cols'] = [
        { wch: 25 }, // Name
        { wch: 30 }, // Email
        { wch: 18 }, // Attended
        { wch: 15 }, // Total
        { wch: 20 }  // Percentage
      ];
      
      // Add percentage formatting to summary sheet
      attendanceData.members.forEach((_, index) => {
        const cellRef = XLSX.utils.encode_cell({ c: 4, r: index + 2 }); // Column E, starting at row 3
        if (!summaryWs[cellRef]) summaryWs[cellRef] = {};
        summaryWs[cellRef].t = 'n';
        summaryWs[cellRef].z = '0.00%';
      });
      
      // Add header styling to summary sheet
      ['A1:E1', 'A2:E2'].forEach(range => {
        summaryWs[range] = summaryWs[range] || [];
        summaryWs[range].forEach(cell => {
          cell.s = {
            font: { bold: true, color: { rgb: theme.headerText } },
            fill: { fgColor: { rgb: theme.summaryHeaderBg } },
            alignment: { horizontal: 'center' }
          };
        });
      });
      
      // Add sheets to workbook
      XLSX.utils.book_append_sheet(wb, detailedWs, 'attendance_report_lastTwoMonths');
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      // Write and download
      XLSX.writeFile(wb, `attendance_report_${exportOptions.timeRange}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel file:', error);
      alert('Failed to generate Excel file. Please try again later.');
    }
  };

  // Export to CSV with detailed format matching the Excel example
  const exportAttendanceToCSV = (filteredMeetings, theme) => {
    try {
      // Create CSV content for detailed attendance
      let csvContent = 'Detailed Attendance\n\n';
      csvContent += 'Name,Email,Meeting Name,Date,Status\n';
      
      // Add member attendance data
      attendanceData.members.forEach(member => {
        let firstRow = true;
        member.meetings.forEach(meeting => {
          if (filteredMeetings.some(m => m.id === meeting.meetingId)) {
            const meetingDate = meeting.date instanceof Date ? meeting.date : new Date(meeting.date);
            const name = firstRow ? member.name : '';
            const email = firstRow ? member.email : '';
            csvContent += `"${name}","${email}","${meeting.meetingName}","${meetingDate.toLocaleDateString()}","${meeting.status}"\n`;
            firstRow = false;
          }
        });
      });
      
      // Add empty lines before summary
      csvContent += '\n\n';
      
      // Create CSV content for summary
      csvContent += 'Summary\n\n';
      csvContent += 'Name,Email,Meetings Attended,Total Meetings,Attendance Percentage\n';
      attendanceData.members.forEach(member => {
        const percentage = member.total > 0 ? (member.attended / member.total) : 0;
        csvContent += `"${member.name}","${member.email}",${member.attended},${member.total},${percentage.toFixed(2)}\n`;
      });
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${exportOptions.timeRange}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating CSV file:', error);
      alert('Failed to generate CSV file. Please try again later.');
    }
  };

  // Toggle export modal
  const toggleExportModal = () => {
    setExportOptions(prev => ({
      ...prev,
      showExportModal: !prev.showExportModal
    }));
  };

  // Handle export option change
  const handleExportOptionChange = (e) => {
    const { name, value } = e.target;
    setExportOptions(prev => ({
      ...prev,
      [name]: value
    }));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <AnalyticalLoader size="medium" />
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 lg:p-3">
      <div className="flex p-1 justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Attendance Analytics</h2>
        
        <div className="relative">
          <button 
            onClick={toggleExportModal}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            <div className='hidden md:block'>Export</div>
            <ChevronDown className="w-4 h-4 ml-1" />
          </button>
          
          {/* Export Options Modal */}
          {exportOptions.showExportModal && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10 p-4">
              <h3 className="font-semibold mb-3 dark:text-white">Export Options</h3>
              
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Format</label>
                <select
                  name="format"
                  value={exportOptions.format}
                  onChange={handleExportOptionChange}
          className="w-full md:w-1/2 border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {XLSX && <option value="excel">Excel (.xlsx)</option>}
                  <option value="csv">CSV (.csv)</option>
                </select>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Time Range</label>
                <select
                  name="timeRange"
                  value={exportOptions.timeRange}
                  onChange={handleExportOptionChange}
          className="w-full md:w-1/2 border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="lastMonth">Last Month</option>
                  <option value="lastTwoMonths">Last Two Months</option>
                  <option value="lastSixMonths">Last Six Months</option>
                  <option value="lastYear">Last Year</option>
                  <option value="overall">Overall</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Color Theme</label>
                <select
                  name="colorTheme"
                  value={exportOptions.colorTheme}
                  onChange={handleExportOptionChange}
          className="w-full md:w-1/2 border border-blue-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="default">Default</option>
                </select>
              </div>
              
              <button
                onClick={exportAttendanceData}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
              >
                Generate Report
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
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
        
        <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold dark:text-yellow-500 text-yellow-800">Low Attendance</h3>
          </div>
          <p className="text-3xl font-bold dark:text-yellow-200 text-yellow-700">{attendanceData.overview.lowAttendanceMembers.length}</p>
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
            {jsPDF && html2canvas && (
              <button 
                onClick={() => exportAsPDF(trendChartRef, 'attendance_trend')}
                className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center text-sm"
              >
                <Download className="w-3 h-3 mr-1" />
                PDF
              </button>
            )}
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
          <div className="bg-yellow-50 dark:bg-yellow-950/50 dark:text-white p-4 rounded-lg">
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