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
  expires_at: number;
}

declare global {
  interface Window {
    gapi: any;
  }
}

export class CalendarExecutor {
  private accessToken: string;

  constructor(credentials: CalendarCredentials) {
    this.accessToken = credentials.access_token;
  }

  private async loadGapiClient(): Promise<void> {
    if (!window.gapi?.client?.calendar) {
      await new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = async () => {
          await new Promise<void>(r => window.gapi.load('client', r));
          await window.gapi.client.init({});
          await window.gapi.client.load('calendar', 'v3');
          resolve();
        };
        document.head.appendChild(script);
      });
    }
  }

  private async getCalendarClient() {
    await this.loadGapiClient();
    window.gapi.client.setToken({
      access_token: this.accessToken
    });
    return window.gapi.client.calendar;
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

    return response.result.items as CalendarEvent[];
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
      resource: {
        summary: options.summary,
        description: options.description,
        start: options.start,
        end: options.end,
        attendees: options.attendees?.map(email => ({ email })),
        location: options.location,
      },
    });

    return response.result as CalendarEvent;
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
      resource: {
        summary: options.summary,
        description: options.description,
        start: options.start,
        end: options.end,
        attendees: options.attendees?.map(email => ({ email })),
        location: options.location,
      },
    });

    return response.result as CalendarEvent;
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