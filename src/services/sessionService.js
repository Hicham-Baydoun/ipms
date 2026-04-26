import { addDoc, collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { cleanUndefined, mapSessionFromFirestore, toTimestampOrNull } from './firebaseMappers';
import { logAudit } from './auditService';

export const subscribeToSessions = (dispatch) => {
  if (!isFirebaseConfigured() || !db) return () => {};

  return onSnapshot(collection(db, 'sessions'), (snapshot) => {
    const sessions = snapshot.docs.map((sessionDoc) => mapSessionFromFirestore(sessionDoc));
    dispatch({ type: 'SET_SESSIONS', payload: sessions });
  });
};

const normalizeSessionForWrite = (sessionData = {}, { forCreate = false } = {}) => {
  const staffId = sessionData.staffId || (Array.isArray(sessionData.assignedStaff) ? sessionData.assignedStaff[0] : null);
  return cleanUndefined({
    zoneId: sessionData.zoneId ?? (forCreate ? '' : undefined),
    startTime: sessionData.startTime !== undefined ? toTimestampOrNull(sessionData.startTime) : undefined,
    endTime: sessionData.endTime !== undefined ? toTimestampOrNull(sessionData.endTime) : undefined,
    staffId: staffId ?? (forCreate ? '' : undefined),
    status: sessionData.status ?? (forCreate ? 'scheduled' : undefined),
    sessionType: sessionData.sessionType ?? (forCreate ? 'General' : undefined),
    maxParticipants:
      sessionData.maxParticipants !== undefined ? Number(sessionData.maxParticipants || 0) : forCreate ? 0 : undefined,
    currentParticipants:
      sessionData.currentParticipants !== undefined ? Number(sessionData.currentParticipants || 0) : forCreate ? 0 : undefined
  });
};

export const addSession = async (sessionData, performedBy) => {
  if (!isFirebaseConfigured() || !db) return null;

  const docRef = await addDoc(collection(db, 'sessions'), normalizeSessionForWrite(sessionData, { forCreate: true }));
  await logAudit('SESSION_CREATED', performedBy, docRef.id, 'session', `Session in zone ${sessionData.zoneId}`);
  return docRef.id;
};

export const updateSession = async (sessionId, updates) => {
  if (!isFirebaseConfigured() || !db) return;

  await updateDoc(doc(db, 'sessions', sessionId), normalizeSessionForWrite(updates));
};
