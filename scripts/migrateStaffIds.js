/**
 * One-time migration: copy staff documents so their Firestore document ID
 * matches the Firebase Auth UID stored in the `uid` field.
 *
 * Run ONCE with:  node scripts/migrateStaffIds.js
 *
 * Requirements:
 *  - Node.js 18+
 *  - A Firebase service account key saved as scripts/serviceAccountKey.json
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

const migrate = async () => {
  console.log('Reading staff collection...');
  const snapshot = await db.collection('staff').get();

  if (snapshot.empty) {
    console.log('No staff documents found.');
    return;
  }

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const currentId = docSnap.id;
    const authUid = data.uid;

    if (!authUid) {
      console.warn(`  SKIP  ${currentId} — no uid field found`);
      continue;
    }

    if (currentId === authUid) {
      console.log(`  OK    ${currentId} — already correct`);
      continue;
    }

    console.log(`  FIX   ${currentId}  →  ${authUid}`);

    // Write new document with correct ID
    await db.collection('staff').doc(authUid).set(data);

    // Delete the old document
    await db.collection('staff').doc(currentId).delete();

    console.log(`        Done.`);
  }

  console.log('\nMigration complete.');
};

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
