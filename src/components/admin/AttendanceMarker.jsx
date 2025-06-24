import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { updateMissedMeetingCount } from '../../utils/attendanceUtils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import Loader from '../Loader';
import QRCode from 'qrcode.react';
import { Copy, Download, QrCode, Share2 } from 'lucide-react';
import { FaWhatsapp } from "react-icons/fa6";
import { FaTelegram } from "react-icons/fa";
import { MdAttachEmail } from "react-icons/md";

const AttendanceMarker = ({ meeting, clubId, onClose, onSuccess }) => {
  // State for loading status
  const [loading, setLoading] = useState(true);

  // State for error messages
  const [error, setError] = useState('');

  // State for attendance list
  const [attendanceList, setAttendanceList] = useState([]);

  // State for attendance statistics
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    percentage: 0
  });

  // QR code states
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Get current user from auth context
  const { currentUser } = useAuth();

  // Counter to prevent infinite fetch loops
  const [fetchAttempts, setFetchAttempts] = useState(0);

  // Fetch attendance data when meeting ID changes
  useEffect(() => {
    if (meeting && meeting.id && fetchAttempts < 3) {
      setLoading(true);
      setFetchAttempts(prev => prev + 1);
      fetchAttendanceData();
    }
  }, [meeting?.id]);

  // Function to fetch attendance data
  const fetchAttendanceData = async () => {
    setError('');

    if (!meeting || !clubId) {
      setError('Invalid meeting data');
      setLoading(false);
      return;
    }

    try {
      // Create a snapshot of current meeting data
      const meetingData = { ...meeting };

      // Fetch all club members
      const membersRef = collection(db, 'clubs', clubId, 'members');
      const membersSnapshot = await getDocs(membersRef);

      if (membersSnapshot.empty) {
        setAttendanceList([]);
        setAttendanceStats({
          present: 0,
          absent: 0,
          percentage: 0
        });
        setLoading(false);
        return;
      }

      // Process members in batches
      const membersList = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const batchSize = 5;
      const attendanceData = [];

      for (let i = 0; i < membersList.length; i += batchSize) {
        const batch = membersList.slice(i, i + batchSize);

        const batchPromises = batch.map(async (member) => {
          const userId = member.userId || member.id;

          if (!userId) return null;

          try {
            const userDoc = await getDoc(doc(db, 'users', userId));

            let userData = {
              id: userId,
              name: 'Unknown User',
              email: 'unknown@email.com',
              present: meetingData.attendees && meetingData.attendees[userId] || false
            };

            if (userDoc.exists()) {
              const docData = userDoc.data();
              userData.name = docData.displayName || member.displayName || `User ${userId.substring(0, 6)}`;
              userData.email = docData.email || member.email || 'No email available';
            } else {
              userData.name = member.displayName || `User ${userId.substring(0, 6)}`;
              userData.email = member.email || 'No email available';
            }

            return userData;
          } catch (error) {
            console.error(`Error processing user ${userId}:`, error);
            return {
              id: userId,
              name: `User ${userId.substring(0, 6)}`,
              email: 'Error retrieving data',
              present: meetingData.attendees && meetingData.attendees[userId] || false
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        attendanceData.push(...batchResults.filter(item => item !== null));
      }

      // Calculate attendance stats
      const presentCount = attendanceData.filter(user => user.present).length;
      const totalCount = attendanceData.length;
      const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

      setAttendanceStats({
        present: presentCount,
        absent: totalCount - presentCount,
        percentage: percentage
      });

      setAttendanceList(attendanceData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError(`Failed to load attendance data: ${err.message}`);
      setLoading(false);
    }
  };

  // Function to retry fetching data
  const retryFetch = () => {
    setFetchAttempts(0);
    fetchAttendanceData();
  };

  // Function to handle attendance submission
  const handleSubmitAttendance = async () => {
    try {
      if (!meeting || !meeting.id || !clubId) {
        setError('Invalid meeting data. Please try again.');
        return;
      }

      // Check if attendance was already marked
      const meetingDoc = await getDoc(doc(db, 'clubs', clubId, 'meetings', meeting.id));
      const wasAlreadyMarked = meetingDoc.data()?.attendanceMarked || false;

      // Convert attendance list to attendees object
      const attendeesObject = {};
      attendanceList.forEach(user => {
        if (user.present) {
          attendeesObject[user.id] = true;
        }
      });

      // Update meeting document
      await updateDoc(doc(db, 'clubs', clubId, 'meetings', meeting.id), {
        attendees: attendeesObject,
        attendanceMarked: true,
        attendanceMarkedAt: serverTimestamp(),
        attendanceMarkedBy: currentUser.uid
      });

      // Update missed meeting counts (only if not already marked)
      if (!wasAlreadyMarked) {
        await updateMissedMeetingCount(clubId, meeting.id, attendeesObject);
      }

      // Update attended meetings for present users
      for (const user of attendanceList) {
        if (user.present) {
          try {
            const userRef = doc(db, 'users', user.id);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
              const userData = userDoc.data();
              const attendedMeetings = userData.attendedMeetings || [];

              if (!attendedMeetings.some(m => m.meetingId === meeting.id)) {
                await updateDoc(userRef, {
                  attendedMeetings: [...attendedMeetings, {
                    meetingId: meeting.id,
                    clubId: clubId,
                    meetingName: meeting.name,
                    date: meeting.date,
                    timestamp: serverTimestamp()
                  }]
                });
              }
            }
          } catch (userError) {
            console.error(`Error updating attendance for user ${user.id}:`, userError);
          }
        }
      }

      if (onSuccess) onSuccess('Attendance marked successfully');
      if (onClose) onClose();
    } catch (err) {
      console.error('Failed to update attendance:', err);
      setError('Failed to update attendance: ' + err.message);
    }
  };

  // Function to generate QR code
  const handleGenerateQRCode = async () => {
    try {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      setSessionCode(code);

      const qrData = {
        meetingId: meeting.id,
        sessionCode: code,
        clubId: clubId,
        timestamp: Date.now()
      };

      const qrString = JSON.stringify(qrData);
      setQrValue(qrString);

      await updateDoc(doc(db, 'clubs', clubId, 'meetings', meeting.id), {
        activeSessionCode: code,
        sessionStartTime: serverTimestamp()
      });

      setShowQrModal(true);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code: ' + err.message);
    }
  };

  // Function to download QR code
  const downloadQRCode = () => {
    const canvas = document.getElementById('attendance-qr-code');
    if (canvas) {
      const pngUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream');

      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `meeting-attendance-qr-${meeting.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  // Function to close QR modal
  const closeQrModal = () => {
    setShowQrModal(false);
  };

  // Function to share session code via social media
  const shareSessionCode = (platform) => {
    const meetingDetails =`
📢 *Meeting Details*

📌 *Title:* *${meeting.name}*
📅 *Date:* *${meeting.date}* 
⏰ *Time:* *${meeting.time}*

✅ *Use the session code below to mark your attendance:*

🔐 *Session Code:* \`${sessionCode}\`

📝 _Enter this code in the app to confirm your attendance._

⏳ *Note:* This code is valid for a *limited time only*. Please mark your attendance *before it expires!*
`.trim();


    let url = '';

    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(meetingDetails)}`;
        window.open(url, '_blank');
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(meetingDetails)}`;
        window.open(url, '_blank');
        break;
      case 'email':
        url = `mailto:?subject=Attendance Session Code for ${meeting.name}&body=${encodeURIComponent(meetingDetails)}`;
        window.open(url, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(meetingDetails);
        //change the button text as copied for two seconds
        const copyButton = document.querySelector('.copy');
        if (copyButton) {
          copyButton.textContent = 'Code Copied!';
          setTimeout(() => {
            copyButton.textContent = 'Copy to Clipboard';
          }, 2000);
        }
        break;
      default:
        break;
    }
  };

  // Loading state UI
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white mx-2 dark:bg-gray-800 rounded-lg p-6 w-[600px]"
        >
          <h3 className="text-xl font-semibold mb-4">Loading Attendance Data...</h3>
          <div className="flex justify-center py-8">
            <Loader size="medium" />
          </div>
        </motion.div>
      </div>
    );
  }

  // Main component UI
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white mx-2 dark:bg-gray-800 rounded-lg p-6 w-[800px] max-h-[80vh] overflow-y-auto"
      >
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h2 className="text-xl font-semibold mb-3">Mark Attendance</h2>
          <div className='flex gap-2'>
            <span className="text-gray-500 text-sm">Meeting: </span>
            <span className="font-medium">{meeting.name}</span>
          </div>
        </div>

        {/* Meeting details */}
        <div className='flex justify-between'>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="text-gray-500 text-sm">Date: </span>
            <span className="font-medium mr-4">{meeting.date}</span>
            <span className="text-gray-500 text-sm">Time: </span>
            <span className="font-medium">{meeting.time}</span>
          </div>
          <QrCode onClick={handleGenerateQRCode} className="h-10 w-10 lg:hidden cursor-pointer mr-2 mt-1 " />
        </div>
        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
            <button
              onClick={retryFetch}
              className="ml-2 px-2 py-1 bg-red-200 text-red-700 rounded hover:bg-red-300"
            >
              Retry
            </button>
          </div>
        )}

        {/* QR Code button */}
        <span onClick={handleGenerateQRCode} className='hidden cursor-pointer lg:inline-flex px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 items-center'>
          <QrCode className="h-4 w-4 mr-2 mt-1" />
          Generate QR Code for Attendance</span>

        {/* Attendance statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6 mt-16 lg:mt-2">
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <p className="text-sm text-green-700">Present</p>
            <p className="text-xl font-bold text-green-700">{attendanceStats.present}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <p className="text-sm text-red-700">Absent</p>
            <p className="text-xl font-bold text-red-700">{attendanceStats.absent}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <p className="text-sm text-blue-700">Attendance</p>
            <p className="text-xl font-bold text-blue-700">{attendanceStats.percentage}%</p>
          </div>
        </div>

        {/* Attendance chart */}
        <div className="mb-6 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Present', value: attendanceStats.present },
                  { name: 'Absent', value: attendanceStats.absent }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#4ade80" />
                <Cell fill="#f87171" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance list */}
        <div className="space-y-4 mt-6 max-h-80 overflow-y-auto">
          {attendanceList.length > 0 ? (
            attendanceList.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 border border-blue-100 rounded hover:text-black hover:bg-blue-50 transition-colors">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded text-blue-600 border-blue-300 focus:ring-blue-500"
                    checked={user.present}
                    onChange={(e) => {
                      const updatedList = attendanceList.map(u =>
                        u.id === user.id ? { ...u, present: e.target.checked } : u
                      );
                      setAttendanceList(updatedList);

                      const presentCount = updatedList.filter(u => u.present).length;
                      const totalCount = updatedList.length;
                      const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

                      setAttendanceStats({
                        present: presentCount,
                        absent: totalCount - presentCount,
                        percentage: percentage
                      });
                    }}
                  />
                  <span className={user.present ? 'text-green-600' : 'text-gray-600'}>
                    {user.present ? 'Present' : 'Absent'}
                  </span>
                </label>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No members found in this club</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitAttendance}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Submit Attendance
          </button>
        </div>
      </motion.div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70  flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white mx-2 dark:bg-slate-800 dark:text-white overflow-y-auto max-h-[800px] rounded-lg p-6 max-w-md"
          >
            <h3 className="text-xl font-semibold mb-4 text-center">Attendance Session</h3>

            <div className="flex flex-col items-center">
              <QRCode
                id="attendance-qr-code"
                value={qrValue}
                size={256}
                level={"H"}
                includeMargin={true}
                bgColor={"#FFFFFF"}
                fgColor={"#000000"}
              />

              <p className="mt-4 text-center  dark:text-gray-200 text-gray-700">
                <span className="block font-medium  dark:text-gray-100 text-gray-900">
                  {meeting.name}
                </span>
                <span className="text-sm">
                  {meeting.date} at {meeting.time}
                </span>
              </p>

              <div className="mt-4 mb-2 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg text-center w-full">
                <p className="text-sm font-medium dark:text-gray-200 text-gray-700 mb-1">
                  Session Code
                </p>
                <p className="text-2xl font-bold dark:text-white text-gray-900">
                  {sessionCode}
                </p>
              </div>

              <p className="mt-2 dark:text-gray-200 text-sm text-gray-500 max-w-xs text-center">
                Share this code with members to mark their attendance.
              </p>

              <div className="mt-4 relative">
                <button
                  onClick={() => setShowShareOptions(!showShareOptions)}
                  className="px-4 py-2 share bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Session Code
                </button>

                {showShareOptions && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute bottom-full -left-5 mb-2 w-[240px] bg-white dark:bg-gray-700 rounded-md shadow-lg z-10 p-2">
                    <button
                      onClick={() => shareSessionCode('whatsapp')}
                      className="w-full text-left bg-green-200 mb-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded flex items-center"
                    >
                       <FaWhatsapp className="h-6 w-6 mr-2 text-green-700" />
                      <span className="mr-2 text-green-700">WhatsApp</span>
                    </button>
                    <button
                      onClick={() => shareSessionCode('telegram')}
                      className="w-full text-left px-3 py-2 bg-blue-200 mb-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded flex items-center"
                    >
                       <FaTelegram className="h-6 w-6 mr-2 text-blue-700" />
                      <span className="mr-2 text-blue-700">Telegram</span>
                    </button>
                    <button
                      onClick={() => shareSessionCode('email')}
                      className="w-full text-left px-3 py-2 bg-gray-200 mb-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded flex items-center"
                    >
                       <MdAttachEmail className="h-6 w-6 mr-2 text-gray-700" />
                      <span className="mr-2 text-gray-700">Email</span>
                    </button>
                    <button
                      onClick={() => shareSessionCode('copy')}
                      className="w-full gap-2 text-left px-3 py-2 bg-yellow-200 mb-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded flex items-center"
                    >
                      <Copy className="h-6 w-6 mr-2 text-yellow-700" />
                      <span className="mr-2 copy text-yellow-700">Copy to Clipboard</span>
                    </button>
                  </motion.div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={downloadQRCode}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR
                </button>

                <button
                  onClick={closeQrModal}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AttendanceMarker;