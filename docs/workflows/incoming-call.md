# Incoming Phone Call Workflow

## Purpose
Handle inbound client calls professionally and efficiently using Twilio for telephony and ElevenLabs AI agent for initial call handling. Ensure all information is captured and appropriate action is taken.

## Architecture

```
Incoming Call → Twilio → ElevenLabs AI Agent → [Resolve OR Transfer to Human]
                              ↓
                    Log to Firestore + CCH
```

## Twilio Configuration

### Webhook Endpoints
- **Incoming Call**: `POST /api/twilio/incoming`
- **Status Callback**: `POST /api/twilio/status`
- **Recording Callback**: `POST /api/twilio/recording`

### TwiML Flow
1. Answer incoming call
2. Stream audio to ElevenLabs Conversational AI
3. AI agent handles conversation
4. Transfer to human OR end call based on resolution

## ElevenLabs AI Agent

### Agent Configuration
- **Voice**: Professional, warm tone (Rachel or similar)
- **Model**: Turbo v2.5 for low latency
- **First Message Latency**: Optimized for <1s response

### Greeting Script (AI Agent)
"Good [morning/afternoon], thank you for calling Gordon Ulen CPA. I'm an AI assistant and I can help you with scheduling appointments, checking your return status, or answering questions about documents. How may I help you today?"

### Intent Classification
The AI agent classifies caller intent into:
1. `appointment_scheduling` - Book/reschedule/cancel appointments
2. `status_inquiry` - Check tax return status
3. `document_question` - Questions about documents needed or submitted
4. `billing_inquiry` - Questions about invoices or payments
5. `new_client` - New client wanting to start service
6. `speak_to_human` - Caller requests human representative
7. `other` - Cannot classify, transfer to human

### AI-Resolvable Intents
The AI agent can fully handle:
- **Appointment Scheduling**: Check Calendly availability, book appointments via Calendly API, send confirmations
- **Status Inquiry**: Look up client, provide general status update
- **Document Questions**: Answer FAQs, provide portal instructions
- **New Client Intake**: Gather basic info, explain services, schedule initial appointment via Calendly

### Transfer Triggers
Transfer to human when:
- Caller explicitly requests it
- Billing disputes or complex billing questions
- Frustrated or difficult caller detected
- AI cannot resolve after 2 attempts
- Sensitive information discussion needed

## Calendly Integration

The AI agent uses Calendly for all appointment scheduling:

### How It Works
1. Caller requests appointment
2. AI agent asks for appointment type preference
3. AI queries Calendly API for available slots
4. AI presents options: "I have openings on Tuesday at 2pm or Thursday at 10am..."
5. Caller selects time
6. AI books appointment via Calendly API
7. Calendly sends confirmation email automatically
8. Appointment syncs to Tax Helper dashboard

### Appointment Types in Calendly
| Type | Duration | Calendly Slug |
|------|----------|---------------|
| Tax Preparation | 60 min | `tax-prep` |
| Document Drop-Off | 15 min | `drop-off` |
| Pick-Up & Signing | 30 min | `pick-up-signing` |
| Consultation | 30 min | `consultation` |

### AI Scheduling Script
"I can help you schedule an appointment. What type of appointment do you need - a full tax preparation session, dropping off documents, picking up your completed return, or a general consultation?"

[After selection]

"Let me check our availability. I have openings on [day] at [time] or [day] at [time]. Which works better for you?"

[After booking]

"I've scheduled your [type] appointment for [day] at [time]. You'll receive a confirmation email shortly. Is there anything else I can help you with?"

## Call Categories

### 1. Appointment Scheduling
- AI checks Calendly for real-time availability
- Confirm client name and phone/email
- Book appropriate appointment type via Calendly API
- Calendly automatically sends confirmation email/text

### 2. Status Inquiry
- Look up client in CCH
- Check current return status
- Provide update (be general, not specific amounts)
- If return is ready, schedule pick-up
- If waiting on something, explain what's needed

### 3. Document Questions
- Common questions:
  - "What do I need to bring?" - Refer to tax organizer
  - "Did you receive my documents?" - Check CCH/portal
  - "Can I upload online?" - Provide portal instructions

### 4. Billing Inquiry
- Look up AR in CCH
- Explain charges if asked
- Offer payment options
- Transfer to manager if dispute

### 5. New Client Inquiry
- Gather basic information:
  - Name
  - Phone
  - Email
  - Type of return needed
- Explain services and pricing
- Schedule initial appointment
- Send new client packet

## Call Logging

### Automatic Logging (AI Agent)
Every call is automatically logged to Firestore:
- Call SID (Twilio unique ID)
- Caller phone number
- Timestamp (start/end)
- Duration
- Intent classification
- Transcript summary
- Resolution status (resolved/transferred/voicemail)
- Recording URL

### CCH Sync
After call completion, sync to CCH:
1. Match caller to client record (by phone number)
2. Add Activity Note with:
   - Date/time
   - AI-generated summary
   - Action taken
   - Follow-up needed
   - Link to full transcript

## Voicemail Handling

### AI Voicemail Greeting
"You've reached Gordon Ulen CPA. Our office is currently closed [OR all representatives are busy]. Please leave your name, phone number, and a brief message. You can also visit our client portal at gordonulencpa.com to upload documents or check your return status. We'll return your call within one business day. Thank you."

### Voicemail Processing
1. Twilio records voicemail
2. Transcribe using Twilio/ElevenLabs
3. AI agent extracts:
   - Caller name
   - Callback number
   - Message summary
   - Urgency level
4. Create follow-up task in system
5. Notify staff via dashboard/email

## Transfer Procedures

### AI-to-Human Handoff
1. AI Agent: "Let me connect you with one of our team members who can better assist you. One moment please."
2. Play hold music via Twilio
3. Dial available staff member
4. Whisper to staff: Brief context from AI (e.g., "Incoming transfer: billing dispute, client John Smith")
5. Connect caller to staff
6. If no answer after 30s, offer callback option

### Staff Availability
- Check staff availability status in system
- Round-robin or priority-based routing
- Fallback to voicemail if no staff available

## Difficult Calls

### AI Escalation Triggers
- Detect frustration (raised voice, negative sentiment)
- Repeated "speak to a person" requests
- Profanity detected
- AI unable to help after 2 attempts

### AI De-escalation Script
"I understand this is frustrating. Let me connect you with a team member right away who can help resolve this for you."

## Integration Details

### Twilio Setup
```
Phone Number: [Your Twilio Number]
Voice Webhook: https://api.taxhelper.com/twilio/incoming
Status Callback: https://api.taxhelper.com/twilio/status
Recording: Enabled (dual-channel)
Transcription: Enabled
```

### ElevenLabs Setup
```
Agent ID: [Your Agent ID]
WebSocket URL: wss://api.elevenlabs.io/v1/convai/conversation
Voice ID: [Selected Voice ID]
Model: eleven_turbo_v2_5
```

### Required API Keys (Environment Variables)
```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
```

## Notes
- AI agent always captures callback number early in conversation
- Never give specific tax amounts over phone (AI trained on this)
- All calls recorded with consent notification
- Transcripts stored for compliance (7 year retention)
- AI responses audited weekly for quality
