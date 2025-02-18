import type { ServiceIntegration, ServiceAction } from '../../../lib/task-management/WorkflowEngine';
import type { Task } from '../../../types/index';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  reminders?: Array<{
    method: 'email' | 'popup';
    minutes: number;
  }>;
}

interface CreateEventContext {
  due_date?: string;
}

interface UpdateEventContext {
  eventId?: string;
}

interface ReminderContext {
  eventId?: string;
  hoursRemaining?: number;
}

export class CalendarExecutor {
  private accessToken: string;
  private expiresAt: number;

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error('Access token is required');
    }
    this.accessToken = accessToken;
    this.expiresAt = Date.now() + 3600000; // 1 hour from now
  }

  async findConflicts(startTime: string, endTime: string) {
    return [];
  }

  async createEvent(event: {
    summary: string;
    description?: string;
    start: { dateTime: string };
    end: { dateTime: string };
  }) {
    // Implementation
  }
}

class CalendarService {
  private events: Map<string, CalendarEvent> = new Map();

  async createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const id = Math.random().toString(36).substring(7);
    const newEvent = { ...event, id };
    this.events.set(id, newEvent);
    return newEvent;
  }

  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const event = this.events.get(id);
    if (!event) {
      throw new Error(`Event not found: ${id}`);
    }
    const updatedEvent = { ...event, ...updates };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async addReminder(eventId: string, minutes: number): Promise<void> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }
    
    event.reminders = [
      ...(event.reminders || []),
      { method: 'popup', minutes }
    ];
    
    this.events.set(eventId, event);
  }
}

const calendarService = new CalendarService();

export const calendarIntegration: ServiceIntegration = {
  id: 'calendar',
  name: 'Calendar Integration',
  actions: {
    createEvent: {
      type: 'calendar:createEvent' as const,
      handler: async (task: Task) => {
        if (!task.due_date) return;

        const startTime = new Date(task.due_date);
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 1);

        await calendarService.createEvent({
          title: task.title,
          description: task.description,
          startTime,
          endTime,
          reminders: [
            { method: 'popup', minutes: 30 }
          ]
        });
      }
    },

    updateEvent: {
      type: 'calendar:updateEvent' as const,
      handler: async (task: Task, context: UpdateEventContext) => {
        if (!context.eventId) return;

        await calendarService.updateEvent(context.eventId, {
          title: task.title,
          description: task.description,
          ...(task.due_date && {
            startTime: new Date(task.due_date)
          })
        });
      }
    },

    addReminder: {
      type: 'calendar:addReminder' as const,
      handler: async (task: Task, context: ReminderContext) => {
        if (!context.eventId || !context.hoursRemaining) return;

        await calendarService.addReminder(
          context.eventId,
          context.hoursRemaining * 60
        );
      },
      condition: (task: Task, context: ReminderContext) => {
        return !!context.hoursRemaining && context.hoursRemaining > 0;
      }
    }
  }
};