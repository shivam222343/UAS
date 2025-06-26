// src/services/presence.js
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase';

let userRef = null;
let lastActiveTime = null;
let activityTimeout = null;
let heartbeatInterval = null;

// Constants for timing (in milliseconds)
const HEARTBEAT_INTERVAL = 15000; // 15 seconds
const OFFLINE_DELAY = 30000; // 30 seconds delay before marking offline
const ACTIVITY_TIMEOUT = 30000; // 30 seconds of inactivity to consider user away

const updatePresence = async (isOnline) => {
  if (!userRef) return;

  try {
    const updateData = {
      lastSeen: serverTimestamp(),
      isOnline: isOnline
    };

    // Only update if status changed or it's a heartbeat
    await updateDoc(userRef, updateData);
  } catch (err) {
    console.error('Error updating presence:', err);
  }
};

const handleUserActivity = () => {
  // Reset the activity timeout
  clearTimeout(activityTimeout);
  
  // If user was offline, mark them online
  if (lastActiveTime && (Date.now() - lastActiveTime > OFFLINE_DELAY)) {
    updatePresence(true);
  }
  
  lastActiveTime = Date.now();
  
  // Set timeout to mark user as offline after period of inactivity
  activityTimeout = setTimeout(() => {
    updatePresence(false);
  }, OFFLINE_DELAY);
};

const setupEventListeners = () => {
  // Track various user activities
  const activityEvents = [
    'mousemove', 'keydown', 'wheel', 'click', 
    'touchstart', 'scroll', 'resize'
  ];
  
  activityEvents.forEach(event => {
    window.addEventListener(event, handleUserActivity, { passive: true });
  });

  // Handle visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      handleUserActivity();
    } else {
      // When tab becomes inactive, wait before marking offline
      activityTimeout = setTimeout(() => {
        updatePresence(false);
      }, OFFLINE_DELAY);
    }
  });

  // Handle app close/disconnect
  window.addEventListener('beforeunload', () => {
    // Immediately mark as offline when closing
    updatePresence(false);
  });
};

const cleanupEventListeners = () => {
  const activityEvents = [
    'mousemove', 'keydown', 'wheel', 'click', 
    'touchstart', 'scroll', 'resize'
  ];
  
  activityEvents.forEach(event => {
    window.removeEventListener(event, handleUserActivity);
  });

  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('beforeunload', handleBeforeUnload);
};

export const startPresenceTracking = () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    userRef = doc(db, 'users', user.uid);
    
    // Initialize presence
    await updatePresence(true);
    lastActiveTime = Date.now();
    
    // Set up event listeners for activity detection
    setupEventListeners();
    
    // Set up heartbeat to ensure connection stays active
    heartbeatInterval = setInterval(() => {
      if (lastActiveTime && (Date.now() - lastActiveTime < OFFLINE_DELAY)) {
        updatePresence(true);
      }
    }, HEARTBEAT_INTERVAL);
  });
};

export const stopPresenceTracking = () => {
  cleanupEventListeners();
  clearTimeout(activityTimeout);
  clearInterval(heartbeatInterval);
  
  if (userRef) {
    updatePresence(false);
  }
  
  userRef = null;
  lastActiveTime = null;
};