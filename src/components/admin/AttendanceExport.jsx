import { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { 
  FileText, 
  Download, 
  Calendar, 
  FilterIcon, 
  RefreshCw, 
  FileSpreadsheet,
  FileImage,
  FilePdf,
  AlertCircle,
  BarChart2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Import optional dependencies for export
let jsPDF, html2canvas;
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

// Utility to convert date to string
const formatDate = (date) => {
  if (!date) return 'N/A';
  if (date instanceof Timestamp) {
    date = date.toDate();
  }
  return date.toLocaleDateString();
};

const AttendanceExport = () => {
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  
  // Add refs for chart components
  const chartContainerRef = useRef(null);
  
  // Add state for chart data
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    if (selectedClub) {
      fetchMeetings(selectedClub);
    } else {
      setMeetings([]);
    }
  }, [selectedClub]);
  
  // Generate chart data when attendance data changes
  useEffect(() => {
    if (attendanceData.length > 0) {
      generateChartData();
    }
  }, [attendanceData]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const clubsRef = collection(db, 'clubs');
      const clubsSnapshot = await getDocs(clubsRef);
      
      const clubsList = clubsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setClubs(clubsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      setError('Failed to load clubs');
      setLoading(false);
    }
  };

  const fetchMeetings = async (clubId) => {
    try {
      setLoading(true);
      setMeetings([]);
      
      const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
      const meetingsQuery = query(meetingsRef, orderBy('date', 'desc'));
      const meetingsSnapshot = await getDocs(meetingsQuery);
      
      const meetingsList = meetingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date instanceof Timestamp ? doc.data().date.toDate() : new Date(doc.data().date)
      }));
      
      setMeetings(meetingsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setError('Failed to load meetings');
      setLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setAttendanceData([]);
      setError('');
      
      if (!selectedClub) {
        setError('Please select a club');
        setLoading(false);
        return;
      }
      
      let attendanceRecords = [];
      
      // If a specific meeting is selected
      if (selectedMeeting) {
        const meeting = meetings.find(m => m.id === selectedMeeting);
        const attendance = meeting?.attendance || [];
        
        // Fetch member details for each attendance record
        for (const memberId of attendance) {
          try {
            const memberRef = doc(db, 'clubs', selectedClub, 'members', memberId);
            const memberDoc = await getDoc(memberRef);
            
            if (memberDoc.exists()) {
              attendanceRecords.push({
                meeting: meeting.topic || meeting.name,
                meetingDate: formatDate(meeting.date),
                memberName: memberDoc.data().displayName || 'Unknown',
                memberEmail: memberDoc.data().email || 'N/A',
                status: 'Present'
              });
            }
          } catch (error) {
            console.error('Error fetching member data:', error);
          }
        }
      } 
      // Fetch by date range
      else if (dateRange.start && dateRange.end) {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999); // Set to end of day
        
        // First get all meetings in the date range
        const meetingsInRange = meetings.filter(meeting => {
          return meeting.date >= start && meeting.date <= end;
        });
        
        // Get attendance for each meeting
        for (const meeting of meetingsInRange) {
          const attendance = meeting.attendance || [];
          
          // Fetch member details for attendance
          for (const memberId of attendance) {
            try {
              const memberRef = doc(db, 'clubs', selectedClub, 'members', memberId);
              const memberDoc = await getDoc(memberRef);
              
              if (memberDoc.exists()) {
                attendanceRecords.push({
                  meeting: meeting.topic || meeting.name,
                  meetingDate: formatDate(meeting.date),
                  memberName: memberDoc.data().displayName || 'Unknown',
                  memberEmail: memberDoc.data().email || 'N/A',
                  status: 'Present'
                });
              }
            } catch (error) {
              console.error('Error fetching member data:', error);
            }
          }
        }
      } else {
        setError('Please select a meeting or a date range');
        setLoading(false);
        return;
      }
      
      setAttendanceData(attendanceRecords);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setError('Failed to fetch attendance data');
      setLoading(false);
    }
  };
  
  // Function to generate chart data
  const generateChartData = () => {
    // Group attendance by meeting
    const meetingAttendance = {};
    
    attendanceData.forEach(record => {
      if (!meetingAttendance[record.meeting]) {
        meetingAttendance[record.meeting] = {
          meeting: record.meeting,
          date: record.meetingDate,
          attendees: 0
        };
      }
      meetingAttendance[record.meeting].attendees += 1;
    });
    
    // Convert to array and sort by date
    const chartData = Object.values(meetingAttendance)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    setChartData(chartData);
  };

  const exportToCSV = () => {
    if (attendanceData.length === 0) {
      setError('No attendance data to export');
      return;
    }
    
    try {
      setExporting(true);
      
      // Define headers for CSV
      const headers = ['Meeting', 'Date', 'Member Name', 'Email', 'Status'];
      
      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      
      attendanceData.forEach(record => {
        const row = [
          `"${record.meeting}"`,
          `"${record.meetingDate}"`,
          `"${record.memberName}"`,
          `"${record.memberEmail}"`,
          `"${record.status}"`
        ];
        csvContent += row.join(',') + '\n';
      });
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'attendance_report.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExporting(false);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      setError('Failed to export CSV');
      setExporting(false);
    }
  };

  const exportToExcel = () => {
    if (attendanceData.length === 0) {
      setError('No attendance data to export');
      return;
    }
    
    try {
      setExporting(true);
      
      // Similar to CSV but for Excel (XLS)
      // In a real application, you might use a library like XLSX.js
      // For this example, we'll use CSV with an .xls extension
      const headers = ['Meeting', 'Date', 'Member Name', 'Email', 'Status'];
      
      let csvContent = headers.join('\t') + '\n';
      
      attendanceData.forEach(record => {
        const row = [
          record.meeting,
          record.meetingDate,
          record.memberName,
          record.memberEmail,
          record.status
        ];
        csvContent += row.join('\t') + '\n';
      });
      
      const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'attendance_report.xls');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExporting(false);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Failed to export Excel');
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    if (!jsPDF || !html2canvas) {
      setError('PDF export functionality requires PDF generation libraries (jsPDF and html2canvas)');
      return;
    }
    
    if (attendanceData.length === 0) {
      setError('No attendance data to export');
      return;
    }
    
    try {
      setExporting(true);
      
      // Create a container that includes both the data table and chart
      const exportContainer = document.createElement('div');
      exportContainer.style.width = '800px';
      exportContainer.style.padding = '20px';
      exportContainer.style.backgroundColor = 'white';
      
      // Add title
      const title = document.createElement('h2');
      title.textContent = 'Attendance Report';
      title.style.marginBottom = '20px';
      exportContainer.appendChild(title);
      
      // Add chart if available
      if (chartData.length > 0) {
        const chartContainer = document.createElement('div');
        chartContainer.style.height = '300px';
        chartContainer.style.marginBottom = '20px';
        
        // Render the chart into DOM
        const chartElement = document.createElement('div');
        chartElement.style.width = '100%';
        chartElement.style.height = '100%';
        chartContainer.appendChild(chartElement);
        exportContainer.appendChild(chartContainer);
        
        // Clone the chart from the ref
        if (chartContainerRef.current) {
          const chartClone = chartContainerRef.current.cloneNode(true);
          exportContainer.appendChild(chartClone);
        }
      }
      
      // Add table
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      
      // Create header row
      const headers = ['Meeting', 'Date', 'Member Name', 'Email', 'Status'];
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.border = '1px solid #ddd';
        th.style.padding = '8px';
        th.style.backgroundColor = '#f2f2f2';
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      // Create data rows
      const tbody = document.createElement('tbody');
      
      attendanceData.forEach(record => {
        const row = document.createElement('tr');
        
        const values = [
          record.meeting,
          record.meetingDate,
          record.memberName,
          record.memberEmail,
          record.status
        ];
        
        values.forEach(value => {
          const td = document.createElement('td');
          td.textContent = value;
          td.style.border = '1px solid #ddd';
          td.style.padding = '8px';
          row.appendChild(td);
        });
        
        tbody.appendChild(row);
      });
      
      table.appendChild(tbody);
      exportContainer.appendChild(table);
      
      // Temporarily add to document to render
      document.body.appendChild(exportContainer);
      
      // Convert to canvas
      const canvas = await html2canvas(exportContainer);
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('attendance_report.pdf');
      
      // Clean up
      document.body.removeChild(exportContainer);
      setExporting(false);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setError('Failed to export to PDF: ' + error.message);
      setExporting(false);
    }
  };

  const exportToSVG = () => {
    if (chartContainerRef.current) {
      try {
        setExporting(true);
        
        // Find SVG element in the chart container
        const svgElement = chartContainerRef.current.querySelector('svg');
        
        if (!svgElement) {
          setError('No SVG element found for export');
          setExporting(false);
          return;
        }
        
        // Clone SVG to avoid modifying the original
        const svgClone = svgElement.cloneNode(true);
        
        // Add any necessary attributes for standalone SVG
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        // Convert to string
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgClone);
        
        // Add XML declaration
        svgString = '<?xml version="1.0" standalone="no"?>\r\n' + svgString;
        
        // Create download link
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'attendance_chart.svg';
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setExporting(false);
      } catch (error) {
        console.error('Error exporting to SVG:', error);
        setError('Failed to export SVG: ' + error.message);
        setExporting(false);
      }
    } else {
      setError('No chart available for SVG export');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center mb-6">
        <FileText className="h-5 w-5 mr-2" />
        Attendance Export
      </h2>

      {error && (
        <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Club
          </label>
          <select
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
            className="form-select"
            disabled={loading}
          >
            <option value="">Select a club</option>
            {clubs.map(club => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Meeting (Optional)
          </label>
          <select
            value={selectedMeeting}
            onChange={(e) => setSelectedMeeting(e.target.value)}
            className="form-select"
            disabled={!selectedClub || loading}
          >
            <option value="">All meetings</option>
            {meetings.map(meeting => (
              <option key={meeting.id} value={meeting.id}>
                {meeting.topic || meeting.name} ({formatDate(meeting.date)})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
        <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
          <FilterIcon className="h-4 w-4 mr-2" />
          Filter by Date Range
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="form-input"
              disabled={loading || selectedMeeting !== ''}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="form-input"
              disabled={loading || selectedMeeting !== '' || !dateRange.start}
              min={dateRange.start}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={fetchAttendanceData}
          className="form-btn form-btn-primary flex items-center"
          disabled={!selectedClub || loading || 
            (selectedMeeting === '' && (!dateRange.start || !dateRange.end))}
        >
          {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
          {loading ? 'Loading...' : 'Fetch Attendance Data'}
        </button>
        
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={exportToCSV}
            className="form-btn form-btn-secondary flex items-center"
            disabled={attendanceData.length === 0 || exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </button>
          
          <button
            onClick={exportToExcel}
            className="form-btn form-btn-secondary flex items-center"
            disabled={attendanceData.length === 0 || exporting}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </button>
          
          <button
            onClick={exportToPDF}
            className="form-btn form-btn-secondary flex items-center"
            disabled={attendanceData.length === 0 || exporting}
          >
            <FilePdf className="h-4 w-4 mr-2" />
            PDF
          </button>
          
          <button
            onClick={exportToSVG}
            className="form-btn form-btn-secondary flex items-center"
            disabled={chartData.length === 0 || exporting}
          >
            <FileImage className="h-4 w-4 mr-2" />
            SVG
          </button>
        </div>
      </div>
      
      {/* Attendance Chart */}
      {chartData.length > 0 && (
        <div className="mb-8" ref={chartContainerRef}>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart2 className="h-5 w-5 mr-2" />
            Attendance Chart
          </h3>
          <div className="h-64 bg-white p-4 rounded-lg border border-gray-200">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="meeting" 
                  tick={{ fontSize: 12 }}
                  height={60}
                  tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="attendees" name="Number of Attendees" fill="#4ade80" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {attendanceData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Meeting</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {attendanceData.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{record.meeting}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{record.meetingDate}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{record.memberName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{record.memberEmail}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Attendance Data</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Select a club and meeting or date range, then click "Fetch Attendance Data" to view and export attendance.
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendanceExport; 