import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { createConversation, ElevenLabsConversation } from '../services/elevenlabs.js';
import { activeConversations, handleAgentAction } from '../routes/twilio.js';

// Audio conversion utilities for Twilio <-> ElevenLabs
// Twilio: mulaw 8kHz, ElevenLabs: PCM 16kHz

// Mulaw to Linear PCM conversion table
const MULAW_DECODE_TABLE = new Int16Array(256);
for (let i = 0; i < 256; i++) {
  const mulaw = ~i;
  const sign = mulaw & 0x80;
  const exponent = (mulaw >> 4) & 0x07;
  const mantissa = mulaw & 0x0f;
  let sample = ((mantissa << 3) + 0x84) << exponent;
  sample -= 0x84;
  MULAW_DECODE_TABLE[i] = sign ? -sample : sample;
}

// Linear PCM to Mulaw conversion
function linearToMulaw(sample: number): number {
  const MULAW_MAX = 0x1fff;
  const MULAW_BIAS = 33;
  const sign = sample < 0 ? 0x80 : 0;
  if (sign) sample = -sample;
  sample = Math.min(sample, MULAW_MAX);
  sample += MULAW_BIAS;
  let exponent = 7;
  for (let expMask = 0x4000; (sample & expMask) === 0 && exponent > 0; exponent--, expMask >>= 1);
  const mantissa = (sample >> (exponent + 3)) & 0x0f;
  return ~(sign | (exponent << 4) | mantissa) & 0xff;
}

// Convert mulaw 8kHz buffer to PCM 16kHz buffer (with upsampling)
function mulawToPcm16k(mulawBuffer: Buffer): Buffer {
  const pcmSamples: number[] = [];
  for (let i = 0; i < mulawBuffer.length; i++) {
    const sample = MULAW_DECODE_TABLE[mulawBuffer[i]];
    // Simple linear interpolation for 8k -> 16k upsampling
    pcmSamples.push(sample);
    if (i < mulawBuffer.length - 1) {
      const nextSample = MULAW_DECODE_TABLE[mulawBuffer[i + 1]];
      pcmSamples.push(Math.round((sample + nextSample) / 2));
    } else {
      pcmSamples.push(sample);
    }
  }
  const pcmBuffer = Buffer.alloc(pcmSamples.length * 2);
  for (let i = 0; i < pcmSamples.length; i++) {
    pcmBuffer.writeInt16LE(pcmSamples[i], i * 2);
  }
  return pcmBuffer;
}

// Convert PCM 16kHz buffer to mulaw 8kHz buffer (with downsampling)
function pcm16kToMulaw(pcmBuffer: Buffer): Buffer {
  const numSamples = pcmBuffer.length / 2;
  const mulawBuffer = Buffer.alloc(Math.floor(numSamples / 2));
  for (let i = 0, j = 0; i < numSamples - 1; i += 2, j++) {
    const sample = pcmBuffer.readInt16LE(i * 2);
    mulawBuffer[j] = linearToMulaw(sample);
  }
  return mulawBuffer;
}

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
              // Convert PCM 16kHz from ElevenLabs to mulaw 8kHz for Twilio
              if (ws.readyState === WebSocket.OPEN) {
                try {
                  const pcmBuffer = Buffer.from(audioData, 'base64');
                  const mulawBuffer = pcm16kToMulaw(pcmBuffer);
                  ws.send(
                    JSON.stringify({
                      event: 'media',
                      streamSid: streamSid,
                      media: {
                        payload: mulawBuffer.toString('base64'),
                      },
                    })
                  );
                } catch (err) {
                  console.error('[Audio] Conversion error:', err);
                }
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
            // Convert mulaw 8kHz from Twilio to PCM 16kHz for ElevenLabs
            if (conversation && message.media) {
              try {
                const mulawBuffer = Buffer.from(message.media.payload, 'base64');
                const pcmBuffer = mulawToPcm16k(mulawBuffer);
                conversation.sendAudio(pcmBuffer);
              } catch (err) {
                console.error('[Audio] Conversion error:', err);
              }
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
