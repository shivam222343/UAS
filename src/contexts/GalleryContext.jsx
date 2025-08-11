// src/contexts/GalleryContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, query, orderBy, serverTimestamp, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { useAuth } from './AuthContext'; // <-- ADD THIS LINE

const GalleryContext = createContext();

export function useGallery() {
  return useContext(GalleryContext);
}

const CLOUDINARY_CLOUD_NAME = 'dwsddmatc';
const CLOUDINARY_UPLOAD_PRESET = 'MavericksGallery';

export function GalleryProvider({ children }) {
  const { currentUser } = useAuth(); // <-- ADD THIS LINE
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sortBy, setSortBy] = useState('desc');

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      if (!res.ok) {
        throw new Error('Cloudinary upload failed.');
      }
      const data = await res.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  };

  const addNewImage = async (file, description) => {
    if (!currentUser) { // <-- ADD THIS CHECK
      console.error('User not authenticated.');
      return false;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      await addDoc(collection(db, 'gallery'), {
        url: imageUrl,
        description: description,
        createdAt: serverTimestamp(),
        likes: [],
        uploaderId: currentUser.uid, // <-- ADD THIS LINE
        uploaderName: currentUser.displayName || 'Anonymous', // <-- ADD THIS LINE
        uploaderPhotoUrl: currentUser.photoURL || null, // <-- ADD THIS LINE
      });

      return true;
    } catch (error) {
      console.error('Error adding image to gallery:', error);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId) => {
    try {
      const imageDocRef = doc(db, 'gallery', imageId);
      await deleteDoc(imageDocRef);
      console.log('Image deleted successfully from Firestore.');
    } catch (error) {
      console.error('Error deleting image from gallery:', error);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let fetchedImages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (sortBy === 'likesDesc') {
        fetchedImages.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
      } else if (sortBy === 'likesAsc') {
        fetchedImages.sort((a, b) => (a.likes?.length || 0) - (b.likes?.length || 0));
      } else if (sortBy === 'asc') {
        fetchedImages.reverse();
      }
      
      setImages(fetchedImages);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching gallery images:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sortBy]);

  const value = {
    images,
    loading,
    uploading,
    addNewImage,
    deleteImage,
    sortBy,
    setSortBy,
  };

  return (
    <GalleryContext.Provider value={value}>
      {children}
    </GalleryContext.Provider>
  );
}