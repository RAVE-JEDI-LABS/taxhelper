import { Router, Request, Response } from 'express';
import { FirestoreService } from '../services/firestore.js';
import {
  validateTwilioSignature,
  generateStreamTwiML,
  generateTransferTwiML,
  generateVoicemailTwiML,
  generateHangupTwiML,
  generateWhisperTwiML,
  updateCall,
  sendSms,
} from '../services/twilio.js';
import { createConversation, ElevenLabsConversation, Intent, AgentAction } from '../services/elevenlabs.js';
import { buildSystemPrompt } from '@taxhelper/shared/prompts';
import type { components } from '@taxhelper/shared/generated/typescript/schema';

type CallLog = components['schemas']['CallLog'];
type SmsLog = components['schemas']['SmsLog'];
type StaffMember = components['schemas']['StaffMember'];
type TaxReturn = components['schemas']['TaxReturn'];
type Customer = components['schemas']['Customer'];

// Helper to get full name from customer
function getCustomerName(customer: Customer | null | undefined): string | undefined {
  if (!customer) return undefined;
  if (customer.firstName && customer.lastName) {
    return `${customer.firstName} ${customer.lastName}`;
  }
  return customer.firstName || customer.lastName || undefined;
}

// Store active conversations by call SID
const activeConversations = new Map<string, ElevenLabsConversation>();

const callLogService = new FirestoreService<CallLog>('call_logs');
const smsLogService = new FirestoreService<SmsLog>('sms_logs');
const customerService = new FirestoreService<Customer>('customers');
const taxReturnService = new FirestoreService<TaxReturn>('returns');

export const twilioRouter: Router = Router();

// Middleware to validate Twilio signatures
const validateSignature = (req: Request, res: Response, next: Function) => {
  // Skip validation in development mode if explicitly configured
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_TWILIO_VALIDATION === 'true') {
    console.warn('[Twilio] Skipping signature validation (development mode)');
    return next();
  }

  const signature = req.headers['x-twilio-signature'] as string;

  if (!signature) {
    console.error('[Twilio] Missing X-Twilio-Signature header');
    return res.status(403).json({ error: 'Missing Twilio signature' });
  }

  // Use configured API_BASE_URL for signature validation
  // This fixes the URL mismatch between Cloud Run internal URL and Twilio's expected URL
  const baseUrl = process.env.API_BASE_URL || `https://${req.get('host')}`;
  const fullUrl = `${baseUrl}${req.originalUrl}`;

  const isValid = validateTwilioSignature(signature, fullUrl, req.body);

  if (!isValid) {
    console.error('[Twilio] Invalid signature for URL:', fullUrl);
    return res.status(403).json({ error: 'Invalid Twilio signature' });
  }

  next();
};

// Apply signature validation to all routes
twilioRouter.use(validateSignature);

/**
 * POST /api/twilio/incoming
 * Handle incoming phone calls - main entry point
 */
twilioRouter.post('/incoming', async (req: Request, res: Response) => {
  try {
    const { CallSid, From, To, Direction, CallStatus } = req.body;

    console.log(`[Twilio] Incoming call: ${CallSid} from ${From}`);

    // Create call log
    await callLogService.create({
      callSid: CallSid,
      from: From,
      to: To,
      direction: Direction === 'inbound' ? 'inbound' : 'outbound',
      status: 'in-progress',
      startTime: new Date().toISOString(),
      resolution: 'ai-resolved', // Default, will be updated
    });

    // Try to find existing customer by phone
    const customer = await customerService.findOne({ phone: From });
    if (customer) {
      console.log(`[Twilio] Found existing customer: ${customer.id}`);
    }

    // Check if we should go to voicemail (office closed, no staff available)
    const shouldVoicemail = await checkShouldVoicemail();
    if (shouldVoicemail) {
      const twiml = generateVoicemailTwiML('/api/twilio/recording');
      res.type('text/xml').send(twiml);
      return;
    }

    // Generate TwiML to connect to ElevenLabs via WebSocket
    const wsUrl = `wss://${req.get('host')}/api/twilio/stream`;
    const twiml = generateStreamTwiML(CallSid, wsUrl);

    res.type('text/xml').send(twiml);
  } catch (error) {
    console.error('[Twilio] Error handling incoming call:', error);
    const twiml = generateVoicemailTwiML('/api/twilio/recording');
    res.type('text/xml').send(twiml);
  }
});

/**
 * POST /api/twilio/status
 * Handle call status updates
 */
twilioRouter.post('/status', async (req: Request, res: Response) => {
  try {
    const { CallSid, CallStatus, CallDuration, RecordingUrl } = req.body;

    console.log(`[Twilio] Call ${CallSid} status: ${CallStatus}`);

    // Get the conversation if it exists
    const conversation = activeConversations.get(CallSid);

    // Update call log
    const existingLog = await callLogService.findOne({ callSid: CallSid });
    if (existingLog) {
      await callLogService.update(existingLog.id!, {
        status: CallStatus,
        endTime: new Date().toISOString(),
        duration: parseInt(CallDuration) || 0,
        recordingUrl: RecordingUrl,
        transcript: conversation?.getTranscript(),
        intent: conversation?.getIntent() || undefined,
      });
    }

    // Cleanup conversation
    if (conversation) {
      await conversation.disconnect();
      activeConversations.delete(CallSid);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('[Twilio] Error handling status callback:', error);
    res.sendStatus(500);
  }
});

/**
 * POST /api/twilio/recording
 * Handle recording completion
 */
twilioRouter.post('/recording', async (req: Request, res: Response) => {
  try {
    const { CallSid, RecordingUrl, RecordingDuration } = req.body;

    console.log(`[Twilio] Recording for call ${CallSid}: ${RecordingUrl}`);

    // Update call log with recording
    const existingLog = await callLogService.findOne({ callSid: CallSid });
    if (existingLog) {
      await callLogService.update(existingLog.id!, {
        recordingUrl: RecordingUrl,
        resolution: 'voicemail',
      });
    }

    // Return TwiML to end the call
    const twiml = generateHangupTwiML('Thank you for your message. Goodbye.');
    res.type('text/xml').send(twiml);
  } catch (error) {
    console.error('[Twilio] Error handling recording:', error);
    res.sendStatus(500);
  }
});

/**
 * POST /api/twilio/transcription
 * Handle voicemail transcription
 */
twilioRouter.post('/transcription', async (req: Request, res: Response) => {
  try {
    const { CallSid, TranscriptionText, TranscriptionStatus } = req.body;

    console.log(`[Twilio] Transcription for call ${CallSid}: ${TranscriptionStatus}`);

    if (TranscriptionStatus === 'completed' && TranscriptionText) {
      // Update call log with transcription
      const existingLog = await callLogService.findOne({ callSid: CallSid });
      if (existingLog) {
        await callLogService.update(existingLog.id!, {
          transcriptSummary: TranscriptionText,
        });
      }

      // TODO: Create follow-up task based on transcription
      // TODO: Send notification to staff
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('[Twilio] Error handling transcription:', error);
    res.sendStatus(500);
  }
});

/**
 * POST /api/twilio/transfer-status
 * Handle transfer completion/failure
 */
twilioRouter.post('/transfer-status', async (req: Request, res: Response) => {
  try {
    const { CallSid, DialCallStatus } = req.body;

    console.log(`[Twilio] Transfer status for ${CallSid}: ${DialCallStatus}`);

    // If transfer failed, offer callback or voicemail
    if (DialCallStatus !== 'completed') {
      const twiml = generateVoicemailTwiML('/api/twilio/recording');
      res.type('text/xml').send(twiml);
      return;
    }

    res.type('text/xml').send('<Response></Response>');
  } catch (error) {
    console.error('[Twilio] Error handling transfer status:', error);
    res.sendStatus(500);
  }
});

/**
 * POST /api/twilio/whisper
 * Whisper context to staff before connecting
 */
twilioRouter.post('/whisper', async (req: Request, res: Response) => {
  try {
    const { text } = req.query;
    const whisperText = text
      ? `Incoming transfer: ${text}`
      : 'Incoming call transfer from AI assistant.';

    const twiml = generateWhisperTwiML(whisperText);
    res.type('text/xml').send(twiml);
  } catch (error) {
    console.error('[Twilio] Error generating whisper:', error);
    res.sendStatus(500);
  }
});

// Store SMS conversation history by phone number
const smsConversations = new Map<string, { role: string; content: string }[]>();

// Use centralized SMS prompt from shared package
const SMS_SYSTEM_PROMPT = buildSystemPrompt('sms');

async function getOpenAIResponse(messages: { role: string; content: string }[]): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SMS_SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 150,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content || 'Sorry, I could not respond. Please call (978) 372-7050.';
}

/**
 * POST /api/twilio/sms
 * Handle incoming SMS messages with AI conversation
 */
twilioRouter.post('/sms', async (req: Request, res: Response) => {
  try {
    const { MessageSid, From, To, Body } = req.body;

    console.log(`[Twilio] Incoming SMS from ${From}: ${Body}`);

    // Try to find existing customer by phone
    const customer = await customerService.findOne({ phone: From });

    // Log the SMS with customer info
    await smsLogService.create({
      messageSid: MessageSid,
      from: From,
      to: To,
      body: Body,
      direction: 'inbound',
      status: 'received',
      customerId: customer?.id,
      customerName: getCustomerName(customer),
    });

    // Get or create conversation history for this phone number
    let conversation = smsConversations.get(From) || [];

    // Add the new message
    conversation.push({ role: 'user', content: Body });

    // Keep only last 10 messages to avoid token limits
    if (conversation.length > 10) {
      conversation = conversation.slice(-10);
    }

    // Add customer context if we found them
    const customerName = getCustomerName(customer);
    const customerContext = customerName
      ? `[Texting with ${customerName}, existing client] `
      : '[New/unknown caller] ';

    // Prepend context to first user message for AI
    if (conversation.length === 1) {
      conversation[0] = {
        role: 'user',
        content: customerContext + conversation[0].content,
      };
    }

    // Get AI response
    let replyMessage: string;
    try {
      replyMessage = await getOpenAIResponse(conversation);
    } catch (error) {
      console.error('[Twilio] OpenAI error:', error);
      replyMessage = 'Thanks for your message! For assistance, please call (978) 372-7050.';
    }

    // Add assistant response to history
    conversation.push({ role: 'assistant', content: replyMessage });
    smsConversations.set(From, conversation);

    // Send TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${replyMessage}</Message>
</Response>`;

    res.type('text/xml').send(twiml);
  } catch (error) {
    console.error('[Twilio] Error handling SMS:', error);
    res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  }
});

/**
 * POST /api/twilio/sms/send
 * Send an outbound SMS (for staff to reply to customers)
 */
twilioRouter.post('/sms/send', async (req: Request, res: Response) => {
  try {
    const { to, body } = req.body;

    if (!to || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, body' });
    }

    console.log(`[Twilio] Sending SMS to ${to}: ${body}`);

    const messageSid = await sendSms(to, body);

    // Log the outbound SMS
    await smsLogService.create({
      messageSid,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
      body,
      direction: 'outbound',
      status: 'sent',
    });

    res.json({ success: true, messageSid });
  } catch (error: any) {
    console.error('[Twilio] Error sending SMS:', error?.message || error);
    res.status(500).json({ error: 'Failed to send SMS', details: error?.message });
  }
});

/**
 * POST /api/twilio/sms/status
 * Handle SMS delivery status updates
 */
twilioRouter.post('/sms/status', async (req: Request, res: Response) => {
  try {
    const { MessageSid, MessageStatus } = req.body;

    console.log(`[Twilio] SMS ${MessageSid} status: ${MessageStatus}`);

    // Update SMS log status
    const existingLog = await smsLogService.findOne({ messageSid: MessageSid });
    if (existingLog) {
      await smsLogService.update(existingLog.id!, {
        status: MessageStatus as SmsLog['status'],
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('[Twilio] Error handling SMS status:', error);
    res.sendStatus(500);
  }
});

/**
 * Normalize phone number to E.164 format for consistent lookups
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If it's a 10-digit US number, add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If it's 11 digits starting with 1, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // Return with + if not already there
  return phone.startsWith('+') ? phone : `+${digits}`;
}

/**
 * Format tax return status into a human-readable message
 * IMPORTANT: Never disclose specific dollar amounts
 */
function formatTaxReturnStatus(taxReturn: TaxReturn, customerName: string): string {
  const statusMessages: Record<string, string> = {
    intake: `${customerName}, your return for ${taxReturn.taxYear} is in our intake queue. We'll begin processing it shortly.`,
    documents_pending: `${customerName}, we're still waiting on some documents for your ${taxReturn.taxYear} return. Please check your portal or contact us for a list of what's needed.`,
    documents_complete: `Great news, ${customerName}! We have all your documents for ${taxReturn.taxYear}. Your return is queued for preparation.`,
    in_preparation: `${customerName}, your ${taxReturn.taxYear} return is currently being prepared by our team.`,
    review_needed: `${customerName}, your ${taxReturn.taxYear} return is in review. We may reach out if we have any questions.`,
    waiting_on_client: `${customerName}, your ${taxReturn.taxYear} return is on hold - we need some additional information from you. Please check your portal or give us a call.`,
    ready_for_signing: `${customerName}, great news! Your ${taxReturn.taxYear} return is ready for your review and signature. Would you like to schedule an appointment to come in?`,
    completed: `${customerName}, your ${taxReturn.taxYear} return has been completed. Please stop by to pick up your copies if you haven't already.`,
    filed: `${customerName}, your ${taxReturn.taxYear} return has been filed with the IRS. You should receive confirmation within a few weeks.`,
    picked_up: `${customerName}, according to our records, you've already picked up your ${taxReturn.taxYear} return. Let us know if you need anything else!`,
    extension_needed: `${customerName}, it looks like we need to file an extension for your ${taxReturn.taxYear} return. Please contact us to discuss the details.`,
    extension_filed: `${customerName}, we've filed an extension for your ${taxReturn.taxYear} return. You'll have until October 15th to complete filing.`,
  };

  const status = taxReturn.status || 'intake';
  return statusMessages[status] ||
    `${customerName}, your ${taxReturn.taxYear} return is currently being processed. Status: ${status}`;
}

/**
 * Handle AI agent actions
 */
async function handleAgentAction(
  callSid: string,
  action: AgentAction,
  conversation: ElevenLabsConversation
): Promise<void> {
  console.log(`[Twilio] Agent action for ${callSid}:`, action);

  switch (action.action) {
    case 'transfer':
      // Get available staff member
      const staff = await getAvailableStaff();
      if (staff && staff.phone) {
        const whisper = action.params?.reason || 'Customer requested transfer';
        const twiml = generateTransferTwiML(staff.phone, whisper);
        await updateCall(callSid, twiml);

        // Update call log
        const log = await callLogService.findOne({ callSid });
        if (log) {
          await callLogService.update(log.id!, { resolution: 'transferred' });
        }
      } else {
        // No staff available, go to voicemail
        const twiml = generateVoicemailTwiML('/api/twilio/recording');
        await updateCall(callSid, twiml);
      }
      break;

    case 'schedule':
      // TODO: Integrate with appointments service
      console.log('[Twilio] Schedule appointment:', action.params);
      conversation.setIntent('appointment_scheduling');
      break;

    case 'lookup_status':
      console.log('[Twilio] Look up status:', action.params);
      conversation.setIntent('status_inquiry');

      // Try to find customer by phone or name from action params
      const lookupPhone = action.params?.phone;
      const lookupName = action.params?.name;

      let statusCustomer = null;

      // First try phone number lookup
      if (lookupPhone) {
        const normalizedPhone = normalizePhoneNumber(lookupPhone);
        statusCustomer = await customerService.findOne({ phone: normalizedPhone });
      }

      // If no phone match, try name lookup (search by lastName as a simple approach)
      if (!statusCustomer && lookupName) {
        // Search by lastName (Firestore doesn't support case-insensitive or full-text search directly)
        statusCustomer = await customerService.findOne({ lastName: lookupName });
      }

      if (statusCustomer) {
        const statusCustomerName = getCustomerName(statusCustomer) || 'Customer';
        console.log(`[Twilio] Found customer for status lookup: ${statusCustomer.id} (${statusCustomerName})`);

        // Get their tax returns - get the most recent year
        const currentYear = new Date().getFullYear();
        let taxReturn = await taxReturnService.findOne({
          customerId: statusCustomer.id!,
          taxYear: currentYear
        });

        // If no current year return, try previous year
        if (!taxReturn) {
          taxReturn = await taxReturnService.findOne({
            customerId: statusCustomer.id!,
            taxYear: currentYear - 1
          });
        }

        if (taxReturn) {
          const statusMessage = formatTaxReturnStatus(taxReturn, statusCustomerName);
          console.log(`[Twilio] Tax return status for ${statusCustomerName}: ${taxReturn.status}`);

          // Inject the status into the ElevenLabs conversation
          conversation.injectContext(statusMessage);
          conversation.setCustomerId(statusCustomer.id!);
        } else {
          console.log(`[Twilio] No tax return found for customer ${statusCustomer.id}`);
          conversation.injectContext(
            `I found your account, ${statusCustomerName}, but I don't see a tax return on file for this year. Would you like to schedule an appointment to get started?`
          );
        }
      } else {
        console.log('[Twilio] Could not find customer for status lookup');
        conversation.injectContext(
          "I wasn't able to find your account with that information. Can you please verify your name and the phone number on file with us?"
        );
      }
      break;

    case 'end_call':
      const endMessage =
        action.params?.summary ||
        'Thank you for calling Gordon Ulen CPA. Have a great day!';
      const twiml = generateHangupTwiML(endMessage);
      await updateCall(callSid, twiml);
      break;

    case 'voicemail':
      const vmTwiml = generateVoicemailTwiML('/api/twilio/recording');
      await updateCall(callSid, vmTwiml);
      break;
  }
}

/**
 * Check if we should go directly to voicemail
 */
async function checkShouldVoicemail(): Promise<boolean> {
  // TODO: Re-enable office hours check after testing
  // For now, always allow calls through to ElevenLabs AI
  return false;

  /*
  // Check office hours (Eastern Time)
  const now = new Date();
  // Convert to Eastern Time (UTC-5 or UTC-4 during DST)
  const etOffset = -5; // Standard time, adjust for DST if needed
  const etHour = (now.getUTCHours() + 24 + etOffset) % 24;
  const day = now.getUTCDay();

  // Closed on weekends
  if (day === 0 || day === 6) {
    return true;
  }

  // Office hours: 9 AM - 5 PM ET
  if (etHour < 9 || etHour >= 17) {
    return true;
  }

  return false;
  */
}

/**
 * Get an available staff member
 */
async function getAvailableStaff(): Promise<StaffMember | null> {
  // TODO: Implement round-robin or priority-based routing
  // For now, return a placeholder
  const staffPhone = process.env.STAFF_PHONE_NUMBER;
  if (!staffPhone) {
    return null;
  }

  return {
    id: 'default',
    name: 'Front Desk',
    phone: staffPhone,
    available: true,
  };
}

// Export for WebSocket server setup
export { activeConversations, handleAgentAction };
