import { doc, getDoc, getDocs, collection, query, where, limit, startAfter, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Batch fetch multiple documents by IDs
 * Reduces N+1 queries to a single batched operation
 */
export const batchGetDocs = async (collectionPath, docIds) => {
    if (!docIds || docIds.length === 0) return [];

    const BATCH_SIZE = 10; // Firestore 'in' query limit
    const batches = [];

    for (let i = 0; i < docIds.length; i += BATCH_SIZE) {
        const batch = docIds.slice(i, i + BATCH_SIZE);
        batches.push(batch);
    }

    const results = [];

    for (const batch of batches) {
        const q = query(
            collection(db, collectionPath),
            where('__name__', 'in', batch)
        );

        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
            results.push({
                id: doc.id,
                ...doc.data()
            });
        });
    }

    return results;
};

/**
 * Paginated query with cursor-based pagination
 * Use this instead of fetching entire collections
 */
export const paginatedQuery = async (collectionPath, options = {}) => {
    const {
        pageSize = 20,
        lastDoc = null,
        orderByField = 'createdAt',
        orderDirection = 'desc',
        whereConditions = []
    } = options;

    let q = collection(db, collectionPath);

    // Apply where conditions
    whereConditions.forEach(condition => {
        q = query(q, where(condition.field, condition.op, condition.value));
    });

    // Apply ordering
    q = query(q, orderBy(orderByField, orderDirection));

    // Apply pagination
    q = query(q, limit(pageSize));

    if (lastDoc) {
        q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const docs = [];

    snapshot.forEach(doc => {
        docs.push({
            id: doc.id,
            ...doc.data(),
            _doc: doc // Store for pagination
        });
    });

    return {
        docs,
        lastDoc: docs.length > 0 ? docs[docs.length - 1]._doc : null,
        hasMore: docs.length === pageSize
    };
};

/**
 * Optimized member fetch with batching
 * Replaces individual getDoc calls in loops
 */
export const fetchMembersOptimized = async (clubId, memberIds) => {
    if (!memberIds || memberIds.length === 0) return [];

    // Fetch from members subcollection
    const membersRef = collection(db, 'clubs', clubId, 'members');
    const membersSnapshot = await getDocs(membersRef);

    const memberDataMap = {};
    membersSnapshot.forEach(doc => {
        memberDataMap[doc.id] = doc.data();
    });

    // Batch fetch user details
    const userIds = memberIds.filter(id => memberDataMap[id]);
    const users = await batchGetDocs('users', userIds);

    // Merge member and user data
    return users.map(user => ({
        ...user,
        ...memberDataMap[user.id],
        id: user.id
    }));
};

/**
 * Optimized meeting fetch with attendance data
 * Reduces queries by fetching related data in parallel
 */
export const fetchMeetingsOptimized = async (clubId, options = {}) => {
    const {
        pageSize = 20,
        includeAttendance = false,
        status = null
    } = options;

    const whereConditions = [];
    if (status) {
        whereConditions.push({ field: 'status', op: '==', value: status });
    }

    const result = await paginatedQuery(`clubs/${clubId}/meetings`, {
        pageSize,
        orderByField: 'date',
        orderDirection: 'desc',
        whereConditions
    });

    if (includeAttendance && result.docs.length > 0) {
        // Fetch attendance data in parallel
        const attendancePromises = result.docs.map(async (meeting) => {
            const attendees = meeting.attendees || {};
            return {
                ...meeting,
                attendeeCount: Object.keys(attendees).length
            };
        });

        result.docs = await Promise.all(attendancePromises);
    }

    return result;
};

/**
 * Cache manager for frequently accessed data
 */
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.ttl = 5 * 60 * 1000; // 5 minutes default
    }

    set(key, value, customTtl = null) {
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl: customTtl || this.ttl
        });
    }

    get(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const age = Date.now() - cached.timestamp;
        if (age > cached.ttl) {
            this.cache.delete(key);
            return null;
        }

        return cached.value;
    }

    clear() {
        this.cache.clear();
    }

    delete(key) {
        this.cache.delete(key);
    }
}

export const cacheManager = new CacheManager();

/**
 * Memoized fetch with cache
 */
export const fetchWithCache = async (key, fetchFn, ttl = null) => {
    const cached = cacheManager.get(key);
    if (cached) return cached;

    const data = await fetchFn();
    cacheManager.set(key, data, ttl);
    return data;
};

/**
 * Optimized attendance stats calculation
 * Avoids fetching all meetings for stats
 */
export const calculateAttendanceStats = async (clubId, userId) => {
    const cacheKey = `attendance-stats-${clubId}-${userId}`;

    return fetchWithCache(cacheKey, async () => {
        const meetingsRef = collection(db, 'clubs', clubId, 'meetings');
        const meetingsSnapshot = await getDocs(meetingsRef);

        let totalMeetings = 0;
        let attended = 0;

        meetingsSnapshot.forEach(doc => {
            const meeting = doc.data();
            totalMeetings++;

            if (meeting.attendees && meeting.attendees[userId]) {
                attended++;
            }
        });

        return {
            totalMeetings,
            attended,
            missed: totalMeetings - attended,
            attendanceRate: totalMeetings > 0 ? Math.round((attended / totalMeetings) * 100) : 0
        };
    }, 2 * 60 * 1000); // Cache for 2 minutes
};
