import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Optimized hook for Firebase queries with caching, debouncing, and real-time updates
 */
export const useOptimizedQuery = (
  collectionPath,
  queryConstraints = [],
  options = {}
) => {
  const {
    enableRealtime = false,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes default cache
    debounceMs = 300,
    transform = (data) => data
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const cacheRef = useRef(new Map());
  const debounceRef = useRef(null);
  const unsubscribeRef = useRef(null);
  
  // Create cache key from collection path and query constraints
  const getCacheKey = useCallback(() => {
    const constraintsStr = JSON.stringify(queryConstraints.map(c => ({
      type: c.type,
      field: c.field,
      op: c.op,
      value: c.value
    })));
    return `${collectionPath}-${constraintsStr}`;
  }, [collectionPath, queryConstraints]);

  // Check if cached data is still valid
  const getCachedData = useCallback(() => {
    const cacheKey = getCacheKey();
    const cached = cacheRef.current.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      return cached.data;
    }
    return null;
  }, [getCacheKey, cacheTimeout]);

  // Cache data with timestamp
  const setCachedData = useCallback((newData) => {
    const cacheKey = getCacheKey();
    cacheRef.current.set(cacheKey, {
      data: newData,
      timestamp: Date.now()
    });
  }, [getCacheKey]);

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      // Check cache first
      const cachedData = getCachedData();
      if (cachedData) {
        setData(transform(cachedData));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const q = query(collection(db, collectionPath), ...queryConstraints);
      const snapshot = await getDocs(q);
      
      const results = [];
      snapshot.forEach((doc) => {
        results.push({
          id: doc.id,
          ...doc.data()
        });
      });

      const transformedData = transform(results);
      setData(transformedData);
      setCachedData(results);
      
    } catch (err) {
      console.error('Query error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [collectionPath, queryConstraints, getCachedData, setCachedData, transform]);

  // Setup real-time listener
  const setupRealtimeListener = useCallback(() => {
    if (!enableRealtime) return;

    try {
      const q = query(collection(db, collectionPath), ...queryConstraints);
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const results = [];
        snapshot.forEach((doc) => {
          results.push({
            id: doc.id,
            ...doc.data()
          });
        });

        const transformedData = transform(results);
        setData(transformedData);
        setCachedData(results);
        setLoading(false);
      }, (err) => {
        console.error('Real-time listener error:', err);
        setError(err);
        setLoading(false);
      });

      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      console.error('Failed to setup real-time listener:', err);
      setError(err);
      setLoading(false);
    }
  }, [collectionPath, queryConstraints, enableRealtime, transform, setCachedData]);

  // Debounced fetch
  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (enableRealtime) {
        setupRealtimeListener();
      } else {
        fetchData();
      }
    }, debounceMs);
  }, [fetchData, setupRealtimeListener, enableRealtime, debounceMs]);

  // Effect to trigger data fetching
  useEffect(() => {
    debouncedFetch();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [debouncedFetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    // Clear cache for this query
    const cacheKey = getCacheKey();
    cacheRef.current.delete(cacheKey);
    
    // Fetch fresh data
    if (enableRealtime) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      setupRealtimeListener();
    } else {
      fetchData();
    }
  }, [getCacheKey, enableRealtime, setupRealtimeListener, fetchData]);

  return {
    data,
    loading,
    error,
    refresh
  };
};

/**
 * Hook for optimized member queries with role-based filtering
 */
export const useOptimizedMembers = (clubId, options = {}) => {
  const queryConstraints = clubId ? [
    where('clubs', 'array-contains', clubId)
  ] : [];

  return useOptimizedQuery('users', queryConstraints, {
    enableRealtime: true,
    cacheTimeout: 2 * 60 * 1000, // 2 minutes for member data
    transform: (data) => {
      // Sort by online status first, then by name
      return data.sort((a, b) => {
        if (a.isOnline !== b.isOnline) {
          return b.isOnline ? 1 : -1;
        }
        return (a.displayName || '').localeCompare(b.displayName || '');
      });
    },
    ...options
  });
};

/**
 * Hook for optimized meeting queries with date sorting
 */
export const useOptimizedMeetings = (clubId, options = {}) => {
  const queryConstraints = clubId ? [
    where('clubId', '==', clubId)
  ] : [];

  return useOptimizedQuery(`clubs/${clubId}/meetings`, [], {
    enableRealtime: true,
    cacheTimeout: 1 * 60 * 1000, // 1 minute for meeting data
    transform: (data) => {
      // Sort by date descending (newest first)
      return data.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt);
        const dateB = new Date(b.date || b.createdAt);
        return dateB - dateA;
      });
    },
    ...options
  });
};
