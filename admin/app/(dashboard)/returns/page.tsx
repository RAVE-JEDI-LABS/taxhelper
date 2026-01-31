'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { Plus, Filter, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaxReturn {
  id: string;
  customerId: string;
  customerName?: string;
  taxYear: number;
  returnType: string;
  status: string;
  assignedPreparer?: string;
  dueDate?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  intake: 'bg-gray-100 text-gray-700',
  documents_pending: 'bg-yellow-100 text-yellow-700',
  documents_complete: 'bg-blue-100 text-blue-700',
  in_preparation: 'bg-purple-100 text-purple-700',
  review_needed: 'bg-orange-100 text-orange-700',
  waiting_on_client: 'bg-red-100 text-red-700',
  ready_for_signing: 'bg-green-100 text-green-700',
  completed: 'bg-green-200 text-green-800',
  filed: 'bg-emerald-100 text-emerald-700',
  picked_up: 'bg-gray-200 text-gray-800',
  extension_needed: 'bg-amber-100 text-amber-700',
  extension_filed: 'bg-amber-200 text-amber-800',
};

const statusLabels: Record<string, string> = {
  intake: 'Intake',
  documents_pending: 'Documents Pending',
  documents_complete: 'Documents Complete',
  in_preparation: 'In Preparation',
  review_needed: 'Review Needed',
  waiting_on_client: 'Waiting on Client',
  ready_for_signing: 'Ready for Signing',
  completed: 'Completed',
  filed: 'Filed',
  picked_up: 'Picked Up',
  extension_needed: 'Extension Needed',
  extension_filed: 'Extension Filed',
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<TaxReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear() - 1);

  useEffect(() => {
    fetchReturns();
  }, [statusFilter, yearFilter]);

  async function fetchReturns() {
    try {
      const response = await api.returns.list({
        status: statusFilter || undefined,
        taxYear: yearFilter,
      });
      setReturns(response.data || []);
    } catch (error) {
      console.error('Failed to fetch returns:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tax Returns</h1>
          <p className="text-gray-600">Track and manage tax return preparation</p>
        </div>
        <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
          <Plus className="h-5 w-5" />
          New Return
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value={2024}>Tax Year 2024</option>
            <option value={2023}>Tax Year 2023</option>
            <option value={2022}>Tax Year 2022</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Returns List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : returns.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No tax returns found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preparer
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {returns.map((taxReturn) => (
                <tr key={taxReturn.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {taxReturn.customerName || taxReturn.customerId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {taxReturn.taxYear}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {taxReturn.returnType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        statusColors[taxReturn.status] || 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {statusLabels[taxReturn.status] || taxReturn.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {taxReturn.assignedPreparer || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
