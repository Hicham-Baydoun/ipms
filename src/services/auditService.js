import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
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
