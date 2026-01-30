'use client';

import { CheckCircle, Clock, AlertCircle, FileText, Upload, Send, PenLine, Truck, Calendar, DollarSign, MapPin } from 'lucide-react';
import { cn, formatDate, formatDateTime } from '@/lib/utils';

interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  note?: string;
}

interface StateFiling {
  state: string;
  status: string;
}

interface ReturnStatusTimelineProps {
  status: string;
  taxYear: number;
  returnType?: string;
  createdAt?: string;
  updatedAt?: string;
  dueDate?: string;
  extensionFiled?: boolean;
  extensionDate?: string;
  states?: StateFiling[];
  payment?: {
    amount?: number;
    status?: string;
  };
  routingSheet?: {
    dropOffDate?: string;
    inPersonOrDropOff?: string;
    missingDocuments?: string[];
    notes?: string;
  };
  statusHistory?: StatusHistoryEntry[];
  assignedPreparer?: string;
}

// Full status flow with details
const statusFlow = [
  { id: 'intake', label: 'Received', icon: Upload, color: 'blue' },
  { id: 'documents_pending', label: 'Documents Needed', icon: AlertCircle, color: 'yellow' },
  { id: 'documents_complete', label: 'Documents Complete', icon: CheckCircle, color: 'blue' },
  { id: 'in_preparation', label: 'In Preparation', icon: Clock, color: 'purple' },
  { id: 'review_needed', label: 'CPA Review', icon: FileText, color: 'orange' },
  { id: 'waiting_on_client', label: 'Action Required', icon: AlertCircle, color: 'red' },
  { id: 'ready_for_signing', label: 'Ready to Sign', icon: PenLine, color: 'green' },
  { id: 'completed', label: 'Completed', icon: CheckCircle, color: 'green' },
  { id: 'filed', label: 'Filed with IRS', icon: Send, color: 'emerald' },
  { id: 'picked_up', label: 'Picked Up', icon: Truck, color: 'emerald' },
];

const statusIndex: Record<string, number> = {};
statusFlow.forEach((s, i) => { statusIndex[s.id] = i; });

// Main flow (excluding branching statuses)
const mainFlow = ['intake', 'documents_complete', 'in_preparation', 'review_needed', 'ready_for_signing', 'filed'];

export function ReturnStatusTimeline({
  status,
  taxYear,
  returnType = '1040',
  createdAt,
  updatedAt,
  dueDate,
  extensionFiled,
  extensionDate,
  states,
  payment,
  routingSheet,
  statusHistory,
  assignedPreparer,
}: ReturnStatusTimelineProps) {
  const currentStatusInfo = statusFlow.find(s => s.id === status) || statusFlow[0];
  const currentIndex = statusIndex[status] ?? 0;

  // Calculate progress through main flow
  const mainFlowIndex = mainFlow.indexOf(status);
  const progressPercent = mainFlowIndex >= 0
    ? (mainFlowIndex / (mainFlow.length - 1)) * 100
    : status === 'picked_up' ? 100 : 0;

  // Determine if there's a blocking issue
  const isBlocked = ['documents_pending', 'waiting_on_client'].includes(status);
  const isComplete = ['filed', 'picked_up', 'completed'].includes(status);

  // Get status timestamp from history or fall back to updatedAt
  const getStatusDate = (statusId: string): string | undefined => {
    const entry = statusHistory?.find(h => h.status === statusId);
    return entry?.timestamp;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header with key info */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold">{taxYear} Tax Return</h3>
            <p className="text-primary-100 mt-1">Form {returnType}</p>
          </div>
          <div className="text-right">
            <div className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
              isComplete ? 'bg-green-500/20 text-green-100' :
              isBlocked ? 'bg-yellow-500/20 text-yellow-100' :
              'bg-white/20 text-white'
            )}>
              <currentStatusInfo.icon className="h-4 w-4" />
              {currentStatusInfo.label}
            </div>
          </div>
        </div>

        {/* Key dates row */}
        <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-primary-200">Received</p>
            <p className="font-medium">{createdAt ? formatDate(createdAt) : 'N/A'}</p>
          </div>
          <div>
            <p className="text-primary-200">Last Update</p>
            <p className="font-medium">{updatedAt ? formatDate(updatedAt) : 'N/A'}</p>
          </div>
          <div>
            <p className="text-primary-200">Due Date</p>
            <p className="font-medium">
              {extensionFiled && extensionDate
                ? formatDate(extensionDate) + ' (Ext)'
                : dueDate ? formatDate(dueDate) : 'April 15'}
            </p>
          </div>
          {payment?.amount !== undefined && (
            <div>
              <p className="text-primary-200">
                {payment.amount >= 0 ? 'Refund' : 'Balance Due'}
              </p>
              <p className="font-medium">
                ${Math.abs(payment.amount).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Alert for blocking issues */}
      {isBlocked && (
        <div className={cn(
          'p-4 flex items-start gap-3 border-b',
          status === 'documents_pending' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
        )}>
          <AlertCircle className={cn(
            'h-5 w-5 flex-shrink-0 mt-0.5',
            status === 'documents_pending' ? 'text-yellow-600' : 'text-red-600'
          )} />
          <div>
            <p className={cn(
              'font-medium',
              status === 'documents_pending' ? 'text-yellow-800' : 'text-red-800'
            )}>
              {status === 'documents_pending' ? 'Documents Needed' : 'Action Required'}
            </p>
            {routingSheet?.missingDocuments && routingSheet.missingDocuments.length > 0 ? (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Missing documents:</p>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {routingSheet.missingDocuments.map((doc, i) => (
                    <li key={i}>{doc}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-600 mt-1">
                Please check your email or contact our office for details.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Progress Timeline */}
      <div className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Progress</h4>

        {/* Visual progress bar */}
        <div className="relative mb-6">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                isComplete ? 'bg-green-500' : isBlocked ? 'bg-yellow-500' : 'bg-primary-600'
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex justify-between mt-2">
            {mainFlow.map((stepId, i) => {
              const step = statusFlow.find(s => s.id === stepId)!;
              const isActive = mainFlowIndex >= i;
              const isCurrent = stepId === status;
              const stepDate = getStatusDate(stepId);

              return (
                <div key={stepId} className="flex flex-col items-center" style={{ width: `${100 / mainFlow.length}%` }}>
                  <div className={cn(
                    'w-3 h-3 rounded-full -mt-2 transition-all',
                    isActive ? (isComplete ? 'bg-green-500' : 'bg-primary-600') : 'bg-gray-300',
                    isCurrent && !isComplete && 'ring-4 ring-primary-100'
                  )} />
                  <p className={cn(
                    'text-xs mt-2 text-center',
                    isActive ? 'text-gray-900 font-medium' : 'text-gray-400'
                  )}>
                    {step.label}
                  </p>
                  {stepDate && (
                    <p className="text-xs text-gray-400">{formatDate(stepDate)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed status history */}
        {statusHistory && statusHistory.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold text-gray-900 mb-3">Activity Log</h4>
            <div className="space-y-3">
              {statusHistory.slice().reverse().map((entry, i) => {
                const statusInfo = statusFlow.find(s => s.id === entry.status);
                return (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className={cn(
                      'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                      statusInfo?.color === 'green' ? 'bg-green-500' :
                      statusInfo?.color === 'yellow' ? 'bg-yellow-500' :
                      statusInfo?.color === 'red' ? 'bg-red-500' :
                      statusInfo?.color === 'purple' ? 'bg-purple-500' :
                      'bg-blue-500'
                    )} />
                    <div className="flex-1">
                      <p className="text-gray-900">{statusInfo?.label || entry.status}</p>
                      {entry.note && (
                        <p className="text-gray-500 mt-0.5">{entry.note}</p>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs">
                      {formatDateTime(entry.timestamp)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Multi-state filings */}
      {states && states.length > 0 && (
        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              State Filings
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {states.map((state, i) => {
                const stateStatus = statusFlow.find(s => s.id === state.status);
                return (
                  <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border">
                    <span className="font-medium text-gray-900">{state.state}</span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      state.status === 'filed' ? 'bg-green-100 text-green-700' :
                      state.status === 'in_preparation' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-600'
                    )}>
                      {stateStatus?.label || state.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Extension notice */}
      {extensionFiled && (
        <div className="px-6 pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Extension Filed</p>
              <p className="text-sm text-blue-700 mt-1">
                Your tax filing deadline has been extended to {extensionDate ? formatDate(extensionDate) : 'October 15'}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment info */}
      {payment && payment.status && (
        <div className="px-6 pb-6">
          <div className={cn(
            'rounded-lg p-4 flex items-start gap-3',
            payment.status === 'paid' ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
          )}>
            <DollarSign className={cn(
              'h-5 w-5 flex-shrink-0 mt-0.5',
              payment.status === 'paid' ? 'text-green-600' : 'text-gray-600'
            )} />
            <div>
              <p className={cn(
                'font-medium',
                payment.status === 'paid' ? 'text-green-800' : 'text-gray-800'
              )}>
                Payment {payment.status === 'paid' ? 'Complete' : payment.status === 'partial' ? 'Partial' : 'Pending'}
              </p>
              {payment.amount !== undefined && (
                <p className="text-sm text-gray-600 mt-1">
                  {payment.status === 'paid'
                    ? `$${payment.amount.toLocaleString()} paid`
                    : `$${payment.amount.toLocaleString()} ${payment.amount >= 0 ? 'preparation fee' : 'due'}`
                  }
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer with preparer info */}
      {assignedPreparer && (
        <div className="px-6 py-4 bg-gray-50 border-t text-sm text-gray-600">
          <p>Your preparer: <span className="font-medium text-gray-900">{assignedPreparer}</span></p>
        </div>
      )}
    </div>
  );
}
