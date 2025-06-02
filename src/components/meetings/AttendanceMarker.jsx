import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { CheckSquare, X, Users, AlertCircle } from 'lucide-react';

const AttendanceMarker = ({ meeting, clubId, onClose, onUpdate }) => {
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchClubMembers();
  }, [clubId]);

  const fetchClubMembers = async () => {
    try {
      setLoading(true);
      
      const membersRef = collection(db, 'clubs', clubId, 'members');
      const membersSnapshot = await getDocs(membersRef);
      
      const membersList = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isPresent: false
      }));
      
      // If meeting already has attendance, mark those members as present
      if (meeting.attendance && meeting.attendance.length > 0) {
        for (const memberId of meeting.attendance) {
          const memberIndex = membersList.findIndex(m => m.id === memberId);
          if (memberIndex !== -1) {
            membersList[memberIndex].isPresent = true;
          }
        }
        
        // Initialize selected members from existing attendance
        setSelectedMembers(meeting.attendance);
      }
      
      setMembers(membersList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching club members:', error);
      setError('Failed to load club members');
      setLoading(false);
    }
  };

  const toggleMemberAttendance = (memberId) => {
    // Update the members list for UI
    setMembers(prevMembers => {
      return prevMembers.map(member => {
        if (member.id === memberId) {
          return {
            ...member,
            isPresent: !member.isPresent
          };
        }
        return member;
      });
    });

    // Update selected members list
    setSelectedMembers(prevSelected => {
      if (prevSelected.includes(memberId)) {
        return prevSelected.filter(id => id !== memberId);
      } else {
        return [...prevSelected, memberId];
      }
    });
  };

  const markAllPresent = () => {
    setMembers(prevMembers => {
      return prevMembers.map(member => ({
        ...member,
        isPresent: true
      }));
    });
    
    setSelectedMembers(members.map(member => member.id));
  };

  const markAllAbsent = () => {
    setMembers(prevMembers => {
      return prevMembers.map(member => ({
        ...member,
        isPresent: false
      }));
    });
    
    setSelectedMembers([]);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Check if the meeting is already marked as completed
      const meetingRef = doc(db, 'clubs', clubId, 'meetings', meeting.id);
      const meetingDoc = await getDoc(meetingRef);
      
      if (!meetingDoc.exists()) {
        throw new Error('Meeting not found');
      }
      
      const meetingData = meetingDoc.data();
      const isCompleted = meetingData.status === 'completed';

      // Update the meeting with attendance information
      await updateDoc(meetingRef, {
        attendance: selectedMembers,
        status: 'completed',
        updatedAt: serverTimestamp(),
        markedBy: currentUser.uid
      });
      
      // Create individual attendance records for analytics and reporting
      for (const memberId of selectedMembers) {
        const attendanceRef = doc(collection(db, 'clubs', clubId, 'attendance'));
        await setDoc(attendanceRef, {
          meetingId: meeting.id,
          memberId: memberId,
          clubId: clubId,
          meetingTopic: meeting.topic,
          meetingDate: meetingData.date,
          recordedAt: serverTimestamp(),
          recordedBy: currentUser.uid
        });
      }
      
      setSuccess('Attendance marked successfully');
      
      // Close the modal after a short delay
      setTimeout(() => {
        if (onUpdate) {
          onUpdate();
        }
        
        if (onClose) {
          onClose();
        }
      }, 1500);
    } catch (error) {
      console.error('Error marking attendance:', error);
      setError(error.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  if (loading && members.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Mark Attendance
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={markAllPresent}
            className="form-btn form-btn-secondary text-xs px-2 py-1 flex items-center"
          >
            <CheckSquare className="h-3 w-3 mr-1" />
            Mark All Present
          </button>
          <button
            onClick={markAllAbsent}
            className="form-btn form-btn-secondary text-xs px-2 py-1 flex items-center"
          >
            <X className="h-3 w-3 mr-1" />
            Mark All Absent
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg flex items-start">
          <CheckSquare className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{success}</p>
        </div>
      )}

      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
        <div className="flex items-center text-gray-700 dark:text-gray-300 mb-2">
          <Users className="h-5 w-5 mr-2" />
          <span className="font-medium">{selectedMembers.length} of {members.length} members present</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
          <div 
            className="bg-blue-500 h-2.5 rounded-full"
            style={{ width: `${members.length > 0 ? (selectedMembers.length / members.length) * 100 : 0}%` }}
          ></div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Member
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Attendance
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <img
                        className="h-8 w-8 rounded-full"
                        src={member.photoURL || `https://ui-avatars.com/api/?name=${member.displayName}&background=0A66C2&color=fff`}
                        alt={member.displayName}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.displayName || 'Unknown Member'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {member.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => toggleMemberAttendance(member.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.isPresent
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}
                  >
                    {member.isPresent ? 'Present' : 'Absent'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={onClose}
          className="form-btn form-btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="form-btn form-btn-primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>
    </div>
  );
};

export default AttendanceMarker; 