import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDdNNT0LuJYN5aCn3f-5S0it86vGfW4gg0",
  authDomain: "seproject-7f60a.firebaseapp.com",
  projectId: "seproject-7f60a",
  storageBucket: "seproject-7f60a.firebasestorage.app",
  messagingSenderId: "660024164552",
  appId: "1:660024164552:web:7ed6bfe541ae4a70ae65fd"
};

const isFirstInit = !getApps().length;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

const secondaryApp = getApps().some((existingApp) => existingApp.name === 'secondary')
  ? getApp('secondary')
  : initializeApp(firebaseConfig, 'secondary');

const db = isFirstInit
  ? initializeFirestore(app, { experimentalForceLongPolling: true })
  : getFirestore(app);

const auth = getAuth(app);
const secondaryAuth = getAuth(secondaryApp);

export { app, db, auth, secondaryApp, secondaryAuth };

export const isFirebaseConfigured = () => true;
