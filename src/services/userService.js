import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Cache for user data to avoid repeated fetches
const userCache = new Map();

/**
 * Fetch user data by user ID
 * @param {string} userId - The user ID to fetch
 * @returns {Promise<Object>} User data object
 */
export const fetchUserData = async (userId) => {
    if (!userId) return null;

    // Check cache first
    if (userCache.has(userId)) {
        return userCache.get(userId);
    }

    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const userData = {
                id: userId,
                displayName: userDoc.data().displayName || 'Unknown User',
                photoURL: userDoc.data().photoURL || null,
                email: userDoc.data().email || ''
            };

            // Cache the result
            userCache.set(userId, userData);
            return userData;
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }

    return {
        id: userId,
        displayName: 'Unknown User',
        photoURL: null,
        email: ''
    };
};

/**
 * Get other participant in a direct conversation
 * @param {Array} participants - Array of participant IDs
 * @param {string} currentUserId - Current user's ID
 * @returns {string} Other participant's ID
 */
export const getOtherParticipant = (participants, currentUserId) => {
    return participants.find(id => id !== currentUserId);
};

/**
 * Clear user cache (useful for logout)
 */
export const clearUserCache = () => {
    userCache.clear();
};
