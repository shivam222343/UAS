import { collection, getDocs, doc, getDoc, updateDoc, query, where, orderBy, limit, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Update missed meeting count for members of a club who were absent from a meeting
 * @param {string} clubId - The club ID
 * @param {string} meetingId - The meeting ID
 * @param {Object} attendees - Object containing attendee user IDs as keys (with true as value)
 */
export const updateMissedMeetingCount = async (clubId, meetingId, attendees) => {
  try {
    // Get all members for this club
    const membersRef = collection(db, 'clubs', clubId, 'members');
    const membersSnapshot = await getDocs(membersRef);
    
    // Get meeting details
    const meetingDoc = await getDoc(doc(db, 'clubs', clubId, 'meetings', meetingId));
    if (!meetingDoc.exists()) {
      console.error('Meeting not found');
      return;
    }
    
    const meetingData = meetingDoc.data();
    
    // Process each member
    const membersToWarn = [];
    
    for (const memberDoc of membersSnapshot.docs) {
      const memberId = memberDoc.id;
      const memberData = memberDoc.data();
      
      // Skip processing if the user was present
      if (attendees[memberId]) {
        // Reset their consecutive missed meeting count since they're present
        if (memberData.consecutiveMissedCount && memberData.consecutiveMissedCount > 0) {
          await updateDoc(doc(db, 'clubs', clubId, 'members', memberId), {
            consecutiveMissedCount: 0,
            warningEmailSent: false
          });
        }
        continue;
      }
      
      // User was absent, increment their consecutive missed meeting count
      const currentConsecutiveMissed = memberData.consecutiveMissedCount || 0;
      const newConsecutiveMissed = currentConsecutiveMissed + 1;
      
      // Also keep track of total missed meetings for stats
      const totalMissedCount = memberData.missedMeetingCount || 0;
      
      await updateDoc(doc(db, 'clubs', clubId, 'members', memberId), {
        consecutiveMissedCount: newConsecutiveMissed,
        missedMeetingCount: totalMissedCount + 1,
        lastMissedMeeting: {
          meetingId,
          meetingName: meetingData.name,
          date: meetingData.date,
          time: meetingData.time
        }
      });
      
      // If they've missed 3 or more consecutive meetings and haven't been warned yet,
      // add them to the list to send warning emails
      if (newConsecutiveMissed >= 3 && !memberData.warningEmailSent) {
        // Get user details
        const userDoc = await getDoc(doc(db, 'users', memberId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          membersToWarn.push({
            id: memberId,
            email: userData.email,
            displayName: userData.displayName || memberData.displayName || 'Club Member',
            missedCount: newConsecutiveMissed
          });
        }
      }
    }
    
    // Send warning emails to members who have missed 3+ consecutive meetings
    if (membersToWarn.length > 0) {
      await sendWarningEmails(clubId, membersToWarn);
    }
    
    return membersToWarn.length;
  } catch (err) {
    console.error('Error updating missed meeting count:', err);
    throw err;
  }
};

/**
 * Send warning emails to members who have missed 3 or more consecutive meetings
 * @param {string} clubId - The club ID
 * @param {Array} membersToWarn - Array of member objects to warn
 */
export const sendWarningEmails = async (clubId, membersToWarn) => {
  try {
    // Get club details
    const clubDoc = await getDoc(doc(db, 'clubs', clubId));
    if (!clubDoc.exists()) {
      console.error('Club not found');
      return;
    }
    
    const clubName = clubDoc.data().name;
    
    // For each member, send email and update their status
    for (const member of membersToWarn) {
      // In a real app, you would integrate with an email service here
      // For now, we'll just simulate sending an email and log it
      
      // Update the member record to indicate a warning email was sent
      await updateDoc(doc(db, 'clubs', clubId, 'members', member.id), {
        warningEmailSent: true,
        warningEmailSentAt: serverTimestamp()
      });
      
      // Also store this in a collection for tracking
      const warningsRef = collection(db, 'clubs', clubId, 'attendanceWarnings');
      await addDoc(warningsRef, {
        userId: member.id,
        displayName: member.displayName,
        email: member.email,
        missedCount: member.missedCount,
        clubId,
        clubName,
        sentAt: serverTimestamp()
      });
      
      // Send an in-app notification to the user
      const warningMessage = `⚠️ ATTENDANCE WARNING: You have missed ${member.missedCount} consecutive meetings in ${clubName}. IMPORTANT: If you miss the next meeting, strict action will be taken according to club policy. Please ensure you attend or notify an admin in advance if you cannot attend.`;
      
      await addDoc(collection(db, 'users', member.id, 'notifications'), {
        type: 'attendance_warning',
        title: 'Attendance Warning',
        message: warningMessage,
        clubId: clubId,
        clubName: clubName,
        missedCount: member.missedCount,
        read: false,
        createdAt: serverTimestamp()
      });
    }
    
    return true;
  } catch (err) {
    console.error('Error sending warning emails:', err);
    throw err;
  }
};

/**
 * Reset missed meeting count for a member
 * @param {string} clubId - The club ID
 * @param {string} memberId - The member's user ID
 */
export const resetMissedMeetingCount = async (clubId, memberId) => {
  try {
    await updateDoc(doc(db, 'clubs', clubId, 'members', memberId), {
      consecutiveMissedCount: 0,
      warningEmailSent: false
    });
    return true;
  } catch (err) {
    console.error('Error resetting missed meeting count:', err);
    throw err;
  }
};

/**
 * Get a list of members who have received warning emails
 * @param {string} clubId - The club ID
 * @returns {Array} - Array of warning records
 */
export const getWarningEmailsList = async (clubId) => {
  try {
    const warningsRef = collection(db, 'clubs', clubId, 'attendanceWarnings');
    const q = query(warningsRef, orderBy('sentAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      sentAt: doc.data().sentAt?.toDate()
    }));
  } catch (err) {
    console.error('Error getting warnings list:', err);
    throw err;
  }
}; 