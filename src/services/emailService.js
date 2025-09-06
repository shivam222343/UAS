import emailjs from '@emailjs/browser';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Reads EmailJS config from Vite env variables
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_MEETING_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

function ensureEmailJsConfigured() {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    throw new Error('EmailJS is not configured. Please set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_MEETING_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY in .env');
  }
  emailjs.init(PUBLIC_KEY);
}

// Fetches club metadata (name) and members (name, email)
async function getClubAndMembers(clubId) {
  const clubDoc = await getDoc(doc(db, 'clubs', clubId));
  const clubName = clubDoc.exists() ? (clubDoc.data().name || 'Club') : 'Club';

  const membersRef = collection(db, 'clubs', clubId, 'members');
  const membersSnapshot = await getDocs(membersRef);

  const members = [];
  for (const memberDoc of membersSnapshot.docs) {
    const member = memberDoc.data();
    const userId = member.userId || member.uid || memberDoc.id;
    // Prefer to pull email & displayName from users collection
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.exists() ? userDoc.data() : {};
    const email = userData.email || member.email;
    const displayName = userData.displayName || member.displayName || 'Member';

    if (email && typeof email === 'string') {
      members.push({ userId, email, displayName });
    }
  }

  return { clubName, members };
}

// Sends a meeting announcement to all members of a club using EmailJS
// meetingData should include: { name, date, time, mode, location, classroomNumber, platform, description }
export async function sendMeetingAnnouncement(clubId, meetingId, meetingData) {
  ensureEmailJsConfigured();

  const { clubName, members } = await getClubAndMembers(clubId);

  if (!members.length) {
    return { success: true, sent: 0, skipped: 0, errors: [] };
  }

  // Compose shared fields for template
  const locationText = meetingData.mode === 'offline'
    ? `${meetingData.location || ''}${meetingData.location === 'Classroom' && meetingData.classroomNumber ? ` (${meetingData.classroomNumber})` : ''}`
    : (meetingData.platform || 'Online');

  const mandatoryLine = 'Attendance is mandatory. Please be on time.';

  // Optionally include a link inside your app to the meeting detail
  const appUrl = window.location.origin;
  const meetingUrl = `${appUrl}/meetings?club=${encodeURIComponent(clubId)}&meeting=${encodeURIComponent(meetingId)}`;

  const results = [];

  // Send sequentially to avoid hitting EmailJS rate limits
  for (const m of members) {
    const templateParams = {
      to_email: m.email,
      to_name: m.displayName,
      club_name: clubName,
      meeting_name: meetingData.name,
      meeting_date: meetingData.date,
      meeting_time: meetingData.time,
      meeting_mode: meetingData.mode,
      meeting_location: locationText,
      meeting_description: meetingData.description,
      attendance_note: mandatoryLine,
      meeting_link: meetingUrl,
    };

    try {
      /* eslint-disable no-await-in-loop */
      const res = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, {
        publicKey: PUBLIC_KEY,
      });
      results.push({ email: m.email, status: 'sent', res });
    } catch (err) {
      console.error('EmailJS send error for', m.email, err);
      results.push({ email: m.email, status: 'error', error: err?.message || String(err) });
    }
  }

  const sent = results.filter(r => r.status === 'sent').length;
  const errors = results.filter(r => r.status === 'error');

  return { success: errors.length === 0, sent, skipped: 0, errors };
}

export default {
  sendMeetingAnnouncement,
};
