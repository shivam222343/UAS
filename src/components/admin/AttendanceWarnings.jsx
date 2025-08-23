import { useState, useEffect } from 'react';
import { AlertTriangle, Mail, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { getWarningEmailsList, resetMissedMeetingCount } from '../../utils/attendanceUtils';
import Loader from '../Loader';

const AttendanceWarnings = ({ clubId }) => {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetAll, setResetAll] = useState(false);

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
      setSuccess('');
      
      const warningsList = await getWarningEmailsList(clubId);
      setWarnings(warningsList);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching warnings:', err);
      setError('Failed to fetch warning emails');
      setLoading(false);
    }
  };

  const handleResetCount = async (memberId) => {
    try {
      setLoading(true);
      await resetMissedMeetingCount(clubId, memberId, resetAll);
      
      // Remove the member from the UI list after manual reset.
      setWarnings(prevWarnings => 
        prevWarnings.filter(warning => warning.userId !== memberId)
      );
      
      setSuccess(`Successfully reset ${resetAll ? 'all' : 'consecutive'} counts for member.`);
      setTimeout(() => setSuccess(''), 3000);
      setLoading(false);
    } catch (err) {
      console.error('Error resetting missed count:', err);
      setError('Failed to reset missed meetings count');
      setLoading(false);
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
        Attendance Warnings
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg dark:bg-green-900/20 dark:text-green-400">
          {success}
        </div>
      )}
      
      <div className="mb-4 flex items-center">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
            checked={resetAll}
            onChange={() => setResetAll(!resetAll)}
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Reset all missed counts (including total)
          </span>
        </label>
      </div>
      
      {warnings.length > 0 ? (
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
                  Missed Meetings
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Warning Sent
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {warnings.map(warning => (
                <tr key={warning.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {warning.displayName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {warning.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-red-600 dark:text-red-400">
                      {warning.missedCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <Mail className="h-4 w-4 mr-1 text-blue-500" />
                      {warning.sentAt ? (
                        <span>
                          {warning.sentAt.toLocaleDateString()} at {warning.sentAt.toLocaleTimeString()}
                        </span>
                      ) : (
                        <span>Unknown date</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleResetCount(warning.userId)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                      title={`Reset ${resetAll ? 'all' : 'consecutive'} missed meetings count`}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      <span className="text-xs">Reset {resetAll ? 'All' : 'Count'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Mail className="h-16 w-16 mx-auto text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No Warning Emails</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No warning emails have been sent to club members yet
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendanceWarnings;