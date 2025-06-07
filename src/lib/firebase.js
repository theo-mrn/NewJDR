// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAPhy-gZ0c3m_dGFWGnGoPid7Ydv04kyFA",
  authDomain: "newjdr2.firebaseapp.com",
  databaseURL: "https://newjdr2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "newjdr2",
  storageBucket: "newjdr2.firebasestorage.app",
  messagingSenderId: "512882463375",
  appId: "1:512882463375:web:ff5e70795d23f5a2aa56fa",
  measurementId: "G-7G38TJDJVF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;