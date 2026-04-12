import { collection, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { mapGuardianFromFirestore } from './firebaseMappers';

export const subscribeToGuardians = (dispatch) => {
  if (!isFirebaseConfigured() || !db) return () => {};

  return onSnapshot(collection(db, 'guardians'), (snapshot) => {
    const guardians = snapshot.docs.map((guardianDoc) => mapGuardianFromFirestore(guardianDoc));
    dispatch({ type: 'SET_GUARDIANS', payload: guardians });
  });
};

export const subscribeToGuardian = (guardianUid, dispatch) => {
  if (!isFirebaseConfigured() || !db || !guardianUid) return () => {};

  return onSnapshot(doc(db, 'guardians', guardianUid), (snapshot) => {
    if (snapshot.exists()) {
      dispatch({ type: 'SET_CURRENT_GUARDIAN', payload: mapGuardianFromFirestore(snapshot) });
    }
  });
};

export const updatePickupList = async (guardianUid, authorizedPickup) => {
  if (!isFirebaseConfigured() || !db || !guardianUid) return;

  await updateDoc(doc(db, 'guardians', guardianUid), { authorizedPickup });
};

export const upsertGuardian = async (guardianUid, data) => {
  if (!isFirebaseConfigured() || !db || !guardianUid) return;

  const guardianRef = doc(db, 'guardians', guardianUid);
  const existingDoc = await getDoc(guardianRef);
  const nextData = {
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    childrenIds: Array.isArray(data.childrenIds) ? data.childrenIds : [],
    authorizedPickup: Array.isArray(data.authorizedPickup) ? data.authorizedPickup : []
  };

  if (existingDoc.exists()) {
    await updateDoc(guardianRef, nextData);
  } else {
    await setDoc(guardianRef, nextData);
  }
};
