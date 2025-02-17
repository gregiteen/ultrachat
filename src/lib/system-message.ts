import type { Assistant } from '../types';

export function generateSystemMessage(assistant: Partial<Assistant>): string {
  let message = '';

  // Add assistant name and prompt
  if (assistant.name) {
    message += `Assistant: ${assistant.name}\n\n`;
  }
  if (assistant.prompt) {
    message += `${assistant.prompt}\n\n`;
  }

  // Add AI personality settings
  if (assistant.personality) {
    message += 'Personality Settings:\n';
    message += `- Communication Tone: ${assistant.personality.tone}\n`;
    message += `- Interaction Style: ${assistant.personality.style}\n`;
    message += '- Personality Traits:\n';
    assistant.personality.traits.forEach(trait => {
      message += `  * ${trait.label} (${trait.level}%): ${trait.description}\n`;
    });
    message += '\n';
  }

  // Add integrations if available
  if (assistant.integrations?.length) {
    message += 'Available Integrations:\n';
    assistant.integrations.forEach(integration => {
      message += `- ${integration}\n`;
    });
    message += '\n';
  }

  return message.trim();
}