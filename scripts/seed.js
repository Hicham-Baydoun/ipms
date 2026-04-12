// Run this once from a temporary admin screen or a node environment configured for ESM + Vite envs.
// After seeding, disable or remove this file.

import { addDoc, collection, doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../src/firebase/config.js';

const seedZones = [
  { zoneName: 'Tiny Explorers', ageGroup: '3-5', activityType: 'Free Play', capacity: 20, currentOccupancy: 0, isActive: true, safetyRules: 'Shoes off, guardian must remain in area' },
  { zoneName: 'Adventure Arena', ageGroup: '6-12', activityType: 'Obstacle Course', capacity: 30, currentOccupancy: 0, isActive: true, safetyRules: 'Helmet required' },
  { zoneName: 'Creative Corner', ageGroup: '3-5', activityType: 'Arts & Crafts', capacity: 15, currentOccupancy: 0, isActive: true, safetyRules: 'Non-toxic materials only' },
  { zoneName: 'Laser Tag Arena', ageGroup: '13-17', activityType: 'Laser Tag', capacity: 20, currentOccupancy: 0, isActive: true, safetyRules: 'Safety vest required, no running' },
  { zoneName: 'Escape Room', ageGroup: '13-17', activityType: 'Escape Room', capacity: 8, currentOccupancy: 0, isActive: true, safetyRules: 'Max 60 min session, emergency exit accessible' },
  { zoneName: 'Adult Lounge', ageGroup: '18+', activityType: 'Relaxation', capacity: 25, currentOccupancy: 0, isActive: true, safetyRules: 'No children allowed' },
  { zoneName: 'Paintball Zone', ageGroup: '18+', activityType: 'Paintball', capacity: 16, currentOccupancy: 0, isActive: true, safetyRules: 'Full protective gear mandatory' }
];

const seedStaff = [
  { name: 'Ahmad Fawzi', gender: 'Male', dateOfBirth: Timestamp.fromDate(new Date('1995-03-15')), phoneNumber: '+961-71-123456', address: 'Beirut, Lebanon', role: 'Admin', email: 'admin@ipms.com', uid: 'REPLACE_WITH_AUTH_UID', isActive: true },
  { name: 'Sara Abdo', gender: 'Female', dateOfBirth: Timestamp.fromDate(new Date('1998-07-22')), phoneNumber: '+961-70-654321', address: 'Baabda, Lebanon', role: 'Supervisor', email: 'supervisor@ipms.com', uid: 'REPLACE_WITH_AUTH_UID', isActive: true },
  { name: 'Christian Nehman', gender: 'Male', dateOfBirth: Timestamp.fromDate(new Date('2000-01-10')), phoneNumber: '+961-76-111222', address: 'Jounieh, Lebanon', role: 'Staff', email: 'staff@ipms.com', uid: 'REPLACE_WITH_AUTH_UID', isActive: true }
];

const seed = async () => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured. Populate .env first.');
  }

  await setDoc(doc(db, 'systemConfig', 'global'), {
    emergencyMode: false,
    emergencyActivatedAt: null,
    emergencyActivatedBy: null,
    playgroundName: 'IPMS Indoor Playground',
    updatedAt: serverTimestamp()
  }, { merge: true });

  for (const zone of seedZones) {
    await addDoc(collection(db, 'zones'), {
      ...zone,
      createdAt: serverTimestamp()
    });
  }

  for (const staffMember of seedStaff) {
    await addDoc(collection(db, 'staff'), staffMember);
  }

  console.log('Seeding complete');
};

seed().catch((error) => {
  console.error('Seeding failed:', error);
});
