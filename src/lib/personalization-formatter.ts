import type { PersonalInfo } from '../types';

export function formatPersonalizationContext(personalInfo: PersonalInfo): string {
  const sections: string[] = [];

  if (personalInfo.name) {
    sections.push(`Name: ${personalInfo.name}`);
  }

  if (personalInfo.personalization_document) {
    sections.push(`Personal Background:\n${personalInfo.personalization_document}`);
  }

  if (personalInfo.interests && personalInfo.interests.length > 0) {
    sections.push(`Interests: ${personalInfo.interests.join(', ')}`);
  }

  if (personalInfo.communication_preferences?.tone) {
    sections.push(`Communication Style: ${personalInfo.communication_preferences.tone}`);
  }

  if (personalInfo.learning_preferences?.style) {
    sections.push(`Learning Style: ${personalInfo.learning_preferences.style}`);
  }

  if (personalInfo.work_preferences?.style) {
    sections.push(`Work Style: ${personalInfo.work_preferences.style}`);
  }

  if (sections.length === 0) {
    return '';
  }

  return `User Information:\n\n${sections.join('\n\n')}`;
}

export function formatPersonalResponse(query: string, personalInfo: PersonalInfo): string {
  // Format response based on query type
  const normalizedQuery = query.toLowerCase();
  
  if (normalizedQuery.includes('who am i') || normalizedQuery.includes('tell me about myself')) {
    return formatFullProfile(personalInfo);
  }
  
  if (normalizedQuery.includes('my interests')) {
    return formatInterests(personalInfo);
  }
  
  if (normalizedQuery.includes('my background')) {
    return formatBackground(personalInfo);
  }
  
  // Default to full profile
  return formatFullProfile(personalInfo);
}

function formatFullProfile(personalInfo: PersonalInfo): string {
  const sections: string[] = [];
  
  if (personalInfo.name) {
    sections.push(`You are ${personalInfo.name}.`);
  }

  if (personalInfo.personalization_document) {
    sections.push(personalInfo.personalization_document);
  }

  if (personalInfo.interests && personalInfo.interests.length > 0) {
    sections.push(`Your interests include: ${personalInfo.interests.join(', ')}`);
  }

  const preferences: string[] = [];
  if (personalInfo.communication_preferences?.tone) {
    preferences.push(`communicate in a ${personalInfo.communication_preferences.tone} style`);
  }
  if (personalInfo.learning_preferences?.style) {
    preferences.push(`learn best through ${personalInfo.learning_preferences.style}`);
  }
  if (personalInfo.work_preferences?.style) {
    preferences.push(`prefer a ${personalInfo.work_preferences.style} work environment`);
  }

  if (preferences.length > 0) {
    sections.push(`You ${preferences.join(' and ')}.`);
  }

  return sections.join('\n\n');
}

function formatInterests(personalInfo: PersonalInfo): string {
  if (!personalInfo.interests || personalInfo.interests.length === 0) {
    return 'I don\'t have any specific interests recorded for you yet.';
  }

  return `Your interests include:\n\n${personalInfo.interests.map(interest => `• ${interest}`).join('\n')}`;
}

function formatBackground(personalInfo: PersonalInfo): string {
  if (!personalInfo.personalization_document) {
    return 'I don\'t have detailed background information recorded for you yet.';
  }

  return personalInfo.personalization_document;
}