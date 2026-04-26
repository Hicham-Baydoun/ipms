import { addDoc, collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { mapZoneFromFirestore } from './firebaseMappers';
import { logAudit } from './auditService';

export const subscribeToZones = (dispatch) => {
  if (!isFirebaseConfigured() || !db) return () => {};

  return onSnapshot(collection(db, 'zones'), (snapshot) => {
    const zones = snapshot.docs.map((zoneDoc) => mapZoneFromFirestore(zoneDoc));
    dispatch({ type: 'SET_ZONES', payload: zones });
  });
};

export const addZone = async (zoneData, performedBy) => {
  if (!isFirebaseConfigured() || !db) return null;

  const docRef = await addDoc(collection(db, 'zones'), {
    zoneName: zoneData.zoneName || '',
    ageGroup: zoneData.ageGroup || '',
    activityType: zoneData.activityType || '',
    capacity: Number(zoneData.capacity || 0),
    currentOccupancy: 0,
    isActive: zoneData.isActive !== false,
    safetyRules: zoneData.safetyRules || '',
    createdAt: serverTimestamp()
  });

  await logAudit('ZONE_CREATED', performedBy, docRef.id, 'zone', `Created zone: ${zoneData.zoneName}`);
  return docRef.id;
};

export const updateZone = async (zoneId, updates, performedBy) => {
  if (!isFirebaseConfigured() || !db) return;

  const { id, createdAt, ...rest } = updates || {};
  await updateDoc(doc(db, 'zones', zoneId), rest);
  await logAudit('ZONE_UPDATED', performedBy, zoneId, 'zone', `Updated zone ${zoneId}`);
};

export const deactivateZone = async (zoneId, performedBy) => {
  if (!isFirebaseConfigured() || !db) return;

  await updateDoc(doc(db, 'zones', zoneId), { isActive: false });
  await logAudit('ZONE_UPDATED', performedBy, zoneId, 'zone', `Deactivated zone: ${zoneId}`);
};

export const reactivateZone = async (zoneId, performedBy) => {
  if (!isFirebaseConfigured() || !db) return;

  await updateDoc(doc(db, 'zones', zoneId), { isActive: true });
  await logAudit('ZONE_UPDATED', performedBy, zoneId, 'zone', `Reactivated zone: ${zoneId}`);
};
