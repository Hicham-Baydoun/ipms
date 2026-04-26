import { Timestamp, collection, doc, increment, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { logAudit } from './auditService';

export const performCheckIn = async (userId, zoneId, braceletId, staffUid) => {
  if (!isFirebaseConfigured() || !db) return;

  const batch = writeBatch(db);

  batch.update(doc(db, 'users', userId), {
    isCheckedIn: true,
    assignedZoneId: zoneId,
    checkInTime: serverTimestamp(),
    checkOutTime: null,
    braceletId
  });

  batch.update(doc(db, 'zones', zoneId), {
    currentOccupancy: increment(1)
  });

  const logRef = doc(collection(db, 'attendanceLogs'));
  batch.set(logRef, {
    userId,
    zoneId,
    checkInTime: serverTimestamp(),
    checkOutTime: null,
    eventType: 'Normal',
    staffId: staffUid
  });

  const expiryDate = Timestamp.fromDate(new Date(Date.now() + 4 * 60 * 60 * 1000));
  const braceletRef = doc(collection(db, 'bracelets'));
  batch.set(braceletRef, {
    userId,
    issueDate: serverTimestamp(),
    expiryDate,
    isActive: true
  });

  await batch.commit();
  await logAudit('CHECK_IN', staffUid, userId, 'user', `Checked in to zone ${zoneId}, bracelet ${braceletId}`);
};
