import { addDoc, collection, onSnapshot, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { mapBraceletFromFirestore } from './firebaseMappers';

export const subscribeToBracelets = (dispatch) => {
  if (!isFirebaseConfigured() || !db) return () => {};

  return onSnapshot(collection(db, 'bracelets'), (snapshot) => {
    const bracelets = snapshot.docs.map((braceletDoc) => mapBraceletFromFirestore(braceletDoc));
    dispatch({ type: 'SET_BRACELETS', payload: bracelets });
  });
};

export const assignBracelet = async (userId) => {
  if (!isFirebaseConfigured() || !db) return null;

  return addDoc(collection(db, 'bracelets'), {
    userId,
    issueDate: serverTimestamp(),
    expiryDate: null,
    isActive: true
  });
};

export const releaseBracelet = async (braceletId) => {
  if (!isFirebaseConfigured() || !db) return;

  await updateDoc(doc(db, 'bracelets', braceletId), {
    userId: null,
    expiryDate: serverTimestamp(),
    isActive: false
  });
};
