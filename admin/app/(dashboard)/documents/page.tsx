'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api/client';
import { Upload, FileText, Search, Filter, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';

interface Document {
  id: string;
  customerId: string;
  customerName?: string;
  taxYear: number;
  type: string;
  fileName: string;
  status: string;
  ocrExtracted: boolean;
  uploadedAt: string;
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

const statusConfig: Record<string, { icon: any; color: string }> = {
  pending: { icon: Clock, color: 'text-yellow-500' },
  processed: { icon: CheckCircle, color: 'text-green-500' },
  verified: { icon: CheckCircle, color: 'text-blue-500' },
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, [typeFilter]);

  async function fetchDocuments() {
    try {
      const response = await api.documents.list({});
      setDocuments(response.data || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: Show upload modal to select customer and tax year
    console.log('File selected:', file.name);
  };

  const filteredDocuments = documents.filter((doc) => {
    if (search && !doc.fileName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (typeFilter && doc.type !== typeFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage uploaded tax documents</p>
        </div>
        <button
          onClick={handleUpload}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          <Upload className="h-5 w-5" />
          Upload Document
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Types</option>
            {Object.entries(documentTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading...</div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No documents found</p>
          <button
            onClick={handleUpload}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Upload your first document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const StatusIcon = statusConfig[doc.status]?.icon || AlertCircle;
            const statusColor = statusConfig[doc.status]?.color || 'text-gray-400';

            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {doc.fileName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {documentTypeLabels[doc.type] || doc.type} - {doc.taxYear}
                    </p>
                  </div>
                  <StatusIcon className={cn('h-5 w-5', statusColor)} />
                </div>
                <div className="mt-3 pt-3 border-t flex justify-between items-center text-xs text-gray-500">
                  <span>{formatDateTime(doc.uploadedAt)}</span>
                  {doc.ocrExtracted && (
                    <span className="text-green-600">OCR Complete</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
