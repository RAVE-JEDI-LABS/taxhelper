'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api/client';
import { FileText, Upload, CheckCircle, Clock, AlertCircle, LogOut } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface PortalReturn {
  id: string;
  taxYear: number;
  status: string;
  returnType: string;
}

interface PortalDocument {
  id: string;
  fileName: string;
  type: string;
  status: string;
  uploadedAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  intake: { label: 'Received', color: 'bg-blue-100 text-blue-700', icon: Clock },
  documents_pending: { label: 'Documents Needed', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  documents_complete: { label: 'Documents Complete', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  in_preparation: { label: 'In Preparation', color: 'bg-purple-100 text-purple-700', icon: Clock },
  review_needed: { label: 'Under Review', color: 'bg-orange-100 text-orange-700', icon: Clock },
  waiting_on_client: { label: 'Action Required', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  ready_for_signing: { label: 'Ready to Sign', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-green-200 text-green-800', icon: CheckCircle },
  filed: { label: 'Filed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
};

export default function ClientPortalPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [returns, setReturns] = useState<PortalReturn[]>([]);
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'status' | 'documents'>('status');

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
    } catch (error) {
      console.error('Failed to fetch portal data:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Client Portal</h1>
                <p className="text-sm text-gray-500">Gordon Ullen CPA</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Welcome, {user.email?.split('@')[0]}
          </h2>
          <p className="text-gray-600">
            Track your tax return status and upload documents securely.
          </p>
        </div>

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
            My Documents
          </button>
        </div>

        {/* Content */}
        {activeTab === 'status' ? (
          <div className="space-y-4">
            {returns.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No tax returns on file yet.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Your returns will appear here once processing begins.
                </p>
              </div>
            ) : (
              returns.map((taxReturn) => {
                const status = statusConfig[taxReturn.status] || statusConfig.intake;
                const StatusIcon = status.icon;

                return (
                  <div
                    key={taxReturn.id}
                    className="bg-white rounded-xl shadow-sm border p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {taxReturn.taxYear} Tax Return
                        </h3>
                        <p className="text-sm text-gray-500">
                          Form {taxReturn.returnType}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm',
                          status.color
                        )}
                      >
                        <StatusIcon className="h-4 w-4" />
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div>
            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Upload Documents</h3>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-sm text-gray-400">
                  Supported: PDF, JPG, PNG (max 10MB)
                </p>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                />
                <button className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                  Select Files
                </button>
              </div>
            </div>

            {/* Document List */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Uploaded Documents</h3>
              </div>
              {documents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No documents uploaded yet.
                </div>
              ) : (
                <div className="divide-y">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.fileName}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'px-2 py-1 text-xs rounded-full',
                          doc.status === 'verified'
                            ? 'bg-green-100 text-green-700'
                            : doc.status === 'processed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        )}
                      >
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
