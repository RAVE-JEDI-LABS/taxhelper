import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeApp({
  credential: cert('/Users/ravejedi/Desktop/taxhelper/service-account.json'),
});

const db = getFirestore();

async function seedReturns() {
  // Get customers
  const customersSnapshot = await db.collection('customers').get();
  const customers: Record<string, any> = {};
  customersSnapshot.forEach((doc) => {
    const data = doc.data();
    customers[`${data.firstName} ${data.lastName}`] = { id: doc.id, ...data };
  });

  console.log('Customers:', Object.keys(customers));

  // Create tax returns for different stages
  const returns = [
    // Michele Goodwin - In Preparation with multi-state
    {
      customerId: customers['Michele Goodwin']?.id,
      customerName: 'Michele Goodwin',
      taxYear: 2025,
      returnType: '1040',
      status: 'in_preparation',
      assignedPreparer: 'Gordon Ulen',
      dueDate: '2026-04-15T00:00:00Z',
      extensionFiled: false,
      states: [
        { state: 'CA', status: 'in_preparation' },
        { state: 'NV', status: 'documents_complete' },
      ],
      payment: {
        amount: 2450,
        status: 'pending',
      },
      routingSheet: {
        dropOffDate: '2026-01-15T10:30:00Z',
        inPersonOrDropOff: 'drop-off',
        missingDocuments: [],
        notes: 'Client dropped off W-2s and 1099s',
      },
      statusHistory: [
        { status: 'intake', timestamp: '2026-01-15T10:30:00Z', note: 'Documents received via drop-off' },
        { status: 'documents_complete', timestamp: '2026-01-18T14:00:00Z', note: 'All documents verified' },
        { status: 'in_preparation', timestamp: '2026-01-22T09:00:00Z', note: 'Started preparation' },
      ],
      createdAt: '2026-01-15T10:30:00Z',
      updatedAt: '2026-01-28T16:45:00Z',
    },
    // David Takesian - Documents Pending (action required)
    {
      customerId: customers['David Takesian']?.id,
      customerName: 'David Takesian',
      taxYear: 2025,
      returnType: '1040',
      status: 'documents_pending',
      assignedPreparer: 'Gordon Ulen',
      dueDate: '2026-04-15T00:00:00Z',
      extensionFiled: false,
      states: [
        { state: 'CA', status: 'intake' },
      ],
      routingSheet: {
        dropOffDate: '2026-01-20T11:00:00Z',
        inPersonOrDropOff: 'portal',
        missingDocuments: ['W-2 from Tech Corp', '1099-INT from Chase Bank', 'Property tax statement'],
        notes: 'Client uploaded partial docs via portal',
      },
      statusHistory: [
        { status: 'intake', timestamp: '2026-01-20T11:00:00Z', note: 'Initial documents uploaded' },
        { status: 'documents_pending', timestamp: '2026-01-21T09:30:00Z', note: 'Missing W-2 and 1099 forms' },
      ],
      createdAt: '2026-01-20T11:00:00Z',
      updatedAt: '2026-01-21T09:30:00Z',
    },
    // Lucas Richards - Ready for Signing
    {
      customerId: customers['Lucas Richards']?.id,
      customerName: 'Lucas Richards',
      taxYear: 2025,
      returnType: '1040',
      status: 'ready_for_signing',
      assignedPreparer: 'Gordon Ulen',
      dueDate: '2026-04-15T00:00:00Z',
      extensionFiled: false,
      states: [
        { state: 'CA', status: 'ready_for_signing' },
      ],
      payment: {
        amount: 3200,
        status: 'pending',
      },
      routingSheet: {
        dropOffDate: '2026-01-10T09:00:00Z',
        inPersonOrDropOff: 'in-person',
        missingDocuments: [],
        notes: 'Appointment scheduled for signing',
      },
      statusHistory: [
        { status: 'intake', timestamp: '2026-01-10T09:00:00Z', note: 'In-person appointment' },
        { status: 'documents_complete', timestamp: '2026-01-10T10:00:00Z', note: 'All docs received at appointment' },
        { status: 'in_preparation', timestamp: '2026-01-12T08:00:00Z', note: 'Started preparation' },
        { status: 'review_needed', timestamp: '2026-01-20T15:00:00Z', note: 'Sent for CPA review' },
        { status: 'ready_for_signing', timestamp: '2026-01-25T11:00:00Z', note: 'Approved - ready for client signature' },
      ],
      createdAt: '2026-01-10T09:00:00Z',
      updatedAt: '2026-01-25T11:00:00Z',
    },
    // Kierstyn Fahey - Filed (complete)
    {
      customerId: customers['Kierstyn Fahey']?.id,
      customerName: 'Kierstyn Fahey',
      taxYear: 2025,
      returnType: '1040',
      status: 'filed',
      assignedPreparer: 'Gordon Ulen',
      dueDate: '2026-04-15T00:00:00Z',
      extensionFiled: false,
      states: [
        { state: 'CA', status: 'filed' },
      ],
      payment: {
        amount: 275,
        status: 'paid',
      },
      routingSheet: {
        dropOffDate: '2026-01-05T14:00:00Z',
        inPersonOrDropOff: 'portal',
        missingDocuments: [],
        notes: 'E-filed successfully',
      },
      statusHistory: [
        { status: 'intake', timestamp: '2026-01-05T14:00:00Z', note: 'Documents uploaded via portal' },
        { status: 'documents_complete', timestamp: '2026-01-06T09:00:00Z', note: 'All documents verified' },
        { status: 'in_preparation', timestamp: '2026-01-08T10:00:00Z', note: 'Started preparation' },
        { status: 'review_needed', timestamp: '2026-01-15T14:00:00Z', note: 'Sent for CPA review' },
        { status: 'ready_for_signing', timestamp: '2026-01-18T10:00:00Z', note: 'Ready for signature' },
        { status: 'completed', timestamp: '2026-01-20T11:00:00Z', note: 'Client signed - DocuSign' },
        { status: 'filed', timestamp: '2026-01-20T11:30:00Z', note: 'E-filed with IRS - confirmation #2026-01200145' },
      ],
      createdAt: '2026-01-05T14:00:00Z',
      updatedAt: '2026-01-20T11:30:00Z',
    },
    // Gordon Ulen - 2024 return with extension
    {
      customerId: customers['Gordon Ulen']?.id,
      customerName: 'Gordon Ulen',
      taxYear: 2024,
      returnType: '1040',
      status: 'filed',
      assignedPreparer: 'Gordon Ulen',
      dueDate: '2025-04-15T00:00:00Z',
      extensionFiled: true,
      extensionDate: '2025-10-15T00:00:00Z',
      states: [
        { state: 'CA', status: 'filed' },
      ],
      payment: {
        amount: 0,
        status: 'paid',
      },
      statusHistory: [
        { status: 'intake', timestamp: '2025-04-10T09:00:00Z' },
        { status: 'extension_filed', timestamp: '2025-04-14T16:00:00Z', note: 'Extension filed' },
        { status: 'documents_complete', timestamp: '2025-09-20T10:00:00Z' },
        { status: 'in_preparation', timestamp: '2025-09-25T08:00:00Z' },
        { status: 'filed', timestamp: '2025-10-10T14:00:00Z', note: 'E-filed with IRS' },
      ],
      createdAt: '2025-04-10T09:00:00Z',
      updatedAt: '2025-10-10T14:00:00Z',
    },
  ];

  console.log('\nSeeding tax returns...');

  const batch = db.batch();
  for (const taxReturn of returns) {
    if (!taxReturn.customerId) {
      console.log(`  Skipping ${taxReturn.customerName} - customer not found`);
      continue;
    }
    const docRef = db.collection('returns').doc();
    batch.set(docRef, taxReturn);
    console.log(`  Created return for ${taxReturn.customerName} (${taxReturn.taxYear}) - ${taxReturn.status}`);
  }

  await batch.commit();
  console.log('\nDone! Tax returns seeded.');

  // Verify
  const snapshot = await db.collection('returns').get();
  console.log(`\nVerified: ${snapshot.size} returns in database`);
}

seedReturns().catch(console.error);
