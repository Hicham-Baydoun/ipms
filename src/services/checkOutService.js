import {
  collection,
  doc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { logAudit } from './auditService';

export const performCheckOut = async (userId, currentZoneId, staffUid, pickupPerson = null) => {
  if (!isFirebaseConfigured() || !db) return;

  const batch = writeBatch(db);

  batch.update(doc(db, 'users', userId), {
    isCheckedIn: false,
    checkOutTime: serverTimestamp(),
    assignedZoneId: null,
    braceletId: null
  });

  batch.update(doc(db, 'zones', currentZoneId), {
    currentOccupancy: increment(-1)
  });

  await batch.commit();

  const openLogQuery = query(
    collection(db, 'attendanceLogs'),
    where('userId', '==', userId),
    where('checkOutTime', '==', null)
  );

  const openLogSnapshot = await getDocs(openLogQuery);
  if (!openLogSnapshot.empty) {
    const openLog = openLogSnapshot.docs[0];
    const openLogData = openLog.data();
    let duration = null;
    if (openLogData.checkInTime) {
      const checkIn = typeof openLogData.checkInTime.toDate === 'function'
        ? openLogData.checkInTime.toDate()
        : new Date(openLogData.checkInTime);
      duration = Math.round((Date.now() - checkIn.getTime()) / 60000);
    }
    await updateDoc(doc(db, 'attendanceLogs', openLog.id), {
      checkOutTime: serverTimestamp(),
      ...(duration !== null && { duration })
    });
  }

  const details = pickupPerson
    ? `Checked out. Pickup by: ${pickupPerson.name} (${pickupPerson.relation})`
    : 'Checked out';

  await logAudit('CHECK_OUT', staffUid, userId, 'user', details);
};
