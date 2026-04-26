import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { mapAttendanceFromFirestore } from './firebaseMappers';

export const subscribeToAttendance = (dispatch) => {
  if (!isFirebaseConfigured() || !db) return () => {};

  return onSnapshot(collection(db, 'attendanceLogs'), (snapshot) => {
    const logs = snapshot.docs.map((logDoc) => mapAttendanceFromFirestore(logDoc));
    dispatch({ type: 'SET_ATTENDANCE_LOGS', payload: logs });
  });
};

export const subscribeToAttendanceLogs = subscribeToAttendance;

export const createCheckInLog = async (userId, zoneId, staffId) => {
  if (!isFirebaseConfigured() || !db) return null;

  return addDoc(collection(db, 'attendanceLogs'), {
    userId,
    zoneId,
    checkInTime: serverTimestamp(),
    checkOutTime: null,
    eventType: 'Normal',
    staffId
  });
};

export const closeCheckOutLog = async (userId) => {
  if (!isFirebaseConfigured() || !db) return;

  const q = query(
    collection(db, 'attendanceLogs'),
    where('userId', '==', userId),
    where('checkOutTime', '==', null)
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const logDoc = snapshot.docs[0];
    await updateDoc(doc(db, 'attendanceLogs', logDoc.id), { checkOutTime: serverTimestamp() });
  }
};

export const addAttendanceLog = async (logData) => {
  if (!isFirebaseConfigured() || !db) return null;

  return addDoc(collection(db, 'attendanceLogs'), {
    userId: logData.userId,
    zoneId: logData.zoneId,
    checkInTime: logData.checkInTime ? new Date(logData.checkInTime) : serverTimestamp(),
    checkOutTime: logData.checkOutTime || null,
    eventType: logData.eventType || 'Normal',
    staffId: logData.staffId || logData.checkedInBy || ''
  });
};

export const updateAttendanceLog = async (logId, updates) => {
  if (!isFirebaseConfigured() || !db) return;

  await updateDoc(doc(db, 'attendanceLogs', logId), updates);
};
