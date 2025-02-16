import type { PersonalInfo } from './index';

export interface PersonalizationChatState {
  currentStep: number;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  extractedInfo: Partial<PersonalInfo>;
  isProcessing: boolean;
  error: string | null;
}

export interface AIResponse {
  message: string;
  type: 'response' | 'question' | 'suggestion' | 'confirmation' | 'error' | 'greeting';
  intent: {
    category: 'basic_info' | 'address' | 'professional' | 'background' | 'personal' | 
              'preferences' | 'relationships' | 'identity' | 'interests' | 'goals' | 
              'health' | 'files';
    action: 'gather' | 'clarify' | 'suggest' | 'confirm';
    confidence: number;
    field: string;
  };
  suggestions: string[];
  extractedInfo: Record<string, any>;
}

export interface PersonalizationDocument {
  preferences: {
    communication: string;
    learning: string;
    workStyle: string;
  };
  interests: string[];
  expertise: string[];
  communication_style: {
    tone: string;
    formality: string;
    detail_level: string;
  };
  personality_traits: string[];
  goals: string[];
  context_awareness: {
    background: string;
    current_focus: string;
    future_aspirations: string;
  };
}