import { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ListTodo, Plus, Trash2, Edit, Check, X, ArrowUpDown } from 'lucide-react';

export default function TaskModal({ isOpen, onClose, meetingId, clubId, meetingName, clubMembers }) {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: {},
    dueDate: '',
  });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortAlphabetically, setSortAlphabetically] = useState(true);

  useEffect(() => {
    if (isOpen && meetingId) {
      fetchTasks();
    }
  }, [isOpen, meetingId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const tasksRef = collection(db, 'clubs', clubId, 'meetings', meetingId, 'tasks');
      const snapshot = await getDocs(tasksRef);
      
      const tasksData = [];
      snapshot.forEach(doc => {
        tasksData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title || Object.keys(newTask.assignedTo).filter(k => newTask.assignedTo[k]).length === 0) return;
    
    try {
      setLoading(true);
      const tasksRef = collection(db, 'clubs', clubId, 'meetings', meetingId, 'tasks');
      
      const assignedMembers = Object.keys(newTask.assignedTo)
        .filter(userId => newTask.assignedTo[userId])
        .reduce((acc, userId) => {
          acc[userId] = true;
          return acc;
        }, {});

      const completionStatus = Object.keys(assignedMembers)
        .reduce((acc, userId) => {
          acc[userId] = false;
          return acc;
        }, {});

      await addDoc(tasksRef, {
        title: newTask.title,
        description: newTask.description,
        assignedTo: assignedMembers,
        dueDate: newTask.dueDate,
        createdAt: new Date().toISOString(),
        completion: completionStatus
      });
      
      setNewTask({
        title: '',
        description: '',
        assignedTo: {},
        dueDate: '',
      });
      
      await fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskId) => {
    try {
      setLoading(true);
      const taskRef = doc(db, 'clubs', clubId, 'meetings', meetingId, 'tasks', taskId);
      
      const assignedMembers = Object.keys(newTask.assignedTo)
        .filter(userId => newTask.assignedTo[userId])
        .reduce((acc, userId) => {
          acc[userId] = true;
          return acc;
        }, {});

      // Preserve existing completion status for already assigned members
      const currentTask = tasks.find(task => task.id === taskId);
      const completionStatus = { ...currentTask.completion };
      
      // Add new members with default false status
      Object.keys(assignedMembers).forEach(userId => {
        if (!completionStatus.hasOwnProperty(userId)) {
          completionStatus[userId] = false;
        }
      });

      // Remove unassigned members
      Object.keys(completionStatus).forEach(userId => {
        if (!assignedMembers[userId]) {
          delete completionStatus[userId];
        }
      });

      await updateDoc(taskRef, {
        title: newTask.title,
        description: newTask.description,
        assignedTo: assignedMembers,
        dueDate: newTask.dueDate,
        completion: completionStatus
      });
      
      setEditingTaskId(null);
      setNewTask({
        title: '',
        description: '',
        assignedTo: {},
        dueDate: '',
      });
      
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setLoading(true);
      const taskRef = doc(db, 'clubs', clubId, 'meetings', meetingId, 'tasks', taskId);
      await deleteDoc(taskRef);
      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = (task) => {
    setEditingTaskId(task.id);
    setNewTask({
      title: task.title,
      description: task.description,
      assignedTo: { ...task.assignedTo },
      dueDate: task.dueDate,
    });
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setNewTask({
      title: '',
      description: '',
      assignedTo: {},
      dueDate: '',
    });
  };

  const toggleMemberAssignment = (userId) => {
    setNewTask(prev => ({
      ...prev,
      assignedTo: {
        ...prev.assignedTo,
        [userId]: !prev.assignedTo[userId]
      }
    }));
  };

  const toggleSortOrder = () => {
    setSortAlphabetically(!sortAlphabetically);
  };

  const getSortedMembers = () => {
    const membersArray = Object.values(clubMembers);
    if (sortAlphabetically) {
      return [...membersArray].sort((a, b) => 
        a.displayName.localeCompare(b.displayName)
      );
    }
    return membersArray;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0  bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold dark:text-white">
              <ListTodo className="inline mr-2" />
              Tasks for {meetingName}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500  bg-transparent hover:bg-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6 text-blue-500 hover:text-purple-600" />
            </button>
          </div>
          
          <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-medium mb-3 dark:text-white">
              {editingTaskId ? 'Edit Task' : 'Add New Task'}
            </h3>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title*</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                className="w-full p-2 border bg-white border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
                placeholder="Task title"
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                className="w-full p-2 border bg-white border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
                placeholder="Task description"
                rows="3"
              />
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign To*</label>
                <button 
                  onClick={toggleSortOrder}
                  className="flex w-24 items-center text-xs text-white dark:text-blue-100 hover:underline"
                >
                  <ArrowUpDown className="w-3 h-3 mr-1" />
                  {sortAlphabetically ? 'Sorted' : 'Default'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {getSortedMembers().map(member => (
                  <div key={member.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`member-${member.id}`}
                      checked={!!newTask.assignedTo[member.id]}
                      onChange={() => toggleMemberAssignment(member.id)}
                      className="h-4 w-4 text-blue-600 bg-white rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor={`member-${member.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {member.displayName}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                className="w-full p-2 border bg-white border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end space-x-2">
              {editingTaskId && (
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
              )}
              
              <button
                onClick={editingTaskId ? () => handleUpdateTask(editingTaskId) : handleAddTask}
                disabled={!newTask.title || Object.keys(newTask.assignedTo).filter(k => newTask.assignedTo[k]).length === 0 || loading}
                className={`px-3 py-1 rounded-md flex items-center ${
                  (!newTask.title || Object.keys(newTask.assignedTo).filter(k => newTask.assignedTo[k]).length === 0 || loading)
                    ? 'bg-blue-300 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  'Processing...'
                ) : (
                  <>
                    {editingTaskId ? (
                      <>
                        <Edit className="w-4 h-4 mr-1" />
                        Update Task
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Task
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3 dark:text-white">Current Tasks</h3>
            
            {loading && tasks.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No tasks assigned yet</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {tasks.map(task => (
                  <li key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium dark:text-white">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{task.description}</p>
                        )}
                      </div>
                      
                      <div className="flex ">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="text-blue-600 bg-transparent hover:bg-transparent hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Edit className="w-5 h-5 text-blue-500 hover:text-purple-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 bg-transparent hover:bg-transparent hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-5 h-5 text-red-500 hover:text-red-700" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 mr-2">Assigned to:</span>
                        <div className="mt-1">
                          {Object.entries(task.assignedTo)
                            .filter(([_, isAssigned]) => isAssigned)
                            .map(([userId]) => {
                              const member = clubMembers[userId];
                              if (!member) return null;
                              return (
                                <div key={userId} className="text-sm dark:text-white">
                                  {member.displayName}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                      
                      {task.dueDate && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400 mr-2">Due:</span>
                          <span className="dark:text-white">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}