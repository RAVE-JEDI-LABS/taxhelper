import { Router } from 'express';
import { FirestoreService } from '../services/firestore.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import {
  requirePreparer,
  requireAdmin,
  loadCustomerContext,
  filterByOwnership,
  isCustomer,
  verifyOwnership,
} from '../middleware/authorization.js';
import { validateForeignKeys } from '../services/validation.js';
import { deleteReturnCascade } from '../services/cascade-delete.js';
import type { components } from '@taxhelper/shared/generated/typescript/schema';

type TaxReturn = components['schemas']['TaxReturn'];

const returnService = new FirestoreService<TaxReturn>('returns');

export const returnsRouter: Router = Router();

// Apply customer context loading to all routes
returnsRouter.use(loadCustomerContext());

// List tax returns - Staff sees all, customers see only their own
returnsRouter.get('/', filterByOwnership(), async (req: AuthenticatedRequest, res, next) => {
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

// Get tax return by ID - Staff or customer accessing own return
returnsRouter.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const taxReturn = await returnService.getById(req.params.id);
    if (!taxReturn) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Tax return not found' });
    }

    // Authorization: Staff can view any, customers can only view their own
    if (!verifyOwnership(req, taxReturn.customerId)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You do not have access to this tax return',
      });
    }

    res.json(taxReturn);
  } catch (error) {
    next(error);
  }
});

// Create tax return - Preparers only
returnsRouter.post('/', requirePreparer(), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { customerId, taxYear, returnType, assignedPreparer, dueDate, routingSheet } = req.body;

    if (!customerId || !taxYear || !returnType) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'customerId, taxYear, and returnType are required',
      });
    }

    // Validate foreign keys
    const validation = await validateForeignKeys({
      customerId,
      assignedPreparer,
    });

    if (!validation.valid) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Foreign key validation failed',
        details: { errors: validation.errors },
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

// Update tax return status - Preparers only
returnsRouter.patch('/:id/status', requirePreparer(), async (req: AuthenticatedRequest, res, next) => {
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

// Update tax return - Preparers only
returnsRouter.patch('/:id', requirePreparer(), async (req, res, next) => {
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

// Delete tax return - Admin only (cascading delete includes related documents)
returnsRouter.delete('/:id', requireAdmin(), async (req, res, next) => {
  try {
    const result = await deleteReturnCascade(req.params.id);

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return res.status(404).json({ code: 'NOT_FOUND', message: result.error });
      }
      return res.status(500).json({ code: 'DELETE_FAILED', message: result.error });
    }

    console.log(`Cascade deleted return ${req.params.id}:`, result.deleted);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
