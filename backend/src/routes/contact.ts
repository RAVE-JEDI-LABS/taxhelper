import { Router } from 'express';
import type { Request, Response } from 'express';
import { FirestoreService } from '../services/firestore.js';

interface ContactSubmission {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  userId?: string;
  userEmail?: string;
  customerId?: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  source: 'website' | 'portal';
  createdAt?: string;
  updatedAt?: string;
}

const contactService = new FirestoreService<ContactSubmission>('contact_submissions');
const customerService = new FirestoreService<{ id?: string; email?: string; phone?: string }>('customers');

export const contactRouter: Router = Router();

/**
 * POST /api/contact
 * Submit a contact form - logs to Firestore with user ID if authenticated
 */
contactRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    // Check if user is authenticated (from auth middleware)
    const user = (req as any).user;
    let customerId: string | undefined;

    // Try to find existing customer by email or phone
    let customer = await customerService.findOne({ email });
    if (!customer && phone) {
      customer = await customerService.findOne({ phone });
    }
    if (customer) {
      customerId = customer.id;
    }

    // Create contact submission
    const submission = await contactService.create({
      name,
      email,
      phone: phone || undefined,
      message,
      userId: user?.uid,
      userEmail: user?.email,
      customerId,
      status: 'new',
      source: user ? 'portal' : 'website',
    });

    console.log(`[Contact] New submission from ${name} (${email})${customerId ? ` - Customer: ${customerId}` : ''}`);

    res.json({ success: true, id: submission.id });
  } catch (error) {
    console.error('[Contact] Error saving submission:', error);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

/**
 * GET /api/contact
 * List all contact submissions (staff only)
 */
contactRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const filters: Record<string, any> = {};

    if (status) {
      filters.status = status;
    }

    const result = await contactService.list(filters, {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });

    res.json(result);
  } catch (error) {
    console.error('[Contact] Error listing submissions:', error);
    res.status(500).json({ error: 'Failed to list contact submissions' });
  }
});

/**
 * PATCH /api/contact/:id
 * Update contact submission status
 */
contactRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await contactService.update(id, { status });
    if (!updated) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('[Contact] Error updating submission:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});
