export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  thread_id: string;
  user_id: string;
  context_id?: string;
  files?: string[];
  versions?: string[];
  created_at: string;
}

export interface Thread {
  id: string;
  title: string;
  user_id: string;
  context_id?: string;
  pinned?: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Context {
  id: string;
  name: string;
  ai_name: string;
  content: string;
  user_id: string;
  voice: {
    id?: string;
    name: string;
    description?: string;
    settings?: {
      stability: number;
      similarity_boost: number;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  job?: string;
  company?: string;
  interests?: string[];
  expertise?: string[];
  goals?: string[];
  dreams?: string[];
  backstory?: string;
  projects?: string;
  resume?: string;
  hobbies?: string[];
  favorite_foods?: string[];
  favorite_drinks?: string[];
  family?: string[];
  friends?: string[];
  love_interests?: string[];
  cultural_groups?: string[];
  health_concerns?: string[];
  keywords?: string[];
  pets?: string[];
  communication_preferences?: {
    tone?: string;
    style?: string;
  };
  learning_preferences?: {
    style?: string;
    pace?: string;
  };
  work_preferences?: {
    style?: string;
    environment?: string;
  };
  personalization_document?: {
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
  };
}