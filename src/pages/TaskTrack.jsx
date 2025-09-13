import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  Clock, 
  Users, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle, 
  User,
  CalendarDays,
  Target,
  X,
  Eye,
  Edit
} from 'lucide-react';
import Loader from '../components/Loader';

const TaskTrack = () => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState({});
  const [clubMembers, setClubMembers] = useState({});
  const [userClubs, setUserClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'completed', 'overdue'
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week'
  
  const { currentUser, userProfile } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchUserClubs();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedClub) {
      fetchAllTasks();
    }
  }, [selectedClub]);

  const fetchUserClubs = async () => {
    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      let clubIds = [];

      if (userData?.clubsJoined && Object.keys(userData.clubsJoined).length > 0) {
        clubIds = Object.keys(userData.clubsJoined);
      } else if (userData?.clubs && Array.isArray(userData.clubs)) {
        clubIds = userData.clubs;
      } else {
        const clubsRef = collection(db, 'clubs');
        const clubsSnapshot = await getDocs(clubsRef);

        for (const clubDoc of clubsSnapshot.docs) {
          const memberRef = doc(db, 'clubs', clubDoc.id, 'members', currentUser.uid);
          const memberDoc = await getDoc(memberRef);
          if (memberDoc.exists()) {
            clubIds.push(clubDoc.id);
          }
        }
      }

      const clubDetails = [];
      for (const clubId of clubIds) {
        const clubDocRef = doc(db, 'clubs', clubId);
        const clubDoc = await getDoc(clubDocRef);
        if (clubDoc.exists()) {
          clubDetails.push({
            id: clubDoc.id,
            name: clubDoc.data().name
          });
        }
      }

      setUserClubs(clubDetails);
      if (clubDetails.length === 1) {
        setSelectedClub(clubDetails[0].id);
      }
    } catch (error) {
      console.error('Error fetching user clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTasks = async () => {
    try {
      setLoading(true);
      
      // Fetch club members
      const membersRef = collection(db, 'clubs', selectedClub, 'members');
      const membersSnapshot = await getDocs(membersRef);
      const members = {};
      membersSnapshot.docs.forEach(doc => {
        members[doc.id] = {
          id: doc.id,
          ...doc.data(),
          displayName: doc.data().displayName || 'Unknown User'
        };
      });
      setClubMembers(members);

      // Fetch all meetings
      const meetingsRef = collection(db, 'clubs', selectedClub, 'meetings');
      const meetingsSnapshot = await getDocs(meetingsRef);
      
      const allTasks = [];
      const meetingsData = {};

      for (const meetingDoc of meetingsSnapshot.docs) {
        const meetingData = meetingDoc.data();
        meetingsData[meetingDoc.id] = {
          id: meetingDoc.id,
          ...meetingData
        };

        // Fetch tasks for this meeting
        const tasksRef = collection(db, 'clubs', selectedClub, 'meetings', meetingDoc.id, 'tasks');
        const tasksSnapshot = await getDocs(tasksRef);
        
        tasksSnapshot.docs.forEach(taskDoc => {
          const taskData = taskDoc.data();
          if (taskData.dueDate) { // Only include tasks with due dates
            allTasks.push({
              id: taskDoc.id,
              meetingId: meetingDoc.id,
              clubId: selectedClub,
              ...taskData,
              meetingName: meetingData.name,
              meetingDate: meetingData.date
            });
          }
        });
      }

      setTasks(allTasks);
      setMeetings(meetingsData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusChange = async (task, userId, isCompleted) => {
    try {
      const taskRef = doc(db, 'clubs', task.clubId, 'meetings', task.meetingId, 'tasks', task.id);
      await updateDoc(taskRef, {
        [`completion.${userId}`]: isCompleted
      });
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === task.id 
            ? { 
                ...t, 
                completion: { 
                  ...t.completion, 
                  [userId]: isCompleted 
                } 
              }
            : t
        )
      );
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  // Filter tasks based on selected filter
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const now = new Date();
      const dueDate = new Date(task.dueDate);
      const isAssignedToUser = task.assignedTo?.[currentUser?.uid];
      const isUserCompleted = task.completion?.[currentUser?.uid];
      const isOverdue = dueDate < now && !isUserCompleted;
      
      // Check if task has any pending assignments
      const hasPendingAssignments = Object.entries(task.assignedTo || {}).some(
        ([userId, isAssigned]) => isAssigned && !task.completion?.[userId]
      );

      switch (filter) {
        case 'pending':
          return hasPendingAssignments;
        case 'completed':
          return !hasPendingAssignments;
        case 'overdue':
          return isOverdue && isAssignedToUser;
        case 'my-tasks':
          return isAssignedToUser;
        default:
          return true;
      }
    });
  }, [tasks, filter, currentUser?.uid]);

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // Get tasks for a specific date
  const getTasksForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredTasks.filter(task => {
      const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
  };

  // Get task status color
  const getTaskStatusColor = (task) => {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const isOverdue = dueDate < now;
    
    const hasPendingAssignments = Object.entries(task.assignedTo || {}).some(
      ([userId, isAssigned]) => isAssigned && !task.completion?.[userId]
    );

    if (!hasPendingAssignments) return 'bg-green-500';
    if (isOverdue) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-64 mt-10"
      >
        <Loader size="large" />
        <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg">Loading task calendar...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto p-4"
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Task Track</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track all task deadlines across meetings in a calendar view
        </p>
      </div>

      {/* Club Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Club
        </label>
        <select
          value={selectedClub}
          onChange={(e) => setSelectedClub(e.target.value)}
          className="block w-full md:w-1/3 p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a club</option>
          {userClubs.map(club => (
            <option key={club.id} value={club.id}>{club.name}</option>
          ))}
        </select>
      </div>

      {!selectedClub && userClubs.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-4 mb-6 rounded">
          <p>Please select a club to view task calendar.</p>
        </div>
      )}

      {selectedClub && (
        <>
          {/* Filters and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-100 dark:bg-blue-900/40 p-4 rounded-lg">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total Tasks</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{tasks.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-100 dark:bg-yellow-900/40 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mr-3" />
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                    {tasks.filter(task => 
                      Object.entries(task.assignedTo || {}).some(
                        ([userId, isAssigned]) => isAssigned && !task.completion?.[userId]
                      )
                    ).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-100 dark:bg-green-900/40 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">Completed</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {tasks.filter(task => 
                      !Object.entries(task.assignedTo || {}).some(
                        ([userId, isAssigned]) => isAssigned && !task.completion?.[userId]
                      )
                    ).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-100 dark:bg-red-900/40 p-4 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-red-600 dark:text-red-400 mr-3" />
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400">Overdue</p>
                  <p className="text-2xl font-bold text-red-800 dark:text-red-200">
                    {tasks.filter(task => {
                      const now = new Date();
                      const dueDate = new Date(task.dueDate);
                      const isAssignedToUser = task.assignedTo?.[currentUser?.uid];
                      const isUserCompleted = task.completion?.[currentUser?.uid];
                      return dueDate < now && isAssignedToUser && !isUserCompleted;
                    }).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
            </div>
            {[
              { value: 'all', label: 'All Tasks', icon: Target },
              { value: 'pending', label: 'Pending', icon: AlertCircle },
              { value: 'completed', label: 'Completed', icon: CheckCircle },
              { value: 'overdue', label: 'Overdue', icon: Clock },
              { value: 'my-tasks', label: 'My Tasks', icon: User }
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </div>

          {/* Calendar Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Today
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {calendarDays.map((day, index) => {
                const dayTasks = getTasksForDate(day);
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isToday = day.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border border-gray-200 dark:border-gray-700 ${
                      isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                    } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'
                    } ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                      {day.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map(task => (
                        <div
                          key={task.id}
                          onClick={() => {
                            setSelectedTask(task);
                            setShowTaskModal(true);
                          }}
                          className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 text-white ${getTaskStatusColor(task)}`}
                          title={task.title}
                        >
                          <div className="truncate font-medium">{task.title}</div>
                          <div className="truncate opacity-75">{task.meetingName}</div>
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          +{dayTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Task Detail Modal */}
      <AnimatePresence>
        {showTaskModal && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold dark:text-white mb-1">
                      {selectedTask.title}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Meeting: {selectedTask.meetingName} ({selectedTask.meetingDate})
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTaskModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Task Description */}
                {selectedTask.description && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Description</h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedTask.description}
                    </p>
                  </div>
                )}

                {/* Due Date */}
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Due Date</h3>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    {new Date(selectedTask.dueDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                {/* Assigned Members */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Assigned Members</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedTask.assignedTo || {})
                      .filter(([userId, isAssigned]) => isAssigned)
                      .map(([userId]) => {
                        const member = clubMembers[userId];
                        const isCompleted = selectedTask.completion?.[userId];
                        const isCurrentUser = userId === currentUser?.uid;
                        
                        if (!member) return null;
                        
                        return (
                          <div key={userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-3 ${
                                isCompleted ? 'bg-green-500' : 'bg-yellow-500'
                              }`} />
                              <span className={`font-medium ${
                                isCurrentUser ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                              }`}>
                                {member.displayName}
                                {isCurrentUser && ' (You)'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm px-2 py-1 rounded ${
                                isCompleted 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400'
                              }`}>
                                {isCompleted ? 'Completed' : 'Pending'}
                              </span>
                              {isCurrentUser && !isCompleted && (
                                <button
                                  onClick={() => handleTaskStatusChange(selectedTask, userId, true)}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                >
                                  Mark Complete
                                </button>
                              )}
                              {isCurrentUser && isCompleted && (
                                <button
                                  onClick={() => handleTaskStatusChange(selectedTask, userId, false)}
                                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                                >
                                  Mark Pending
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowTaskModal(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TaskTrack;
