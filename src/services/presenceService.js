import { doc, updateDoc, onSnapshot, collection, getDocs, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// We'll need to add Firebase Realtime Database to the project
// For now, we'll use Firestore with a polling mechanism for presence

class PresenceService {
  constructor() {
    this.currentUser = null;
    this.presenceListeners = new Map();
    this.heartbeatInterval = null;
    this.isOnline = false;
    this.clubMembersListeners = new Map();
  }

  // Initialize presence for the current user
  async initializePresence(user, userClubs = []) {
    if (!user) return;
    
    this.currentUser = user;
    this.userClubs = userClubs;
    
    // Set user as online
    await this.setUserOnline();
    
    // Start heartbeat to maintain online status
    this.startHeartbeat();
    
    // Handle page visibility changes
    this.setupVisibilityHandlers();
    
    // Handle beforeunload event
    this.setupUnloadHandlers();
  }

  // Set user as online
  async setUserOnline() {
    if (!this.currentUser) return;
    
    try {
      const userRef = doc(db, 'users', this.currentUser.uid);
      await updateDoc(userRef, {
        isOnline: true,
        lastSeen: serverTimestamp(),
        lastHeartbeat: serverTimestamp()
      });
      this.isOnline = true;
    } catch (error) {
      console.error('Error setting user online:', error);
    }
  }

  // Set user as offline
  async setUserOffline() {
    if (!this.currentUser) return;
    
    try {
      const userRef = doc(db, 'users', this.currentUser.uid);
      await updateDoc(userRef, {
        isOnline: false,
        lastSeen: serverTimestamp()
      });
      this.isOnline = false;
    } catch (error) {
      console.error('Error setting user offline:', error);
    }
  }

  // Start heartbeat to maintain online status
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(async () => {
      if (this.currentUser && this.isOnline) {
        try {
          const userRef = doc(db, 'users', this.currentUser.uid);
          await updateDoc(userRef, {
            lastHeartbeat: serverTimestamp()
          });
        } catch (error) {
          console.error('Error updating heartbeat:', error);
        }
      }
    }, 30000); // Update every 30 seconds
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Setup visibility change handlers
  setupVisibilityHandlers() {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Page is hidden, but don't set offline immediately
        // User might just be switching tabs
        setTimeout(async () => {
          if (document.hidden) {
            await this.setUserOffline();
          }
        }, 60000); // Wait 1 minute before setting offline
      } else {
        // Page is visible again
        if (!this.isOnline) {
          await this.setUserOnline();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  // Setup unload handlers
  setupUnloadHandlers() {
    const handleBeforeUnload = () => {
      // Synchronously set user offline when closing tab/browser/app
      if (this.currentUser) {
        // Use synchronous XMLHttpRequest for reliable offline status update
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/user-offline', false); // false = synchronous
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(JSON.stringify({
            userId: this.currentUser.uid,
            isOnline: false,
            lastSeen: Date.now()
          }));
        } catch (error) {
          // Fallback to direct Firebase update
          this.setUserOffline();
        }
      }
    };

    const handlePageHide = () => {
      // Page is being hidden (tab switch, minimize, etc.)
      if (this.currentUser) {
        this.setUserOffline();
      }
    };

    const handlePageShow = () => {
      // Page is being shown again
      if (this.currentUser && !this.isOnline) {
        this.setUserOnline();
      }
    };

    // Multiple event listeners for better browser compatibility
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);
    
    // Handle tab/window close more reliably
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Tab is hidden - set offline after short delay
        setTimeout(() => {
          if (document.hidden && this.currentUser) {
            this.setUserOffline();
          }
        }, 5000); // 5 second delay to avoid false offline on quick tab switches
      } else {
        // Tab is visible again - set online
        if (this.currentUser && !this.isOnline) {
          this.setUserOnline();
        }
      }
    });
  }

  // Listen to club members' presence status
  listenToClubMembersPresence(clubId, callback) {
    if (this.clubMembersListeners.has(clubId)) {
      // Remove existing listener
      this.stopListeningToClubMembers(clubId);
    }

    // We'll implement a polling mechanism since Firestore doesn't have real-time presence
    // In a production app, you'd use Firebase Realtime Database for this
    const pollInterval = setInterval(async () => {
      try {
        const membersRef = collection(db, 'clubs', clubId, 'members');
        const membersSnapshot = await getDocs(membersRef);
        
        const memberStatuses = [];
        for (const memberDoc of membersSnapshot.docs) {
          const userId = memberDoc.data().userId || memberDoc.data().uid || memberDoc.id;
          const userRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const lastHeartbeat = userData.lastHeartbeat?.toDate();
            const now = new Date();
            const timeDiff = lastHeartbeat ? now - lastHeartbeat : Infinity;
            
            // Consider user offline if no heartbeat for more than 2 minutes
            const isReallyOnline = userData.isOnline && timeDiff < 120000;
            
            memberStatuses.push({
              userId,
              isOnline: isReallyOnline,
              lastSeen: userData.lastSeen,
              displayName: userData.displayName,
              email: userData.email,
              photoURL: userData.photoURL
            });
          }
        }
        
        callback(memberStatuses);
      } catch (error) {
        console.error('Error polling member presence:', error);
      }
    }, 10000); // Poll every 10 seconds

    this.clubMembersListeners.set(clubId, pollInterval);
  }

  // Stop listening to club members' presence
  stopListeningToClubMembers(clubId) {
    const listener = this.clubMembersListeners.get(clubId);
    if (listener) {
      clearInterval(listener);
      this.clubMembersListeners.delete(clubId);
    }
  }

  // Cleanup all listeners
  cleanup() {
    this.stopHeartbeat();
    
    // Clear all club member listeners
    for (const [clubId, listener] of this.clubMembersListeners) {
      clearInterval(listener);
    }
    this.clubMembersListeners.clear();
    
    // Set user offline
    if (this.currentUser) {
      this.setUserOffline();
    }
  }

  // Get online members count for a club
  async getOnlineMembersCount(clubId) {
    try {
      const membersRef = collection(db, 'clubs', clubId, 'members');
      const membersSnapshot = await getDocs(membersRef);
      
      let onlineCount = 0;
      for (const memberDoc of membersSnapshot.docs) {
        const userId = memberDoc.data().userId || memberDoc.data().uid || memberDoc.id;
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const lastHeartbeat = userData.lastHeartbeat?.toDate();
          const now = new Date();
          const timeDiff = lastHeartbeat ? now - lastHeartbeat : Infinity;
          
          if (userData.isOnline && timeDiff < 120000) {
            onlineCount++;
          }
        }
      }
      
      return onlineCount;
    } catch (error) {
      console.error('Error getting online members count:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const presenceService = new PresenceService();
export default presenceService;
