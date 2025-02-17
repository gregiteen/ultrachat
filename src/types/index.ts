import type { User as SupabaseUser } from '@supabase/supabase-js';

// Message and Thread types
export type MessageArray = Message[];
export type ThreadArray = Thread[];

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  thread_id: string;
  context_id?: string;
  user_id: string;
  files?: string[];
  created_at: string;
}

export interface Thread {
  id: string;
  user_id: string;
  title: string;
  context_id?: string;
  pinned: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type User = SupabaseUser;

// Integration types
export interface Integration {
  id: string;
  user_id: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  last_synced?: string;
  settings?: {
    name?: string;
    endpoint?: string;
    api_key?: string;
  };
  credentials?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

// Task types
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  estimated_duration?: string;
  dependencies?: string[];
  automation_rules?: AutomationRule;
}

export interface AutomationRuleBase {
  type: 'recurring' | 'dependent' | 'deadline';
  status: 'active' | 'failed' | 'completed';
  config: {
    frequency?: string;
    dependsOn?: string[];
    notifyBefore?: number;
  };
  error?: string;
}

export interface AutomationRule extends AutomationRuleBase {}

export interface AutomationRuleInput extends Partial<AutomationRuleBase> {
  type: 'recurring' | 'dependent' | 'deadline';
  config: {
    frequency?: string;
    dependsOn?: string[];
    notifyBefore?: number;
  };
}

export interface TaskNotification {
  type: 'email' | 'reminder';
  task: Task;
  scheduledFor: Date;
  message: string;
  sent: boolean;
}

// Credential types
export interface CredentialMetadata {
  title?: string;
  url?: string;
  icon?: string;
  category?: CredentialCategory;
}

export type CredentialCategory = 
  | 'communication'
  | 'productivity'
  | 'social'
  | 'development'
  | 'storage'
  | 'media'
  | 'database';

export const CATEGORIES: Record<CredentialCategory, string> = {
  communication: 'Communication',
  productivity: 'Productivity',
  social: 'Social Media',
  development: 'Development',
  storage: 'Storage',
  media: 'Media',
  database: 'Database'
};

// Voice types
export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
}

export interface Voice {
  id?: string;
  name: string;
  description?: string;
  settings: VoiceSettings;
}

// Context types
export interface Context {
  id: string;
  user_id: string;
  name: string;
  ai_name: string;
  content: string;
  files?: string[];
  voice: Voice;
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
  personalization_document?: string;
  created_at: string;
  updated_at: string;
}

// Shared types used by both personalization and context systems
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface ClothingSizes {
  top?: string;
  bottom?: string;
}

export interface PersonalityTraits {
  mbti?: string;
  enneagram?: string;
  customTraits?: string[];
}

export interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  address?: Address;
  job?: string;
  company?: string;
  projects?: string;
  resume?: string;
  height?: string;
  weight?: string;
  shoe_size?: string;
  clothing_sizes?: ClothingSizes;
  health_concerns?: string[];
  pets?: string[];
  goals?: string[];
  dreams?: string[];
  hobbies?: string[];
  favorite_foods?: string[];
  favorite_drinks?: string[];
  family?: string[];
  friends?: string[];
  love_interests?: string[];
  cultural_groups?: string[];
  religion?: string;
  worldview?: string;
  personalityTraits?: PersonalityTraits;
  backstory?: string;
  interests?: string[];
  expertise?: string[];
  files?: string[];
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
  personalization_document?: string;
}

export interface Contact {
  name: string;
  role?: string;
  notes?: string;
}

// Unified Message types
export interface UnifiedMessage {
  id: string;
  content: string;
  sender: string;
  source: 'email' | 'slack' | 'messenger' | 'instagram';
  read: boolean;
  created_at: string;
  user_id: string;
}