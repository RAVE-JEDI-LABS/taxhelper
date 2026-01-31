import { Router } from 'express';
import { FirestoreService } from '../services/firestore.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import {
  requireStaff,
  requireAdmin,
  loadCustomerContext,
  requireResourceOwnership,
  isStaff,
  isCustomer,
  verifyOwnership,
} from '../middleware/authorization.js';
import { deleteCustomerCascade, previewCustomerDelete } from '../services/cascade-delete.js';
import { validateUserExists } from '../services/validation.js';
import type { components } from '@taxhelper/shared/generated/typescript/schema';

type Customer = components['schemas']['Customer'];

const customerService = new FirestoreService<Customer>('customers');

export const customersRouter: Router = Router();

// Apply customer context loading to all routes
customersRouter.use(loadCustomerContext());

// List customers - Staff only
customersRouter.get('/', requireStaff(), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page, limit, search, entityType } = req.query;

    const filters: Record<string, any> = {};
    if (entityType) filters.entityType = entityType;

    const result = await customerService.list(filters, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    // Filter by search if provided (client-side filtering for now)
    if (search) {
      const searchLower = (search as string).toLowerCase();
      result.data = result.data.filter(
        (c) =>
          c.firstName.toLowerCase().includes(searchLower) ||
          c.lastName.toLowerCase().includes(searchLower) ||
          c.email.toLowerCase().includes(searchLower)
      );
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get customer by ID - Staff or customer accessing own record
customersRouter.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const customer = await customerService.getById(req.params.id);
    if (!customer) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Customer not found' });
    }

    // Authorization: Staff can view any, customers can only view their own
    if (!verifyOwnership(req, req.params.id)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You do not have access to this customer record',
      });
    }

    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// Create customer - Staff only
customersRouter.post('/', requireStaff(), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { firstName, lastName, email, phone, addresses, entityType, ein, assignedPreparer, portalAccess, firebaseUid } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'firstName, lastName, and email are required',
      });
    }

    // Validate assigned preparer exists if provided
    if (assignedPreparer) {
      const validation = await validateUserExists(assignedPreparer);
      if (!validation.valid) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Assigned preparer not found',
          details: { errors: validation.errors },
        });
      }
    }

    const customer = await customerService.create({
      firstName,
      lastName,
      email,
      phone,
      addresses,
      entityType: entityType || 'individual',
      ein,
      assignedPreparer,
      portalAccess: portalAccess || false,
      firebaseUid,
    });

    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
});

// Update customer - Staff can update any, customers can update own (limited fields)
customersRouter.patch('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const customerId = req.params.id;

    // Check if customer exists
    const existingCustomer = await customerService.getById(customerId);
    if (!existingCustomer) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Customer not found' });
    }

    // Authorization check
    if (!verifyOwnership(req, customerId)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You do not have access to update this customer record',
      });
    }

    // If customer is updating their own record, restrict which fields they can update
    if (isCustomer(req)) {
      const sensitiveFields = ['assignedPreparer', 'ssnEncrypted', 'bankingInfo', 'firebaseUid', 'portalAccess', 'role'];
      const requestedFields = Object.keys(req.body);
      const forbiddenFields = requestedFields.filter((f) => sensitiveFields.includes(f));

      if (forbiddenFields.length > 0) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: `Customers cannot update the following fields: ${forbiddenFields.join(', ')}`,
        });
      }
    }

    const customer = await customerService.update(customerId, req.body);
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// Preview delete - Admin only (shows what would be deleted)
customersRouter.get('/:id/delete-preview', requireAdmin(), async (req, res, next) => {
  try {
    const preview = await previewCustomerDelete(req.params.id);
    if (!preview) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Customer not found' });
    }
    res.json({
      message: 'This action will delete the following records:',
      preview,
    });
  } catch (error) {
    next(error);
  }
});

// Delete customer - Admin only (cascading delete)
customersRouter.delete('/:id', requireAdmin(), async (req, res, next) => {
  try {
    const result = await deleteCustomerCascade(req.params.id);

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return res.status(404).json({ code: 'NOT_FOUND', message: result.error });
      }
      return res.status(500).json({ code: 'DELETE_FAILED', message: result.error });
    }

    // Return 204 No Content on success, but log what was deleted
    console.log(`Cascade deleted customer ${req.params.id}:`, result.deleted);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
