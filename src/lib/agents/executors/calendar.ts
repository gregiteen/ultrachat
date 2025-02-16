import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees: Array<{
    email: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  location?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  created: string;
  updated: string;
}

interface CalendarCredentials {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export class CalendarExecutor {
  private oauth2Client: OAuth2Client;

  constructor(credentials: CalendarCredentials) {
    this.oauth2Client = new OAuth2Client({
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
    });

    this.oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
      expiry_date: credentials.expires_at,
    });
  }

  private async getCalendarClient() {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    return calendar;
  }

  async listEvents(options: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    query?: string;
  } = {}): Promise<CalendarEvent[]> {
    const calendar = await this.getCalendarClient();
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: options.timeMin || new Date().toISOString(),
      timeMax: options.timeMax,
      maxResults: options.maxResults || 10,
      singleEvents: true,
      orderBy: 'startTime',
      q: options.query,
    });

    return (response.data.items || []) as CalendarEvent[];
  }

  async createEvent(options: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    attendees?: string[];
    location?: string;
  }): Promise<CalendarEvent> {
    const calendar = await this.getCalendarClient();

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: options.summary,
        description: options.description,
        start: options.start,
        end: options.end,
        attendees: options.attendees?.map(email => ({ email })),
        location: options.location,
      },
    });

    return response.data as CalendarEvent;
  }

  async updateEvent(eventId: string, options: {
    summary?: string;
    description?: string;
    start?: { dateTime: string; timeZone?: string };
    end?: { dateTime: string; timeZone?: string };
    attendees?: string[];
    location?: string;
  }): Promise<CalendarEvent> {
    const calendar = await this.getCalendarClient();

    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: {
        summary: options.summary,
        description: options.description,
        start: options.start,
        end: options.end,
        attendees: options.attendees?.map(email => ({ email })),
        location: options.location,
      },
    });

    return response.data as CalendarEvent;
  }

  async deleteEvent(eventId: string): Promise<void> {
    const calendar = await this.getCalendarClient();

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
  }

  async findConflicts(start: string, end: string): Promise<CalendarEvent[]> {
    const events = await this.listEvents({
      timeMin: start,
      timeMax: end,
    });

    return events.filter(event => event.status !== 'cancelled');
  }
}