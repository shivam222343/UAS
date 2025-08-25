import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import presenceService from '../services/presenceService';
import toastService from '../services/toastService';

const PresenceContext = createContext();

export function usePresence() {
  return useContext(PresenceContext);
}

export function PresenceProvider({ children }) {
  const [onlineMembers, setOnlineMembers] = useState(new Map());
  const [clubMembers, setClubMembers] = useState(new Map());
  const [userClubs, setUserClubs] = useState([]);
  const { currentUser } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize presence system when user logs in
  useEffect(() => {
    if (currentUser && !isInitialized) {
      initializePresenceSystem();
    } else if (!currentUser && isInitialized) {
      cleanupPresenceSystem();
    }
  }, [currentUser, isInitialized]);

  const initializePresenceSystem = async () => {
    try {
      // Get user's clubs
      const clubs = await fetchUserClubs();
      setUserClubs(clubs);
      
      // Initialize presence service
      await presenceService.initializePresence(currentUser, clubs);
      
      // Start listening to club members for each club
      clubs.forEach(club => {
        startListeningToClubMembers(club.id, club.name);
      });
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing presence system:', error);
    }
  };

  const cleanupPresenceSystem = () => {
    presenceService.cleanup();
    setOnlineMembers(new Map());
    setClubMembers(new Map());
    setUserClubs([]);
    setIsInitialized(false);
  };

  const fetchUserClubs = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      let userClubIds = [];

      if (userData?.clubsJoined && Object.keys(userData.clubsJoined).length > 0) {
        userClubIds = Object.keys(userData.clubsJoined);
      } else if (userData?.clubs && Array.isArray(userData.clubs) && userData.clubs.length > 0) {
        userClubIds = userData.clubs;
      } else {
        const clubsRef = collection(db, 'clubs');
        const clubsSnapshot = await getDocs(clubsRef);

        for (const clubDoc of clubsSnapshot.docs) {
          const memberRef = doc(db, 'clubs', clubDoc.id, 'members', currentUser.uid);
          const memberDoc = await getDoc(memberRef);
          if (memberDoc.exists()) {
            userClubIds.push(clubDoc.id);
          }
        }
      }

      const clubsData = [];
      for (const clubId of userClubIds) {
        const clubDoc = await getDoc(doc(db, 'clubs', clubId));
        if (clubDoc.exists()) {
          clubsData.push({
            id: clubId,
            name: clubDoc.data().name,
            ...clubDoc.data()
          });
        }
      }

      return clubsData;
    } catch (error) {
      console.error('Error fetching user clubs:', error);
      return [];
    }
  };

  const startListeningToClubMembers = (clubId, clubName) => {
    presenceService.listenToClubMembersPresence(clubId, (memberStatuses) => {
      const previousOnlineMembers = onlineMembers.get(clubId) || [];
      const currentOnlineMembers = memberStatuses.filter(member => member.isOnline);
      
      // Update state
      setOnlineMembers(prev => new Map(prev.set(clubId, currentOnlineMembers)));
      setClubMembers(prev => new Map(prev.set(clubId, memberStatuses)));
      
      // Check for status changes and show toasts
      if (previousOnlineMembers.length > 0) {
        // Check for newly online members
        const newlyOnline = currentOnlineMembers.filter(current => 
          !previousOnlineMembers.some(prev => prev.userId === current.userId)
        );
        
        // Check for newly offline members
        const newlyOffline = previousOnlineMembers.filter(prev => 
          !currentOnlineMembers.some(current => current.userId === prev.userId)
        );
        
        // Show toasts for status changes (but not for current user)
        newlyOnline.forEach(member => {
          if (member.userId !== currentUser.uid) {
            toastService.showMemberOnline(member.displayName, clubName);
          }
        });
        
        newlyOffline.forEach(member => {
          if (member.userId !== currentUser.uid) {
            toastService.showMemberOffline(member.displayName, clubName);
          }
        });
      } else if (currentOnlineMembers.length > 0) {
        // First time loading - show bulk notifications for online members
        const otherOnlineMembers = currentOnlineMembers.filter(member => 
          member.userId !== currentUser.uid
        );
        
        if (otherOnlineMembers.length > 0) {
          toastService.showBulkOnlineNotifications(otherOnlineMembers, clubName);
        }
      }
    });
  };

  // Get online members for a specific club
  const getOnlineMembersForClub = (clubId) => {
    return onlineMembers.get(clubId) || [];
  };

  // Get all members for a specific club
  const getAllMembersForClub = (clubId) => {
    return clubMembers.get(clubId) || [];
  };

  // Get online count for a specific club
  const getOnlineCountForClub = (clubId) => {
    const online = onlineMembers.get(clubId) || [];
    return online.length;
  };

  // Check if a specific member is online
  const isMemberOnline = (clubId, userId) => {
    const online = onlineMembers.get(clubId) || [];
    return online.some(member => member.userId === userId);
  };

  // Manually refresh presence for a club
  const refreshClubPresence = async (clubId) => {
    const club = userClubs.find(c => c.id === clubId);
    if (club) {
      startListeningToClubMembers(clubId, club.name);
    }
  };

  const value = {
    onlineMembers,
    clubMembers,
    userClubs,
    isInitialized,
    getOnlineMembersForClub,
    getAllMembersForClub,
    getOnlineCountForClub,
    isMemberOnline,
    refreshClubPresence
  };

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}
