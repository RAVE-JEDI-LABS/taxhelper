import { Router } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { FirestoreService } from '../services/firestore.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface ChatLog {
  id?: string;
  sessionId: string;
  customerId?: string;
  customerPhone?: string;
  channel: 'web' | 'sms';
  messages: { role: string; content: string; timestamp: string }[];
  createdAt?: string;
  updatedAt?: string;
}

const chatLogService = new FirestoreService<ChatLog>('chat_logs');
const customerService = new FirestoreService<{ id?: string; phone?: string; name?: string; email?: string }>('customers');

const STAFF_SYSTEM_PROMPT = `You are a helpful AI assistant for Gordon Ulen CPA's TaxHelper application. You help staff navigate the system and answer questions about tax preparation workflows.

## Application Navigation
The app has these main sections:
- **Dashboard** (/admin) - Overview with stats, quick actions
- **Front Desk** (/admin/front-desk) - Client check-ins, drop-offs, phone call logging
- **Customers** (/admin/customers) - Client database with search and CRUD
- **Tax Returns** (/admin/returns) - Track returns by status and year
- **Appointments** (/admin/appointments) - Schedule and manage appointments
- **Documents** (/admin/documents) - Client document management
- **Workflows** (/workflows) - 29 standardized procedures for the office
- **Kanban Board** (/kanban) - Visual task tracking

## Common Tasks
- To check in a client: Go to Front Desk, click "Client Check-In"
- To find a customer: Go to Customers, use the search bar
- To see today's appointments: Go to Front Desk or Appointments
- To track a return status: Go to Tax Returns, filter by client or status
- To process a document drop-off: Go to Front Desk, click "Document Drop-Off"

## Tax Season Statuses
Returns flow through these statuses:
1. Intake → Documents Pending → Documents Complete → In Preparation → Review Needed → Ready for Signing → Completed → Filed → Picked Up

Be concise but helpful. If someone asks about something you're not sure about, suggest they check the Workflows section for detailed procedures.`;

const CUSTOMER_SYSTEM_PROMPT = `You are a friendly and helpful AI assistant for Gordon Ulen CPA's client portal. You help clients upload their tax documents and navigate the portal.

## How to Upload Documents
1. Click "Upload Documents" or go to the Documents section
2. Select the tax year (usually the current year for taxes due April 15)
3. Drag and drop your documents or click to browse
4. Wait for upload confirmation

## Documents Clients Need to Upload
For Individual Tax Returns (Form 1040):
- **W-2 forms** - From all employers
- **1099 forms** - Interest (1099-INT), Dividends (1099-DIV), Retirement (1099-R), Self-employment (1099-NEC/1099-MISC)
- **1098 forms** - Mortgage interest, Student loan interest, Tuition
- **Property tax statements**
- **Charitable donation receipts** (if itemizing)
- **Medical expense receipts** (if itemizing and over 7.5% of AGI)
- **Last year's tax return** (if new client)
- **Photo ID** (for new clients)

For Business Clients:
- **Profit & Loss statement**
- **Balance sheet**
- **Bank statements**
- **1099s issued and received**
- **Payroll reports** (if applicable)
- **Asset purchase/sale documentation**

## Portal Features
- **Documents** - Upload and view your tax documents
- **Return Status** - Check where your return is in the preparation process
- **Appointments** - Schedule or reschedule appointments
- **Messages** - Communicate securely with the tax preparer

## Important Dates
- April 15: Individual tax returns due
- March 15: S-Corp and Partnership returns due
- Extension deadline: October 15

Be patient and friendly. Many clients are not tech-savvy. Guide them step by step if needed.`;

export const assistantRouter: Router = Router();

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

assistantRouter.post('/chat', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { messages, mode = 'staff', sessionId } = req.body as {
      messages: Message[];
      mode?: 'staff' | 'customer';
      sessionId?: string;
    };

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const systemPrompt = mode === 'customer' ? CUSTOMER_SYSTEM_PROMPT : STAFF_SYSTEM_PROMPT;

    // Get customer info if authenticated
    let customerContext = '';
    let customerId: string | undefined;
    if (req.user?.uid) {
      const customer = await customerService.findOne({ email: req.user.email });
      if (customer) {
        customerId = customer.id;
        customerContext = `\n\n[Customer: ${customer.name || 'Unknown'}, Phone: ${customer.phone || 'N/A'}]`;
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt + customerContext },
          ...messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Assistant] OpenAI error:', error);
      return res.status(500).json({ error: 'Failed to get AI response' });
    }

    const data = await response.json() as { choices: { message: { content: string } }[] };
    const assistantMessage = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Log the conversation to Firestore
    if (sessionId) {
      const existingLog = await chatLogService.findOne({ sessionId });
      const timestamp = new Date().toISOString();
      const lastUserMsg = messages[messages.length - 1];

      if (existingLog) {
        // Update existing conversation
        const updateData: Partial<ChatLog> = {
          messages: [
            ...existingLog.messages,
            { role: 'user', content: lastUserMsg.content, timestamp },
            { role: 'assistant', content: assistantMessage, timestamp },
          ],
        };
        if (customerId) updateData.customerId = customerId;
        await chatLogService.update(existingLog.id!, updateData);
      } else {
        // Create new conversation log
        const newLog: Omit<ChatLog, 'id'> = {
          sessionId,
          channel: 'web',
          messages: [
            { role: 'user', content: lastUserMsg.content, timestamp },
            { role: 'assistant', content: assistantMessage, timestamp },
          ],
        };
        if (customerId) newLog.customerId = customerId;
        await chatLogService.createWithId(sessionId, newLog);
      }
    }

    res.json({ message: assistantMessage });
  } catch (error) {
    console.error('[Assistant] Error:', error);
    next(error);
  }
});

// Link anonymous session to customer after login
assistantRouter.post('/link-session', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { sessionId } = req.body;

    if (!req.user?.uid || !sessionId) {
      return res.status(400).json({ error: 'Missing sessionId or not authenticated' });
    }

    // Find customer by email
    const customer = await customerService.findOne({ email: req.user.email });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Update the chat log with customer ID
    const chatLog = await chatLogService.findOne({ sessionId });
    if (chatLog) {
      await chatLogService.update(chatLog.id!, {
        customerId: customer.id,
        customerPhone: customer.phone,
      });
    }

    res.json({ success: true, customerId: customer.id });
  } catch (error) {
    console.error('[Assistant] Link session error:', error);
    next(error);
  }
});
