
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "apiKey": "AIzaSyCg12itK1XBGtAwVd2ZxM35LcxGJpy_p4c",
  "authDomain": "sarkar-co.firebaseapp.com",
  "projectId": "sarkar-co",
  "storageBucket": "sarkar-co.appspot.com",
  "messagingSenderId": "476613728632",
  "appId": "1:476613728632:web:e8acb2aea46b409db6108d"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
