import { doc, increment, writeBatch } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { logAudit } from './auditService';

export const performReassign = async (userId, oldZoneId, newZoneId, staffUid) => {
  if (!isFirebaseConfigured() || !db) return;

  const batch = writeBatch(db);
  batch.update(doc(db, 'users', userId), { assignedZoneId: newZoneId });
  batch.update(doc(db, 'zones', oldZoneId), { currentOccupancy: increment(-1) });
  batch.update(doc(db, 'zones', newZoneId), { currentOccupancy: increment(1) });
  await batch.commit();

  await logAudit('ZONE_REASSIGN', staffUid, userId, 'user', `Moved from zone ${oldZoneId} to ${newZoneId}`);
};
