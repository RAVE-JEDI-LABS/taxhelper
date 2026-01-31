import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase Admin with service account
admin.initializeApp({
  credential: admin.credential.cert(
    process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json'
  ),
});

const db = admin.firestore();

async function createTestCustomer() {
  const customerId = uuidv4();
  const timestamp = new Date().toISOString();

  const customer = {
    id: customerId,
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '+15551234567',
    entityType: 'individual',
    addresses: [
      {
        type: 'home',
        street1: '123 Main Street',
        city: 'Boston',
        state: 'MA',
        zip: '02101',
        country: 'US',
      },
    ],
    communicationPreferences: {
      preferredContact: 'email',
      optOutSms: false,
      optOutEmail: false,
      timezone: 'America/New_York',
    },
    portalAccess: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.collection('customers').doc(customerId).set(customer);
  console.log('✅ Created customer:', customerId);
  console.log(JSON.stringify(customer, null, 2));

  // Also create a tax return for this customer
  const returnId = uuidv4();
  const taxReturn = {
    id: returnId,
    customerId: customerId,
    taxYear: 2024,
    returnType: '1040',
    status: 'info_gathering',
    assignedPreparer: null,
    filingDeadline: '2025-04-15',
    documents: [],
    notes: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.collection('taxReturns').doc(returnId).set(taxReturn);
  console.log('✅ Created tax return:', returnId);
  console.log(JSON.stringify(taxReturn, null, 2));

  process.exit(0);
}

createTestCustomer().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
