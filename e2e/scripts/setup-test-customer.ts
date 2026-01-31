/**
 * Setup Test Customer Account
 *
 * Creates a test customer account in Firebase Auth for E2E testing.
 * Run with: npx tsx scripts/setup-test-customer.ts
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load service account
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  || resolve(__dirname, '../../service-account.json');

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const TEST_CUSTOMER = {
  email: 'customer@example.com',
  password: 'gordonulencpa',
  displayName: 'Test Customer',
};

async function setupTestCustomer() {
  const auth = admin.auth();
  const firestore = admin.firestore();

  try {
    // Check if user already exists
    let user;
    try {
      user = await auth.getUserByEmail(TEST_CUSTOMER.email);
      console.log('Test customer already exists:', user.uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Create user
        user = await auth.createUser({
          email: TEST_CUSTOMER.email,
          password: TEST_CUSTOMER.password,
          displayName: TEST_CUSTOMER.displayName,
        });
        console.log('Created test customer:', user.uid);
      } else {
        throw error;
      }
    }

    // Set custom claims for role
    await auth.setCustomUserClaims(user.uid, { role: 'customer' });
    console.log('Set customer role claim');

    // Check/create customer record in Firestore
    const customersRef = firestore.collection('customers');
    const existingCustomer = await customersRef.where('firebaseUid', '==', user.uid).get();

    if (existingCustomer.empty) {
      const customerDoc = await customersRef.add({
        firebaseUid: user.uid,
        email: TEST_CUSTOMER.email,
        firstName: 'Test',
        lastName: 'Customer',
        phone: '+15555555555',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('Created customer record:', customerDoc.id);
    } else {
      console.log('Customer record already exists:', existingCustomer.docs[0].id);
    }

    console.log('\n✅ Test customer setup complete!');
    console.log('Email:', TEST_CUSTOMER.email);
    console.log('Password:', TEST_CUSTOMER.password);

  } catch (error) {
    console.error('Error setting up test customer:', error);
    process.exit(1);
  }

  process.exit(0);
}

setupTestCustomer();
