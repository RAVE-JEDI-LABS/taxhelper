import { Router } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { FirestoreService } from '../services/firestore.js';
import { buildSystemPrompt, type AssistantMode } from '@taxhelper/shared/prompts';

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

export const assistantRouter: Router = Router();

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

assistantRouter.post('/chat', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { messages, mode = 'staff', sessionId } = req.body as {
      messages: Message[];
      mode?: AssistantMode;
      sessionId?: string;
    };

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Get customer info if authenticated (not for visitors)
    let customerContext = '';
    let customerId: string | undefined;
    if (mode !== 'visitor' && req.user?.uid) {
      const customer = await customerService.findOne({ email: req.user.email });
      if (customer) {
        customerId = customer.id;
        customerContext = `[Customer: ${customer.name || 'Unknown'}, Phone: ${customer.phone || 'N/A'}]`;
      }
    }

    // Build system prompt from shared prompts
    const systemPrompt = buildSystemPrompt(mode, customerContext || undefined);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
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
