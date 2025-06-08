import { collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebase';
import { toast } from 'react-hot-toast';

let prevOnlineUsers = {};

export const startPresenceListener = () => {
  const usersRef = collection(db, 'users');

  return onSnapshot(usersRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const user = change.doc.data();
      const userId = change.doc.id;

      // ✅ Ignore the current user's presence update
      if (auth.currentUser?.uid === userId) return;

      const wasOnline = prevOnlineUsers[userId]?.isOnline;
      const isNowOnline = user.isOnline;

      if (!wasOnline && isNowOnline) {
        toast(`${user.displayName || 'Someone'} is now online`, {
          duration: 3000,
          icon: '🟢',
        });
      }

      prevOnlineUsers[userId] = { isOnline: isNowOnline };
    });
  });
};
