
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Hardcoded configuration for 'sarkar-comm' project to ensure correct connection.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // You will need to replace this with your actual API key from the Firebase console
  authDomain: "sarkar-comm.firebaseapp.com",
  projectId: "sarkar-comm",
  storageBucket: "sarkar-comm.appspot.com",
  messagingSenderId: "476613728632",
  appId: "1:476613728632:web:bf0231908272559a43a8b7"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
