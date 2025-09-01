
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Hardcoded configuration for 'sarkar-comm' project to ensure correct connection.
const firebaseConfig = {
  apiKey: "AIzaSyB1DcmZSlM0J6UksXg8KPvj0idapl25qgk",
  authDomain: "sarkar-comm.firebaseapp.com",
  projectId: "sarkar-comm",
  storageBucket: "sarkar-comm.appspot.com",
  messagingSenderId: "21057194965",
  appId: "1:21057194965:web:a09b91a589391fa8884b5c",
  measurementId: "G-5BLS7YRS23"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
