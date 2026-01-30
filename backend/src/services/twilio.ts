import twilio from 'twilio';
import { WebSocket } from 'ws';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER!;

export const twilioClient = twilio(accountSid, authToken);

export interface CallInfo {
  callSid: string;
  from: string;
  to: string;
  direction: 'inbound' | 'outbound';
  status: string;
  startTime: string;
}

export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  return twilio.validateRequest(authToken, signature, url, params);
}

export function generateStreamTwiML(callSid: string, wsUrl: string): string {
  const response = new twilio.twiml.VoiceResponse();

  // Initial greeting while connecting to AI
  response.say(
    { voice: 'Polly.Joanna' },
    'Please wait while I connect you.'
  );

  // Start bidirectional audio stream to our WebSocket server
  const connect = response.connect();
  connect.stream({
    url: wsUrl,
    name: 'elevenlabs-stream',
  });

  return response.toString();
}

export function generateTransferTwiML(staffNumber: string, whisperText: string): string {
  const response = new twilio.twiml.VoiceResponse();

  response.say(
    { voice: 'Polly.Joanna' },
    'Let me connect you with one of our team members. One moment please.'
  );

  // Play hold music while connecting
  response.play({ loop: 0 }, 'http://com.twilio.sounds.music.s3.amazonaws.com/MARKOVICHAMP-B8-V2.mp3');

  const dial = response.dial({
    callerId: twilioPhoneNumber,
    timeout: 30,
    action: '/api/twilio/transfer-status',
  });

  // Whisper context to staff before connecting
  dial.number(
    {
      statusCallbackEvent: ['answered'],
      statusCallback: '/api/twilio/staff-answered',
      url: `/api/twilio/whisper?text=${encodeURIComponent(whisperText)}`,
    },
    staffNumber
  );

  return response.toString();
}

export function generateWhisperTwiML(text: string): string {
  const response = new twilio.twiml.VoiceResponse();
  response.say({ voice: 'Polly.Joanna' }, text);
  return response.toString();
}

export function generateVoicemailTwiML(recordingCallback: string): string {
  const response = new twilio.twiml.VoiceResponse();

  response.say(
    { voice: 'Polly.Joanna' },
    "You've reached Gordon Ulen CPA. Our office is currently unavailable. Please leave your name, phone number, and a brief message after the beep. You can also visit our client portal to upload documents or check your return status. We'll return your call within one business day."
  );

  response.record({
    maxLength: 120,
    action: recordingCallback,
    transcribe: true,
    transcribeCallback: '/api/twilio/transcription',
    playBeep: true,
  });

  response.say(
    { voice: 'Polly.Joanna' },
    'We did not receive a message. Goodbye.'
  );

  return response.toString();
}

export function generateHangupTwiML(message?: string): string {
  const response = new twilio.twiml.VoiceResponse();

  if (message) {
    response.say({ voice: 'Polly.Joanna' }, message);
  }

  response.hangup();
  return response.toString();
}

export async function updateCall(callSid: string, twiml: string): Promise<void> {
  await twilioClient.calls(callSid).update({ twiml });
}

export async function getCallDetails(callSid: string) {
  return twilioClient.calls(callSid).fetch();
}
