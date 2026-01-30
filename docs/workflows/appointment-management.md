# Appointment Scheduling & Management

## Status: IMPLEMENTED ✓

**Implementation Complete:**
- Backend Calendly service (`backend/src/services/calendly.ts`)
- Webhook endpoints for booking/cancellation sync (`backend/src/routes/calendly.ts`)
- Firestore appointment sync
- Admin dashboard appointment page with quick-book cards
- Environment variables configured

**Remaining Setup:**
- Add Calendly API key to `.env`
- Configure webhook URL in Calendly dashboard
- Set up event types in Calendly

---

## Purpose
Manage all client appointments using Calendly as the scheduling platform, with automatic sync to Tax Helper for visibility and integration with other systems.

## System Architecture

```
Client Books → Calendly → Webhook → Tax Helper → Firestore
                                        ↓
                              Dashboard + CCH Sync
```

## Calendly Setup

### Event Types to Create

| Event Type | Duration | Description |
|------------|----------|-------------|
| Tax Preparation | 60 min | Full tax preparation appointment |
| Document Drop-Off | 15 min | Quick drop-off of tax documents |
| Pick-Up & Signing | 30 min | Return pick-up and e-file signing |
| Consultation | 30 min | General tax questions or planning |

### Calendly Configuration
1. **Availability**: Set office hours (e.g., M-F 9am-5pm)
2. **Buffer Time**: 15 minutes between appointments
3. **Minimum Notice**: 24 hours for booking
4. **Questions**: Collect name, email, phone, return type

### Webhook Setup
Configure Calendly to send webhooks to:
```
https://your-domain.com/api/calendly/webhook
```

Events to subscribe:
- `invitee.created` - New booking
- `invitee.canceled` - Cancellation
- `invitee.rescheduled` - Reschedule (old canceled, new created)

## Booking Channels

### 1. Client Self-Service (Calendly Direct)
- Client visits Calendly link
- Selects appointment type and time
- Provides contact information
- Receives confirmation email

### 2. Staff Booking (Admin Dashboard)
- Staff opens Appointments page
- Clicks appointment type card
- Opens Calendly in new tab
- Books on behalf of client

### 3. Phone AI Booking (Twilio + ElevenLabs)
- AI agent asks for appointment preference
- Queries Calendly API for availability
- Presents options verbally
- Books via Calendly API
- Calendly sends confirmation

### 4. Client Portal Booking
- Client logs into portal
- Clicks "Schedule Appointment"
- Embedded Calendly widget or redirect
- Books and receives confirmation

## Webhook Processing

### New Booking (invitee.created)
1. Receive webhook from Calendly
2. Extract event and invitee data
3. Match email to existing customer (if any)
4. Create appointment record in Firestore
5. Link to customer record
6. (Future) Sync to CCH calendar

### Cancellation (invitee.canceled)
1. Receive webhook from Calendly
2. Find appointment in Firestore
3. Update status to "cancelled"
4. (Optional) Notify staff
5. (Future) Remove from CCH calendar

## Staff Workflow

### Morning Review
1. Open Tax Helper dashboard
2. Check today's appointments
3. Pull files for scheduled clients
4. Note any special requirements

### Client Arrival
1. Check in client via Front Desk
2. Confirm appointment in system
3. Update status if needed

### After Appointment
1. Note outcome in client record
2. Schedule follow-up if needed
3. Update return status

## Integration Points

### CCH Practice Management
- Manual: Check CCH calendar alongside Tax Helper
- Future: Automatic two-way sync

### Phone AI Agent
- AI queries Calendly for availability
- Books appointments via API
- Provides scheduling link via SMS

### Client Communications
- Calendly sends booking confirmations
- Tax Helper sends status updates
- Reminders handled by Calendly

## Environment Variables

```bash
# Backend (.env)
CALENDLY_API_KEY=your-api-key
CALENDLY_ORGANIZATION_URI=https://api.calendly.com/organizations/xxx
CALENDLY_USER_URI=https://api.calendly.com/users/xxx
CALENDLY_WEBHOOK_SECRET=your-webhook-secret

# Frontend (.env.local)
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/gordonulencpa
```

## Troubleshooting

### Appointments Not Syncing
1. Check webhook configuration in Calendly
2. Verify CALENDLY_WEBHOOK_SECRET matches
3. Check server logs for webhook errors
4. Manually trigger webhook test from Calendly

### Double Bookings
- Calendly prevents double-booking automatically
- If occurring, check buffer time settings
- Verify no overlapping event types

### Client Can't Find Times
1. Check Calendly availability settings
2. Verify office hours are set
3. Check minimum notice period
4. Ensure event type is active

## Notes
- Calendly handles all timezone conversions
- Email/SMS reminders configured in Calendly
- Video meeting links can be auto-generated (Zoom/Meet)
- Group booking available for tax prep classes (future)
