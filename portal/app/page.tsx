'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api/client';
import { FileText, Upload, CheckCircle, Clock, AlertCircle, LogOut, Phone, Mail, RefreshCw } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { ReturnStatusTimeline } from '@/components/return-status-timeline';

interface TaxReturn {
  id: string;
  customerId: string;
  taxYear: number;
  status: string;
  returnType: string;
  createdAt?: string;
  updatedAt?: string;
  dueDate?: string;
  extensionFiled?: boolean;
  extensionDate?: string;
  assignedPreparer?: string;
  states?: { state: string; status: string }[];
  payment?: { amount?: number; status?: string };
  routingSheet?: {
    dropOffDate?: string;
    inPersonOrDropOff?: string;
    missingDocuments?: string[];
    notes?: string;
  };
  statusHistory?: { status: string; timestamp: string; note?: string }[];
}

interface PortalDocument {
  id: string;
  fileName: string;
  type: string;
  status: string;
  uploadedAt: string;
  taxYear?: number;
}

const documentTypeLabels: Record<string, string> = {
  w2: 'W-2',
  '1099-r': '1099-R',
  '1099-g': '1099-G',
  '1099-int': '1099-INT',
  '1099-div': '1099-DIV',
  '1099-nec': '1099-NEC',
  k1: 'K-1',
  other: 'Other',
};

export default function ClientPortalPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [returns, setReturns] = useState<TaxReturn[]>([]);
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'documents'>('status');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  async function fetchData() {
    try {
      const [returnsRes, docsRes] = await Promise.all([
        api.returns.list({}).catch(() => ({ data: [] })),
        api.documents.list({}).catch(() => ({ data: [] })),
      ]);
      setReturns(returnsRes.data || []);
      setDocuments(docsRes.data || []);

      // Default to most recent tax year
      if (returnsRes.data?.length > 0 && !selectedYear) {
        const years = returnsRes.data.map((r: TaxReturn) => r.taxYear);
        setSelectedYear(Math.max(...years));
      }
    } catch (error) {
      console.error('Failed to fetch portal data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      // TODO: Implement actual file upload
      console.log('Uploading files:', Array.from(files).map(f => f.name));
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload
      await fetchData(); // Refresh documents list
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Get unique tax years from returns
  const taxYears = Array.from(new Set(returns.map(r => r.taxYear))).sort((a, b) => b - a);
  const selectedReturns = selectedYear
    ? returns.filter(r => r.taxYear === selectedYear)
    : returns;

  // Filter documents by selected year
  const filteredDocuments = selectedYear
    ? documents.filter(d => d.taxYear === selectedYear || !d.taxYear)
    : documents;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Client Portal</h1>
                <p className="text-sm text-gray-500">Gordon Ulen CPA</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                title="Refresh"
              >
                <RefreshCw className={cn('h-5 w-5', refreshing && 'animate-spin')} />
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Welcome Card with Contact */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Welcome, {user.displayName || user.email?.split('@')[0]}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Track your tax return status and upload documents securely.
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="tel:+19783727050"
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
              >
                <Phone className="h-4 w-4" />
                Call Office
              </a>
              <a
                href="mailto:gulen@gwucpa.com"
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
            </div>
          </div>
        </div>

        {/* Year Selector (if multiple years) */}
        {taxYears.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {taxYears.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors',
                  selectedYear === year
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border'
                )}
              >
                {year} Tax Year
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('status')}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              activeTab === 'status'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border'
            )}
          >
            Return Status
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              activeTab === 'documents'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border'
            )}
          >
            My Documents ({filteredDocuments.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'status' ? (
          <div className="space-y-6">
            {selectedReturns.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No tax returns on file yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Your returns will appear here once we begin processing.
                </p>
              </div>
            ) : (
              selectedReturns.map((taxReturn) => (
                <ReturnStatusTimeline
                  key={taxReturn.id}
                  status={taxReturn.status}
                  taxYear={taxReturn.taxYear}
                  returnType={taxReturn.returnType}
                  createdAt={taxReturn.createdAt}
                  updatedAt={taxReturn.updatedAt}
                  dueDate={taxReturn.dueDate}
                  extensionFiled={taxReturn.extensionFiled}
                  extensionDate={taxReturn.extensionDate}
                  states={taxReturn.states}
                  payment={taxReturn.payment}
                  routingSheet={taxReturn.routingSheet}
                  statusHistory={taxReturn.statusHistory}
                  assignedPreparer={taxReturn.assignedPreparer}
                />
              ))
            )}
          </div>
        ) : (
          <div>
            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Upload Documents</h3>
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                  uploading ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-primary-600">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Drag and drop files here, or click to browse
                    </p>
                    <p className="text-sm text-gray-400">
                      Supported: PDF, JPG, PNG (max 10MB each)
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleFileUpload}
                />
              </div>

              {/* Document checklist */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-3">Common Documents Needed</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                    W-2 forms (all employers)
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                    1099 forms (interest, dividends, etc.)
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                    1098 forms (mortgage, tuition)
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                    Property tax statements
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                    Last year's tax return
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                    Photo ID (new clients)
                  </div>
                </div>
              </div>
            </div>

            {/* Document List */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Uploaded Documents</h3>
                {filteredDocuments.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {filteredDocuments.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p>No documents uploaded yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Upload your tax documents above
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <FileText className="h-6 w-6 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{doc.fileName}</p>
                          <p className="text-sm text-gray-500">
                            {documentTypeLabels[doc.type] || doc.type} {doc.taxYear && `- ${doc.taxYear}`}
                            <span className="mx-2">·</span>
                            {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.status === 'verified' ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            Verified
                          </span>
                        ) : doc.status === 'processed' ? (
                          <span className="flex items-center gap-1 text-blue-600 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            Processed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-yellow-600 text-sm">
                            <Clock className="h-4 w-4" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need help? Call us at <a href="tel:+19783727050" className="text-primary-600 hover:underline">(978) 372-7050</a></p>
          <p className="mt-1">Office hours: Mon-Fri 9am-5pm, Sat 9am-12pm (during tax season)</p>
        </div>
      </main>
    </div>
  );
}
