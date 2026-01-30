import { Router } from 'express';
import { FirestoreService } from '../services/firestore.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { components } from '@taxhelper/shared/generated/typescript/schema';

type Communication = components['schemas']['Communication'];

const communicationService = new FirestoreService<Communication>('communications');

export const communicationsRouter: Router = Router();

// List communications
communicationsRouter.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { customerId, type, page, limit } = req.query;

    const filters: Record<string, any> = {};
    if (customerId) filters.customerId = customerId;
    if (type) filters.type = type;

    const result = await communicationService.list(filters, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Send communication
communicationsRouter.post('/send', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { customerId, type, subject, content, triggeredBy } = req.body;

    if (!customerId || !type || !content) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'customerId, type, and content are required',
      });
    }

    // TODO: Integrate with actual email/SMS services
    // For now, just log the communication

    const communication = await communicationService.create({
      customerId,
      type,
      direction: 'outbound',
      subject,
      content,
      sentAt: new Date().toISOString(),
      status: 'sent', // Would be 'pending' until delivery confirmation
      triggeredBy: triggeredBy || 'manual',
    });

    // Log for demo purposes
    console.log(`[Communication] ${type.toUpperCase()} to customer ${customerId}:`, {
      subject,
      content: content.substring(0, 100) + '...',
    });

    res.status(201).json(communication);
  } catch (error) {
    next(error);
  }
});

// Record inbound communication
communicationsRouter.post('/inbound', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { customerId, type, subject, content } = req.body;

    if (!customerId || !type || !content) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'customerId, type, and content are required',
      });
    }

    const communication = await communicationService.create({
      customerId,
      type,
      direction: 'inbound',
      subject,
      content,
      sentAt: new Date().toISOString(),
      status: 'delivered',
      triggeredBy: 'manual',
    });

    res.status(201).json(communication);
  } catch (error) {
    next(error);
  }
});
