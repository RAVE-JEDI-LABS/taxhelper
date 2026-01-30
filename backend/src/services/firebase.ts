import admin from 'firebase-admin';

let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;
let storage: admin.storage.Storage;

export function initializeFirebase() {
  // Initialize with application default credentials or service account
  if (!admin.apps.length) {
    // In production, use service account from environment
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    } else {
      // For local development with emulator or demo mode
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
      });
    }
  }

  db = admin.firestore();
  auth = admin.auth();
  storage = admin.storage();

  // Use Firestore emulator in development if configured
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('Using Firestore emulator');
  }

  console.log('Firebase Admin initialized');
}

export function getDb() {
  if (!db) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return db;
}

export function getAuth(): admin.auth.Auth {
  if (!auth) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return auth;
}

export function getStorage(): admin.storage.Storage {
  if (!storage) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return storage;
}

export { admin };
