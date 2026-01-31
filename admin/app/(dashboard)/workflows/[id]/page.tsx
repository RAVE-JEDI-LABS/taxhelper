import WorkflowDetail from './workflow-detail';

// All workflow IDs for static generation
const workflowIds = [
  'start-of-day', 'incoming-call', 'client-check-in', 'file-retrieval',
  'routing-sheet', 'client-drop-off', 'cch-logging', 'portal-support',
  'tax-organizer', 'pick-up-signing', 'payment-processing', 'end-of-day',
  'doc-scanning', 'portal-notification', 'return-routing', 'payment-automation',
  'appointment-management', 'extension-tracking', 'status-communication', 'management-dashboard',
  'business-intake', 'business-doc-collection', 'business-extension', 'business-routing',
  'annual-report', 'banking-maintenance', '1099-preparation', 'business-communication', 'business-dashboard',
];

export function generateStaticParams() {
  return workflowIds.map((id) => ({ id }));
}

export default function WorkflowDetailPage({ params }: { params: { id: string } }) {
  return <WorkflowDetail id={params.id} />;
}
