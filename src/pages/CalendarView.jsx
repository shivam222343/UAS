import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { motion } from 'framer-motion';
import { format, isSameDay, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  Clock,
  MapPin,
  Users,
  CalendarIcon,
  Video
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Loader from '../components/Loader';

import 'react-calendar/dist/Calendar.css';
import '../styles/Calendar.css';

const CalendarView = () => {
  // State management
  const [value, setValue] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { currentUser } = useAuth();
  const { darkMode } = useTheme();

  // Fetch meetings from Firestore
  useEffect(() => {
    fetchMeetings();
  }, []);
  
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      
      // Get user's clubs
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists()) {
        setLoading(false);
        return;
      }
      
      const userClubs = userDoc.data()?.clubsJoined || {};
      if (Object.keys(userClubs).length === 0) {
        setLoading(false);
        return;
      }
      
      let allMeetings = [];
      
      // For each club, fetch meetings
      for (const clubId of Object.keys(userClubs)) {
        const clubDoc = await getDoc(doc(db, 'clubs', clubId));
        const clubName = clubDoc.exists() ? clubDoc.data().name : 'Unknown Club';
        
        // Check if user joined with access key (has joinedAt in clubsJoined)
        const joinedWithAccessKey = userClubs[clubId].joinedAt !== undefined;
        
        // Fetch club's meetings
        const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
        
        // If user joined with access key, show all meetings; otherwise only admin-created ones
        let meetingsSnapshot;
        if (joinedWithAccessKey) {
          // Show all meetings for club members who joined via access key
          meetingsSnapshot = await getDocs(meetingsRef);
          
          const clubMeetings = meetingsSnapshot.docs.map(doc => ({
            id: doc.id,
            clubId: clubId,
            clubName: clubName,
            ...doc.data(),
            // Make sure we have a topic for backwards compatibility
            topic: doc.data().name || 'Untitled Meeting',
          }));


          
          allMeetings = [...allMeetings, ...clubMeetings];
        } else {
          // Original behavior - only show admin-created meetings
          const meetingsQuery = query(meetingsRef, where('createdBy', '!=', null));
          meetingsSnapshot = await getDocs(meetingsQuery);
          
          // For each meeting, check if it was created by an admin
          const meetingsPromises = meetingsSnapshot.docs.map(async (doc) => {
            const meetingData = doc.data();
            

            if (!creatorId) return null;
            
            // Get the creator's role
            try {
              const userRef = doc(db, 'users', creatorId);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                const userData = userSnap.data();
                const isAdmin = userData.role === 'admin' || userData.role === 'subadmin';
                
                // Only return meetings created by admins
                if (isAdmin) {
                  return {
                    id: doc.id,
                    clubId: clubId,
                    clubName: clubName,
                    ...meetingData,
                    // Make sure we have a topic for backwards compatibility
                    topic: meetingData.name || 'Untitled Meeting'
                  };
                }
              }
            } catch (err) {
              console.error('Error checking creator role:', err);
            }
            
            return null;
          });
          
          const clubMeetings = (await Promise.all(meetingsPromises)).filter(meeting => meeting !== null);
          allMeetings = [...allMeetings, ...clubMeetings];
        }
      }
      
      setMeetings(allMeetings);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch meetings');
      setLoading(false);
      console.error(err);
    }
  };
  
  // Function to get meeting type from title
  const getMeetingType = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('workshop')) return 'workshop';
    if (titleLower.includes('training')) return 'training';
    if (titleLower.includes('project')) return 'project';
    if (titleLower.includes('social') || titleLower.includes('party')) return 'social';
    if (titleLower.includes('general') || titleLower.includes('meeting')) return 'general';
    return 'other';
  };

  // Updated emoji mapping with more distinct emojis
  const meetingEmojis = {
    workshop: '🔧',
    general: '📢',
    training: '🏋️',
    project: '💻',
    social: '🎉',
    other: '📌'
  };

  // Function to get emoji for a meeting
  const getMeetingEmoji = (title) => {
    const type = getMeetingType(title);
    return meetingEmojis[type] || meetingEmojis.other;
  };

  // Function to get background color for a meeting
  const getMeetingColor = (title) => {
    const type = getMeetingType(title);
    switch (type) {
      case 'workshop': return '#FFD166'; // Yellow
      case 'training': return '#06D6A0'; // Green
      case 'project': return '#118AB2'; // Blue
      case 'social': return '#EF476F'; // Pink
      case 'general': return '#073B4C'; // Dark Blue
      default: return '#8338EC'; // Purple
    }
  };

  // Function to check if a date has meetings
  const hasMeetings = (date) => {
    return meetings.some(meeting => {
      const meetingDate = parseISO(meeting.date);
      return isSameDay(date, meetingDate);
    });
  };

  // Function to get meetings for a specific date
  const getMeetingsForDate = (date) => {
    return meetings.filter(meeting => {
      const meetingDate = parseISO(meeting.date);
      return isSameDay(date, meetingDate);
    });
  };

  // Function to render tile content with more prominent meeting indicators
  const tileContent = ({ date, view }) => {
    if (view === 'month' && hasMeetings(date)) {
      const dayMeetings = getMeetingsForDate(date);
      return (
        <div className="meeting-dot-container">
          {dayMeetings.slice(0, 2).map((meeting, index) => (
            <div 
              key={index} 
              className="meeting-indicator"
              style={{ backgroundColor: getMeetingColor(meeting.topic) }}
              title={meeting.topic}
            >
              {getMeetingEmoji(meeting.topic)}
            </div>
          ))}
          {dayMeetings.length > 2 && (
            <div 
              className="meeting-indicator"
              style={{ backgroundColor: '#6366F1' }}
              title={`${dayMeetings.length - 2} more meetings`}
            >
              +{dayMeetings.length - 2}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Function to handle date click
  const handleDateClick = (value) => {
    setValue(value);
    const selectedDate = getMeetingsForDate(value);
    if (selectedDate.length > 0) {
      setSelectedMeeting(selectedDate);
    } else {
      setSelectedMeeting(null);
    }
  };
  
 if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="large" />
      </div>
    );
  }
 

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md dark:bg-red-900 dark:text-red-200">
        {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-2"
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0 dark:text-white">Calendar</h1>
        <div className="bg-white  dark:text-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-sm">
          <p className="text-gray-600 dark:text-gray-300">
            <span className="font-medium dark:text-white">Today:</span> {format(new Date(), 'MMMM d, yyyy')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className=" bg-white text-gray-950 dark:bg-gray-800 rounded-lg shadow-md p-6">
            <Calendar
              onChange={handleDateClick}
              value={value}
              tileContent={tileContent}
              className={`calendar-container  bg-white text-gray-800 dark:bg-gray-800 ${darkMode ? 'dark' : ''}`}
            />
          </div>
          
          <div className="mt-6 bg-white text-gray-800 dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Meeting Types</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(meetingEmojis).map(([type, emoji]) => (
                <div key={type} className="flex items-center">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-2"
                    style={{ 
                      backgroundColor: getMeetingColor(type),
                      color: '#fff',
                      fontSize: '1.2rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                    }}
                  >
                    {emoji}
                  </div>
                  <span className="capitalize dark:text-white text-gray-700">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white text-gray-800 dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl text-gray-800 dark:text-white font-semibold mb-4">
              {selectedMeeting ? 
                `Meetings on ${format(value, 'MMMM d, yyyy')}` : 
                'Select a date to view meetings'}
            </h2>
            
            {selectedMeeting && selectedMeeting.length > 0 ? (
              <div className="space-y-4">
                {selectedMeeting.map(meeting => (
                  <div 
                    key={meeting.id} 
                    className="border-l-4 pl-4 py-3 rounded-md transition-all hover:shadow-md bg-gray-50 dark:bg-gray-700"
                    style={{ borderLeftColor: getMeetingColor(meeting.topic) }}
                  >
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{getMeetingEmoji(meeting.topic)}</span>
                      <h3 className="text-lg font-medium dark:text-white">{meeting.topic}</h3>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="flex items-center text-gray-600 dark:text-gray-300">
                        <Clock className="h-4 w-4 mr-2" /> {meeting.time || 'Time not specified'}
                      </p>
                      
                      {meeting.location && (
                        <p className="flex items-center text-gray-600 dark:text-gray-300">
                          <MapPin className="h-4 w-4 mr-2" /> {meeting.location}
                        </p>
                      )}
                      
                      {meeting.mode === 'online' && meeting.platform && (
                        <p className="flex items-center text-gray-600 dark:text-gray-300">
                          <Video className="h-4 w-4 mr-2" /> {meeting.platform}
                        </p>
                      )}
                      
                      <p className="flex items-center text-gray-600 dark:text-gray-300 mt-1">
                        <Users className="h-4 w-4 mr-2" /> 
                        {meeting.attendees ? Object.keys(meeting.attendees).length : 0} attendees
                      </p>
                    </div>
                    
                    <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-gray-600 dark:text-gray-300 text-sm flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          meeting.status === 'upcoming' ? 'bg-green-500' :
                          meeting.status === 'in-progress' ? 'bg-blue-500' :
                          meeting.status === 'completed' ? 'bg-gray-500' :
                          'bg-red-500'
                        }`}></span>
                        <span className="font-medium">
                          {meeting.status === 'upcoming' ? 'Upcoming' :
                           meeting.status === 'in-progress' ? 'In Progress' :
                           meeting.status === 'past' ? 'Completed' :
                           meeting.status === 'cancelled' ? 'Cancelled' : 'Unknown'}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <CalendarIcon className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                  {value ? 'No meetings on this date' : 'Select a date'}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {value ? 'There are no scheduled meetings for this date.' : 'Click on a date to view scheduled meetings.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CalendarView; 