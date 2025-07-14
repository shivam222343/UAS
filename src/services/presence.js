// src/services/presence.js
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase';

let intervalId;
let userRef = null;
let isPWA = false;

// Check if the app is running as a PWA
if (window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone ||
    document.referrer.includes('android-app://')) {
  isPWA = true;
}

const setOnlineStatus = async (status) => {
  if (userRef) {
    try {
      await updateDoc(userRef, {
        isOnline: status,
        lastSeen: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error updating presence:', err);
    }
  }
};

const handleVisibility = () => {
  if (document.visibilityState === 'hidden') {
    setOnlineStatus(false);
  } else {
    setOnlineStatus(true);
  }
};

const handleAppStateChange = (state) => {
  if (state === 'background' || state === 'inactive') {
    setOnlineStatus(false);
  } else if (state === 'active') {
    setOnlineStatus(true);
  }
};

export const startPresenceTracking = () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    userRef = doc(db, 'users', user.uid);
    await setOnlineStatus(true);

    // For browser tabs
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', () => setOnlineStatus(false));
    window.addEventListener('pagehide', () => setOnlineStatus(false));

    // For PWAs
    if (isPWA && window.cordova) {
      document.addEventListener('pause', () => setOnlineStatus(false), false);
      document.addEventListener('resume', () => setOnlineStatus(true), false);
    } else if (isPWA && document.addEventListener) {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    // Heartbeat to keep status fresh
    intervalId = setInterval(() => {
      setOnlineStatus(true);
    }, 20000);
  });
};

export const stopPresenceTracking = () => {
  clearInterval(intervalId);
  document.removeEventListener('visibilitychange', handleVisibility);
  window.removeEventListener('beforeunload', () => setOnlineStatus(false));
  window.removeEventListener('pagehide', () => setOnlineStatus(false));
  
  if (isPWA && window.cordova) {
    document.removeEventListener('pause', () => setOnlineStatus(false));
    document.removeEventListener('resume', () => setOnlineStatus(true));
  }
  
  setOnlineStatus(false);
};