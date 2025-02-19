export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  thread_id?: string;
  user_id?: string;
  created_at: string;
  updated_at?: string;
  version_count?: number;
  versions?: MessageVersion[];
  files?: string[];
  context_id?: string;
  integrations?: {
    used: string[];  // Names of integrations used to generate this response
    context?: {      // Optional context about how integrations were used
      [key: string]: any;
    };
  };
}

export interface MessageVersion {
  id: string;
  message_id: string;
  content: string;
  version_number: number;
  created_at: string;
  created_by: 'user' | 'system';
  is_current?: boolean;
}

export interface Thread {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  pinned: boolean;
  personalization_enabled: boolean;
  search_enabled: boolean;
  tools_used: string[];
  context_id?: string;
}

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
  relevanceScore: number;
}

export interface SearchResponse {
  summary: string;
  sources: SearchResult[];
  followUps: Array<{
    text: string;
    type: 'clarification' | 'deeper' | 'related';
  }>;
}

export interface User {
  id: string;
  aud: string;
  role: string;
  email?: string;
  email_confirmed_at?: string;
  phone?: string;
  confirmation_sent_at?: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
  app_metadata: {
    provider?: string;
    providers?: string[];
  };
  user_metadata: {
    [key: string]: any;
  };
  identities?: {
    id: string;
    user_id: string;
    identity_data: {
      [key: string]: any;
    };
    provider: string;
    last_sign_in_at: string;
    created_at: string;
    updated_at: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface Context {
  id: string;
  user_id: string;
  name: string;
  ai_name: string; // No longer optional
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  voice: { // No longer optional
    name: string;
    id?: string;
    settings: {
      stability: number;
      similarity_boost: number;
    };
  };
  files?: string[];
}

export interface AITrait {
  id: string;
  label: string;
  description: string;
  level: number;
}

export interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
}

export interface Settings {
  theme: Theme;
  customThemes: Theme[];
  notifications: {
    email: boolean;
    push: boolean;
  };
  volume: number;
}

export interface UnifiedMessage {
  id: string;
  content: string;
  source: string;
  timestamp: string;
  user_id: string;
  read: boolean;
  metadata?: Record<string, any>;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  parent_id?: string;
  assignee?: string;
  tags?: string[];
  automation_rules?: Record<string, any>;
  metadata?: Record<string, any>;
}