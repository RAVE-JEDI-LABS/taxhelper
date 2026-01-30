import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeApp({
  credential: cert('/Users/ravejedi/Desktop/taxhelper/service-account.json'),
});

const db = getFirestore();

async function updateCustomers() {
  // First, let's see all customers
  console.log('Current customers:');
  const snapshot = await db.collection('customers').get();
  snapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`  ${doc.id}: ${data.firstName} ${data.lastName} (${data.email})`);
  });

  // Update Michelle Xyz → Michele Goodwin
  const michelleQuery = await db.collection('customers')
    .where('firstName', '==', 'Michelle')
    .get();

  if (!michelleQuery.empty) {
    const doc = michelleQuery.docs[0];
    await db.collection('customers').doc(doc.id).update({
      firstName: 'Michele',
      lastName: 'Goodwin',
      email: 'michele.goodwin@example.com',
      updatedAt: new Date().toISOString(),
    });
    console.log('\n✓ Updated Michelle Xyz → Michele Goodwin');
  } else {
    console.log('\n✗ Michelle not found');
  }

  // Update David Xyz → David Takesian
  const davidQuery = await db.collection('customers')
    .where('firstName', '==', 'David')
    .get();

  if (!davidQuery.empty) {
    const doc = davidQuery.docs[0];
    await db.collection('customers').doc(doc.id).update({
      firstName: 'David',
      lastName: 'Takesian',
      email: 'david.takesian@example.com',
      updatedAt: new Date().toISOString(),
    });
    console.log('✓ Updated David Xyz → David Takesian');
  } else {
    console.log('✗ David not found');
  }

  // Verify all customers
  console.log('\nUpdated customers:');
  const verifySnapshot = await db.collection('customers').get();
  verifySnapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`  ${doc.id}: ${data.firstName} ${data.lastName} (${data.email})`);
  });
}

updateCustomers().catch(console.error);
