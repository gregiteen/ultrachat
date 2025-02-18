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
  version_count: number;
  created_at: string;
  versions?: MessageVersion[];
}

export interface MessageVersion {
  id: string;
  message_id: string;
  content: string;
  version_number: number;
  created_at: string;
  created_by: string;
  is_current?: boolean;
}

export interface Thread {
  id: string;
  user_id: string;
  title: string;
  context_id?: string;
  pinned?: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Context {
  id: string;
  user_id: string;
  name: string;
  ai_name: string;
  content: string;
  voice?: {
    id: string;
    name: string;
    settings: {
      stability: number;
      similarity_boost: number;
    };
  };
}

export type User = SupabaseUser;

// Theme types
export interface Theme {
  id: string;
  name: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
    mutedForeground: string;
    inputBackground: string;
    buttonText: string;
    iconColor: string;
    iconHover: string;
  };
  spacing?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  typography?: {
    fontFamily?: string;
    fontSize?: {
      base?: string;
      sm?: string;
      lg?: string;
    };
    fontWeight?: {
      normal?: number;
      bold?: number;
    };
  };
  animation?: {
    duration?: {
      fast?: string;
      normal?: string;
      slow?: string;
    };
    easing?: {
      default?: string;
      smooth?: string;
      bounce?: string;
    };
  };
  elevation?: {
    low?: string;
    medium?: string;
    high?: string;
  };
  borderRadius?: {
    sm?: string;
    md?: string;
    lg?: string;
    full?: string;
  };
}

// Settings types
export interface Settings {
  theme: Theme;
  customThemes: Theme[];
  notifications: {
    email: boolean;
    push: boolean;
  };
  volume: number;
}

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

// Search types
export interface SearchResponse {
  summary: string;
  sources: SearchSource[];
  source_previews: { [key: string]: string };
  followUps: FollowUpQuestion[];
}

export interface SearchSource {
  title: string;
  link: string;
  snippet: string;
  domain_trust: number;
  source: string;
  relevanceScore: number;
}

export interface FollowUpQuestion {
  text: string;
  type: 'clarification' | 'deeper' | 'related';
  context?: {
    source?: string;
    relevance?: number;
  };
}