'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, FileText } from 'lucide-react';

interface WorkflowDetailProps {
  id: string;
}

export default function WorkflowDetail({ id }: WorkflowDetailProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [workflow, setWorkflow] = useState<{ name: string; category: string } | null>(null);

  useEffect(() => {
    async function fetchWorkflow() {
      try {
        // Try to fetch from API
        const response = await fetch(`/api/workflows/${id}`);
        if (response.ok) {
          const data = await response.json();
          setWorkflow({ name: data.name, category: data.category });
          setContent(data.content);
        } else {
          // Fallback to showing placeholder
          setWorkflow({
            name: id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            category: 'Workflow',
          });
          setContent(getPlaceholderContent(id));
        }
      } catch (error) {
        console.error('Failed to fetch workflow:', error);
        setWorkflow({
          name: id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          category: 'Workflow',
        });
        setContent(getPlaceholderContent(id));
      } finally {
        setLoading(false);
      }
    }

    fetchWorkflow();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/workflows"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workflows
          </Link>
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{workflow?.name}</h1>
              <p className="text-sm text-gray-500">{workflow?.category}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="prose prose-gray max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </main>
    </div>
  );
}

function getPlaceholderContent(id: string): string {
  const workflowPlaceholders: Record<string, string> = {
    'start-of-day': `
# Start of Day Procedures

## Purpose
Ensure the office is properly set up and ready for client interactions at the beginning of each business day.

## Steps

### 1. Office Setup (8:00 AM)
- Unlock front door
- Turn on lights and HVAC
- Start all computers and check printer status
- Review daily appointment calendar

### 2. System Check
- Log into CCH Practice Management
- Log into Drake Tax Software
- Check email for overnight messages
- Review voicemails and return urgent calls

### 3. Preparation
- Print daily appointment list
- Pull files for scheduled appointments
- Prepare routing sheets for drop-offs
- Stock front desk with forms and supplies

### 4. Team Briefing
- Quick standup meeting (if applicable)
- Review priority returns
- Discuss any special client needs

## Notes
- First appointment typically at 9:00 AM
- Allow 30 minutes for setup before first appointment
`,
    'client-drop-off': `
# Client Drop-Off Workflow

## Purpose
Efficiently process client document drop-offs while ensuring all necessary information is captured.

## Steps

### 1. Greet Client
- Welcome client by name (if known)
- Confirm purpose of visit

### 2. Document Collection
- Receive all documents from client
- Verify client identity if new
- Check for completeness using document checklist

### 3. Create Routing Sheet
- Fill out routing sheet with:
  - Client name and contact info
  - Date of drop-off
  - List of documents received
  - Any special instructions
  - Estimated completion date

### 4. Log in CCH
- Create new engagement if needed
- Update status to "Documents Received"
- Note any missing documents

### 5. Process Documents
- Upload documents to Tax Helper for AI OCR
- Review extracted data for accuracy
- Place physical documents in preparer bin

### 6. Client Communication
- Provide estimated completion time
- Confirm contact preferences
- Give receipt copy if requested

## Tax Helper OCR (Replaces GruntWorx)
Our AI OCR replaces GruntWorx at no per-page cost:
1. Scan documents with office scanner
2. Upload to Tax Helper dashboard
3. AI extracts all data automatically
4. Review and enter into Drake
`,
    'payment-processing': `
# Payment Processing Workflow

## Purpose
Process client payments accurately and efficiently using available payment methods.

## Payment Methods

### Cash
1. Count cash in front of client
2. Issue receipt from receipt book
3. Log in daily cash log
4. Store in secure location

### Check
1. Verify check is properly filled out
2. Stamp "For Deposit Only"
3. Log check number and amount
4. Prepare for bank deposit

### Credit/Debit Card (Square)
1. Open Square POS app
2. Enter invoice amount
3. Process card payment
4. Email or print receipt
5. Verify transaction in Square dashboard

### Payment Plan
1. Discuss payment options with client
2. Set up recurring payment in Square
3. Document agreement terms
4. Schedule payment reminders

## End of Day
- Reconcile cash drawer
- Total all payments by type
- Prepare bank deposit
- Log totals in CCH

## Notes
- Never leave payments unattended
- Secure all payment information
- Report discrepancies immediately
`,
  };

  return workflowPlaceholders[id] || `
# ${id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}

## Purpose
This workflow documentation is being developed.

## Steps
Documentation for this workflow will be added as the system is implemented.

## Notes
- Refer to existing paper procedures
- Contact supervisor for clarification
`;
}
