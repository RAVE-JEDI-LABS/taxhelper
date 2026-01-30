'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { Calendar, ExternalLink, RefreshCw, X } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';

interface SchedulingLinks {
  tax_prep?: string;
  drop_off?: string;
  pick_up?: string;
  signing?: string;
  consultation?: string;
  [key: string]: string | undefined;
}

interface Appointment {
  id: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  type: string;
  scheduledAt: string;
  endAt?: string;
  duration: number;
  status: string;
  source?: string;
}

const appointmentTypes = [
  { id: 'tax_prep', label: 'Tax Preparation', duration: '60 min', color: 'bg-blue-500' },
  { id: 'drop_off', label: 'Document Drop-Off', duration: '15 min', color: 'bg-green-500' },
  { id: 'pick_up', label: 'Pick-Up & Signing', duration: '30 min', color: 'bg-purple-500' },
  { id: 'consultation', label: 'Consultation', duration: '30 min', color: 'bg-orange-500' },
];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [schedulingLinks, setSchedulingLinks] = useState<SchedulingLinks>({});
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch appointments from Firestore (synced from Calendly)
      const appointmentsRes = await api.appointments.list({}).catch(() => ({ data: [] }));
      setAppointments(appointmentsRes.data || []);

      // Fetch Calendly scheduling links
      const linksRes = await fetch('/api/calendly/scheduling-links')
        .then(r => r.json())
        .catch(() => ({ links: {} }));
      setSchedulingLinks(linksRes.links || {});
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  function openCalendlyBooking(type: string) {
    const link = schedulingLinks[type];
    if (link) {
      // Open Calendly in new tab or use popup
      window.open(link, '_blank');
    } else {
      setSelectedType(type);
      setShowBookingModal(true);
    }
  }

  // Group appointments by date
  const appointmentsByDate = appointments.reduce((acc, apt) => {
    const date = new Date(apt.scheduledAt).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const sortedDates = Object.keys(appointmentsByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Powered by Calendly</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowBookingModal(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            <Calendar className="h-5 w-5" />
            Book Appointment
          </button>
        </div>
      </div>

      {/* Quick Book Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {appointmentTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => openCalendlyBooking(type.id)}
            className={cn(
              'p-4 rounded-xl text-white text-left hover:opacity-90 transition-opacity',
              type.color
            )}
          >
            <div className="font-semibold">{type.label}</div>
            <div className="text-sm opacity-80">{type.duration}</div>
            <ExternalLink className="h-4 w-4 mt-2 opacity-60" />
          </button>
        ))}
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Upcoming Appointments</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No upcoming appointments</p>
            <p className="text-sm mt-2">
              Appointments booked via Calendly will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {sortedDates.map((date) => (
              <div key={date}>
                <div className="px-4 py-2 bg-gray-50 font-medium text-sm text-gray-600">
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                {appointmentsByDate[date]
                  .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                  .map((apt) => (
                    <div
                      key={apt.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <div className="text-lg font-semibold text-gray-900">
                            {new Date(apt.scheduledAt).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="text-xs text-gray-500">{apt.duration} min</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {apt.customerName || apt.customerEmail || 'Guest'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {apt.type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {apt.source === 'calendly' && (
                          <span className="text-xs text-gray-400">via Calendly</span>
                        )}
                        <span
                          className={cn(
                            'px-2 py-1 text-xs rounded-full',
                            apt.status === 'scheduled' || apt.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : apt.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendly Setup Instructions */}
      {Object.keys(schedulingLinks).length === 0 && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-semibold text-yellow-800 mb-2">Calendly Setup Required</h3>
          <p className="text-yellow-700 text-sm mb-4">
            To enable appointment scheduling, configure your Calendly integration:
          </p>
          <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
            <li>Create a Calendly account at calendly.com</li>
            <li>Create event types: Tax Prep (60min), Drop-Off (15min), Pick-Up (30min), Consultation (30min)</li>
            <li>Get your API key from Calendly Settings → Integrations → API</li>
            <li>Add to .env: CALENDLY_API_KEY, CALENDLY_ORGANIZATION_URI, CALENDLY_WEBHOOK_SECRET</li>
            <li>Set up webhook to: https://your-domain.com/api/calendly/webhook</li>
          </ol>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          schedulingLinks={schedulingLinks}
          selectedType={selectedType}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedType(null);
          }}
        />
      )}
    </div>
  );
}

function BookingModal({
  schedulingLinks,
  selectedType,
  onClose,
}: {
  schedulingLinks: SchedulingLinks;
  selectedType: string | null;
  onClose: () => void;
}) {
  const calendlyBaseUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com/gordonulencpa';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Book Appointment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {Object.keys(schedulingLinks).length > 0 ? (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">Select an appointment type to book via Calendly:</p>
              {appointmentTypes.map((type) => {
                const link = schedulingLinks[type.id];
                return (
                  <a
                    key={type.id}
                    href={link || `${calendlyBaseUrl}/${type.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center justify-between p-4 rounded-lg border hover:border-primary-500 transition-colors',
                      selectedType === type.id && 'border-primary-500 bg-primary-50'
                    )}
                  >
                    <div>
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-500">{type.duration}</div>
                    </div>
                    <ExternalLink className="h-5 w-5 text-gray-400" />
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-4">
                Calendly integration not configured yet.
              </p>
              <p className="text-sm text-gray-500">
                Visit{' '}
                <a
                  href={calendlyBaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  {calendlyBaseUrl}
                </a>{' '}
                to book an appointment.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border rounded-lg hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
