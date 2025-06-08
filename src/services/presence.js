// src/services/presence.js
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase';


let intervalId;
let userRef = null;

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
  } else if (document.visibilityState === 'visible') {
    setOnlineStatus(true);
  }
};

const handleUnload = () => {
  setOnlineStatus(false);
};

export const startPresenceTracking = () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    userRef = doc(db, 'users', user.uid);
    await setOnlineStatus(true);

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    intervalId = setInterval(() => {
      setOnlineStatus(true);
    }, 20000);
  });
};

export const stopPresenceTracking = () => {
  clearInterval(intervalId);
  window.removeEventListener('visibilitychange', handleVisibility);
  window.removeEventListener('beforeunload', handleUnload);
  window.removeEventListener('pagehide', handleUnload);
  setOnlineStatus(false);
};
