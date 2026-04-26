import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';

/**
 * Queues an email for delivery by writing it to the 'emailQueue' Firestore
 * collection. A Firebase Cloud Function (or equivalent backend service)
 * subscribed to that collection is responsible for actually sending the email
 * via a provider such as SendGrid or Nodemailer.
 */
const queueEmail = async (to, subject, body) => {
  if (!isFirebaseConfigured() || !db) return;
  await addDoc(collection(db, 'emailQueue'), {
    to,
    subject,
    body,
    status: 'pending',
    createdAt: serverTimestamp()
  });
};

export const sendEmergencyEmailsToGuardians = async (guardians) => {
  for (const guardian of guardians) {
    if (!guardian.email) continue;
    await queueEmail(
      guardian.email,
      'URGENT: Emergency at IPMS Indoor Playground',
      `Dear ${guardian.name},\n\nThere is an emergency at the IPMS Indoor Playground facility. Please come pick up your child IMMEDIATELY.\n\nThis is an urgent situation requiring your immediate attention. If you have any questions, please call the facility directly.\n\nIPMS Team`
    );
  }
};
