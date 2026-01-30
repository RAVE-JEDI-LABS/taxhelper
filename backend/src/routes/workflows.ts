import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import type { AuthenticatedRequest } from '../middleware/auth.js';

interface Workflow {
  id: string;
  name: string;
  category: 'front_desk' | 'office_automation' | 'business_clients';
  description: string;
}

// Workflow definitions (could also be stored in Firestore)
const workflows: Workflow[] = [
  // Front Desk (12)
  { id: 'start-of-day', name: 'Start of Day Procedures', category: 'front_desk', description: 'Daily opening procedures and setup' },
  { id: 'incoming-call', name: 'Incoming Phone Call Workflow', category: 'front_desk', description: 'Handle inbound client calls' },
  { id: 'client-check-in', name: 'Client Walk-In / Appointment Check-In', category: 'front_desk', description: 'Process client arrivals' },
  { id: 'file-retrieval', name: 'Client File Retrieval', category: 'front_desk', description: 'Locate and prepare client files' },
  { id: 'routing-sheet', name: 'Routing Sheet Creation', category: 'front_desk', description: 'Create routing sheets for tax returns' },
  { id: 'client-drop-off', name: 'Client Drop-Off Workflow', category: 'front_desk', description: 'Handle document drop-offs' },
  { id: 'cch-logging', name: 'CCH Software Logging', category: 'front_desk', description: 'Log activities in CCH Practice Management' },
  { id: 'portal-support', name: 'Client Portal Support', category: 'front_desk', description: 'Assist clients with portal access' },
  { id: 'tax-organizer', name: 'Tax Organizer Process', category: 'front_desk', description: 'Distribute and collect tax organizers' },
  { id: 'pick-up-signing', name: 'Client Pick-Up & Signing Workflow', category: 'front_desk', description: 'Handle return pick-up and signatures' },
  { id: 'payment-processing', name: 'Payment Processing', category: 'front_desk', description: 'Process client payments' },
  { id: 'end-of-day', name: 'End of Day Procedures', category: 'front_desk', description: 'Daily closing procedures' },

  // Office Automation (8)
  { id: 'doc-scanning', name: 'Document Scanning & Data Extraction', category: 'office_automation', description: 'OCR and data extraction from documents' },
  { id: 'portal-notification', name: 'Portal Document Readiness Notification', category: 'office_automation', description: 'Notify clients when documents are ready' },
  { id: 'return-routing', name: 'Tax Return Routing & Status Tracking', category: 'office_automation', description: 'Track return progress through workflow' },
  { id: 'payment-automation', name: 'Payment Automation & Tracking', category: 'office_automation', description: 'Automated payment reminders and tracking' },
  { id: 'appointment-management', name: 'Appointment Scheduling & Management', category: 'office_automation', description: 'Automated scheduling and reminders' },
  { id: 'extension-tracking', name: 'Extension Tracking & Execution', category: 'office_automation', description: 'Track and file extensions automatically' },
  { id: 'status-communication', name: 'Client Status Communication', category: 'office_automation', description: 'Automated status update notifications' },
  { id: 'management-dashboard', name: 'Management Dashboard & Reporting', category: 'office_automation', description: 'KPIs and operational metrics' },

  // Business Clients (9)
  { id: 'business-intake', name: 'Business Client Intake & Profile Management', category: 'business_clients', description: 'Onboard business clients' },
  { id: 'business-doc-collection', name: 'Document Collection & Missing Document Tracking', category: 'business_clients', description: 'Track business document collection' },
  { id: 'business-extension', name: 'Extension Identification & Tracking', category: 'business_clients', description: 'Identify and track business extensions' },
  { id: 'business-routing', name: 'Business Return Routing & Status Tracking', category: 'business_clients', description: 'Track business return progress' },
  { id: 'annual-report', name: 'Annual Report & Compliance Tracking', category: 'business_clients', description: 'Track annual reports and compliance' },
  { id: 'banking-maintenance', name: 'Banking & Routing Information Maintenance', category: 'business_clients', description: 'Maintain banking information' },
  { id: '1099-preparation', name: '1099 Preparation & Communication', category: 'business_clients', description: 'Prepare and distribute 1099s' },
  { id: 'business-communication', name: 'Client Status Communication', category: 'business_clients', description: 'Business client communications' },
  { id: 'business-dashboard', name: 'Management Dashboard & Reporting', category: 'business_clients', description: 'Business client KPIs' },
];

export const workflowsRouter = Router();

// List workflows
workflowsRouter.get('/', async (_req: AuthenticatedRequest, res, next) => {
  try {
    res.json({ data: workflows });
  } catch (error) {
    next(error);
  }
});

// Get workflow by ID
workflowsRouter.get('/:id', async (req, res, next) => {
  try {
    const workflow = workflows.find((w) => w.id === req.params.id);
    if (!workflow) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Workflow not found' });
    }

    // Try to read markdown content from file
    let content = '';
    try {
      const filePath = path.join(process.cwd(), '..', 'docs', 'workflows', `${req.params.id}.md`);
      content = await fs.readFile(filePath, 'utf-8');
    } catch {
      // Return placeholder content if file doesn't exist
      content = getPlaceholderContent(workflow);
    }

    res.json({
      ...workflow,
      content,
    });
  } catch (error) {
    next(error);
  }
});

function getPlaceholderContent(workflow: Workflow): string {
  return `# ${workflow.name}

## Purpose
${workflow.description}

## Category
${workflow.category.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}

## Steps
Documentation for this workflow will be added as the system is implemented.

## Notes
- Refer to existing paper procedures
- Contact supervisor for clarification
`;
}
