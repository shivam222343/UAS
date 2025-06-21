import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, where, orderBy, limit, getDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  Calendar,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BadgePlus,
  Info,
  Plus,
  X
} from 'lucide-react';
import Loader from '../components/Loader';
import PublicAttendanceWarnings from '../components/club/PublicAttendanceWarnings';
import JoinClub from '../components/clubs/JoinClub';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Link } from 'react-router-dom';
import AccessKey from './AccessKey';
import ClubCard from './Clubcard';

const greetings = {
  morning: [
    "Good morning, Mavericks! Time to crush it like a boss! 💥",
    "Wake up, wake up! The world needs your magic today! ✨",
    "Rise and shine, Mavericks! Coffee in one hand, confidence in the other! ☕😎",
    "Top of the morning to the Mavericks! Let's make today legendary! 🏆",
    "Morning, Mavericks! Ready to slay the day? 🔥",
    "Sun's up, Mavericks! So are your dreams—go chase 'em! 🌞",
    "Good morning! Don't hit snooze on greatness! ⏰",
    "Hey Mavericks, did you bring your A-game today? Let's see it! 🎯",
    "Morning MVPs! Time to turn ideas into action! 🚀",
    "Up and at 'em, Mavericks! Today's challenges are just fun puzzles! 🧩",
    "Shoutout to the Mavericks waking up already winning! 🏅",
    "Sun's out, fun's out! Let's make this morning epic! 🌞🎉",
    "Mornings are for Mavericks who hustle before the world wakes! 💪",
    "Good morning, legends! Time to write your success story today! 📖",
    "Wakey wakey, eggs and victory! 🥚🏆",
    "Morning Mavericks! Got your superhero cape on? Let's fly! 🦸‍♂️🦸‍♀️",
    "New day, new goals, same fierce Mavericks! ⚔️",
    "Morning vibes for Mavericks who mean business! 💼",
    "Rise like a Maverick phoenix from the coffee ashes! ☕🔥",
    "Hey Mavericks, time to shake the world awake! 🌍✨",
    "Sun's shining, Mavericks grinding! Let's go! 🌅💥",
    "Good morning! Let's make this day so good, yesterday gets jealous! 😎",
    "Mavericks, ready to conquer before breakfast? Let's do it! 🥐🚀",
    "Happy morning to the coolest Mavericks in town! 😎👊",
  ],
  afternoon: [
    "Good afternoon, Mavericks! Keep rocking that hustle! 🤘",
    "Hey Mavericks, time to refuel with some good vibes and snacks! 🍎😄",
    "Afternoon alert! Mavericks still winning, still grinning! 😁",
    "Keep calm and power through, Mavericks! Afternoon's your playground! 🎢",
    "Afternoon, Mavericks! Ready for a productivity power-up? ⚡",
    "Hey Mavericks, is it snack o'clock yet? Stay energized! 🍪🚀",
    "Afternoon sunshine to our unstoppable Mavericks! ☀️🔥",
    "Halfway through the day, Mavericks — still killing it! 💪",
    "Mavericks, let's turn this afternoon into a masterpiece! 🎨",
    "Good afternoon! Keep those brains buzzing, Mavericks! 🧠✨",
    "Mavericks in action: powering through the day like champs! 🏆",
    "Afternoon, Mavericks! The day's not over till you say so! 🕒",
    "Take a deep breath, Mavericks — and keep crushing goals! 🌬️💥",
    "Hey Mavericks, remember: naps are for quitters! Just kidding, take a quick one! 😴😉",
    "Afternoon Mavericks, your vibe attracts your tribe! Keep it lit! 🔥",
    "Hello Mavericks! Time for an afternoon pep talk: You've got this! 🙌",
    "Mavericks, coffee's good, but your passion's better! ☕❤️",
    "Afternoon roll call! Who's ready to smash some tasks? 📝🔥",
    "Keep your spirits high and your coffee higher, Mavericks! ☕🚀",
    "Mavericks, every afternoon is a fresh chance to shine brighter! ✨",
    "Afternoon vibes: Mavericks making waves and taking names! 🌊✍️",
    "Halfway through, Mavericks — let's make the rest of the day count! ⏳",
    "Hey Mavericks, your afternoon hustle is legendary! Keep it up! 🏅",
    "Afternoon champs, keep your eyes on the prize and your feet on the ground! 🎯",
    "Mavericks, you're the reason the afternoon rocks! 🎸😄",
  ],
  evening: [
    "Good evening, Mavericks! Time to kick back and relax like royalty! 👑",
    "Evening Mavericks! Did you win the day? Either way, celebrate! 🎉",
    "Sunset salute to our amazing Mavericks! You crushed it! 🌇🔥",
    "Evening vibes! Time to recharge your superhero powers! 🦸‍♂️⚡",
    "Hey Mavericks, time to unwind and share your epic stories! 📖✨",
    "Mavericks, the stars are out — just like your brilliance! 🌟",
    "Good evening! Time for some well-earned Maverick chill time! 😎🍹",
    "Evening, Mavericks! Let's toast to a day well conquered! 🥂",
    "Mavericks, don't just count stars — be one! ✨",
    "Evening! Hope your day was as awesome as you are, Mavericks! 💫",
    "Sunset and Mavericks — the perfect combo! 🌅🔥",
    "Time to swap your hustle hat for a chill cap, Mavericks! 🧢😌",
    "Evening Mavericks, let your mind relax and your dreams get wild! 🌙💭",
    "Cheers to Mavericks who hustle by day and dream big by night! 🍻",
    "Mavericks, the day's done — now time to plot tomorrow's victory! 🗺️",
    "Good evening! Even Mavericks need to Netflix and chill sometimes! 📺😄",
    "Sun's down, Mavericks — time to let your awesomeness glow! 🌃✨",
    "Evening, team! May your relaxation be as fierce as your work ethic! 🔥",
    "Mavericks, you earned this evening's peace and quiet! Enjoy it! 🌌",
    "Good evening! Remember, even legends need rest! 🛌",
    "Mavericks, the night is young and so is your potential! Go dream big! 🌠",
    "Time to wind down, Mavericks. Your future self thanks you! 🙏",
    "Evening cheers to the boldest Mavericks in the galaxy! 🌟🚀",
    "Mavericks, rest well so you can rise and shine even brighter tomorrow! 🌞",
  ],
  night: [
    "Good night, Mavericks! Dream big, rest well! 🌙💤",
    "Mavericks, the stars are watching — make sure you're dreaming of greatness! ✨",
    "Sleep tight, Mavericks! Tomorrow's another chance to be awesome! 😴🔥",
    "Night, Mavericks! Don't let the bedbugs steal your creativity! 🛏️🐞",
    "Mavericks, recharge your brain — it's time to power up! ⚡💤",
    "Good night! May your dreams be as epic as your hustle! 🌌💫",
    "Rest easy, Mavericks! You've earned your place among the stars! 🌟",
    "Sleep like a Maverick — fierce and unbreakable! 🛌🦁",
    "Nighty night, Mavericks! See you at the top tomorrow! 🏔️",
    "Dream on, Mavericks! Tomorrow is your canvas! 🎨🌙",
    "Good night! Even Mavericks need their beauty sleep! 💅😴",
    "Mavericks, close your eyes and open your mind to amazing dreams! 🌠",
    "Sleep well, champions! The world awaits your next move! 🏆",
    "Mavericks, rest now so you can rule tomorrow! 👑",
    "Good night! Let your dreams do the heavy lifting tonight! 🌛💪",
    "Mavericks, the night is your friend — recharge and rise! 🌙✨",
    "Sleep tight! Remember, the best ideas come after a good rest! 💡😴",
    "Mavericks, drift into dreams and wake up ready to conquer! 🌌🚀",
    "Good night! Your dreams are the blueprint for tomorrow's success! 📐🌟",
    "Rest well, Mavericks! Tomorrow's adventures await! 🌄",
    "Night, Mavericks! May your sleep be deep and your dreams wild! 🌙🌪️",
    "Mavericks, even heroes need their downtime! Recharge those powers! 🦸‍♀️💤",
    "Sleep tight, sleep right — Mavericks' motto for greatness! 💤🔥",
  ],
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMeetings: 0,
    upcomingMeetings: 0,
    totalMembers: 0,
    attendanceRate: 0
  });

  const [greeting, setGreeting] = useState('');
  const [currentISTTime, setCurrentISTTime] = useState('');
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [approvedAbsences, setApprovedAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userClubs, setUserClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [userClubIds, setUserClubIds] = useState([]);
  const [showJoinClubPopup, setShowJoinClubPopup] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const { currentUser } = useAuth();
  const [userAttendanceStats, setUserAttendanceStats] = useState({
    totalMeetings: 0,
    attended: 0,
    missed: 0,
    approved: 0,
    unauthorized: 0
  });
  const [attendancePieData, setAttendancePieData] = useState([]);
  const COLORS = ['#4ade80', '#f87171', '#facc15'];

  // Load "Don't show again" preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('dontShowJoinClubPopup');
    if (savedPreference === 'true') {
      setDontShowAgain(true);
    }
  }, []);
  const changeVal = () => {
    setDontShowAgain(false);
    setShowJoinClubPopup(true);

  }

  useEffect(() => {
    if (currentUser) {
      fetchUserClubs();
      checkStoredAccessKeyAndJoinClub();
    }
  }, [currentUser]);


  const handleDontShowAgain = (value) => {
    setDontShowAgain(value);
    localStorage.setItem('dontShowJoinClubPopup', value.toString());
  };

  const checkStoredAccessKeyAndJoinClub = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const keyFromUrl = urlParams.get('accessKey');
      const keyFromStorage = localStorage.getItem('clubAccessKey');
      const accessKey = keyFromUrl || keyFromStorage;

      if (!accessKey) {
        return;
      }

      await validateKeyAndJoinClub(accessKey);

      if (keyFromStorage) {
        localStorage.removeItem('clubAccessKey');
      }

      if (keyFromUrl) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    } catch (err) {
      console.error("Error checking stored access key:", err);
    }
  };

  const validateKeyAndJoinClub = async (accessKey) => {
    try {

      const keysRef = collection(db, 'accessKeys');
      const q = query(keysRef, where('key', '==', accessKey.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.error('Invalid access key');
        return false;
      }

      const keyDoc = querySnapshot.docs[0];
      const keyData = keyDoc.data();

      if (keyData.used) {
        console.error('This access key has already been used');
        return false;
      }

      if (keyData.expiry && new Date(keyData.expiry) < new Date()) {
        console.error('This access key has expired');
        return false;
      }

      const clubId = keyData.clubId;
      if (!clubId) {
        console.error('Access key is not associated with any club');
        return false;
      }

      const clubDoc = await getDoc(doc(db, 'clubs', clubId));
      if (!clubDoc.exists()) {
        return false;
      }

      const clubName = clubDoc.data().name;
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      if (userData.clubsJoined && userData.clubsJoined[clubId]) {
        return false;
      }


      await updateDoc(doc(db, 'clubs', clubId, 'members', currentUser.uid), {
        userId: currentUser.uid,
        displayName: userData.displayName || 'Unknown User',
        email: userData.email || 'No email',
        role: 'member',
        joinedAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'users', currentUser.uid), {
        [`clubsJoined.${clubId}`]: {
          joinedAt: serverTimestamp(),
          role: 'member'
        }
      });

      await updateDoc(doc(db, 'accessKeys', keyDoc.id), {
        used: true,
        usedBy: currentUser.uid,
        usedAt: serverTimestamp()
      });


      setTimeout(() => {
        window.location.reload();
      }, 1500);

      return true;
    } catch (err) {
      console.error('Error validating key and joining club:', err);
      return false;
    }
  };

  useEffect(() => {
    if (selectedClub) {
      fetchDashboardData();
      fetchApprovedAbsences();
      fetchUserAttendanceStats();
    }
  }, [selectedClub]);

  const name = currentUser.displayName;

  const getCurrentIST = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ISTTime = new Date(utc + (5.5 * 60 * 60 * 1000));

    return {
      hours: ISTTime.getHours(),
      minutes: ISTTime.getMinutes(),
      timeString: ISTTime.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      })
    };
  };

  const getRandomGreeting = () => {
    const { hours } = getCurrentIST();
    let timeOfDay;

    if (hours >= 5 && hours < 12) timeOfDay = 'morning';
    else if (hours >= 12 && hours < 17) timeOfDay = 'afternoon';
    else if (hours >= 17 && hours < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const messages = greetings[timeOfDay];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const updateGreeting = () => {
    const istTime = getCurrentIST();
    setCurrentISTTime(istTime.timeString);
    setGreeting(getRandomGreeting());
  };

  useEffect(() => {
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserClubs = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userClubsData = userDoc.data()?.clubsJoined || {};
      const clubIds = Object.keys(userClubsData);
      setUserClubIds(clubIds);

      if (clubIds.length === 0 && !dontShowAgain) {
        setShowJoinClubPopup(true);
        setLoading(false);
        return;
      }

      const clubsDetails = [];
      for (const clubId of Object.keys(userClubsData)) {
        const clubDoc = await getDoc(doc(db, 'clubs', clubId));
        if (clubDoc.exists()) {
          clubsDetails.push({
            id: clubId,
            name: clubDoc.data().name,
            ...clubDoc.data()
          });
        }
      }

      setUserClubs(clubsDetails);

      if (clubsDetails.length > 0) {
        setSelectedClub(clubsDetails[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to fetch user clubs');
      setLoading(false);
      console.error(err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const clubsRef = collection(db, 'clubs');
      const clubsSnapshot = await getDocs(clubsRef);
      const clubsList = clubsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      let allMeetings = [];
      let memberCount = 0;
      const clubId = selectedClub;

      const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
      const meetingsSnapshot = await getDocs(meetingsRef);
      const clubMeetings = meetingsSnapshot.docs.map(doc => ({
        id: doc.id,
        clubId: clubId,
        clubName: clubsList.find(club => club.id === clubId)?.name || 'Unknown Club',
        ...doc.data()
      }));

      allMeetings = [...allMeetings, ...clubMeetings];

      const membersRef = collection(db, 'clubs', clubId, 'members');
      const membersSnapshot = await getDocs(membersRef);
      memberCount += membersSnapshot.size;

      const totalMeetings = allMeetings.length;
      const upcomingMeetings = allMeetings.filter(m => m.status === 'upcoming').length;
      const totalMembers = memberCount;

      let totalAttendance = 0;
      let attendanceCount = 0;

      for (const meeting of allMeetings) {
        if (meeting.attendanceMarked) {
          const attendeeCount = meeting.attendees ? Object.keys(meeting.attendees).length : 0;
          const membersRef = collection(db, 'clubs', meeting.clubId, 'members');
          const membersSnapshot = await getDocs(membersRef);
          const memberCount = membersSnapshot.size;

          if (memberCount > 0) {
            totalAttendance += (attendeeCount / memberCount) * 100;
            attendanceCount++;
          }
        }
      }

      const attendanceRate = attendanceCount > 0
        ? Math.round(totalAttendance / attendanceCount)
        : 0;

      allMeetings.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateB - dateA;
      });

      const recentMeetingsList = allMeetings.slice(0, 5);

      setStats({
        totalMeetings,
        upcomingMeetings,
        totalMembers,
        attendanceRate
      });
      setRecentMeetings(recentMeetingsList);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      setLoading(false);
      console.error(err);
    }
  };

  const fetchApprovedAbsences = async () => {
    try {
      if (!currentUser) return;

      const clubId = selectedClub;
      let allApprovedAbsences = [];

      const clubDoc = await getDoc(doc(db, 'clubs', clubId));
      const clubName = clubDoc.exists() ? clubDoc.data().name : 'Unknown Club';

      const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
      const meetingsSnapshot = await getDocs(meetingsRef);

      for (const meetingDoc of meetingsSnapshot.docs) {
        const meetingId = meetingDoc.id;
        const meetingData = meetingDoc.data();

        const absencesRef = collection(db, 'clubs', clubId, 'meetings', meetingId, 'absences');
        const q = query(absencesRef, where('userId', '==', currentUser.uid), where('status', '==', 'approved'));
        const absencesSnapshot = await getDocs(q);

        if (!absencesSnapshot.empty) {
          absencesSnapshot.forEach(absenceDoc => {
            allApprovedAbsences.push({
              id: absenceDoc.id,
              meetingId: meetingId,
              meetingName: meetingData.name,
              clubId: clubId,
              clubName: clubName,
              date: meetingData.date,
              time: meetingData.time,
              reason: absenceDoc.data().reason,
              approvedAt: absenceDoc.data().approvedAt?.toDate()
            });
          });
        }
      }

      allApprovedAbsences.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });

      setApprovedAbsences(allApprovedAbsences);
    } catch (err) {
      console.error('Error fetching approved absences:', err);
    }
  };

  const fetchUserAttendanceStats = async () => {
    try {
      if (!currentUser || !selectedClub) return;

      const clubId = selectedClub;
      const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
      const meetingsSnapshot = await getDocs(meetingsRef);
      const totalMeetings = meetingsSnapshot.size;

      let attended = 0;
      let missed = 0;
      let approved = 0;
      let unauthorized = 0;

      for (const meetingDoc of meetingsSnapshot.docs) {
        const meetingId = meetingDoc.id;
        const meetingData = meetingDoc.data();

        if (meetingData.attendees && meetingData.attendees[currentUser.uid]) {
          attended++;
        } else {
          missed++;

          const absenceRef = doc(db, 'clubs', clubId, 'meetings', meetingId, 'absences', currentUser.uid);
          const absenceDoc = await getDoc(absenceRef);

          if (absenceDoc.exists() && absenceDoc.data().status === 'approved') {
            approved++;
          } else {
            unauthorized++;
          }
        }
      }

      const pieChartData = [
        { name: 'Attended', value: attended },
        { name: 'Unauthorized Absences', value: unauthorized },
        { name: 'Approved Absences', value: approved }
      ];

      setUserAttendanceStats({
        totalMeetings,
        attended,
        missed,
        approved,
        unauthorized
      });

      setAttendancePieData(pieChartData);
    } catch (err) {
      console.error('Error fetching user attendance stats:', err);
    }
  };

  const JoinClubPopup = ({ onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold dark:text-white">Join a Club</h2>
            <div className='flex'><Link to="/info"><div className='mt-2'>  <Info /></div></Link>
              <button
                onClick={onClose}
                className="text-blue-500 bg-transparent hover:bg-transparent hover:text-blue-900"
              >
                <X className="w-5 h-5" />
              </button></div>
          </div>
          <div className='w-full h-ato flex justify-center items-center'>
            {selectedClub && <div className="p-4">
              <ClubCard />
            </div>}
            {!selectedClub && <div className="p-4">
              <AccessKey />
            </div>}
          </div>
          <div className="p-4 border-t dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="dontShowAgain"
                checked={dontShowAgain}
                onChange={(e) => handleDontShowAgain(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="dontShowAgain" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Don't show this again
              </label>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading && userClubIds.length > 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="large" />
      </div>
    );
  }

  if (loading && userClubIds.length === 0 && !dontShowAgain) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="px-4 py-1"
    >
      <div className="flex flex-col md:flex-row md:items-center mb-8">
        <div className='md:justify-between flex flex-col md:flex-row md:items-center mb-8'>
          <div className="text-center md:min-w-80 mb-6">
            <h1 className="text-2xl font-bold mb-1 text-blue-600 dark:text-blue-400">
              Welcome back, <br /><span className="font-extrabold">{name}</span>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentISTTime} • Indian Standard Time
            </p>
          </div>

          <div className="w-full md:max-w-[900px] p-1 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 shadow-lg">
            <div className="p-6 rounded-lg backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-blue-200 dark:border-gray-700">
              <div className="flex flex-col items-center justify-center">
                <h2 className="text-2xl font-medium text-center mb-3 text-blue-800 dark:text-blue-100">
                  {greeting}
                </h2>
                <div className="w-24 h-1 rounded-full my-2 bg-blue-300/50 dark:bg-blue-400/30"></div>
                <div className="text-4xl mt-2 animate-bounce text-yellow-500 dark:text-yellow-300">
                  {greeting.includes('morning') || greeting.includes('Rise') ? '🌄' :
                    greeting.includes('afternoon') || greeting.includes('Hustle') ? '☀️' :
                      greeting.includes('evening') || greeting.includes('Relax') ? '🌇' :
                        greeting.includes('night') || greeting.includes('Sleep') || greeting.includes('Dream') ? '🌙' : "🔥"
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {userClubs.length > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="w-full md:w-64 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {userClubs.map(club => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className='h-16 w-full mb-5 md:mb-5 flex items-center justify-center bg-transparent border-t-2 border-b-2 border-blue-200'>
        <span className='text-blue-500 font-semibold text-xl'>Dashboard</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/meetings" className="hover:scale-105 transition-transform duration-200">
          <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm dark:text-white text-gray-500">Total Meetings</p>
                <p className="text-2xl font-semibold dark:text-white">{stats.totalMeetings}</p>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/meetings" className="hover:scale-105 transition-transform duration-200">
          <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm dark:text-white text-gray-500">Upcoming Meetings</p>
                <p className="text-2xl dark:text-white font-semibold">{stats.upcomingMeetings}</p>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/members" className="hover:scale-105 transition-transform duration-200">
          <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm dark:text-white text-gray-500">Total Members</p>
                <p className="text-2xl dark:text-white font-semibold">{stats.totalMembers}</p>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/analytics" className="hover:scale-105 transition-transform duration-200">
          <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm dark:text-white text-gray-500">Attendance Rate</p>
                <p className="text-2xl dark:text-white font-semibold">{stats.attendanceRate}%</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {selectedClub && (
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 dark:text-white">My Attendance Stats</h2>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">Total</h3>
                </div>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{userAttendanceStats.totalMeetings}</p>
                <p className="text-sm text-blue-600 dark:text-blue-300">meetings</p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Attended</h3>
                </div>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400">{userAttendanceStats.attended}</p>
                <p className="text-sm text-green-600 dark:text-green-300">
                  {userAttendanceStats.totalMeetings > 0
                    ? `${Math.round((userAttendanceStats.attended / userAttendanceStats.totalMeetings) * 100)}%`
                    : '0%'}
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Clock className="w-5 h-5 text-yellow-500 mr-2" />
                  <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">Approved</h3>
                </div>
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{userAttendanceStats.approved}</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-300">absences</p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Missed</h3>
                </div>
                <p className="text-3xl font-bold text-red-700 dark:text-red-400">{userAttendanceStats.unauthorized}</p>
                <p className="text-sm text-red-600 dark:text-red-300">unauthorized</p>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Attendance Breakdown</h3>
              <div className="h-64">
                {attendancePieData.length > 0 && userAttendanceStats.totalMeetings > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendancePieData}
                        cx="50%"
                        cy="50%"
                        labelPosition="inside"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {attendancePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} meetings`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">No attendance data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Attendance Warnings</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The following members have missed 3 or more consecutive meetings in their clubs and have been notified:
        </p>

        {userClubIds.length > 0 ? (
          <div className="space-y-6">
            {selectedClub ? (
              <PublicAttendanceWarnings key={selectedClub} clubId={selectedClub} />
            ) : (
              userClubIds.map(clubId => (
                <PublicAttendanceWarnings key={clubId} clubId={clubId} />
              ))
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No Clubs Joined</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Join a club to see attendance warnings
            </p>
            <button
              onClick={() => setShowJoinClubPopup(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Join a Club
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-xl dark:text-white font-semibold mb-4">Recent Meetings</h2>
        <div className="space-y-4">
          {recentMeetings.map(meeting => (
            <div
              key={meeting.id}
              className="flex items-center justify-between p-2 flex-wrap gap-2 md:p-4 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div>
                <h3 className="font-medium">{meeting.name}</h3>
                <div className="text-sm dark:text-white text-gray-500 flex items-center gap-2">
                  <span>{meeting.date} at {meeting.time}</span>
                  <span>•</span>
                  <Link to="/about"><span className="font-medium text-blue-600 dark:text-blue-400">{meeting.clubName}</span></Link>
                </div>
                <div className="text-xs dark:text-white text-gray-500 mt-1">
                  {meeting.mode === 'offline' ? (
                    <span>Location: {meeting.location}{meeting.location === 'Classroom' && meeting.classroomNumber ? ` (${meeting.classroomNumber})` : ''}</span>
                  ) : (
                    <span>Platform: {meeting.platform}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${meeting.status === 'upcoming'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : meeting.status === 'cancelled'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                  {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                </span>
                <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                  {meeting.attendees ? Object.keys(meeting.attendees).length : 0} attendees
                </span>
              </div>
            </div>
          ))}

          {recentMeetings.length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-white">No meetings found</p>
            </div>
          )}
        </div>
        <Link to="/meetings"> <div className='w-full mt-2 h-auto flex justify-end text-blue-500 underline'>view all</div></Link>
      </div>

      {approvedAbsences.length > 0 && (
        <div className="bg-white mt-5 dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="mr-2 text-amber-500" />
            Approved Absences
          </h2>

          <div className="space-y-4">
            {approvedAbsences.map(absence => (
              <div
                key={absence.id}
                className="border-l-4 border-amber-500 pl-4 py-3 bg-amber-50 dark:bg-amber-900/20 rounded-r-md"
              >
                <div className="flex justify-between">
                  <h3 className="font-medium text-gray-800 dark:text-white">{absence.meetingName}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{absence.date}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Club: {absence.clubName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">"{absence.reason}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showJoinClubPopup && dontShowAgain == false && (
        <JoinClubPopup onClose={() => setShowJoinClubPopup(false)} />
      )}

      {(
        <button
          onClick={() => changeVal()}
          className="fixed bottom-20 right-6 p-2 bg-blue-600 text-white rounded-full shadow-lg focus:outline-none focus:ring-offset-2 focus:ring-blue-500 z-40"
          aria-label="Join a club"
        >
          <div className="relative h-12 w-12 flex items-center justify-center">
            {/* Chatbot Icon */}
            <div className={`absolute h-full w-full rounded-full flex items-center justify-center bg-transparent`}>
              <div className='text-3xl font-bold'><BadgePlus /></div>
            </div>

            {/* Water Drop Waves */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`absolute h-full w-full rounded-full border-2 bg-transparent`}
                style={{
                  animation: `wave 3s ease-out infinite`,
                  animationDelay: `${i * 1}s`,
                  borderColor: 'white' // Added to make waves visible
                }}
              />
            ))}

            {/* CSS for the animation */}
            <style>{`
        @keyframes wave {
          0% {
            transform: scale(1);
            opacity: 0.7;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
          </div>
        </button>
      )}
    </motion.div>
  );
}

