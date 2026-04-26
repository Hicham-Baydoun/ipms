import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured, secondaryAuth } from '../firebase/config';
import { cleanUndefined, toTimestampOrNull } from './firebaseMappers';
import { logAudit } from './auditService';
import { generateUsername } from '../utils/usernameGenerator';

const normalizeStaffForCreate = (staffData = {}, uid, username) => {
  return cleanUndefined({
    name: staffData.name ?? '',
    gender: staffData.gender ?? '',
    dateOfBirth: staffData.dateOfBirth !== undefined ? toTimestampOrNull(staffData.dateOfBirth) : null,
    phoneNumber: staffData.phoneNumber ?? staffData.phone ?? '',
    address: staffData.address ?? '',
    role: staffData.role ?? 'Staff',
    email: staffData.email ?? '',
    uid,
    username,
    isActive: staffData.isActive !== false
  });
};

export const createStaffAccount = async (staffData, performedBy) => {
  if (!isFirebaseConfigured() || !db || !secondaryAuth) {
    throw new Error('Firebase is not configured. Add valid Firebase env values first.');
  }

  if (!staffData?.email || !staffData?.password) {
    throw new Error('Staff email and password are required.');
  }

  const existingStaffSnapshot = await getDocs(collection(db, 'staff'));
  const existingUsernames = existingStaffSnapshot.docs.map((d) => d.data().username).filter(Boolean);
  const username = generateUsername(staffData.name, existingUsernames);

  const credential = await createUserWithEmailAndPassword(secondaryAuth, staffData.email, staffData.password);
  const uid = credential.user.uid;

  try {
    await setDoc(doc(db, 'staff', uid), normalizeStaffForCreate(staffData, uid, username));
    await logAudit('STAFF_ADDED', performedBy, uid, 'staff', `Added ${staffData.name} as ${staffData.role}`);
    return uid;
  } finally {
    await signOut(secondaryAuth);
  }
};
