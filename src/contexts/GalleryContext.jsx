import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const GalleryContext = createContext();

export function useGallery() {
    return useContext(GalleryContext);
}

const CLOUDINARY_CLOUD_NAME = 'dwsddmatc';
const CLOUDINARY_UPLOAD_PRESET = 'MavericksGallery';

export function GalleryProvider({ children }) {
    const { currentUser, userRole } = useAuth();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [sortBy, setSortBy] = useState('desc');
    // --- New states for features ---
    const [uploadAccess, setUploadAccess] = useState([]);
    const [clubMembers, setClubMembers] = useState([]);
    const [accessLoading, setAccessLoading] = useState(false);

    // --- Upload access logic (admin can manage) ---
    useEffect(() => {
        const fetchAccess = async () => {
            // Fetch upload access list (from a doc in Firestore)
            const accessSnap = await getDocs(collection(db, 'gallerySettings'));
            let accessArr = [];
            accessSnap.forEach(docSnap => {
                if (docSnap.id === 'uploadAccess') {
                    accessArr = docSnap.data().uids || [];
                }
            });
            setUploadAccess(accessArr);
        };
        fetchAccess();
    }, []);

    // Fetch club members for admin
    useEffect(() => {
        if (userRole === 'admin') {
            const fetchMembers = async () => {
                const usersCollection = collection(db, 'users');
                const usersSnapshot = await getDocs(usersCollection);
                const members = usersSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(user => user.role === 'clubMember');
                setClubMembers(members);
            };
            fetchMembers();
        }
    }, [userRole]);

    // Save upload access (admin only)
    const saveUploadAccess = async (uids) => {
        setAccessLoading(true);
        try {
            const accessDocRef = doc(db, 'gallerySettings', 'uploadAccess');
            await updateDoc(accessDocRef, { uids });
            setUploadAccess(uids);
        } catch (e) {
            // handle error
        }
        setAccessLoading(false);
    };

    // --- End upload access logic ---

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

    // --- Add/Edit image logic ---
    const addNewImage = async (file, description) => {
        if (!currentUser) {
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
                uploaderId: currentUser.uid,
                uploaderName: currentUser.displayName || 'Anonymous',
                uploaderPhotoUrl: currentUser.photoURL || null,
            });

            return true;
        } catch (error) {
            console.error('Error adding image to gallery:', error);
            return false;
        } finally {
            setUploading(false);
        }
    };

    // Edit description for user's own post
    const editImageDescription = async (imageId, newDescription) => {
        try {
            const imageRef = doc(db, 'gallery', imageId);
            await updateDoc(imageRef, {
                description: newDescription
            });
            return true;
        } catch (error) {
            console.error('Error updating description:', error);
            return false;
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

    // --- New: fetch liked users for a given likes array ---
    const fetchLikedUsers = async (likesArray) => {
        if (!likesArray || likesArray.length === 0) return [];
        try {
            const usersCollection = collection(db, 'users');
            const usersSnapshot = await getDocs(usersCollection);
            const usersData = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            const likedUsers = likesArray.map(userId => {
                const user = usersData.find(u => u.id === userId);
                return user || { id: userId, firstName: 'Unknown', photoURL: null };
            });
            return likedUsers;
        } catch (error) {
            return [];
        }
    };
    // --- End liked users logic ---

    const value = {
        images,
        loading,
        uploading,
        addNewImage,
        deleteImage,
        sortBy,
        setSortBy,
        // --- New for features ---
        uploadAccess,
        clubMembers,
        saveUploadAccess,
        accessLoading,
        editImageDescription,
        fetchLikedUsers,
    };

    return (
        <GalleryContext.Provider value={value}>
            {children}
        </GalleryContext.Provider>
    );
}