import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';

export const createNotification = (guardianId, type, title, message) => ({
  id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  guardianId,
  type,
  title,
  message,
  isRead: false,
  timestamp: new Date().toISOString()
});

const saveNotification = async (notification) => {
  if (!isFirebaseConfigured() || !db) return;
  await addDoc(collection(db, 'notifications'), {
    guardianId: notification.guardianId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: false,
    timestamp: serverTimestamp()
  });
};

export const subscribeToNotifications = (guardianId, dispatch) => {
  if (!isFirebaseConfigured() || !db || !guardianId) return () => {};

  const q = query(
    collection(db, 'notifications'),
    where('guardianId', '==', guardianId),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((notifDoc) => ({
      id: notifDoc.id,
      ...notifDoc.data(),
      timestamp: notifDoc.data().timestamp?.toDate?.()?.toISOString?.() || new Date().toISOString()
    }));
    dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
  });
};

export const sendZoneDeactivationNotifications = async (zone, guardians, users, dispatch) => {
  const childrenInZone = users.filter((u) => u.isCheckedIn && u.assignedZoneId === zone.id);
  const childIds = new Set(childrenInZone.map((c) => c.id));
  const affectedGuardians = guardians.filter((g) =>
    g.childrenIds?.some((id) => childIds.has(id))
  );

  for (const guardian of affectedGuardians) {
    const notification = createNotification(
      guardian.id,
      'warning',
      `Zone "${zone.zoneName}" Deactivated`,
      `Zone "${zone.zoneName}" has been deactivated. Please come pick up your child or schedule them into a new zone.`
    );
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    await saveNotification(notification);
  }
};

export const sendEmergencyNotificationsToGuardians = async (guardians, dispatch) => {
  for (const guardian of guardians) {
    const notification = createNotification(
      guardian.id,
      'emergency',
      'EMERGENCY ALERT',
      'There is an emergency at the facility. Please come pick up your child immediately!'
    );
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    await saveNotification(notification);
  }
};
