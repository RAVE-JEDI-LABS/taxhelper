import { Router } from 'express';
import { FirestoreService } from '../services/firestore.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { components } from '@taxhelper/shared/generated/typescript/schema';

type TaxReturn = components['schemas']['TaxReturn'];

const returnService = new FirestoreService<TaxReturn>('returns');

export const returnsRouter: Router = Router();

// List tax returns
returnsRouter.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { customerId, taxYear, status, assignedPreparer, page, limit } = req.query;

    const filters: Record<string, any> = {};
    if (customerId) filters.customerId = customerId;
    if (taxYear) filters.taxYear = parseInt(taxYear as string);
    if (status) filters.status = status;
    if (assignedPreparer) filters.assignedPreparer = assignedPreparer;

    const result = await returnService.list(filters, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get tax return by ID
returnsRouter.get('/:id', async (req, res, next) => {
  try {
    const taxReturn = await returnService.getById(req.params.id);
    if (!taxReturn) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Tax return not found' });
    }
    res.json(taxReturn);
  } catch (error) {
    next(error);
  }
});

// Create tax return
returnsRouter.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { customerId, taxYear, returnType, assignedPreparer, dueDate, routingSheet } = req.body;

    if (!customerId || !taxYear || !returnType) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'customerId, taxYear, and returnType are required',
      });
    }

    const taxReturn = await returnService.create({
      customerId,
      taxYear: parseInt(taxYear),
      returnType,
      status: 'intake',
      assignedPreparer,
      dueDate,
      extensionFiled: false,
      routingSheet,
      payment: {
        status: 'pending',
      },
    });

    res.status(201).json(taxReturn);
  } catch (error) {
    next(error);
  }
});

// Update tax return status
returnsRouter.patch('/:id/status', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'status is required',
      });
    }

    const existingReturn = await returnService.getById(req.params.id);
    if (!existingReturn) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Tax return not found' });
    }

    const updateData: Partial<TaxReturn> = { status };

    // Add notes to routing sheet if provided
    if (notes && existingReturn.routingSheet) {
      updateData.routingSheet = {
        ...existingReturn.routingSheet,
        notes: existingReturn.routingSheet.notes
          ? `${existingReturn.routingSheet.notes}\n${new Date().toISOString()}: ${notes}`
          : `${new Date().toISOString()}: ${notes}`,
      };
    }

    const taxReturn = await returnService.update(req.params.id, updateData);

    // TODO: Trigger communication agent on status change

    res.json(taxReturn);
  } catch (error) {
    next(error);
  }
});

// Update tax return
returnsRouter.patch('/:id', async (req, res, next) => {
  try {
    const taxReturn = await returnService.update(req.params.id, req.body);
    if (!taxReturn) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Tax return not found' });
    }
    res.json(taxReturn);
  } catch (error) {
    next(error);
  }
});

// Delete tax return
returnsRouter.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await returnService.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Tax return not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
