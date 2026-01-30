import WebSocket from 'ws';
import { EventEmitter } from 'events';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID!;

export type Intent =
  | 'appointment_scheduling'
  | 'status_inquiry'
  | 'document_question'
  | 'billing_inquiry'
  | 'new_client'
  | 'speak_to_human'
  | 'other';

export interface ConversationEvent {
  type: 'transcript' | 'intent' | 'action' | 'end' | 'error';
  data: any;
}

export interface AgentAction {
  action: 'transfer' | 'schedule' | 'lookup_status' | 'end_call' | 'voicemail';
  params?: Record<string, any>;
}

export class ElevenLabsConversation extends EventEmitter {
  private ws: WebSocket | null = null;
  private callSid: string;
  private customerId: string | null = null;
  private intent: Intent | null = null;
  private transcript: string[] = [];
  private isConnected = false;

  constructor(callSid: string) {
    super();
    this.callSid = callSid;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${ELEVENLABS_AGENT_ID}`;

      this.ws = new WebSocket(wsUrl, {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      });

      this.ws.on('open', () => {
        this.isConnected = true;
        console.log(`[ElevenLabs] Connected for call ${this.callSid}`);

        // Send initial configuration
        this.sendConfig();
        resolve();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(data);
      });

      this.ws.on('error', (error) => {
        console.error(`[ElevenLabs] WebSocket error for call ${this.callSid}:`, error);
        this.emit('error', error);
        reject(error);
      });

      this.ws.on('close', () => {
        this.isConnected = false;
        console.log(`[ElevenLabs] Disconnected for call ${this.callSid}`);
        this.emit('end', { transcript: this.transcript, intent: this.intent });
      });
    });
  }

  private sendConfig(): void {
    if (!this.ws || !this.isConnected) return;

    // Send conversation configuration
    const config = {
      type: 'conversation_initiation_client_data',
      conversation_config_override: {
        agent: {
          first_message: this.getGreeting(),
          prompt: {
            prompt: this.getSystemPrompt(),
          },
        },
      },
    };

    this.ws.send(JSON.stringify(config));
  }

  private getGreeting(): string {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    return `Good ${timeOfDay}, thank you for calling Gordon Ulen CPA. I'm an AI assistant and I can help you with scheduling appointments, checking your return status, or answering questions about documents. How may I help you today?`;
  }

  private getSystemPrompt(): string {
    return `You are a professional AI receptionist for Gordon Ulen CPA, a tax preparation firm.

Your capabilities:
- Schedule, reschedule, or cancel appointments
- Check tax return status (provide general updates only, never specific dollar amounts)
- Answer questions about required documents
- Gather information from new clients
- Transfer to a human when needed

Important rules:
1. Be professional, warm, and helpful
2. Always capture the caller's name and callback number early in the conversation
3. NEVER disclose specific tax amounts, refunds, or financial details over the phone
4. If the caller asks for billing disputes or complex billing questions, offer to transfer
5. If the caller seems frustrated or explicitly requests a human, transfer immediately
6. For new clients, gather: name, phone, email, type of return needed

When you need to take action, respond with a JSON object:
- To schedule: {"action": "schedule", "params": {"name": "...", "phone": "...", "date": "...", "type": "..."}}
- To check status: {"action": "lookup_status", "params": {"name": "...", "phone": "..."}}
- To transfer: {"action": "transfer", "params": {"reason": "..."}}
- To end call: {"action": "end_call", "params": {"summary": "..."}}

Appointment types available:
- Tax Prep (60-90 min)
- Drop-off (15 min)
- Pick-up/Signing (30 min)
- Consultation (60 min)`;
  }

  private handleMessage(data: WebSocket.RawData): void {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'audio':
          // Forward audio to Twilio stream
          this.emit('audio', message.audio);
          break;

        case 'user_transcript':
          this.transcript.push(`Caller: ${message.text}`);
          this.emit('transcript', { role: 'user', text: message.text });
          break;

        case 'agent_response':
          this.transcript.push(`Agent: ${message.text}`);
          this.emit('transcript', { role: 'agent', text: message.text });

          // Check for action in response
          this.parseAction(message.text);
          break;

        case 'interruption':
          this.emit('interruption');
          break;

        case 'ping':
          this.ws?.send(JSON.stringify({ type: 'pong' }));
          break;

        default:
          console.log(`[ElevenLabs] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('[ElevenLabs] Error parsing message:', error);
    }
  }

  private parseAction(text: string): void {
    // Look for JSON action in the response
    const jsonMatch = text.match(/\{[\s\S]*"action"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const action: AgentAction = JSON.parse(jsonMatch[0]);
        this.emit('action', action);
      } catch {
        // Not valid JSON, ignore
      }
    }
  }

  sendAudio(audioData: Buffer): void {
    if (!this.ws || !this.isConnected) return;

    this.ws.send(
      JSON.stringify({
        type: 'audio',
        audio: audioData.toString('base64'),
      })
    );
  }

  setCustomerId(customerId: string): void {
    this.customerId = customerId;
  }

  setIntent(intent: Intent): void {
    this.intent = intent;
  }

  getTranscript(): string[] {
    return this.transcript;
  }

  getIntent(): Intent | null {
    return this.intent;
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export function createConversation(callSid: string): ElevenLabsConversation {
  return new ElevenLabsConversation(callSid);
}
