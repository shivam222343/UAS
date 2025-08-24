import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';

export class AttendanceWarningService {
  constructor() {
    this.warningsCollection = collection(db, 'attendanceWarnings');
    this.notificationsCollection = collection(db, 'notifications');
  }

  // Check and update consecutive attendance for all members after a meeting
  async updateConsecutiveAttendance(clubId, meetingId) {
    try {
      const membersRef = collection(db, 'clubs', clubId, 'members');
      const membersSnapshot = await getDocs(membersRef);
      
      const meetingRef = doc(db, 'clubs', clubId, 'meetings', meetingId);
      const meetingDoc = await getDoc(meetingRef);
      
      if (!meetingDoc.exists()) {
        throw new Error('Meeting not found');
      }

      const meetingData = meetingDoc.data();
      const attendees = meetingData.attendees || {};

      // Process each member
      for (const memberDoc of membersSnapshot.docs) {
        const memberId = memberDoc.id;
        const memberData = memberDoc.data();
        
        // Skip if member joined after this meeting
        const memberJoinDate = memberData.joinedAt?.toDate();
        const meetingDate = new Date(`${meetingData.date} ${meetingData.time}`);
        
        if (memberJoinDate && memberJoinDate > meetingDate) {
          continue;
        }

        const wasPresent = attendees[memberId] ? true : false;
        
        // Check if there was an approved absence
        const hasApprovedAbsence = await this.checkApprovedAbsence(clubId, meetingId, memberId);
        
        if (wasPresent || hasApprovedAbsence) {
          // Reset consecutive missed count
          await this.resetConsecutiveMissedCount(clubId, memberId);
        } else {
          // Increment consecutive missed count
          await this.incrementConsecutiveMissedCount(clubId, memberId, meetingId);
        }
      }

      return { success: true, message: 'Consecutive attendance updated successfully' };
    } catch (error) {
      console.error('Error updating consecutive attendance:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if member has approved absence for a meeting
  async checkApprovedAbsence(clubId, meetingId, memberId) {
    try {
      const absencesRef = collection(db, 'clubs', clubId, 'meetings', meetingId, 'absences');
      const q = query(
        absencesRef,
        where('userId', '==', memberId),
        where('status', '==', 'approved')
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking approved absence:', error);
      return false;
    }
  }

  // Reset consecutive missed count for a member
  async resetConsecutiveMissedCount(clubId, memberId) {
    try {
      const memberRef = doc(db, 'clubs', clubId, 'members', memberId);
      await updateDoc(memberRef, {
        consecutiveMissedMeetings: 0,
        lastAttendanceUpdate: serverTimestamp()
      });
    } catch (error) {
      console.error('Error resetting consecutive missed count:', error);
    }
  }

  // Increment consecutive missed count and check for warning threshold
  async incrementConsecutiveMissedCount(clubId, memberId, meetingId) {
    try {
      const memberRef = doc(db, 'clubs', clubId, 'members', memberId);
      const memberDoc = await getDoc(memberRef);
      
      if (!memberDoc.exists()) {
        return;
      }

      const memberData = memberDoc.data();
      const currentCount = memberData.consecutiveMissedMeetings || 0;
      const newCount = currentCount + 1;

      await updateDoc(memberRef, {
        consecutiveMissedMeetings: newCount,
        lastMissedMeeting: meetingId,
        lastAttendanceUpdate: serverTimestamp()
      });

      // Send warning if reached threshold of 3 consecutive missed meetings
      if (newCount === 3) {
        await this.sendAttendanceWarning(clubId, memberId, newCount);
      }

      return newCount;
    } catch (error) {
      console.error('Error incrementing consecutive missed count:', error);
      return 0;
    }
  }

  // Send attendance warning notification
  async sendAttendanceWarning(clubId, memberId, consecutiveCount) {
    try {
      // Get club info
      const clubDoc = await getDoc(doc(db, 'clubs', clubId));
      const clubName = clubDoc.exists() ? clubDoc.data().name : 'Unknown Club';

      // Get member info
      const memberDoc = await getDoc(doc(db, 'clubs', clubId, 'members', memberId));
      const memberData = memberDoc.data();
      const memberName = memberData.displayName || 'Unknown Member';

      // Create warning record
      const warningData = {
        clubId,
        memberId,
        memberName,
        clubName,
        consecutiveMissedCount: consecutiveCount,
        createdAt: serverTimestamp(),
        resolved: false,
        type: 'consecutive_absence'
      };

      const warningRef = await addDoc(this.warningsCollection, warningData);

      // Send notification to member
      await addDoc(this.notificationsCollection, {
        toUserId: memberId,
        type: 'attendance_warning',
        title: 'Attendance Warning',
        message: `You have missed ${consecutiveCount} consecutive meetings in ${clubName}. Please improve your attendance or contact the admin.`,
        data: {
          clubId,
          clubName,
          consecutiveCount,
          warningId: warningRef.id
        },
        read: false,
        createdAt: serverTimestamp(),
        link: `/meetings`
      });

      // Send notification to club admins
      await this.notifyClubAdmins(clubId, {
        type: 'member_attendance_warning',
        title: 'Member Attendance Warning',
        message: `${memberName} has missed ${consecutiveCount} consecutive meetings and has been warned.`,
        data: {
          clubId,
          clubName,
          memberId,
          memberName,
          consecutiveCount,
          warningId: warningRef.id
        }
      });

      return { success: true, warningId: warningRef.id, message: 'Attendance warning sent successfully' };
    } catch (error) {
      console.error('Error sending attendance warning:', error);
      return { success: false, error: error.message };
    }
  }

  // Notify club admins
  async notifyClubAdmins(clubId, notificationData) {
    try {
      const membersRef = collection(db, 'clubs', clubId, 'members');
      const q = query(membersRef, where('role', 'in', ['admin', 'subadmin']));
      const adminSnapshot = await getDocs(q);

      const notificationPromises = adminSnapshot.docs.map(adminDoc => 
        addDoc(this.notificationsCollection, {
          toUserId: adminDoc.id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data,
          read: false,
          createdAt: serverTimestamp(),
          link: `/admin`
        })
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error notifying club admins:', error);
    }
  }

  // Get attendance warnings for a club
  async getClubAttendanceWarnings(clubId, includeResolved = false) {
    try {
      let q = query(
        this.warningsCollection,
        where('clubId', '==', clubId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      if (!includeResolved) {
        q = query(
          this.warningsCollection,
          where('clubId', '==', clubId),
          where('resolved', '==', false),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }

      const querySnapshot = await getDocs(q);
      const warnings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, warnings };
    } catch (error) {
      console.error('Error getting club attendance warnings:', error);
      return { success: false, error: error.message };
    }
  }

  // Resolve attendance warning
  async resolveAttendanceWarning(warningId, resolvedBy, resolution) {
    try {
      const warningRef = doc(this.warningsCollection, warningId);
      await updateDoc(warningRef, {
        resolved: true,
        resolvedBy,
        resolution,
        resolvedAt: serverTimestamp()
      });

      return { success: true, message: 'Attendance warning resolved successfully' };
    } catch (error) {
      console.error('Error resolving attendance warning:', error);
      return { success: false, error: error.message };
    }
  }

  // Get member's consecutive missed count
  async getMemberConsecutiveMissedCount(clubId, memberId) {
    try {
      const memberDoc = await getDoc(doc(db, 'clubs', clubId, 'members', memberId));
      
      if (!memberDoc.exists()) {
        return 0;
      }

      return memberDoc.data().consecutiveMissedMeetings || 0;
    } catch (error) {
      console.error('Error getting member consecutive missed count:', error);
      return 0;
    }
  }

  // Bulk update attendance for multiple meetings (useful for data migration)
  async bulkUpdateAttendanceHistory(clubId) {
    try {
      const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
      const q = query(meetingsRef, orderBy('date', 'asc'));
      const meetingsSnapshot = await getDocs(q);

      // Reset all members' consecutive counts first
      const membersRef = collection(db, 'clubs', clubId, 'members');
      const membersSnapshot = await getDocs(membersRef);
      
      for (const memberDoc of membersSnapshot.docs) {
        await updateDoc(memberDoc.ref, {
          consecutiveMissedMeetings: 0
        });
      }

      // Process meetings in chronological order
      for (const meetingDoc of meetingsSnapshot.docs) {
        const meetingData = meetingDoc.data();
        
        // Only process past meetings
        const meetingDate = new Date(`${meetingData.date} ${meetingData.time}`);
        if (meetingDate > new Date()) {
          continue;
        }

        await this.updateConsecutiveAttendance(clubId, meetingDoc.id);
      }

      return { success: true, message: 'Bulk attendance history updated successfully' };
    } catch (error) {
      console.error('Error bulk updating attendance history:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const attendanceWarningService = new AttendanceWarningService();
export default attendanceWarningService;
