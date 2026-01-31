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

// Store active conversations by call SID
const activeConversations = new Map<string, ElevenLabsConversation>();

interface CallLog {
  id?: string;
  callSid: string;
  from: string;
  to: string;
  direction: 'inbound' | 'outbound';
  status: 'in-progress' | 'completed' | 'failed' | 'no-answer' | 'busy';
  startTime: string;
  endTime?: string;
  duration?: number;
  intent?: Intent;
  transcript?: string[];
  transcriptSummary?: string;
  resolution: 'ai-resolved' | 'transferred' | 'voicemail' | 'abandoned';
  recordingUrl?: string;
  customerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SmsLog {
  id?: string;
  messageSid: string;
  from: string;
  to: string;
  body: string;
  direction: 'inbound' | 'outbound';
  status: 'received' | 'sent' | 'delivered' | 'failed';
  customerId?: string;
  customerName?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  available: boolean;
}

const callLogService = new FirestoreService<CallLog>('call_logs');
const smsLogService = new FirestoreService<SmsLog>('sms_logs');
const customerService = new FirestoreService<{ id?: string; phone?: string; name?: string }>('customers');

export const twilioRouter: Router = Router();

// Middleware to validate Twilio signatures
const validateSignature = (req: Request, res: Response, next: Function) => {
  const signature = req.headers['x-twilio-signature'] as string;
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  // Skip validation in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  if (!validateTwilioSignature(signature, url, req.body)) {
    console.warn('[Twilio] Invalid signature from:', req.ip);
    return res.status(403).send('Invalid signature');
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

const SMS_SYSTEM_PROMPT = `You are a friendly AI assistant for Gordon Ulen CPA, a tax preparation firm in Amesbury, MA.

You're texting with clients. Keep responses SHORT (under 160 chars when possible, max 320).

You can help with:
- Office hours: Mon-Fri 9am-5pm, Sat 9am-12pm (tax season)
- Address: 6 Chestnut St Suite 106, Amesbury, MA 01913
- Phone: (978) 372-7050
- Scheduling appointments
- Answering questions about tax documents needed
- Directing them to the client portal

NEVER share specific tax amounts or financial details via text.
If they need detailed help, suggest calling or visiting the portal.
Be warm and professional. Use casual texting style but stay professional.`;

async function getOpenAIResponse(messages: { role: string; content: string }[]): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
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
      customerName: customer?.name,
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
    const customerContext = customer?.name
      ? `[Texting with ${customer.name}, existing client] `
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
      if (staff) {
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
      // TODO: Look up return status and provide to conversation
      console.log('[Twilio] Look up status:', action.params);
      conversation.setIntent('status_inquiry');
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
  // Check office hours
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  // Closed on weekends
  if (day === 0 || day === 6) {
    return true;
  }

  // Office hours: 9 AM - 5 PM
  if (hour < 9 || hour >= 17) {
    return true;
  }

  // TODO: Check staff availability in Firestore

  return false;
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
