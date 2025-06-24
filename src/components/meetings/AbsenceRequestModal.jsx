import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, addDoc, getDocs, doc, updateDoc, serverTimestamp, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { X, Check, AlertCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AbsenceRequestModal = ({ isOpen, onClose, meetingId, clubId, meetingName }) => {
  const [reason, setReason] = useState('');
  const [submitStatus, setSubmitStatus] = useState(''); // 'success', 'error', or ''
  const [absenceRequests, setAbsenceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('request'); // 'request' or 'view'
  const [userRequestStatus, setUserRequestStatus] = useState(null); // To track current user's request status
  const { currentUser, userRole } = useAuth();
  
  const isAdmin = userRole === 'admin' || userRole === 'subadmin';

  useEffect(() => {
    if (isOpen) {
      fetchAbsenceRequests();
    }
  }, [isOpen, meetingId, clubId]);

  const fetchAbsenceRequests = async () => {
    try {
      setLoading(true);
      const absencesRef = collection(db, 'clubs', clubId, 'meetings', meetingId, 'absences');
      const querySnapshot = await getDocs(absencesRef);
      
      const absenceList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      // Check if the current user has already submitted a request
      const userRequest = absenceList.find(req => req.userId === currentUser.uid);
      if (userRequest) {
        setUserRequestStatus(userRequest.status);
        // If user already has a request, switch to view tab
        setActiveTab('view');
      } else {
        setUserRequestStatus(null);
      }
      
      setAbsenceRequests(absenceList);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching absence requests:', err);
      setError('Failed to load absence requests');
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Please provide a reason for your absence');
      return;
    }
    
    try {
      // Check if user already submitted a request
      const existingRequest = absenceRequests.find(req => req.userId === currentUser.uid);
      
      if (existingRequest) {
        setError('You have already submitted an absence request for this meeting');
        return;
      }
      
      // Add the absence request
      await addDoc(collection(db, 'clubs', clubId, 'meetings', meetingId, 'absences'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email,
        reason: reason,
        status: 'pending', // 'pending', 'approved', or 'rejected'
        createdAt: serverTimestamp()
      });
      
      setReason('');
      setSubmitStatus('success');
      fetchAbsenceRequests();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSubmitStatus('');
      }, 3000);
    } catch (err) {
      console.error('Error submitting absence request:', err);
      setSubmitStatus('error');
      setError('Failed to submit absence request');
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await updateDoc(doc(db, 'clubs', clubId, 'meetings', meetingId, 'absences', requestId), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: currentUser.uid
      });
      
      fetchAbsenceRequests();
    } catch (err) {
      console.error('Error approving request:', err);
      setError('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await updateDoc(doc(db, 'clubs', clubId, 'meetings', meetingId, 'absences', requestId), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: currentUser.uid
      });
      
      fetchAbsenceRequests();
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError('Failed to reject request');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this absence request?')) {
      try {
        await deleteDoc(doc(db, 'clubs', clubId, 'meetings', meetingId, 'absences', requestId));
        fetchAbsenceRequests();
      } catch (err) {
        console.error('Error deleting request:', err);
        setError('Failed to delete request');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed dark:bg-gray-800 inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl min-h-[500px] overflow-y-auto p-6 w-full max-w-xl m-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Meeting Absence</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full dark:hover:bg-slate-700 hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-medium">{meetingName}</h3>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}
        
        {/* Tabs (only shown if user doesn't have a request yet or is admin) */}
        {(!userRequestStatus || isAdmin) && (
          <div className="border-b border-gray-200 mb-4">
            <div className="flex -mb-px">
              <button
                className={`py-2 px-4 border-b-2 mb-4 mr-2 font-medium text-sm ${
                  activeTab === 'request'
                    ? 'dark:text-white hover:text-white hover:bg-gray-400 dark:bg-gray-800 bg-gray-100 text-black' 
                  : 'dark:text-white hover:text-white hover:bg-gray-400 text-gray-500 dark:bg-gray-800 bg-gray-100'
                }`}
                onClick={() => setActiveTab('request')}
              >
                Request Absence
              </button>
              <button
                className={`py-2 px-4 border-b-2 mb-4 font-medium text-sm ${
                  activeTab === 'view'
                    ? 'dark:text-white hover:text-white hover:bg-gray-400 dark:bg-gray-800 bg-gray-100 text-black' 
                  : 'dark:text-white hover:text-white hover:bg-gray-400 text-gray-500 dark:bg-gray-800 bg-gray-100'
                }`}
                onClick={() => setActiveTab('view')}
              >
                View Requests
              </button>
            </div>
          </div>
        )}

        {/* User's request status display */}
        {userRequestStatus && !isAdmin && (
          <div className={`p-4 mb-4 rounded-lg ${
            userRequestStatus === 'approved' ? 'bg-green-50 text-green-700' :
            userRequestStatus === 'rejected' ? 'bg-red-50 text-red-700' :
            'bg-yellow-50 text-yellow-700'
          }`}>
            <div className="flex items-center">
              {userRequestStatus === 'approved' ? <Check className="w-5 h-5 mr-2" /> : 
               userRequestStatus === 'rejected' ? <XCircle className="w-5 h-5 mr-2" /> : 
               <Clock className="w-5 h-5 mr-2" />}
              <p>
                <span className="font-semibold">Your request status: </span>
                {userRequestStatus.charAt(0).toUpperCase() + userRequestStatus.slice(1)}
              </p>
            </div>
          </div>
        )}
        
        {
          userRequestStatus && isAdmin && (
            <div className="p-4 mb-4 rounded-lg bg-blue-50 text-blue-700">
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                <p>
                  <span className="font-semibold">User's request status: </span>
                  {userRequestStatus.charAt(0).toUpperCase() + userRequestStatus.slice(1)}
                </p>
              </div>
            </div>
          ) 
        }

        {/* Request form */}
        {activeTab === 'request' && !userRequestStatus && (
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium dark:text-white text-gray-700 mb-1">
                Reason for absence
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border text-black bg-gray-100 dark:bg-gray-900 dark:text-white border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                placeholder="Please provide a reason for your absence..."
                required
              ></textarea>
            </div>
            
            {submitStatus === 'success' && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
                <div className="flex items-center">
                  <Check className="w-5 h-5 mr-2" />
                  <p>Absence request submitted successfully</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Submit Request
              </button>
            </div>
          </form>
        )}
        
        {/* View requests */}
        {activeTab === 'view' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Absence Requests</h3>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : absenceRequests.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No absence requests found</p>
            ) : (
              <div className="divide-y divide-gray-200">
                {absenceRequests.map((request) => (
                  <div key={request.id} className="py-3">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className="font-medium">{request.userName}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'Date unavailable'}
                        </span>
                      </div>
                      <div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 dark:text-white text-sm mb-2">{request.reason}</p>
                    
                    {/* Admin controls - only shown to admins */}
                    {isAdmin && request.status === 'pending' && (
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 flex items-center text-xs"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center text-xs"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Reject
                        </button>
                      </div>
                    )}
                    
                    {/* Only show delete option to the user who made the request */}
                    {request.userId === currentUser.uid && (
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => handleDeleteRequest(request.id)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AbsenceRequestModal; 