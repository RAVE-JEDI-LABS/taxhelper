'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { Plus, Calendar, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';

interface Appointment {
  id: string;
  customerId: string;
  customerName?: string;
  type: string;
  scheduledAt: string;
  duration: number;
  assignedTo?: string;
  status: string;
  notes?: string;
}

const typeLabels: Record<string, string> = {
  tax_prep: 'Tax Preparation',
  drop_off: 'Document Drop-off',
  pick_up: 'Pick Up',
  signing: 'Signing Appointment',
  consultation: 'Consultation',
};

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-yellow-100 text-yellow-700',
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchAppointments();
  }, [currentDate]);

  async function fetchAppointments() {
    try {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const response = await api.appointments.list({
        startDate: startOfWeek.toISOString(),
        endDate: endOfWeek.toISOString(),
      });
      setAppointments(response.data || []);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Schedule and manage client appointments</p>
        </div>
        <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
          <Plus className="h-5 w-5" />
          New Appointment
        </button>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h2 className="font-semibold text-gray-900">
              {weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <p className="text-sm text-gray-500">
              {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
              {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Week View */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="grid grid-cols-7 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <div
              key={day}
              className={cn(
                'p-4 text-center border-r last:border-r-0',
                weekDates[i].toDateString() === new Date().toDateString() && 'bg-primary-50'
              )}
            >
              <div className="text-xs text-gray-500 uppercase">{day}</div>
              <div
                className={cn(
                  'text-lg font-semibold',
                  weekDates[i].toDateString() === new Date().toDateString()
                    ? 'text-primary-600'
                    : 'text-gray-900'
                )}
              >
                {weekDates[i].getDate()}
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-7 min-h-[400px]">
            {weekDates.map((date, i) => {
              const dayAppointments = appointments.filter((apt) => {
                const aptDate = new Date(apt.scheduledAt);
                return aptDate.toDateString() === date.toDateString();
              });

              return (
                <div
                  key={i}
                  className={cn(
                    'p-2 border-r last:border-r-0 min-h-full',
                    date.toDateString() === new Date().toDateString() && 'bg-primary-50/50'
                  )}
                >
                  {dayAppointments.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center mt-4">
                      No appointments
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="bg-white border rounded-lg p-2 shadow-sm hover:shadow cursor-pointer text-sm"
                        >
                          <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                            <Clock className="h-3 w-3" />
                            {new Date(apt.scheduledAt).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="font-medium text-gray-900 truncate">
                            {apt.customerName || 'Customer'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {typeLabels[apt.type] || apt.type}
                          </div>
                          <span
                            className={cn(
                              'inline-block px-1.5 py-0.5 text-xs rounded mt-1',
                              statusColors[apt.status] || 'bg-gray-100'
                            )}
                          >
                            {apt.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
