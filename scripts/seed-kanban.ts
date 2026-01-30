import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeApp({
  credential: cert('/Users/ravejedi/Desktop/taxhelper/service-account.json'),
});

const db = getFirestore();

const kanbanFeatures = [
  // COMPLETED
  { id: '1', title: 'Admin Dashboard', description: 'Main staff dashboard with navigation to all features', workflow: 'core', status: 'done', priority: 'high', order: 0 },
  { id: '2', title: 'Demo Login System', description: 'Firebase Auth with demo bypass for development/demos', workflow: 'core', status: 'done', priority: 'high', order: 1 },
  { id: '3', title: 'Customer Management', description: 'CRUD for client records with search and filtering', workflow: 'client_management', status: 'done', priority: 'high', order: 2 },
  { id: '4', title: 'Tax Returns Tracking', description: 'Track return status from intake to filed', workflow: 'return_tracking', status: 'done', priority: 'high', order: 3 },
  { id: '5', title: 'Document Management', description: 'Upload, view, and manage client documents', workflow: 'document_scanning', status: 'done', priority: 'high', order: 4 },
  { id: '6', title: 'Front Desk Assistant', description: 'Quick actions for check-in, drop-off, pick-up workflows', workflow: 'front_desk', status: 'done', priority: 'high', order: 5 },
  { id: '7', title: 'Client Portal', description: 'Client-facing portal for document upload and status check', workflow: 'client_portal', status: 'done', priority: 'medium', order: 6 },
  { id: '8', title: 'Workflow Documentation', description: '10 workflow docs with viewer in admin dashboard', workflow: 'documentation', status: 'done', priority: 'medium', order: 7 },
  { id: '9', title: 'Backend API', description: 'Express API with 10 route modules + Firestore', workflow: 'core', status: 'done', priority: 'high', order: 8 },
  { id: '10', title: 'OpenAPI Schema', description: 'Single source of truth for types - auto-generates TS', workflow: 'core', status: 'done', priority: 'high', order: 9 },
  { id: '11', title: 'Calendly Integration', description: 'All appointment scheduling via Calendly - webhooks, API, sync', workflow: 'appointment_management', status: 'done', priority: 'high', order: 10 },
  // IN PROGRESS
  { id: '12', title: 'Document OCR Agent', description: 'AI-powered OCR for W-2s and 1099s using Claude Vision', workflow: 'document_scanning', status: 'in_progress', priority: 'high', order: 11 },
  { id: '13', title: 'GruntWorx Replacement', description: 'AI OCR to replace GruntWorx ($0.45/page) - saves ~$450/1000 pages', workflow: 'document_scanning', status: 'in_progress', priority: 'high', order: 12 },
  // REVIEW
  { id: '14', title: 'CCH Software Logging', description: 'Automated CCH practice management logging', workflow: 'cch_logging', status: 'review', priority: 'low', order: 13 },
  // BACKLOG
  { id: '15', title: 'Twilio + ElevenLabs Phone AI', description: 'AI agent handles incoming calls - scheduling, status, transfers', workflow: 'incoming_call', status: 'backlog', priority: 'high', order: 14 },
  { id: '16', title: 'Client Communication Automation', description: 'Automated email/SMS for status updates', workflow: 'client_communication', status: 'backlog', priority: 'medium', order: 15 },
  { id: '17', title: 'Payment Processing Integration', description: 'Square integration for payments', workflow: 'payment_processing', status: 'backlog', priority: 'medium', order: 16 },
  { id: '18', title: 'Physical Document Scanning Bottleneck', description: '50% of clients bring physical paper - streamline scan workflow', workflow: 'document_scanning', status: 'backlog', priority: 'medium', order: 17 },
  { id: '19', title: 'Import Existing Client Data', description: 'Import existing client records from legacy systems into Firestore database', workflow: 'data_migration', status: 'backlog', priority: 'high', order: 18 },
];

async function seed() {
  console.log('Seeding kanban features...');

  const batch = db.batch();

  for (const feature of kanbanFeatures) {
    const docRef = db.collection('kanban').doc(feature.id);
    batch.set(docRef, {
      ...feature,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  await batch.commit();
  console.log(`Created ${kanbanFeatures.length} kanban features`);

  // Verify
  const snapshot = await db.collection('kanban').get();
  console.log(`\nVerified: ${snapshot.size} features in database`);
}

seed().catch(console.error);
