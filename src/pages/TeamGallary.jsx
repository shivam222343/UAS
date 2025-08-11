// src/components/TeamGallery.js

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../components/Loader';
import { useAuth } from '../contexts/AuthContext';
import { useGallery } from '../contexts/GalleryContext';
import { useTheme } from '../contexts/ThemeContext';
import { UploadCloud, XCircle, Heart, MessageCircle, Download, Send, Trash2, ArrowDownUp, Search, Loader2 } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app'; // Import getApps
import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove, collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

import toast, { Toaster } from 'react-hot-toast';

// Initializing Firebase from the global config
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

let app;
// Use getApps() to check if an app has already been initialized
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

const db = getFirestore(app);
const auth = getAuth(app);

// Animation variants (No changes needed here)
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 10,
        },
    },
};



const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const modalContentVariants = {
    hidden: { scale: 0.9, y: '50px' },
    visible: { scale: 1, y: '0px' },
};

const LikeAnimation = ({ isVisible }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 2, 1], opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8 }}
                >
                    <Heart className="text-white fill-red-500" size={120} />
                </motion.div>
            )}
        </AnimatePresence>
    );
};


function TeamGallery() {
    const { userRole, currentUser } = useAuth();
    const { images, loading, uploading, addNewImage, deleteImage, sortBy, setSortBy } = useGallery();
    const { darkMode } = useTheme();

    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);
    const [lastClickTime, setLastClickTime] = useState(0);
    const [likedByDoubleClick, setLikedByDoubleClick] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [imageToDelete, setImageToDelete] = useState(null);

    const commentsEndRef = useRef(null);

    const isAdmin = userRole === 'admin';
    const userId = currentUser?.uid;

    const filteredImages = images.filter(img =>
        img.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (!selectedImage) return;

        const imageDocRef = doc(db, 'gallery', selectedImage.id);
        const commentsCollectionRef = collection(imageDocRef, 'comments');

        const q = query(commentsCollectionRef, orderBy('createdAt'));
        const unsubscribeComments = onSnapshot(q, (snapshot) => {
            const newComments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setComments(newComments);
        });

        return () => {
            unsubscribeComments();
        };
    }, [selectedImage]);

    useEffect(() => {
        if (commentsEndRef.current) {
            commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedImage, comments]);

    useEffect(() => {
        if (selectedImage) {
            const updatedImage = images.find(img => img.id === selectedImage.id);
            if (updatedImage) {
                setSelectedImage(updatedImage);
            }
        }
    }, [images, selectedImage]);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !description) return;

        const uploadToast = toast.loading('Uploading image...');
        try {
            const success = await addNewImage(file, description);

            if (success) {
                toast.success('Image uploaded successfully!', { id: uploadToast });
                setDescription('');
                setFile(null);
            } else {
                toast.error('Failed to upload image.', { id: uploadToast });
            }
        } catch (error) {
            toast.error('An error occurred during upload.', { id: uploadToast });
            console.error('Upload error:', error);
        }
    };

    const handleLike = async (imageId, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!imageId || !userId) return;

        const imageRef = doc(db, 'gallery', imageId);

        const currentImage = images.find(img => img.id === imageId);
        if (!currentImage) return;

        const hasLiked = currentImage.likes?.includes(userId);

        try {
            await updateDoc(imageRef, {
                likes: hasLiked ? arrayRemove(userId) : arrayUnion(userId),
            });
        } catch (error) {
            console.error('Error updating like:', error);
        }
    };

    const handleImageDoubleClick = (img, e) => {
        e.stopPropagation();
        const now = Date.now();
        if (now - lastClickTime < 300) {
            if (!img.likes?.includes(userId)) {
                handleLike(img.id, e);
                setLikedByDoubleClick(img.id);
                setTimeout(() => setLikedByDoubleClick(null), 1000);
            }
        }
        setLastClickTime(now);
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !selectedImage || !userId) return;

        const imageDocRef = doc(db, 'gallery', selectedImage.id);
        const commentsCollectionRef = collection(imageDocRef, 'comments');

        try {
            await addDoc(commentsCollectionRef, {
                userId,
                userName: currentUser?.displayName || 'Anonymous',
                text: commentText,
                createdAt: serverTimestamp(),
            });
            setCommentText('');
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!selectedImage || !userId) return;

        const commentDocRef = doc(db, 'gallery', selectedImage.id, 'comments', commentId);

        try {
            await deleteDoc(commentDocRef);
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const handleDeleteImageWithConfirmation = (imageId) => {
        setImageToDelete(imageId);
        setShowConfirmModal(true);
    };

    const confirmDeleteImage = async () => {
        if (!isAdmin || !imageToDelete) return;

        const deleteToast = toast.loading('Deleting image...');
        try {
            await deleteImage(imageToDelete);
            setSelectedImage(null);
            toast.success('Image deleted successfully!', { id: deleteToast });
        } catch (error) {
            toast.error('Failed to delete image.', { id: deleteToast });
            console.error('Delete error:', error);
        } finally {
            setShowConfirmModal(false);
            setImageToDelete(null);
        }
    };

    const handleDownload = (imageUrl, e) => {
        if (e) e.stopPropagation();
        if (imageUrl) {
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = 'gallery-image';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const bgClass = darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800';
    const cardBgClass = darkMode ? 'bg-gray-800' : 'bg-white';
    const inputClass = darkMode
        ? 'bg-gray-700 text-gray-100 border-gray-600 focus:ring-blue-400'
        : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500';
    const buttonClass = darkMode
        ? 'bg-blue-600 hover:bg-blue-700'
        : 'bg-blue-600 hover:bg-blue-700';
    const modalBgClass = darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800';

    // FIX: Change 'isLoading' to 'loading'
    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center min-h-[50vh]"
            >
                <Loader size="large" />
                <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg">Loading gallery...</p>
            </motion.div>
        );
    }

    return (
        <div
            className={`min-h-screen py-8 px-4 dark:bg-slate-900 transition-colors duration-500 ${bgClass}`}
            
        >
            <Toaster position="top-right" />

            <motion.h1
                className="text-4xl font-extrabold text-center mb-8"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 100 }}
            >
                Team Gallery
            </motion.h1>

            <AnimatePresence>
                {isAdmin && (
                    <motion.div
                        className={`mb-12 max-w-lg mx-auto p-6 dark:bg-slate-600 rounded-xl shadow-lg transition-colors duration-500 ${cardBgClass}`}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className={`text-2xl font-semibold mb-4 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            Upload New Image
                        </h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className={`block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100 transition-colors duration-300 ${inputClass}`}
                                required
                            />
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter a description for the image..."
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors duration-300 ${inputClass}`}
                                rows="3"
                                required
                            ></textarea>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={uploading || !file}
                                className={`w-full px-4 py-2 text-white font-bold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${buttonClass}`}
                            >
                                {uploading ? (
                                    <>
                                        <UploadCloud className="animate-pulse" size={20} /> Uploading...
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud size={20} /> Upload to Gallery
                                    </>
                                )}
                            </motion.button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <hr className={`my-8 border-t-2 dark:border-gray-500 max-w-4xl mx-auto ${darkMode ? 'border-gray-700' : 'border-gray-300'}`} />

            <div className="flex flex-col sm:flex-row justify-between items-center max-w-6xl mx-auto mb-4 gap-4">
                <div className="relative w-full sm:w-1/3">
                    <input
                        type="text"
                        placeholder="Search images..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-full border focus:outline-none focus:ring-2 ${inputClass}`}
                    />
                    <Search size={20} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <div className="relative inline-block text-left w-full sm:w-auto">
                    <label htmlFor="sortBy" className={`mr-2 dark:text-gray-200 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sort By:</label>
                    <select
                        id="sortBy"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className={`pl-3 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                    >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                        <option value="likesDesc">Most Liked</option>
                        <option value="likesAsc">Least Liked</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-500">
                    <Loader2 className="animate-spin h-10 w-10 text-blue-500 mb-4" />
                    <p className="text-lg font-medium">Loading gallery...</p>
                </div>
            ) : filteredImages.length > 0 ? (
                <motion.div
                    className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {filteredImages.map((img) => (
                        <motion.div
                            key={img.id}
                            className={`relative dark:bg-slate-700 break-inside-avoid p-2 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer group ${cardBgClass}`}
                            variants={itemVariants}
                            onClick={() => setSelectedImage(img)}
                            onDoubleClick={(e) => handleImageDoubleClick(img, e)}
                        >
                            <LikeAnimation isVisible={likedByDoubleClick === img.id} />
                            <motion.img
                                src={img.url}
                                alt={img.description}
                                className="w-full rounded-t-lg object-cover"
                                loading="lazy"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                            />
                            <div className='flex flex-col '>
                                <div className="p-4">
                                    <p className={`text-md dark:text-white font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{img.description}</p>
                                </div>

                                <motion.div
                                    className={`flex justify-end gap-1 rounded-b-lg transition-opacity duration-300`}
                                >
                                    <div
                                        className={`flex items-center dark:bg-slate-700 dark:text-white gap-1 cursor-pointer px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 bg-opacity-70 text-white' : 'bg-white bg-opacity-70 text-gray-900'}`}
                                        onClick={(e) => handleLike(img.id, e)}
                                    >
                                        <Heart
                                            size={20}
                                            className={
                                                ` ${img.likes?.includes(userId)
                                                    ? 'text-red-500 fill-red-500'
                                                    : ''}`
                                            }
                                        />
                                        <span>{img.likes?.length || 0}</span>
                                    </div>
                                    <div
                                        className={`flex items-center gap-1 dark:bg-slate-700 dark:text-white cursor-pointer px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 bg-opacity-70 text-white' : 'bg-white bg-opacity-70 text-gray-900'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedImage(img);
                                        }}
                                    >
                                        <MessageCircle size={20} />
                                    </div>
                                    <div
                                        className={`flex items-center gap-1 dark:bg-slate-700 dark:text-white cursor-pointer px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 bg-opacity-70 text-white' : 'bg-white bg-opacity-70 text-gray-900'}`}
                                        onClick={(e) => handleDownload(img.url, e)}
                                    >
                                        <Download size={20} />
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <motion.div
                    className="text-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <XCircle className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className={`mt-2 text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>No images found.</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Try a different search or sorting option.
                    </p>
                </motion.div>
            )}

            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.div
                            className={`relative max-w-4xl w-full max-h-[90vh] dark:bg-slate-700 rounded-xl shadow-2xl p-6 overflow-y-auto transition-colors duration-500 ${modalBgClass}`}
                            variants={modalContentVariants}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className={`absolute z-40 dark:bg-slate-500  top-4 right-4 p-2 rounded-full transition-colors duration-200 ${
                                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                                onClick={() => setSelectedImage(null)}
                            >
                                <XCircle size={24} className={`dark:text-white ${darkMode ? 'text-white' : 'text-gray-700'}`} />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex justify-center items-center relative">
                                    <img
                                        src={selectedImage.url}
                                        alt={selectedImage.description}
                                        className="max-h-[80vh] object-contain rounded-lg shadow-lg"
                                    />
                                    {isAdmin && (
                                        <button
                                            className="absolute bottom-4 right-4 p-2 rounded-full bg-white text-red-400 hover:bg-gray-300 transition-colors"
                                            onClick={() => handleDeleteImageWithConfirmation(selectedImage.id)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-col">
                                    <div className="flex items-center gap-3 mb-4">
                                        <img
                                            src={selectedImage.uploaderPhotoUrl || 'https://via.placeholder.com/40'}
                                            alt={selectedImage.uploaderName}
                                            className="w-10 h-10 dark rounded-full object-cover border-2 border-blue-500"
                                        />
                                        <div>
                                            <p className={`text-sm font-semibold dark:text-white ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                Uploaded by:
                                            </p>
                                            <p className={`text-md font-bold dark:text-yellow-200 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {selectedImage.uploaderName}
                                            </p>
                                        </div>
                                    </div>

                                    <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {selectedImage.description}
                                    </h3>
                                    <div className="flex items-center gap-4 mb-6 text-sm">
                                        <button
                                            onClick={() => handleDownload(selectedImage.url)}
                                            className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                        >
                                            <Download size={16} /> Download
                                        </button>
                                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleLike(selectedImage.id)}>
                                            <Heart
                                                size={20}
                                                // FIX: Corrected classname for heart icon
                                                className={
                                                    selectedImage.likes?.includes(userId)
                                                        ? 'text-red-500 fill-red-500'
                                                        : darkMode ? 'text-gray-400' : 'text-gray-500' // Better default color
                                                }
                                            />
                                            {/* FIX: Corrected classname for span */}
                                            <span className={`dark:text-white ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {selectedImage.likes?.length || 0} Likes
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-64">
                                        <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            Comments ({comments.length})
                                        </h4>
                                        <div className="space-y-4">
                                            {comments.length > 0 ? (
                                                comments.map((comment) => (
                                                    <div key={comment.id} className={`p-3 dark:bg-slate-800 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-semibold dark:text-white ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                    {comment.userName}
                                                                </span>
                                                                <span className={`text-xs dark:text-gray-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                    {comment.createdAt?.toDate().toLocaleString()}
                                                                </span>
                                                            </div>
                                                            {comment.userId === userId && (
                                                                <button
                                                                    onClick={() => handleDeleteComment(comment.id)}
                                                                    className="p-1 rounded-full bg-white dark:bg-gray-500 dark:text-gray-300 hover:bg-gray-300 text-gray-400 hover:text-red-500 transition-colors"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className={`dark:text-white ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{comment.text}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No comments yet.</p>
                                            )}
                                            <div ref={commentsEndRef} />
                                        </div>
                                    </div>

                                    <form onSubmit={handleComment} className="mt-4 flex gap-2">
                                        <input
                                            type="text"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="Add a comment..."
                                            className={`flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 ${inputClass}`}
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={!commentText.trim()}
                                            className={`p-2 rounded-full ${buttonClass} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            <Send size={20} />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showConfirmModal && (
                    <motion.div
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={() => setShowConfirmModal(false)}
                    >
                        <motion.div
                            className={`p-6 rounded-xl dark:bg-slate-700 shadow-lg w-full max-w-sm ${modalBgClass}`}
                            variants={modalContentVariants}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className={`text-xl dark:text-white font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Confirm Deletion
                            </h3>
                            <p className={`mb-6 dark:text-gray-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Are you sure you want to delete this image? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                        darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteImage}
                                    className="px-4 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}

export default TeamGallery;