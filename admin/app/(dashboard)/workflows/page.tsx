'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ChevronRight, Search, Building2, Monitor, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Workflow {
  id: string;
  name: string;
  category: 'front_desk' | 'office_automation' | 'business_clients';
  description: string;
}

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

const categories = [
  { id: 'front_desk', label: 'Front Desk', icon: Building2, color: 'bg-blue-100 text-blue-700' },
  { id: 'office_automation', label: 'Office Automation', icon: Monitor, color: 'bg-green-100 text-green-700' },
  { id: 'business_clients', label: 'Business Clients', icon: Briefcase, color: 'bg-purple-100 text-purple-700' },
] as const;

export default function WorkflowsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredWorkflows = workflows.filter((workflow) => {
    if (search && !workflow.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedCategory && workflow.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const groupedWorkflows = categories.map((category) => ({
    ...category,
    workflows: filteredWorkflows.filter((w) => w.category === category.id),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="text-gray-400 hover:text-gray-600">
              <FileText className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Workflow Documentation</h1>
              <p className="text-sm text-gray-500">29 standardized procedures</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  !selectedCategory
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    selectedCategory === category.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto p-6">
        {groupedWorkflows.map((group) =>
          group.workflows.length > 0 ? (
            <div key={group.id} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <group.icon className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">{group.label}</h2>
                <span className="text-sm text-gray-500">({group.workflows.length})</span>
              </div>

              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {group.workflows.map((workflow, index) => (
                  <Link
                    key={workflow.id}
                    href={`/workflows/${workflow.id}`}
                    className={cn(
                      'flex items-center justify-between p-4 hover:bg-gray-50 transition-colors',
                      index > 0 && 'border-t'
                    )}
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                      <p className="text-sm text-gray-500">{workflow.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          ) : null
        )}

        {filteredWorkflows.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No workflows found matching your search.
          </div>
        )}
      </main>
    </div>
  );
}
