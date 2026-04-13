import { addDoc, collection, getDocs, onSnapshot, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { mapAuditFromFirestore } from './firebaseMappers';

export const subscribeToAuditLogs = (dispatch) => {
  if (!isFirebaseConfigured() || !db) return () => {};

  const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map((doc) => mapAuditFromFirestore(doc));
    dispatch({ type: 'SET_AUDIT_LOGS', payload: logs });
  });
};

const batchDelete = async (collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName));
  for (let i = 0; i < snapshot.docs.length; i += 500) {
    const batch = writeBatch(db);
    snapshot.docs.slice(i, i + 500).forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
};

export const clearAuditLogs = async () => {
  if (!isFirebaseConfigured() || !db) return;
  await batchDelete('auditLogs');
};

export const clearAttendanceLogs = async () => {
  if (!isFirebaseConfigured() || !db) return;
  await batchDelete('attendanceLogs');
};

export const logAudit = async (action, performedBy, targetId, targetType, details) => {
  if (!isFirebaseConfigured() || !db) return null;

  return addDoc(collection(db, 'auditLogs'), {
    action,
    performedBy,
    targetId,
    targetType,
    details,
    timestamp: serverTimestamp()
  });
};
