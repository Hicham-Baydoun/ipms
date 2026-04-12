import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const requiredKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId'
];

const firebaseConfigLooksValid = requiredKeys.every((key) => {
  const value = firebaseConfig[key];
  if (typeof value !== 'string') return false;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.includes('your_') || normalized.includes('changeme')) return false;
  if (normalized === 'xxx' || normalized.startsWith('xxx.') || normalized.endsWith('.xxx')) return false;
  if (/^x+$/.test(normalized)) return false;
  return true;
});

let app = null;
let secondaryApp = null;
let db = null;
let auth = null;
let secondaryAuth = null;

if (firebaseConfigLooksValid) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  secondaryApp = getApps().some((existingApp) => existingApp.name === 'secondary')
    ? getApp('secondary')
    : initializeApp(firebaseConfig, 'secondary');

  db = getFirestore(app);
  auth = getAuth(app);
  secondaryAuth = getAuth(secondaryApp);
} else {
  console.warn('Firebase config is missing or invalid. Update .env with valid VITE_FIREBASE_* values.');
}

export { app, db, auth, secondaryApp, secondaryAuth };

export const isFirebaseConfigured = () => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey !== 'xxx' && firebaseConfigLooksValid);
};
