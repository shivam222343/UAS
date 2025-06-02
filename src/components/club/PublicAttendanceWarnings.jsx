import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { AlertTriangle, Calendar, UserX, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { getWarningEmailsList } from '../../utils/attendanceUtils';
import Loader from '../Loader';

const PublicAttendanceWarnings = ({ clubId }) => {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (clubId) {
      fetchWarnings();
    } else {
      setWarnings([]);
      setLoading(false);
    }
  }, [clubId]);

  const fetchWarnings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const warningsList = await getWarningEmailsList(clubId);
      setWarnings(warningsList);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching warnings:', err);
      setError('Failed to fetch attendance warnings');
      setLoading(false);
    }
  };

  if (!clubId) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader size="medium" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
        Members with Attendance Warnings
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      
      {warnings.length > 0 ? (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            The following members have missed 3 or more consecutive meetings and have been notified. 
            If they miss their next meeting, further action will be taken.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {warnings.map(warning => (
              <motion.div
                key={warning.id}
                whileHover={{ scale: 1.02 }}
                className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-red-100 dark:bg-red-800/30 rounded-full">
                    <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {warning.displayName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Missed {warning.missedCount} consecutive meetings
                    </p>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>
                        Warning sent: {warning.sentAt 
                          ? new Date(warning.sentAt).toLocaleDateString() 
                          : 'Unknown date'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <AlertTriangle className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No Warnings</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            All members have good attendance records.
          </p>
        </div>
      )}
    </div>
  );
};

export default PublicAttendanceWarnings; 