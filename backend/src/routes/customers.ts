import { Router } from 'express';
import { FirestoreService } from '../services/firestore.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

interface Customer {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  addresses?: Array<{
    type: 'home' | 'mailing' | 'business';
    street: string;
    city: string;
    state: string;
    zip: string;
  }>;
  entityType?: 'individual' | 's-corp' | 'partnership' | 'c-corp' | 'llc' | 'schedule-c';
  ein?: string;
  ssnEncrypted?: string;
  assignedPreparer?: string;
  bankingInfo?: {
    routingNumber: string;
    accountNumber: string;
    lastVerified?: string;
  };
  portalAccess?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const customerService = new FirestoreService<Customer>('customers');

export const customersRouter: Router = Router();

// List customers
customersRouter.get('/', async (req: AuthenticatedRequest, res, next) => {
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

// Get customer by ID
customersRouter.get('/:id', async (req, res, next) => {
  try {
    const customer = await customerService.getById(req.params.id);
    if (!customer) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// Create customer
customersRouter.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { firstName, lastName, email, phone, addresses, entityType, ein, assignedPreparer, portalAccess } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'firstName, lastName, and email are required',
      });
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
    });

    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
});

// Update customer
customersRouter.patch('/:id', async (req, res, next) => {
  try {
    const customer = await customerService.update(req.params.id, req.body);
    if (!customer) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// Delete customer
customersRouter.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await customerService.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Customer not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
