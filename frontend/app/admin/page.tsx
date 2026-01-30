'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Users, FileText, FolderOpen, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface DashboardStats {
  totalCustomers: number;
  activeReturns: number;
  pendingDocuments: number;
  upcomingAppointments: number;
}

interface RecentActivity {
  id: string;
  type: 'return' | 'document' | 'appointment';
  title: string;
  status: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeReturns: 0,
    pendingDocuments: 0,
    upcomingAppointments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch stats from various endpoints
        const [customers, returns, documents, appointments] = await Promise.all([
          api.customers.list({ limit: 1 }).catch(() => ({ meta: { total: 0 } })),
          api.returns.list({ limit: 1 }).catch(() => ({ meta: { total: 0 } })),
          api.documents.list({ customerId: '' }).catch(() => ({ meta: { total: 0 } })),
          api.appointments.list({ startDate: new Date().toISOString() }).catch(() => ({ meta: { total: 0 } })),
        ]);

        setStats({
          totalCustomers: customers.meta?.total || 0,
          activeReturns: returns.meta?.total || 0,
          pendingDocuments: documents.meta?.total || 0,
          upcomingAppointments: appointments.meta?.total || 0,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of tax preparation activities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={<Users className="h-6 w-6" />}
          href="/admin/customers"
          loading={loading}
        />
        <StatCard
          title="Active Returns"
          value={stats.activeReturns}
          icon={<FileText className="h-6 w-6" />}
          href="/admin/returns"
          loading={loading}
        />
        <StatCard
          title="Pending Documents"
          value={stats.pendingDocuments}
          icon={<FolderOpen className="h-6 w-6" />}
          href="/admin/documents"
          loading={loading}
        />
        <StatCard
          title="Upcoming Appointments"
          value={stats.upcomingAppointments}
          icon={<Calendar className="h-6 w-6" />}
          href="/admin/appointments"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/admin/customers?action=new"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            New Customer
          </Link>
          <Link
            href="/admin/returns?action=new"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            New Tax Return
          </Link>
          <Link
            href="/admin/appointments?action=new"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Schedule Appointment
          </Link>
          <Link
            href="/workflows"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            View Workflows
          </Link>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Return Status Summary</h2>
          <div className="space-y-3">
            <StatusRow
              icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />}
              label="Waiting on Client"
              count={0}
            />
            <StatusRow
              icon={<Clock className="h-5 w-5 text-blue-500" />}
              label="In Preparation"
              count={0}
            />
            <StatusRow
              icon={<CheckCircle className="h-5 w-5 text-green-500" />}
              label="Ready for Signing"
              count={0}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Deadlines</h2>
          <div className="text-gray-600 text-sm">
            <p className="mb-2">No upcoming deadlines</p>
            <p className="text-xs text-gray-400">
              Deadlines will appear here based on tax return due dates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  href,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  loading: boolean;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">
        {loading ? '...' : value}
      </div>
      <div className="text-sm text-gray-600">{title}</div>
    </Link>
  );
}

function StatusRow({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-gray-700">{label}</span>
      </div>
      <span className="font-semibold text-gray-900">{count}</span>
    </div>
  );
}
