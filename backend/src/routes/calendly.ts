/**
 * Calendly Routes
 *
 * Handles:
 * - Webhooks from Calendly (event created, canceled, rescheduled)
 * - API endpoints for frontend to get scheduling links
 * - Appointment sync and management
 */

import { Router } from 'express';
import crypto from 'crypto';
import { calendlyService } from '../services/calendly.js';
import { getDb } from '../services/firebase.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export const calendlyRouter = Router();

/**
 * Verify Calendly webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Calendly Webhook Handler
 * Receives events when appointments are created, canceled, or rescheduled
 */
calendlyRouter.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['calendly-webhook-signature'] as string;
    const webhookSecret = process.env.CALENDLY_WEBHOOK_SECRET;

    // Verify signature in production
    if (webhookSecret && signature) {
      const payload = JSON.stringify(req.body);
      if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
        console.error('Invalid Calendly webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { event, payload } = req.body;

    console.log(`[Calendly Webhook] Event: ${event}`);

    switch (event) {
      case 'invitee.created':
        // New appointment booked
        await handleInviteeCreated(payload);
        break;

      case 'invitee.canceled':
        // Appointment canceled
        await handleInviteeCanceled(payload);
        break;

      case 'invitee.rescheduled':
        // Appointment rescheduled (old one canceled, new one created)
        // The new one will come as invitee.created
        await handleInviteeCanceled(payload);
        break;

      default:
        console.log(`[Calendly] Unhandled event type: ${event}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Calendly webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle new appointment booking
 */
async function handleInviteeCreated(payload: any) {
  const { scheduled_event, invitee } = payload;

  console.log(`[Calendly] New booking: ${invitee.name} (${invitee.email})`);

  // Get full event details
  const event = await calendlyService.getEvent(scheduled_event.uri);
  const invitees = await calendlyService.getEventInvitees(scheduled_event.uri);

  // Sync to Firestore
  await calendlyService.syncEventToFirestore(event, invitees);

  // Try to link to existing customer
  const db = getDb();
  const customerSnapshot = await db
    .collection('customers')
    .where('email', '==', invitee.email)
    .limit(1)
    .get();

  if (!customerSnapshot.empty) {
    const customerId = customerSnapshot.docs[0].id;
    console.log(`[Calendly] Linked to customer: ${customerId}`);

    // Update appointment with customer ID
    const eventUuid = scheduled_event.uri.split('/').pop();
    await db.collection('appointments').doc(eventUuid).update({
      customerId,
      updatedAt: new Date().toISOString(),
    });
  } else {
    console.log(`[Calendly] No matching customer found for ${invitee.email}`);
  }

  // TODO: Send confirmation email/SMS via communication agent
}

/**
 * Handle appointment cancellation
 */
async function handleInviteeCanceled(payload: any) {
  const { scheduled_event, invitee } = payload;

  console.log(`[Calendly] Cancellation: ${invitee.name} (${invitee.email})`);

  const db = getDb();
  const eventUuid = scheduled_event.uri.split('/').pop();

  // Update appointment status
  await db.collection('appointments').doc(eventUuid).update({
    status: 'cancelled',
    canceledAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // TODO: Send cancellation notification via communication agent
}

/**
 * Get scheduling links for all appointment types
 * Used by frontend and phone AI agent
 */
calendlyRouter.get('/scheduling-links', async (req: AuthenticatedRequest, res, next) => {
  try {
    const links = await calendlyService.getSchedulingLinks();
    res.json({ links });
  } catch (error) {
    next(error);
  }
});

/**
 * Get all event types (appointment types)
 */
calendlyRouter.get('/event-types', async (req: AuthenticatedRequest, res, next) => {
  try {
    const eventTypes = await calendlyService.getEventTypes();
    res.json({ data: eventTypes });
  } catch (error) {
    next(error);
  }
});

/**
 * Get upcoming appointments from Calendly
 */
calendlyRouter.get('/upcoming', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { days = '7' } = req.query;
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days as string));

    const events = await calendlyService.getScheduledEvents({
      minStartTime: now.toISOString(),
      maxStartTime: endDate.toISOString(),
      status: 'active',
    });

    res.json({ data: events });
  } catch (error) {
    next(error);
  }
});

/**
 * Get appointments for a specific customer email
 */
calendlyRouter.get('/customer/:email', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { email } = req.params;

    const events = await calendlyService.getScheduledEvents({
      inviteeEmail: email,
      status: 'active',
    });

    res.json({ data: events });
  } catch (error) {
    next(error);
  }
});

/**
 * Cancel an appointment
 */
calendlyRouter.post('/cancel/:eventUri', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { eventUri } = req.params;
    const { reason } = req.body;

    await calendlyService.cancelEvent(decodeURIComponent(eventUri), reason);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * Get availability for a specific event type
 */
calendlyRouter.get('/availability/:eventTypeUri', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { eventTypeUri } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate query parameters required',
      });
    }

    const availability = await calendlyService.getAvailability(
      decodeURIComponent(eventTypeUri),
      startDate as string,
      endDate as string
    );

    res.json({ data: availability });
  } catch (error) {
    next(error);
  }
});
