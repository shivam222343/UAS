import { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, RotateCcw, Clock, Calendar, MapPin, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import Loader from '../components/Loader';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // 'success', 'error', 'processing'
  const [errorMessage, setErrorMessage] = useState('');
  const [meetingDetails, setMeetingDetails] = useState(null);
  
  const { currentUser } = useAuth();
  
  const startScanning = () => {
    setScanning(true);
    setScanResult(null);
    setScanStatus(null);
    setErrorMessage('');
    setMeetingDetails(null);
  };
  
  const resetScanner = () => {
    setScanResult(null);
    setScanStatus(null);
    setErrorMessage('');
    setMeetingDetails(null);
    startScanning();
  };
  
  const stopScanning = () => {
    setScanning(false);
  };
  
  const handleScan = async (data) => {
    if (data && data.text && !scanResult) {
      stopScanning();
      setScanStatus('processing');
      
      try {
        // Parse the QR code data
        const qrData = JSON.parse(data.text);
        setScanResult(qrData);
        
        // Check if QR code has required fields
        if (!qrData.meetingId || !qrData.sessionCode || !qrData.clubId) {
          throw new Error('Invalid QR code format');
        }
        
        // Check if QR code is expired (older than 12 hours)
        const qrTimestamp = qrData.timestamp;
        const currentTime = Date.now();
        const twelveHoursMs = 12 * 60 * 60 * 1000;
        
        if (currentTime - qrTimestamp > twelveHoursMs) {
          throw new Error('QR code has expired');
        }
        
        // Fetch meeting details to verify sessionCode is still active
        const meetingRef = doc(db, 'clubs', qrData.clubId, 'meetings', qrData.meetingId);
        const meetingSnapshot = await getDoc(meetingRef);
        
        if (!meetingSnapshot.exists()) {
          throw new Error('Meeting not found');
        }
        
        const meetingData = meetingSnapshot.data();
        
        // Format meeting details for display
        const formattedMeeting = {
          ...meetingData,
          id: meetingSnapshot.id,
          clubId: qrData.clubId,
          date: meetingData.date ? new Date(meetingData.date).toLocaleDateString() : 'Unknown date',
        };
        
        setMeetingDetails(formattedMeeting);
        
        // Check if session code matches
        if (meetingData.activeSessionCode !== qrData.sessionCode) {
          throw new Error('Invalid or expired session code');
        }
        
        // Check if user has already marked attendance
        if (meetingData.attendees && meetingData.attendees[currentUser.uid]) {
          throw new Error('You have already marked your attendance for this meeting');
        }
        
        // Get user details
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        
        // Make sure user has joined this club
        if (!userData || !userData.clubsJoined || !userData.clubsJoined[qrData.clubId]) {
          throw new Error('You are not a member of this club');
        }
        
        // Add user to meeting attendees
        // Using object format instead of array for attendees
        const attendeesUpdate = {};
        attendeesUpdate[currentUser.uid] = true;
        
        await updateDoc(meetingRef, {
          [`attendees.${currentUser.uid}`]: true,
          attendanceTimestamps: arrayUnion({
            userId: currentUser.uid,
            timestamp: Timestamp.now()
          })
        });
        
        // Update user's attendance record
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          attendedMeetings: arrayUnion({
            meetingId: qrData.meetingId,
            clubId: qrData.clubId,
            meetingName: meetingData.name,
            date: meetingData.date,
            timestamp: Timestamp.now()
          })
        });
        
        // Also mark the user as present in the club members collection
        // This helps with tracking missed meetings
        const memberRef = doc(db, 'clubs', qrData.clubId, 'members', currentUser.uid);
        const memberDoc = await getDoc(memberRef);
        
        if (memberDoc.exists()) {
          // Reset missed meeting count if present
          await updateDoc(memberRef, {
            missedMeetingCount: 0,
            warningEmailSent: false
          });
        }
        
        setScanStatus('success');
      } catch (error) {
        console.error('Error processing QR code:', error);
        setScanStatus('error');
        setErrorMessage(error.message || 'Failed to process QR code');
      }
    }
  };
  
  const handleError = (err) => {
    console.error('QR Scanner Error:', err);
    setErrorMessage('Error accessing camera. Please check permissions and try again.');
    setScanStatus('error');
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Mark Attendance
        </h1>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <AnimatePresence mode="wait">
          {!scanning && !scanResult && (
            <motion.div 
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-10"
            >
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-full">
                <Clock className="h-12 w-12" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Ready to Mark Attendance
              </h2>
              <p className="text-center text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                Scan the QR code provided by your admin to mark your attendance for today's meeting.
              </p>
              <button
                onClick={startScanning}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Start Scanner
              </button>
            </motion.div>
          )}
          
          {scanning && !scanStatus && (
            <motion.div 
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="max-w-sm w-full mb-4">
                <QrReader
                  constraints={{ facingMode: 'environment' }}
                  onResult={handleScan}
                  scanDelay={500}
                  className="w-full rounded-lg overflow-hidden"
                  videoStyle={{ objectFit: 'cover' }}
                  containerStyle={{ 
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                  videoContainerStyle={{
                    position: 'relative',
                    paddingTop: '100%'
                  }}
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    border: '2px solid #0A66C2',
                    borderRadius: '0.5rem',
                    pointerEvents: 'none',
                    zIndex: 10
                  }}
                >
                  <motion.div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      right: 0,
                      height: '2px',
                      backgroundColor: '#0A66C2'
                    }}
                    animate={{
                      top: ['0%', '100%', '0%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                </motion.div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-4 text-center">
                Position the QR code within the scanner frame
              </p>
              <button
                onClick={stopScanning}
                className="mt-6 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          )}
          
          {scanStatus === 'processing' && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-10"
            >
              <div className="mb-6">
                <Loader size="large" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Processing...
              </h2>
              <p className="text-center text-gray-500 dark:text-gray-400">
                Please wait while we verify your attendance.
              </p>
            </motion.div>
          )}
          
          {scanStatus === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center py-10"
            >
              <div className="mb-6 p-4 bg-green-100 text-green-600 dark:text-green-400 dark:bg-green-900/20 rounded-full">
                <CheckCircle className="h-12 w-12" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Attendance Marked Successfully
              </h2>
              
              {meetingDetails && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg w-full max-w-md">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {meetingDetails.name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" /> 
                      <span>{meetingDetails.date}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" /> 
                      <span>{meetingDetails.time}</span>
                    </div>
                    {meetingDetails.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" /> 
                        <span>{meetingDetails.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <p className="text-center text-gray-500 dark:text-gray-400 mt-4 max-w-md">
                Your attendance has been recorded successfully. Thank you for attending the meeting!
              </p>
              
              <button
                onClick={resetScanner}
                className="mt-6 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors inline-flex items-center"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Scan Another
              </button>
            </motion.div>
          )}
          
          {scanStatus === 'error' && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center py-10"
            >
              <div className="mb-6 p-4 bg-red-100 text-red-600 dark:text-red-400 dark:bg-red-900/20 rounded-full">
                <XCircle className="h-12 w-12" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Error
              </h2>
              <p className="text-center text-red-600 dark:text-red-400 mb-6 max-w-md">
                {errorMessage || 'An error occurred while processing the QR code.'}
              </p>
              <button
                onClick={resetScanner}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QRScanner; 