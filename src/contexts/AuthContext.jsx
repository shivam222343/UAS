import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const adminPassword = "JustMavericksThings";

  const auth = getAuth();

  // User creation and sign in methods
  function createUser(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  function logout() {
    return signOut(auth);
  }

  function updateUserProfile(user, data) {
    return updateProfile(user, data);
  }

  // Get user data from Firestore
  async function fetchUserData(uid) {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProfile(userData);
        setUserRole(userData.role || 'member');
        
        // Update last login time
        await updateDoc(userDocRef, {
          lastLogin: serverTimestamp()
        });
        
        return userData;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  // Admin authentication
  function authenticateAdmin(password) {
    if (password === adminPassword) {
      setAdminAuthenticated(true);
      // Store in session storage to persist during the session
      sessionStorage.setItem('adminAuthenticated', 'true');
      return true;
    }
    return false;
  }

  function checkAdminAccess() {
    // Check if user is already an admin or has admin authentication
    return userRole === 'admin' || adminAuthenticated;
  }

  // Check if admin is authenticated when the component mounts
  useEffect(() => {
    const isAdminAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
    if (isAdminAuthenticated) {
      setAdminAuthenticated(true);
    }
  }, []);

  // Update user role in Firestore
  async function updateUserRole(userId, newRole) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: serverTimestamp()
      });
      
      // If updating the current user's role, update state
      if (userId === currentUser.uid) {
        setUserRole(newRole);
        setUserProfile(prev => ({
          ...prev,
          role: newRole
        }));
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  }

  // Update user profile in Firestore
  async function updateUserProfileData(userId, profileData) {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Exclude role from profileData to ensure it's not updated here
      const { role, ...dataToUpdate } = profileData;
      
      await updateDoc(userRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp()
      });
      
      // If updating the current user's role, update state
      if (userId === currentUser.uid) {
        setUserProfile(prev => ({
          ...prev,
          ...dataToUpdate
        }));
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user data from Firestore
        await fetchUserData(user.uid);
      } else {
        setUserProfile(null);
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userProfile,
    adminAuthenticated,
    loading,
    createUser,
    login,
    logout,
    loginWithGoogle,
    updateUserProfile,
    fetchUserData,
    updateUserRole,
    updateUserProfileData,
    authenticateAdmin,
    checkAdminAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 