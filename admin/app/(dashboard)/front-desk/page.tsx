'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import {
  UserPlus,
  Package,
  FileText,
  Clock,
  CheckCircle,
  Phone,
  Search,
  Plus,
  ClipboardList,
} from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface Appointment {
  id: string;
  customerId: string;
  customerName?: string;
  type: string;
  scheduledAt: string;
  status: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

export default function FrontDeskPage() {
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showDropOffModal, setShowDropOffModal] = useState(false);
  const [showRoutingSheetModal, setShowRoutingSheetModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [appointmentsRes, customersRes] = await Promise.all([
        api.appointments.list({
          startDate: today.toISOString(),
          endDate: tomorrow.toISOString(),
        }).catch(() => ({ data: [] })),
        api.customers.list({ limit: 10 }).catch(() => ({ data: [] })),
      ]);

      setTodayAppointments(appointmentsRes.data || []);
      setRecentCustomers(customersRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  const quickActions: QuickAction[] = [
    {
      id: 'check-in',
      label: 'Client Check-In',
      icon: <UserPlus className="h-6 w-6" />,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => setShowCheckInModal(true),
    },
    {
      id: 'drop-off',
      label: 'Document Drop-Off',
      icon: <Package className="h-6 w-6" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => setShowDropOffModal(true),
    },
    {
      id: 'routing-sheet',
      label: 'New Routing Sheet',
      icon: <ClipboardList className="h-6 w-6" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => setShowRoutingSheetModal(true),
    },
    {
      id: 'phone-call',
      label: 'Log Phone Call',
      icon: <Phone className="h-6 w-6" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => console.log('Log phone call'),
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Front Desk</h1>
        <p className="text-gray-600">Client management and daily operations</p>
        <div className="mt-2 flex gap-4 text-sm">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">~50% In-Person Drop-offs</span>
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">~50% Portal Uploads</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={cn(
              'flex flex-col items-center justify-center p-6 rounded-xl text-white transition-transform hover:scale-105',
              action.color
            )}
          >
            {action.icon}
            <span className="mt-2 font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Today's Appointments */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              Today's Appointments
            </h2>
            <span className="text-sm text-gray-500">
              {todayAppointments.length} scheduled
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : todayAppointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No appointments scheduled for today
            </div>
          ) : (
            <div className="divide-y max-h-96 overflow-y-auto">
              {todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {apt.customerName || 'Customer'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(apt.scheduledAt).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}{' '}
                      - {apt.type.replace('_', ' ')}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-1 text-xs rounded-full',
                      apt.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : apt.status === 'completed'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-blue-100 text-blue-700'
                    )}
                  >
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Customers */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-400" />
              Recent Customers
            </h2>
            <a
              href="/customers"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </a>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : recentCustomers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No customers found
            </div>
          ) : (
            <div className="divide-y max-h-96 overflow-y-auto">
              {recentCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{customer.email}</div>
                  </div>
                  {customer.phone && (
                    <span className="text-sm text-gray-400">{customer.phone}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Workflow Quick Links */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Front Desk Workflows</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <WorkflowLink href="/workflows/start-of-day" label="Start of Day" />
          <WorkflowLink href="/workflows/incoming-call" label="Phone Calls" />
          <WorkflowLink href="/workflows/client-check-in" label="Check-In" />
          <WorkflowLink href="/workflows/client-drop-off" label="Drop-Off" />
          <WorkflowLink href="/workflows/routing-sheet" label="Routing Sheet" />
          <WorkflowLink href="/workflows/pick-up-signing" label="Pick-Up/Signing" />
          <WorkflowLink href="/workflows/payment-processing" label="Payments" />
          <WorkflowLink href="/workflows/end-of-day" label="End of Day" />
        </div>
      </div>

      {/* Modals would go here */}
      {showCheckInModal && (
        <CheckInModal onClose={() => setShowCheckInModal(false)} onComplete={fetchData} />
      )}
      {showDropOffModal && (
        <DropOffModal onClose={() => setShowDropOffModal(false)} onComplete={fetchData} />
      )}
      {showRoutingSheetModal && (
        <RoutingSheetModal onClose={() => setShowRoutingSheetModal(false)} onComplete={fetchData} />
      )}
    </div>
  );
}

function WorkflowLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="p-3 text-center border rounded-lg hover:bg-gray-50 text-sm text-gray-700 hover:text-gray-900"
    >
      {label}
    </a>
  );
}

function CheckInModal({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [customerId, setCustomerId] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCheckIn() {
    setLoading(true);
    try {
      // Update appointment status to confirmed
      // In real app, would search for appointment by customer
      onComplete();
      onClose();
    } catch (error) {
      console.error('Check-in failed:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Check-In</h2>
        <p className="text-gray-600 mb-4">Search for the client or select from today's appointments.</p>

        <input
          type="text"
          placeholder="Search customer name..."
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg mb-4"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Checking in...' : 'Check In'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DropOffModal({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleDropOff() {
    setLoading(true);
    try {
      // Create drop-off record
      onComplete();
      onClose();
    } catch (error) {
      console.error('Drop-off failed:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Document Drop-Off</h2>

        <div className="space-y-4 mb-6">
          <input
            type="text"
            placeholder="Customer name..."
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <textarea
            placeholder="Notes (documents received, special instructions)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleDropOff}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Process Drop-Off'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoutingSheetModal({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [formData, setFormData] = useState({
    customerName: '',
    dropOffType: 'drop-off',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      // Create routing sheet
      onComplete();
      onClose();
    } catch (error) {
      console.error('Failed to create routing sheet:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">New Routing Sheet</h2>

        <div className="space-y-4 mb-6">
          <input
            type="text"
            placeholder="Customer name..."
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <select
            value={formData.dropOffType}
            onChange={(e) => setFormData({ ...formData, dropOffType: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="in-person">In-Person Appointment</option>
            <option value="drop-off">Document Drop-Off</option>
            <option value="portal">Portal Upload</option>
          </select>
          <textarea
            placeholder="Notes, missing documents..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Routing Sheet'}
          </button>
        </div>
      </div>
    </div>
  );
}
