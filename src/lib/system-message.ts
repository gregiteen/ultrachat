import type { Context } from '../types';

export function generateSystemMessage(context: Partial<Context>): string {
  let message = '';

  // Add context name and description
  if (context.name) {
    message += `Context: ${context.name}\n\n`;
  }
  if (context.content) {
    message += `${context.content}\n\n`;
  }

  // Add AI personality settings
  if (context.ai_personality) {
    message += 'AI Personality Settings:\n';
    message += `- Communication Tone: ${context.ai_personality.tone}\n`;
    message += '- Personality Traits:\n';
    context.ai_personality.traits.forEach(trait => {
      message += `  * ${trait.label} (${trait.level}%): ${trait.description}\n`;
    });
    message += '\n';
  }

  // Add personal information if available
  if (context.personal_info) {
    message += 'Personal Information:\n';
    if (context.personal_info.name) {
      message += `- Name: ${context.personal_info.name}\n`;
    }
    if (context.personal_info.email) {
      message += `- Email: ${context.personal_info.email}\n`;
    }
    if (context.personal_info.personalityTraits) {
      message += '- Personality Traits:\n';
      if (context.personal_info.personalityTraits.mbti) {
        message += `  * MBTI: ${context.personal_info.personalityTraits.mbti}\n`;
      }
      if (context.personal_info.personalityTraits.enneagram) {
        message += `  * Enneagram: ${context.personal_info.personalityTraits.enneagram}\n`;
      }
      if (context.personal_info.personalityTraits.customTraits?.length) {
        message += `  * Custom Traits: ${context.personal_info.personalityTraits.customTraits.join(', ')}\n`;
      }
    }
    message += '\n';
  }

  // Add contacts if available
  if (context.contacts?.length) {
    message += 'Important Contacts:\n';
    context.contacts.forEach(contact => {
      message += `- ${contact.name}`;
      if (contact.role) message += ` (${contact.role})`;
      if (contact.notes) message += `\n  Notes: ${contact.notes}`;
      message += '\n';
    });
    message += '\n';
  }

  // Add keywords/special instructions
  if (context.keywords?.length) {
    message += 'Special Instructions:\n';
    context.keywords.forEach(keyword => {
      message += `- When user says "${keyword.keyword}": ${keyword.description}\n`;
    });
    message += '\n';
  }

  return message.trim();
}