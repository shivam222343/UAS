import { useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to listen for new club members and trigger app reload
 * @param {string} clubId - Club ID to monitor
 */
export const useClubMemberUpdates = (clubId) => {
    const authContext = useAuth();
    const currentUser = authContext?.currentUser;

    useEffect(() => {
        if (!clubId || !currentUser) return;

        // Listen to club members collection
        const membersRef = collection(db, 'clubs', clubId, 'members');
        const q = query(membersRef);

        let initialLoad = true;
        let previousMemberCount = 0;

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const currentMemberCount = snapshot.docs.length;

            // Skip initial load
            if (initialLoad) {
                previousMemberCount = currentMemberCount;
                initialLoad = false;
                return;
            }

            // Check if new member joined
            if (currentMemberCount > previousMemberCount) {
                console.log('New member joined! Reloading app...');

                // Show notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('New Member Joined!', {
                        body: 'A new member has joined the club. Refreshing...',
                        icon: '/logo.png'
                    });
                }

                // Reload after short delay to show notification
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }

            previousMemberCount = currentMemberCount;
        });

        return () => unsubscribe();
    }, [clubId, currentUser]);
};
