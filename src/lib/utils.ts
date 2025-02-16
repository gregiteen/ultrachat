import type { PersonalInfo } from '../types';

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getArrayField(field: string[] | string | undefined): string[] {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  return field.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
}

export function formatArrayField(field: string[] | string | undefined): string {
  if (!field) return '';
  if (Array.isArray(field)) return field.join(', ');
  return field;
}

export function processPersonalInfo(info: PersonalInfo): PersonalInfo {
  return {
    ...info,
    interests: getArrayField(info.interests),
    hobbies: getArrayField(info.hobbies),
    favorite_foods: getArrayField(info.favorite_foods),
    favorite_drinks: getArrayField(info.favorite_drinks),
    family: getArrayField(info.family),
    friends: getArrayField(info.friends),
    love_interests: getArrayField(info.love_interests),
    cultural_groups: getArrayField(info.cultural_groups),
    goals: getArrayField(info.goals),
    dreams: getArrayField(info.dreams),
    health_concerns: getArrayField(info.health_concerns),
    keywords: getArrayField(info.keywords),
    expertise: getArrayField(info.expertise),
    pets: getArrayField(info.pets)
  };
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function extractPersonalizationContext(info: PersonalInfo) {
  // Convert all info fields into a single text document
  const fields = Object.entries(info)
    .filter(([key, value]) => value && key !== 'id' && key !== 'user_id' && key !== 'created_at' && key !== 'updated_at')
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key.replace(/_/g, ' ')}: ${value.join(', ')}`;
      }
      if (typeof value === 'object') {
        return `${key.replace(/_/g, ' ')}: ${JSON.stringify(value, null, 2)}`;
      }
      return `${key.replace(/_/g, ' ')}: ${value}`;
    })
    .join('\n');

  return {
    name: info.name,
    personalDocument: fields,
    preferences: {
      communication: info.communication_preferences?.tone || 'professional',
      learning: info.learning_preferences?.style || 'adaptive',
      workStyle: info.work_preferences?.style || 'flexible'
    }
  };
}