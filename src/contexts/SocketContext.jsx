import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { doc, updateDoc, serverTimestamp, getDoc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../services/firebase';

// Create context
const SocketContext = createContext();

// Socket.io server URL - replace with your actual socket server URL
const SOCKET_SERVER_URL = 'https://your-socket-server-url.com';

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [lastSeenUsers, setLastSeenUsers] = useState({});
  const { currentUser } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (!currentUser) return;

    // Connect to socket server
    const newSocket = io(SOCKET_SERVER_URL, {
      query: { userId: currentUser.uid }
    });

    setSocket(newSocket);

    // Listen for online users updates
    newSocket.on('users:online', (users) => {
      setOnlineUsers(users);
    });

    // Listen for last seen updates
    newSocket.on('user:last_seen', (data) => {
      setLastSeenUsers(prev => ({
        ...prev,
        [data.userId]: data.timestamp
      }));
    });

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  // Update user status in Firestore and emit socket event
  const updateUserStatus = async (status) => {
    if (!currentUser || !socket) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const timestamp = serverTimestamp();
      
      await updateDoc(userRef, {
        isOnline: status,
        lastSeen: timestamp
      });

      // Emit status change to socket server
      socket.emit('user:status_change', {
        userId: currentUser.uid,
        status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  // Get user status (online/offline)
  const getUserStatus = (userId) => {
    return onlineUsers[userId] || false;
  };

  // Get user's last seen timestamp
  const getUserLastSeen = (userId) => {
    return lastSeenUsers[userId] || null;
  };

  // Load initial online users and last seen data from Firestore
  useEffect(() => {
    if (!currentUser) return;

    const loadInitialData = async () => {
      try {
        // Get all users
        const usersRef = collection(db, 'users');
        
        // Set up real-time listener for user status changes
        const unsubscribe = onSnapshot(usersRef, (snapshot) => {
          const onlineUsersData = {};
          const lastSeenData = {};
          
          snapshot.docs.forEach(doc => {
            const userData = doc.data();
            onlineUsersData[doc.id] = userData.isOnline || false;
            
            if (userData.lastSeen) {
              lastSeenData[doc.id] = userData.lastSeen;
            }
          });
          
          setOnlineUsers(onlineUsersData);
          setLastSeenUsers(lastSeenData);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Error loading initial user status data:', error);
      }
    };

    const unsubscribe = loadInitialData();
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser]);

  // Format last seen time
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      // Convert Firestore timestamp to Date
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      // Get current time
      const now = new Date();
      
      // Calculate time difference in seconds
      const diffSeconds = Math.floor((now - date) / 1000);
      
      if (diffSeconds < 60) {
        return 'Just now';
      } else if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60);
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
      } else if (diffSeconds < 86400) {
        const hours = Math.floor(diffSeconds / 3600);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffSeconds < 604800) {
        const days = Math.floor(diffSeconds / 86400);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      console.error('Error formatting last seen time:', error);
      return 'Unknown';
    }
  };

  const value = {
    socket,
    updateUserStatus,
    getUserStatus,
    getUserLastSeen,
    formatLastSeen,
    onlineUsers
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}