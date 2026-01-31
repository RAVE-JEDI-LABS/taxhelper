import admin from 'firebase-admin';

// Initialize Firebase
if (!admin.apps.length) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } else {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'taxhelper-ravejedilabs',
    });
  }
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

async function checkCollections() {
  const collections = [
    'call_logs',
    'sms_logs',
    'chat_logs',
    'contact_submissions',
    'customers',
  ];

  console.log('=== Firestore Data Check ===\n');

  for (const name of collections) {
    try {
      const snapshot = await db.collection(name).orderBy('createdAt', 'desc').limit(5).get();
      console.log(`${name}: ${snapshot.size} recent records`);

      if (snapshot.size > 0) {
        snapshot.docs.forEach((doc, i) => {
          const data = doc.data();
          const preview = JSON.stringify(data).substring(0, 150);
          console.log(`  ${i + 1}. ${preview}...`);
        });
      }
      console.log('');
    } catch (err: any) {
      console.log(`${name}: Error - ${err.message}\n`);
    }
  }
}

checkCollections();
