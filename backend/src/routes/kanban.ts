import { Router } from 'express';
import { FirestoreService } from '../services/firestore.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

interface KanbanFeature {
  id?: string;
  title: string;
  description?: string;
  workflow?: string;
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

const kanbanService = new FirestoreService<KanbanFeature>('kanban');

export const kanbanRouter = Router();

// List kanban features
kanbanRouter.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status, workflow } = req.query;

    const filters: Record<string, any> = {};
    if (status) filters.status = status;
    if (workflow) filters.workflow = workflow;

    const result = await kanbanService.list(filters, { limit: 100 });

    // Sort by order
    result.data.sort((a, b) => (a.order || 0) - (b.order || 0));

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get kanban feature by ID
kanbanRouter.get('/:id', async (req, res, next) => {
  try {
    const feature = await kanbanService.getById(req.params.id);
    if (!feature) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Feature not found' });
    }
    res.json(feature);
  } catch (error) {
    next(error);
  }
});

// Create kanban feature
kanbanRouter.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { title, description, workflow, status, priority } = req.body;

    if (!title) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'title is required',
      });
    }

    // Get max order for the status column
    const existingFeatures = await kanbanService.list({ status: status || 'backlog' });
    const maxOrder = Math.max(0, ...existingFeatures.data.map((f) => f.order || 0));

    const feature = await kanbanService.create({
      title,
      description,
      workflow,
      status: status || 'backlog',
      priority: priority || 'medium',
      order: maxOrder + 1,
    });

    res.status(201).json(feature);
  } catch (error) {
    next(error);
  }
});

// Update kanban feature
kanbanRouter.patch('/:id', async (req, res, next) => {
  try {
    const feature = await kanbanService.update(req.params.id, req.body);
    if (!feature) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Feature not found' });
    }
    res.json(feature);
  } catch (error) {
    next(error);
  }
});

// Delete kanban feature
kanbanRouter.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await kanbanService.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Feature not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Reorder kanban features
kanbanRouter.post('/reorder', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { featureIds } = req.body;

    if (!Array.isArray(featureIds)) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'featureIds array is required',
      });
    }

    // Update order for each feature
    const updates = featureIds.map((id: string, index: number) =>
      kanbanService.update(id, { order: index })
    );

    await Promise.all(updates);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
