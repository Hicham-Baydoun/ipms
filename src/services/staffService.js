import { collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { cleanUndefined, mapStaffFromFirestore, toTimestampOrNull } from './firebaseMappers';
import { logAudit } from './auditService';
import { createStaffAccount } from './staffAuthService';

export const subscribeToStaff = (dispatch) => {
  if (!isFirebaseConfigured() || !db) return () => {};

  return onSnapshot(collection(db, 'staff'), (snapshot) => {
    const staff = snapshot.docs.map((staffDoc) => mapStaffFromFirestore(staffDoc));
    dispatch({ type: 'SET_STAFF', payload: staff });
  });
};

const normalizeStaffForWrite = (staffData = {}, { forCreate = false } = {}) => {
  return cleanUndefined({
    name: staffData.name ?? (forCreate ? '' : undefined),
    gender: staffData.gender ?? (forCreate ? '' : undefined),
    dateOfBirth: staffData.dateOfBirth !== undefined ? toTimestampOrNull(staffData.dateOfBirth) : undefined,
    phoneNumber: staffData.phoneNumber ?? staffData.phone ?? (forCreate ? '' : undefined),
    address: staffData.address ?? (forCreate ? '' : undefined),
    role: staffData.role ?? (forCreate ? 'Staff' : undefined),
    email: staffData.email ?? (forCreate ? '' : undefined),
    uid: staffData.uid ?? (forCreate ? '' : undefined),
    isActive: staffData.isActive !== undefined ? Boolean(staffData.isActive) : forCreate ? true : undefined
  });
};

export const addStaff = async (staffData, performedBy) => {
  return createStaffAccount(staffData, performedBy);
};

export const updateStaff = async (staffId, updates, performedBy) => {
  if (!isFirebaseConfigured() || !db) return;

  await updateDoc(doc(db, 'staff', staffId), normalizeStaffForWrite(updates));
  await logAudit('STAFF_UPDATED', performedBy, staffId, 'staff', `Updated staff: ${staffId}`);
};

export const removeStaff = async (staffId, performedBy) => {
  if (!isFirebaseConfigured() || !db) return;

  await deleteDoc(doc(db, 'staff', staffId));
  await logAudit('STAFF_REMOVED', performedBy, staffId, 'staff', `Removed staff: ${staffId}`);
};
