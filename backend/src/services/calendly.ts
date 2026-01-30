/**
 * Calendly Integration Service
 *
 * Handles all Calendly API interactions for appointment scheduling.
 * Used by: Frontend booking, Phone AI agent, Admin dashboard
 */

import { getDb } from './firebase.js';

const CALENDLY_API_BASE = 'https://api.calendly.com';

interface CalendlyConfig {
  apiKey: string;
  organizationUri: string;
  userUri: string;
}

interface EventType {
  uri: string;
  name: string;
  slug: string;
  duration: number;
  schedulingUrl: string;
}

interface ScheduledEvent {
  uri: string;
  name: string;
  status: 'active' | 'canceled';
  startTime: string;
  endTime: string;
  eventType: string;
  invitees: Array<{
    uri: string;
    email: string;
    name: string;
  }>;
  location?: {
    type: string;
    location?: string;
  };
}

interface Invitee {
  uri: string;
  email: string;
  name: string;
  status: 'active' | 'canceled';
  questions_and_answers?: Array<{
    question: string;
    answer: string;
  }>;
}

class CalendlyService {
  private config: CalendlyConfig | null = null;

  constructor() {
    this.config = {
      apiKey: process.env.CALENDLY_API_KEY || '',
      organizationUri: process.env.CALENDLY_ORGANIZATION_URI || '',
      userUri: process.env.CALENDLY_USER_URI || '',
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.config?.apiKey) {
      throw new Error('Calendly API key not configured');
    }

    const response = await fetch(`${CALENDLY_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Calendly API error: ${response.status} - ${JSON.stringify(error)}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get all event types (appointment types) for the organization
   */
  async getEventTypes(): Promise<EventType[]> {
    const data = await this.request<{ collection: any[] }>(
      `/event_types?organization=${encodeURIComponent(this.config!.organizationUri)}&active=true`
    );

    return data.collection.map((et) => ({
      uri: et.uri,
      name: et.name,
      slug: et.slug,
      duration: et.duration,
      schedulingUrl: et.scheduling_url,
    }));
  }

  /**
   * Get available time slots for an event type
   */
  async getAvailability(eventTypeUri: string, startDate: string, endDate: string): Promise<any> {
    const data = await this.request<any>(
      `/event_type_available_times?event_type=${encodeURIComponent(eventTypeUri)}&start_time=${startDate}&end_time=${endDate}`
    );
    return data.collection;
  }

  /**
   * Get scheduled events (appointments)
   */
  async getScheduledEvents(params: {
    minStartTime?: string;
    maxStartTime?: string;
    status?: 'active' | 'canceled';
    inviteeEmail?: string;
  } = {}): Promise<ScheduledEvent[]> {
    const queryParams = new URLSearchParams({
      organization: this.config!.organizationUri,
    });

    if (params.minStartTime) queryParams.set('min_start_time', params.minStartTime);
    if (params.maxStartTime) queryParams.set('max_start_time', params.maxStartTime);
    if (params.status) queryParams.set('status', params.status);
    if (params.inviteeEmail) queryParams.set('invitee_email', params.inviteeEmail);

    const data = await this.request<{ collection: any[] }>(
      `/scheduled_events?${queryParams.toString()}`
    );

    return data.collection.map((event) => ({
      uri: event.uri,
      name: event.name,
      status: event.status,
      startTime: event.start_time,
      endTime: event.end_time,
      eventType: event.event_type,
      invitees: [],
      location: event.location,
    }));
  }

  /**
   * Get a single scheduled event by URI
   */
  async getEvent(eventUri: string): Promise<ScheduledEvent> {
    const data = await this.request<{ resource: any }>(`/scheduled_events/${eventUri.split('/').pop()}`);
    return {
      uri: data.resource.uri,
      name: data.resource.name,
      status: data.resource.status,
      startTime: data.resource.start_time,
      endTime: data.resource.end_time,
      eventType: data.resource.event_type,
      invitees: [],
      location: data.resource.location,
    };
  }

  /**
   * Get invitees for an event
   */
  async getEventInvitees(eventUri: string): Promise<Invitee[]> {
    const eventUuid = eventUri.split('/').pop();
    const data = await this.request<{ collection: any[] }>(
      `/scheduled_events/${eventUuid}/invitees`
    );

    return data.collection.map((inv) => ({
      uri: inv.uri,
      email: inv.email,
      name: inv.name,
      status: inv.status,
      questions_and_answers: inv.questions_and_answers,
    }));
  }

  /**
   * Cancel an event
   */
  async cancelEvent(eventUri: string, reason?: string): Promise<void> {
    const eventUuid = eventUri.split('/').pop();
    await this.request(`/scheduled_events/${eventUuid}/cancellation`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Canceled by staff' }),
    });
  }

  /**
   * Get scheduling links for different appointment types
   * These are the URLs clients use to book
   */
  async getSchedulingLinks(): Promise<Record<string, string>> {
    const eventTypes = await this.getEventTypes();
    const links: Record<string, string> = {};

    for (const et of eventTypes) {
      // Map Calendly event type names to our appointment types
      const slug = et.slug.toLowerCase();
      if (slug.includes('tax') && slug.includes('prep')) {
        links.tax_prep = et.schedulingUrl;
      } else if (slug.includes('drop')) {
        links.drop_off = et.schedulingUrl;
      } else if (slug.includes('pick')) {
        links.pick_up = et.schedulingUrl;
      } else if (slug.includes('sign')) {
        links.signing = et.schedulingUrl;
      } else if (slug.includes('consult')) {
        links.consultation = et.schedulingUrl;
      }
      // Store all by slug as well
      links[et.slug] = et.schedulingUrl;
    }

    return links;
  }

  /**
   * Sync a Calendly event to our Firestore appointments collection
   */
  async syncEventToFirestore(event: ScheduledEvent, invitees: Invitee[]): Promise<void> {
    const db = getDb();
    const eventUuid = event.uri.split('/').pop()!;

    // Try to match invitee email to a customer
    let customerId = '';
    if (invitees.length > 0) {
      const customerSnapshot = await db
        .collection('customers')
        .where('email', '==', invitees[0].email)
        .limit(1)
        .get();

      if (!customerSnapshot.empty) {
        customerId = customerSnapshot.docs[0].id;
      }
    }

    // Map Calendly event to our appointment format
    const appointmentData = {
      id: eventUuid,
      calendlyEventUri: event.uri,
      customerId,
      customerName: invitees[0]?.name || '',
      customerEmail: invitees[0]?.email || '',
      type: mapEventNameToType(event.name),
      scheduledAt: event.startTime,
      endAt: event.endTime,
      duration: Math.round(
        (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60000
      ),
      status: event.status === 'active' ? 'scheduled' : 'cancelled',
      source: 'calendly',
      location: event.location,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('appointments').doc(eventUuid).set(appointmentData, { merge: true });
  }
}

/**
 * Map Calendly event name to our appointment type
 */
function mapEventNameToType(eventName: string): string {
  const name = eventName.toLowerCase();
  if (name.includes('tax') && name.includes('prep')) return 'tax_prep';
  if (name.includes('drop')) return 'drop_off';
  if (name.includes('pick')) return 'pick_up';
  if (name.includes('sign')) return 'signing';
  if (name.includes('consult')) return 'consultation';
  return 'consultation'; // default
}

// Singleton instance
export const calendlyService = new CalendlyService();

// Event type definitions for setting up Calendly
export const RECOMMENDED_EVENT_TYPES = [
  {
    name: 'Tax Preparation Appointment',
    slug: 'tax-prep',
    duration: 60,
    description: 'Full tax preparation appointment with a tax professional.',
  },
  {
    name: 'Document Drop-Off',
    slug: 'drop-off',
    duration: 15,
    description: 'Quick appointment to drop off your tax documents.',
  },
  {
    name: 'Return Pick-Up & Signing',
    slug: 'pick-up-signing',
    duration: 30,
    description: 'Pick up your completed return and sign required forms.',
  },
  {
    name: 'Consultation',
    slug: 'consultation',
    duration: 30,
    description: 'General tax consultation or questions.',
  },
];
