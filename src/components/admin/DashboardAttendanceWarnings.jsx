import { useState, useEffect } from 'react';
import { AlertTriangle, Download, Eye, EyeOff, Calendar, Users, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, where, orderBy, limit, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../Loader';

const DashboardAttendanceWarnings = ({ clubId }) => {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (clubId && currentUser) {
      checkAdminStatus();
      fetchWarnings();
    } else {
      setWarnings([]);
      setLoading(false);
    }
  }, [clubId, currentUser]);

  const checkAdminStatus = async () => {
    try {
      if (!currentUser || !clubId) return;
      
      const memberDoc = await getDoc(doc(db, 'clubs', clubId, 'members', currentUser.uid));
      if (memberDoc.exists()) {
        const memberData = memberDoc.data();
        setIsAdmin(memberData.role === 'admin' || memberData.role === 'president');
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
  };

  const fetchWarnings = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get warnings from the last month only
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const warningsRef = collection(db, 'clubs', clubId, 'attendanceWarnings');
      const q = query(
        warningsRef, 
        where('sentAt', '>=', oneMonthAgo),
        orderBy('sentAt', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      const warningsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate()
      }));

      // Clean up warnings older than 1 month automatically
      await cleanupOldWarnings(clubId);
      
      setWarnings(warningsList);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching warnings:', err);
      setError('Failed to fetch attendance warnings');
      setLoading(false);
    }
  };

  const cleanupOldWarnings = async (clubId) => {
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const warningsRef = collection(db, 'clubs', clubId, 'attendanceWarnings');
      const oldWarningsQuery = query(
        warningsRef,
        where('sentAt', '<', oneMonthAgo)
      );
      
      const oldWarningsSnapshot = await getDocs(oldWarningsQuery);
      
      // Delete old warnings
      const deletePromises = oldWarningsSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      
      if (oldWarningsSnapshot.size > 0) {
        console.log(`Cleaned up ${oldWarningsSnapshot.size} old attendance warnings`);
      }
    } catch (err) {
      console.error('Error cleaning up old warnings:', err);
    }
  };

  const getMembersWhoMissedLastThreeMeetings = async () => {
    try {
      // Get the last 3 meetings
      const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
      const meetingsQuery = query(meetingsRef, orderBy('date', 'desc'), limit(3));
      const meetingsSnapshot = await getDocs(meetingsQuery);
      
      if (meetingsSnapshot.size < 3) {
        return []; // Not enough meetings to check
      }
      
      const meetings = meetingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get all club members
      const membersRef = collection(db, 'clubs', clubId, 'members');
      const membersSnapshot = await getDocs(membersRef);
      
      const membersWhoMissedAll = [];
      
      for (const memberDoc of membersSnapshot.docs) {
        const memberId = memberDoc.id;
        const memberData = memberDoc.data();
        
        // Check if member missed all 3 meetings
        let missedCount = 0;
        
        for (const meeting of meetings) {
          // Check if member was present
          const wasPresent = meeting.attendees && meeting.attendees[memberId];
          
          if (!wasPresent) {
            // Check if absence was approved
            const absenceRef = doc(db, 'clubs', clubId, 'meetings', meeting.id, 'absences', memberId);
            const absenceDoc = await getDoc(absenceRef);
            const wasApproved = absenceDoc.exists() && absenceDoc.data().status === 'approved';
            
            if (!wasApproved) {
              missedCount++;
            }
          }
        }
        
        // If missed all 3 meetings without approval
        if (missedCount === 3) {
          // Get user details
          const userDoc = await getDoc(doc(db, 'users', memberId));
          const userData = userDoc.exists() ? userDoc.data() : {};
          
          membersWhoMissedAll.push({
            id: memberId,
            displayName: memberData.displayName || userData.displayName || 'Unknown User',
            email: memberData.email || userData.email || 'No email',
            role: memberData.role || 'member',
            missedCount: missedCount,
            joinedAt: memberData.joinedAt?.toDate() || new Date(),
            totalMissedCount: memberData.missedMeetingCount || 0
          });
        }
      }
      
      return membersWhoMissedAll;
    } catch (err) {
      console.error('Error getting members who missed last 3 meetings:', err);
      return [];
    }
  };

  const exportToCSV = async () => {
    try {
      setExporting(true);
      
      const membersToExport = await getMembersWhoMissedLastThreeMeetings();
      
      if (membersToExport.length === 0) {
        alert('No members found who missed the last 3 meetings.');
        setExporting(false);
        return;
      }
      
      // Create CSV content
      const headers = ['Name', 'Email', 'Role', 'Missed Last 3 Meetings', 'Total Missed Count', 'Joined Date'];
      const csvContent = [
        headers.join(','),
        ...membersToExport.map(member => [
          `"${member.displayName}"`,
          `"${member.email}"`,
          `"${member.role}"`,
          member.missedCount,
          member.totalMissedCount,
          `"${member.joinedAt.toLocaleDateString()}"`
        ].join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExporting(false);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export attendance report');
      setExporting(false);
    }
  };

  if (!clubId) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Select a club</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Please select a club to view attendance warnings
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader size="medium" />
      </div>
    );
  }

  const displayedWarnings = showAll ? warnings : warnings.slice(0, 2);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Recent Attendance Warnings
          </h2>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            (Last 30 days)
          </span>
        </div>
        
        {isAdmin && warnings.length > 0 && (
          <div
            onClick={exportToCSV}
            className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {exporting ? (
              <Loader size="small" />
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      
      {warnings.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Member
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Missed Count
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Warning Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {displayedWarnings.map((warning, index) => (
                  <motion.tr
                    key={warning.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {warning.displayName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {warning.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                        {warning.missedCount} meetings
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {warning.sentAt ? (
                          <span>
                            {warning.sentAt.toLocaleDateString()} at {warning.sentAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        ) : (
                          <span>Unknown date</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {warnings.length > 2 && (
            <div className="mt-4 flex justify-center">
              <div
                onClick={() => setShowAll(!showAll)}
                className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors cursor-pointer"
              >
                {showAll ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show More ({warnings.length - 2} more)
                  </>
                )}
              </div>
            </div>
          )}
          
          {isAdmin && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Admin Features</h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Export report includes only members who missed the last 3 consecutive meetings without approved absences.
                    Warnings older than 30 days are automatically removed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Users className="h-16 w-16 mx-auto text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No Recent Warnings</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No attendance warnings have been sent in the last 30 days
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardAttendanceWarnings;
