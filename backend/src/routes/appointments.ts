import { Router } from 'express';
import { FirestoreService } from '../services/firestore.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import {
  requireStaff,
  requireAdmin,
  loadCustomerContext,
  filterByOwnership,
  verifyOwnership,
} from '../middleware/authorization.js';
import type { components } from '@taxhelper/shared/generated/typescript/schema';

type Appointment = components['schemas']['Appointment'];

const appointmentService = new FirestoreService<Appointment>('appointments');

export const appointmentsRouter: Router = Router();

// Apply customer context loading to all routes
appointmentsRouter.use(loadCustomerContext());

// List appointments - Staff sees all, customers see only their own
appointmentsRouter.get('/', filterByOwnership(), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { customerId, assignedTo, status, startDate, endDate, page, limit } = req.query;

    const filters: Record<string, any> = {};
    if (customerId) filters.customerId = customerId;
    if (assignedTo) filters.assignedTo = assignedTo;
    if (status) filters.status = status;

    const result = await appointmentService.list(filters, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    // Filter by date range if provided
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate as string) : new Date(0);
      const end = endDate ? new Date(endDate as string) : new Date('2100-01-01');

      result.data = result.data.filter((apt) => {
        if (!apt.scheduledAt) return false;
        const aptDate = new Date(apt.scheduledAt);
        return aptDate >= start && aptDate <= end;
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get appointment by ID - Staff or customer accessing own appointment
appointmentsRouter.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const appointment = await appointmentService.getById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Appointment not found' });
    }

    // Authorization: Staff can view any, customers can only view their own
    if (!verifyOwnership(req, appointment.customerId)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You do not have access to this appointment',
      });
    }

    res.json(appointment);
  } catch (error) {
    next(error);
  }
});

// Create appointment - Staff can create for anyone, customers can create for themselves
appointmentsRouter.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { customerId, type, scheduledAt, duration, assignedTo, notes } = req.body;

    if (!customerId || !type || !scheduledAt) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'customerId, type, and scheduledAt are required',
      });
    }

    // Authorization: Staff can create for anyone, customers can only create for themselves
    if (!verifyOwnership(req, customerId)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You can only create appointments for your own account',
      });
    }

    const appointment = await appointmentService.create({
      customerId,
      type,
      scheduledAt,
      duration: duration || 60,
      assignedTo,
      status: 'scheduled',
      reminderSent: false,
      notes,
    });

    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
});

// Update appointment - Staff only
appointmentsRouter.patch('/:id', requireStaff(), async (req, res, next) => {
  try {
    const appointment = await appointmentService.update(req.params.id, req.body);
    if (!appointment) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (error) {
    next(error);
  }
});

// Delete (cancel) appointment - Staff only
appointmentsRouter.delete('/:id', requireStaff(), async (req, res, next) => {
  try {
    // Soft delete by updating status to cancelled
    const appointment = await appointmentService.update(req.params.id, { status: 'cancelled' });
    if (!appointment) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Appointment not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
