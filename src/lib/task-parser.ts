import type { Task } from '../types';

// Task-related keywords and patterns
const taskKeywords = [
  'create task',
  'add task',
  'new task',
  'todo',
  'remind me to',
  'schedule',
  'set deadline',
];

const priorityKeywords = {
  high: ['urgent', 'important', 'critical', 'asap', 'high priority'],
  medium: ['normal', 'medium priority'],
  low: ['low priority', 'whenever', 'not urgent'],
};

const datePatterns = [
  // Today/Tomorrow
  { regex: /\b(today|tomorrow)\b/i, handler: (match: string) => {
    const date = new Date();
    if (match.toLowerCase() === 'tomorrow') {
      date.setDate(date.getDate() + 1);
    }
    return date;
  }},
  // Next week
  { regex: /\bnext week\b/i, handler: () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  }},
  // Day of week (e.g., "on Monday")
  { regex: /\bon\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, handler: (match: string) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = days.indexOf(match.toLowerCase().replace('on ', ''));
    const date = new Date();
    const currentDay = date.getDay();
    const daysToAdd = (targetDay + 7 - currentDay) % 7;
    date.setDate(date.getDate() + daysToAdd);
    return date;
  }},
  // Specific date (e.g., "on March 15")
  { regex: /\bon\s+([a-z]+)\s+(\d{1,2})(st|nd|rd|th)?/i, handler: (match: string) => {
    const [_, month, day] = match.toLowerCase().match(/([a-z]+)\s+(\d{1,2})/) || [];
    if (month && day) {
      const date = new Date();
      const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      const monthIndex = months.indexOf(month.toLowerCase());
      if (monthIndex !== -1) {
        date.setMonth(monthIndex);
        date.setDate(parseInt(day));
        return date;
      }
    }
    return null;
  }},
];

export function parseTaskFromMessage(message: string): Partial<Task> | null {
  // Check if message contains task-related keywords
  const hasTaskKeyword = taskKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );

  if (!hasTaskKeyword) return null;

  // Extract task title (everything after the keyword until the next special indicator)
  let title = '';
  for (const keyword of taskKeywords) {
    const index = message.toLowerCase().indexOf(keyword);
    if (index !== -1) {
      title = message.slice(index + keyword.length).trim();
      break;
    }
  }

  // Remove any trailing details we'll parse separately
  title = title.split(/\b(by|on|due|with priority)\b/i)[0].trim();

  // Determine priority
  let priority: 'low' | 'medium' | 'high' = 'medium';
  for (const [level, keywords] of Object.entries(priorityKeywords)) {
    if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
      priority = level as 'low' | 'medium' | 'high';
      break;
    }
  }

  // Parse due date
  let dueDate: Date | null = null;
  for (const pattern of datePatterns) {
    const match = message.match(pattern.regex);
    if (match) {
      dueDate = pattern.handler(match[0]);
      break;
    }
  }

  if (!title) return null;

  return {
    title,
    priority,
    due_date: dueDate?.toISOString(),
    status: 'todo'
  };
}