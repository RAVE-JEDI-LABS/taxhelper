import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { createConversation, ElevenLabsConversation } from '../services/elevenlabs.js';
import { activeConversations, handleAgentAction } from '../routes/twilio.js';

interface TwilioStreamMessage {
  event: string;
  sequenceNumber?: string;
  streamSid?: string;
  start?: {
    streamSid: string;
    accountSid: string;
    callSid: string;
    tracks: string[];
    customParameters: Record<string, string>;
  };
  media?: {
    track: string;
    chunk: string;
    timestamp: string;
    payload: string;
  };
  stop?: {
    accountSid: string;
    callSid: string;
  };
}

export function setupTwilioWebSocket(server: Server): void {
  const wss = new WebSocketServer({
    server,
    path: '/api/twilio/stream',
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket] New Twilio stream connection');

    let callSid: string | null = null;
    let streamSid: string | null = null;
    let conversation: ElevenLabsConversation | null = null;

    ws.on('message', async (data: Buffer) => {
      try {
        const message: TwilioStreamMessage = JSON.parse(data.toString());

        switch (message.event) {
          case 'connected':
            console.log('[WebSocket] Twilio stream connected');
            break;

          case 'start':
            callSid = message.start!.callSid;
            streamSid = message.start!.streamSid;
            console.log(`[WebSocket] Stream started for call ${callSid}`);

            // Create ElevenLabs conversation
            conversation = createConversation(callSid);
            activeConversations.set(callSid, conversation);

            // Set up event handlers
            conversation.on('audio', (audioData: string) => {
              // Send audio back to Twilio
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    event: 'media',
                    streamSid: streamSid,
                    media: {
                      payload: audioData,
                    },
                  })
                );
              }
            });

            conversation.on('action', (action) => {
              handleAgentAction(callSid!, action, conversation!);
            });

            conversation.on('transcript', (transcript) => {
              console.log(`[Transcript] ${transcript.role}: ${transcript.text}`);
            });

            conversation.on('error', (error) => {
              console.error(`[ElevenLabs] Error for call ${callSid}:`, error);
            });

            // Connect to ElevenLabs
            try {
              await conversation.connect();
            } catch (error) {
              console.error(`[ElevenLabs] Failed to connect for call ${callSid}:`, error);
            }
            break;

          case 'media':
            // Forward audio from Twilio to ElevenLabs
            if (conversation && message.media) {
              const audioBuffer = Buffer.from(message.media.payload, 'base64');
              conversation.sendAudio(audioBuffer);
            }
            break;

          case 'stop':
            console.log(`[WebSocket] Stream stopped for call ${callSid}`);
            if (conversation) {
              await conversation.disconnect();
            }
            if (callSid) {
              activeConversations.delete(callSid);
            }
            break;

          default:
            console.log(`[WebSocket] Unknown event: ${message.event}`);
        }
      } catch (error) {
        console.error('[WebSocket] Error processing message:', error);
      }
    });

    ws.on('close', async () => {
      console.log(`[WebSocket] Connection closed for call ${callSid}`);
      if (conversation) {
        await conversation.disconnect();
      }
      if (callSid) {
        activeConversations.delete(callSid);
      }
    });

    ws.on('error', (error) => {
      console.error(`[WebSocket] Error for call ${callSid}:`, error);
    });
  });

  console.log('[WebSocket] Twilio stream server initialized');
}
