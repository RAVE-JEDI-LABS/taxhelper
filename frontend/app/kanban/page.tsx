'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '@/lib/api/client';
import { Plus, GripVertical, MoreHorizontal, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface KanbanFeature {
  id: string;
  title: string;
  description?: string;
  workflow?: string;
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  order: number;
}

const columns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-100' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'review', title: 'Review', color: 'bg-yellow-100' },
  { id: 'done', title: 'Done', color: 'bg-green-100' },
] as const;

const priorityColors = {
  low: 'bg-gray-200 text-gray-700',
  medium: 'bg-yellow-200 text-yellow-800',
  high: 'bg-red-200 text-red-800',
};

export default function KanbanPage() {
  const [features, setFeatures] = useState<KanbanFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchFeatures();
  }, []);

  async function fetchFeatures() {
    try {
      const response = await api.kanban.list();
      setFeatures(response.data || []);
    } catch (error) {
      console.error('Failed to fetch features:', error);
      // Use mock data for demo
      setFeatures([
        {
          id: '1',
          title: 'Document OCR Agent',
          description: 'AI-powered OCR for W-2s and 1099s',
          workflow: 'document_scanning',
          status: 'in_progress',
          priority: 'high',
          order: 0,
        },
        {
          id: '2',
          title: 'Client Communication Automation',
          description: 'Automated email/SMS for status updates',
          workflow: 'client_communication',
          status: 'backlog',
          priority: 'medium',
          order: 1,
        },
        {
          id: '3',
          title: 'Payment Processing Integration',
          description: 'Square integration for payments',
          workflow: 'payment_processing',
          status: 'backlog',
          priority: 'medium',
          order: 2,
        },
        {
          id: '4',
          title: 'GruntWorx Replacement',
          description: 'AI OCR to replace GruntWorx ($0.45/page) - use Claude Vision',
          workflow: 'document_scanning',
          status: 'in_progress',
          priority: 'high',
          order: 3,
        },
        {
          id: '5',
          title: 'CCH Software Logging',
          description: 'Automated CCH practice management logging',
          workflow: 'cch_logging',
          status: 'review',
          priority: 'low',
          order: 4,
        },
        {
          id: '6',
          title: 'Physical Document Scanning Bottleneck',
          description: '50% of clients bring physical paper - streamline scan workflow',
          workflow: 'document_scanning',
          status: 'backlog',
          priority: 'medium',
          order: 5,
        },
        {
          id: '7',
          title: 'Twilio + ElevenLabs Phone AI',
          description: 'AI agent handles incoming calls - scheduling, status, transfers',
          workflow: 'incoming_call',
          status: 'backlog',
          priority: 'high',
          order: 6,
        },
        {
          id: '8',
          title: 'Calendly Integration',
          description: 'All appointment scheduling via Calendly - webhooks, API, sync',
          workflow: 'appointment_management',
          status: 'in_progress',
          priority: 'high',
          order: 7,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeFeature = features.find((f) => f.id === active.id);
    if (!activeFeature) return;

    // Check if dropped on a column
    const targetColumn = columns.find((c) => c.id === over.id);
    if (targetColumn && activeFeature.status !== targetColumn.id) {
      const newStatus = targetColumn.id as KanbanFeature['status'];

      // Optimistic update
      setFeatures((prev) =>
        prev.map((f) =>
          f.id === activeFeature.id ? { ...f, status: newStatus } : f
        )
      );

      // API update
      try {
        await api.kanban.update(activeFeature.id, { status: newStatus });
      } catch (error) {
        console.error('Failed to update feature status:', error);
        fetchFeatures(); // Revert on error
      }
    }
  }

  const activeFeature = activeId ? features.find((f) => f.id === activeId) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-400 hover:text-gray-600">
              <FileText className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Feature Kanban</h1>
              <p className="text-sm text-gray-500">Track implementation progress</p>
            </div>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-5 w-5" />
            Add Feature
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="p-6 overflow-x-auto">
        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading...</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 min-w-max">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  features={features.filter((f) => f.status === column.id)}
                />
              ))}
            </div>

            <DragOverlay>
              {activeFeature ? <KanbanCard feature={activeFeature} isDragging /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* New Feature Modal */}
      {showNewModal && (
        <NewFeatureModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => {
            setShowNewModal(false);
            fetchFeatures();
          }}
        />
      )}
    </div>
  );
}

function KanbanColumn({
  column,
  features,
}: {
  column: (typeof columns)[number];
  features: KanbanFeature[];
}) {
  const { setNodeRef } = useSortable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className="w-80 flex-shrink-0"
    >
      <div className={cn('rounded-t-lg px-4 py-3', column.color)}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{column.title}</h2>
          <span className="text-sm text-gray-600 bg-white/50 px-2 py-0.5 rounded">
            {features.length}
          </span>
        </div>
      </div>
      <div className="bg-gray-100 rounded-b-lg p-2 min-h-[500px]">
        <SortableContext
          items={features.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {features.map((feature) => (
              <SortableCard key={feature.id} feature={feature} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

function SortableCard({ feature }: { feature: KanbanFeature }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: feature.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <KanbanCard feature={feature} isDragging={isDragging} dragHandleProps={listeners} />
    </div>
  );
}

function KanbanCard({
  feature,
  isDragging,
  dragHandleProps,
}: {
  feature: KanbanFeature;
  isDragging?: boolean;
  dragHandleProps?: any;
}) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border p-3 cursor-pointer hover:shadow-md transition-shadow',
        isDragging && 'opacity-50 rotate-2 shadow-lg'
      )}
    >
      <div className="flex items-start gap-2">
        <div {...dragHandleProps} className="mt-1 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm">{feature.title}</h3>
          {feature.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {feature.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded',
                priorityColors[feature.priority]
              )}
            >
              {feature.priority}
            </span>
            {feature.workflow && (
              <span className="text-xs text-gray-400">
                {feature.workflow.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function NewFeatureModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    workflow: '',
    priority: 'medium' as const,
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await api.kanban.create({
        ...formData,
        status: 'backlog',
      });
      onCreated();
    } catch (error) {
      console.error('Failed to create feature:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">New Feature</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Feature title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Brief description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related Workflow
            </label>
            <input
              type="text"
              value={formData.workflow}
              onChange={(e) => setFormData({ ...formData, workflow: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., document_scanning"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value as any })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Feature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
