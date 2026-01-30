import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = path.resolve(__dirname, '../service-account.json');
initializeApp({
  credential: cert(serviceAccountPath),
});

const db = getFirestore();

const customers = [
  {
    firstName: 'Lucas',
    lastName: 'Richards',
    email: 'lucas@example.com',
    phone: '555-123-4567',
    entityType: 'individual',
    portalAccess: true,
    addresses: [
      { type: 'home', street: '123 Main St', city: 'Columbus', state: 'OH', zip: '43215' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    firstName: 'Kierstyn',
    lastName: 'Fahey',
    email: 'kierstyn@example.com',
    phone: '555-987-6543',
    entityType: 'individual',
    portalAccess: true,
    addresses: [
      { type: 'home', street: '456 Oak Ave', city: 'Columbus', state: 'OH', zip: '43210' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    firstName: 'Stephen',
    lastName: 'Fahey',
    email: 'stephen@example.com',
    phone: '555-111-2222',
    entityType: 'individual',
    portalAccess: true,
    addresses: [
      { type: 'home', street: '456 Oak Ave', city: 'Columbus', state: 'OH', zip: '43210' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    firstName: 'Gordon',
    lastName: 'Ulen',
    email: 'gordon@gordonulencpa.com',
    phone: '555-333-4444',
    entityType: 'individual',
    portalAccess: true,
    addresses: [
      { type: 'business', street: '789 CPA Blvd', city: 'Columbus', state: 'OH', zip: '43220' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    firstName: 'Michelle',
    lastName: 'Xyz',
    email: 'michelle@example.com',
    phone: '555-555-6666',
    entityType: 'individual',
    portalAccess: false,
    addresses: [
      { type: 'home', street: '321 Elm St', city: 'Columbus', state: 'OH', zip: '43201' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    firstName: 'David',
    lastName: 'Xyz',
    email: 'david@example.com',
    phone: '555-777-8888',
    entityType: 'individual',
    portalAccess: false,
    addresses: [
      { type: 'home', street: '654 Pine Rd', city: 'Columbus', state: 'OH', zip: '43202' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function seed() {
  console.log('Seeding customers...');

  for (const customer of customers) {
    const docRef = await db.collection('customers').add(customer);
    console.log(`Created customer: ${customer.firstName} ${customer.lastName} (${docRef.id})`);
  }

  console.log('Done!');

  // Verify by reading back
  console.log('\nVerifying customers in database:');
  const snapshot = await db.collection('customers').get();
  snapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`  - ${data.firstName} ${data.lastName} (${doc.id})`);
  });
}

seed().catch(console.error);
