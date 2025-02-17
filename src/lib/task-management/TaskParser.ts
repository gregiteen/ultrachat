import { Task } from '../../types';

interface ParsedTask {
  title: string;
  description?: string;
  due_date?: string;
  priority?: Task['priority'];
  estimated_duration?: string;
  automation?: {
    type: 'recurring' | 'dependent' | 'deadline';
    config: {
      frequency?: string;
      dependsOn?: string[];
      notifyBefore?: number;
    };
  };
  subtasks?: Array<{
    title: string;
    estimated_duration?: string;
  }>;
}

interface ParserResult {
  success: boolean;
  task?: ParsedTask;
  error?: string;
}

/**
 * Natural language task parser
 * Supports commands like:
 * - "Create a high priority task to review code by tomorrow at 5pm"
 * - "Set up weekly team meeting every Monday at 10am"
 * - "Remind me to send report 2 hours before deadline on Friday"
 */
export class TaskParser {
  private static readonly PRIORITY_KEYWORDS = {
    high: ['urgent', 'important', 'critical', 'high priority', 'asap'],
    medium: ['medium priority', 'normal priority', 'moderate'],
    low: ['low priority', 'whenever', 'not urgent']
  };

  private static readonly TIME_KEYWORDS = {
    today: /today|tonight/i,
    tomorrow: /tomorrow|next day/i,
    nextWeek: /next week/i,
    specificDate: /on ([A-Za-z]+day)|on (\d{1,2}(?:st|nd|rd|th)?)(?:\s+of\s+)?([A-Za-z]+)/i,
    specificTime: /at (\d{1,2}(?::\d{2})?\s*(?:am|pm))/i,
    duration: /(\d+)\s*(hour|hr|day|week|month)s?/i
  };

  private static readonly RECURRING_KEYWORDS = {
    daily: /every\s+day|daily/i,
    weekly: /every\s+week|weekly|every\s+([A-Za-z]+day)/i,
    biweekly: /every\s+other\s+week|biweekly/i,
    monthly: /every\s+month|monthly/i
  };

  private static readonly DEADLINE_KEYWORDS = {
    remind: /remind\s+(?:me\s+)?(\d+)\s*(hour|hr|day|week)s?\s+before/i
  };

  /**
   * Parses natural language input into a structured task
   */
  static parse(input: string): ParserResult {
    try {
      const task: ParsedTask = {
        title: this.extractTitle(input)
      };

      // Extract priority
      task.priority = this.extractPriority(input);

      // Extract due date and time
      const dateTime = this.extractDateTime(input);
      if (dateTime) {
        task.due_date = dateTime.toISOString();
      }

      // Extract duration
      task.estimated_duration = this.extractDuration(input);

      // Extract automation rules
      const automation = this.extractAutomation(input);
      if (automation) {
        task.automation = automation;
      }

      // Extract subtasks
      const subtasks = this.extractSubtasks(input);
      if (subtasks.length > 0) {
        task.subtasks = subtasks;
      }

      // Extract description (any remaining relevant text)
      task.description = this.extractDescription(input);

      return {
        success: true,
        task
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse task'
      };
    }
  }

  /**
   * Extracts the main task title
   */
  private static extractTitle(input: string): string {
    // Remove common prefixes
    const cleanInput = input.replace(/^(create|add|make|set up)\s+(a|an|the)?\s+task\s+to\s+/i, '');
    
    // Take the first sentence or up to 50 characters
    const title = cleanInput.split(/[.!?]|\n/)[0].trim();
    return title.length > 50 ? `${title.slice(0, 47)}...` : title;
  }

  /**
   * Extracts task priority based on keywords
   */
  private static extractPriority(input: string): Task['priority'] {
    const lowercaseInput = input.toLowerCase();
    
    for (const [priority, keywords] of Object.entries(this.PRIORITY_KEYWORDS)) {
      if (keywords.some(keyword => lowercaseInput.includes(keyword))) {
        return priority as Task['priority'];
      }
    }

    return 'medium'; // Default priority
  }

  /**
   * Extracts date and time information
   */
  private static extractDateTime(input: string): Date | null {
    const date = new Date();
    let modified = false;

    // Check for today/tomorrow
    if (this.TIME_KEYWORDS.today.test(input)) {
      modified = true;
    } else if (this.TIME_KEYWORDS.tomorrow.test(input)) {
      date.setDate(date.getDate() + 1);
      modified = true;
    } else if (this.TIME_KEYWORDS.nextWeek.test(input)) {
      date.setDate(date.getDate() + 7);
      modified = true;
    }

    // Check for specific date
    const dateMatch = input.match(this.TIME_KEYWORDS.specificDate);
    if (dateMatch) {
      const dayName = dateMatch[1];
      const dayOfMonth = dateMatch[2];
      const monthName = dateMatch[3];

      if (dayName) {
        const targetDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
          .indexOf(dayName.toLowerCase());
        if (targetDay !== -1) {
          const currentDay = date.getDay();
          let daysToAdd = targetDay - currentDay;
          if (daysToAdd <= 0) daysToAdd += 7;
          date.setDate(date.getDate() + daysToAdd);
          modified = true;
        }
      } else if (dayOfMonth && monthName) {
        const month = new Date(Date.parse(monthName + " 1, 2000")).getMonth();
        if (!isNaN(month)) {
          date.setMonth(month);
          date.setDate(parseInt(dayOfMonth));
          modified = true;
        }
      }
    }

    // Check for specific time
    const timeMatch = input.match(this.TIME_KEYWORDS.specificTime);
    if (timeMatch) {
      const timeStr = timeMatch[1];
      const [hours, minutes] = timeStr.split(':');
      let hour = parseInt(hours);
      const minute = minutes ? parseInt(minutes) : 0;
      
      if (timeStr.toLowerCase().includes('pm') && hour < 12) {
        hour += 12;
      } else if (timeStr.toLowerCase().includes('am') && hour === 12) {
        hour = 0;
      }

      date.setHours(hour, minute, 0, 0);
      modified = true;
    }

    return modified ? date : null;
  }

  /**
   * Extracts duration information
   */
  private static extractDuration(input: string): string | undefined {
    const match = input.match(this.TIME_KEYWORDS.duration);
    if (!match) return undefined;

    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    // Convert to hours
    switch (unit) {
      case 'hour':
      case 'hr':
        return amount.toString();
      case 'day':
        return (amount * 8).toString(); // Assume 8-hour workday
      case 'week':
        return (amount * 40).toString(); // Assume 40-hour workweek
      case 'month':
        return (amount * 160).toString(); // Assume 160-hour workmonth
      default:
        return undefined;
    }
  }

  /**
   * Extracts automation rules
   */
  private static extractAutomation(input: string): ParsedTask['automation'] | undefined {
    // Check for recurring patterns
    for (const [frequency, pattern] of Object.entries(this.RECURRING_KEYWORDS)) {
      if (pattern.test(input)) {
        return {
          type: 'recurring',
          config: { frequency }
        };
      }
    }

    // Check for deadline reminders
    const deadlineMatch = input.match(this.DEADLINE_KEYWORDS.remind);
    if (deadlineMatch) {
      const amount = parseInt(deadlineMatch[1]);
      const unit = deadlineMatch[2].toLowerCase();
      
      // Convert to hours
      const hours = unit === 'hour' || unit === 'hr' ? amount :
                   unit === 'day' ? amount * 24 :
                   unit === 'week' ? amount * 168 : 24; // Default to 24 hours

      return {
        type: 'deadline',
        config: { notifyBefore: hours }
      };
    }

    return undefined;
  }

  /**
   * Extracts subtasks from lists or bullet points
   */
  private static extractSubtasks(input: string): ParsedTask['subtasks'] {
    const subtasks: ParsedTask['subtasks'] = [];
    
    // Look for bullet points, numbers, or dashed lists
    const subtaskRegex = /[-•*]\s*([^-•*\n]+)|(\d+\.\s*[^\n]+)/g;
    let match;

    while ((match = subtaskRegex.exec(input)) !== null) {
      const subtaskTitle = (match[1] || match[2]).trim();
      if (subtaskTitle) {
        const duration = this.extractDuration(subtaskTitle);
        subtasks.push({
          title: subtaskTitle.replace(this.TIME_KEYWORDS.duration, '').trim(),
          estimated_duration: duration
        });
      }
    }

    return subtasks;
  }

  /**
   * Extracts description from remaining text
   */
  private static extractDescription(input: string): string | undefined {
    // Remove the title and any matched patterns
    let description = input
      .replace(this.extractTitle(input), '')
      .replace(this.TIME_KEYWORDS.specificDate, '')
      .replace(this.TIME_KEYWORDS.specificTime, '')
      .replace(this.TIME_KEYWORDS.duration, '')
      .trim();

    // Remove any automation-related text
    Object.values(this.RECURRING_KEYWORDS).forEach(pattern => {
      description = description.replace(pattern, '');
    });
    description = description.replace(this.DEADLINE_KEYWORDS.remind, '');

    // Clean up and return if not empty
    description = description.replace(/\s+/g, ' ').trim();
    return description || undefined;
  }
}