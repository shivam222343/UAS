import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode.react';
import { collection, getDocs, doc, updateDoc, getDoc, Timestamp, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Save, Calendar, Clock, MapPin, Users, Download, RefreshCw } from 'lucide-react';
import Loader from '../components/Loader';

const QRGenerator = () => {
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [qrValue, setQrValue] = useState('');
  const [qrGenerated, setQrGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchUserClubs();
  }, []);

  useEffect(() => {
    if (selectedClub) {
      fetchMeetings(selectedClub);
    } else {
      setMeetings([]);
    }
  }, [selectedClub]);

  const fetchUserClubs = async () => {
    try {
      setIsLoading(true);
      
      // Get the current user's document
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      const userData = userDoc.data();
      const userClubs = userData.clubsJoined || {};
      
      // Only get clubs where the user is an admin or subadmin
      const adminClubIds = Object.keys(userClubs).filter(clubId => 
        userClubs[clubId].role === 'admin' || userClubs[clubId].role === 'subadmin'
      );
      
      const clubsList = [];
      
      // Get details for each club
      for (const clubId of adminClubIds) {
        const clubDoc = await getDoc(doc(db, 'clubs', clubId));
        if (clubDoc.exists()) {
          clubsList.push({
            id: clubId,
            name: clubDoc.data().name
          });
        }
      }
      
      setClubs(clubsList);
      
      // If there's only one club, select it automatically
      if (clubsList.length === 1) {
        setSelectedClub(clubsList[0].id);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching user clubs:', error);
      setError('Failed to load clubs. Please try again.');
      setIsLoading(false);
    }
  };

  const fetchMeetings = async (clubId) => {
    try {
      setIsLoading(true);
      setError('');
      
      // Get upcoming and current meetings for this club
      const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
      const snapshot = await getDocs(meetingsRef);
      
      const meetingsList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firebase timestamp to JS Date if it exists
          date: doc.data().date || new Date().toISOString().split('T')[0]
        }))
        .filter(meeting => 
          // Only show upcoming and in-progress meetings
          meeting.status === 'upcoming' || meeting.status === 'in-progress'
        );
      
      // Sort meetings by date (newest first)
      meetingsList.sort((a, b) => {
        const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
        const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
        return dateB - dateA;
      });
      
      setMeetings(meetingsList);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setError('Failed to load meetings. Please try again.');
      setIsLoading(false);
    }
  };

  const handleMeetingSelect = (meeting) => {
    setSelectedMeeting(meeting);
    setQrGenerated(false);
    setError('');
    setSuccess('');
  };

  const generateQRCode = async () => {
    if (!selectedClub) {
      setError('Please select a club first');
      return;
    }
    
    if (!selectedMeeting) {
      setError('Please select a meeting first');
      return;
    }

    try {
      // Create a unique code for this meeting session
      const sessionCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Create QR value that includes meeting ID and session code
      const qrData = {
        meetingId: selectedMeeting.id,
        sessionCode: sessionCode,
        clubId: selectedClub,
        timestamp: Date.now()
      };
      
      // Convert to JSON string for QR code
      const qrString = JSON.stringify(qrData);
      setQrValue(qrString);
      
      // Update the meeting with the active session code
      const meetingRef = doc(db, 'clubs', selectedClub, 'meetings', selectedMeeting.id);
      await updateDoc(meetingRef, {
        activeSessionCode: sessionCode,
        sessionStartTime: Timestamp.now()
      });
      
      setQrGenerated(true);
      setSuccess('QR code generated successfully!');
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Failed to generate QR code. Please try again.');
    }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-code');
    if (canvas) {
      const pngUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream');
      
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `meeting-qr-${selectedMeeting.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-1 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          QR Code Generator
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Club and Meeting Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select Club and Meeting
          </h2>
          
          {isLoading && clubs.length === 0 ? (
            <div className="py-10 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Club Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Club
                </label>
                <select
                  value={selectedClub}
                  onChange={(e) => setSelectedClub(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select a club</option>
                  {clubs.map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Meeting Selection */}
              {selectedClub && (
                <>
                  <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Meeting
                  </h3>
                  
                  {isLoading ? (
                    <div className="py-6 flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
                    </div>
                  ) : meetings.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {meetings.map(meeting => (
                        <motion.div
                          key={meeting.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleMeetingSelect(meeting)}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedMeeting?.id === meeting.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {meeting.name}
                          </h3>
                          <div className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span>{formatDate(meeting.date)}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>{meeting.time}</span>
                            </div>
                            {meeting.location && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2" />
                                <span>{meeting.location}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-gray-500 dark:text-gray-400">
                      <p>No upcoming meetings found for this club.</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          <div className="mt-6">
            <button
              onClick={generateQRCode}
              disabled={!selectedMeeting || isLoading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Generate QR Code
            </button>
          </div>
        </div>

        {/* QR Code Display */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            QR Code
          </h2>
          
          {qrGenerated && selectedMeeting ? (
            <motion.div 
              className="flex flex-col items-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <QRCode
                id="qr-code"
                value={qrValue}
                size={256}
                level={"H"}
                includeMargin={true}
                bgColor={"#FFFFFF"}
                fgColor={"#000000"}
              />
              <p className="mt-4 text-center text-gray-700 dark:text-gray-300">
                Scan this QR code to mark attendance for:<br />
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedMeeting.name}
                </span>
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {formatDate(selectedMeeting.date)} at {selectedMeeting.time}
              </p>
              <button
                onClick={downloadQRCode}
                className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 inline-flex items-center transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </button>
            </motion.div>
          ) : (
            <div className="py-20 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center">
              <Save className="h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
              <p>Select a meeting and generate a QR code to display it here.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default QRGenerator; 