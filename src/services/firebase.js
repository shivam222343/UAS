// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCOGj1NCvjHmTjoO8Sec4dLX1K-uJVXf0o",
    authDomain: "attendancesystem-f4978.firebaseapp.com",
    projectId: "attendancesystem-f4978",
    storageBucket: "attendancesystem-f4978.firebasestorage.app",
    messagingSenderId: "664046566677",
    appId: "1:664046566677:web:ac04b9c1972bab86cb3d1c",
    measurementId: "G-VKX79R7Q97"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);



export { app, auth, db, storage }; 