import { addDoc, collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { cleanUndefined, mapUserFromFirestore, toTimestampOrNull } from './firebaseMappers';

export const subscribeToUsers = (dispatch) => {
  if (!isFirebaseConfigured() || !db) return () => {};

  return onSnapshot(collection(db, 'users'), (snapshot) => {
    const users = snapshot.docs.map((userDoc) => mapUserFromFirestore(userDoc));
    dispatch({ type: 'SET_USERS', payload: users });
  });
};

const normalizeUserForWrite = (userData = {}, { forCreate = false } = {}) => {
  return cleanUndefined({
    fullName: userData.fullName ?? userData.name ?? (forCreate ? '' : undefined),
    dateOfBirth: userData.dateOfBirth !== undefined ? toTimestampOrNull(userData.dateOfBirth) : undefined,
    gender: userData.gender ?? (forCreate ? '' : undefined),
    guardianName: userData.guardianName ?? (forCreate ? '' : undefined),
    guardianContact: userData.guardianContact ?? (forCreate ? '' : undefined),
    guardianUid: userData.guardianUid ?? userData.guardianId ?? (forCreate ? null : undefined),
    medicalInfo: userData.medicalInfo ?? (forCreate ? '' : undefined),
    allergies: userData.allergies ?? (forCreate ? '' : undefined),
    assignedZoneId: userData.assignedZoneId !== undefined ? userData.assignedZoneId : forCreate ? null : undefined,
    checkInTime: userData.checkInTime !== undefined ? toTimestampOrNull(userData.checkInTime) : undefined,
    checkOutTime: userData.checkOutTime !== undefined ? toTimestampOrNull(userData.checkOutTime) : undefined,
    isCheckedIn: userData.isCheckedIn !== undefined ? Boolean(userData.isCheckedIn) : forCreate ? false : undefined,
    braceletId: userData.braceletId !== undefined ? userData.braceletId : forCreate ? null : undefined
  });
};

export const addUser = async (userData) => {
  if (!isFirebaseConfigured() || !db) return null;

  const docRef = await addDoc(collection(db, 'users'), {
    ...normalizeUserForWrite(userData, { forCreate: true })
  });

  return docRef.id;
};

export const updateUser = async (userId, updates) => {
  if (!isFirebaseConfigured() || !db) return;

  const normalizedUpdates = normalizeUserForWrite(updates);
  await updateDoc(doc(db, 'users', userId), normalizedUpdates);
};
