export interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  job?: string;
  company?: string;
  mbti?: string;
  backstory?: string;
  projects?: string;
  pets?: string[];
  health_concerns?: string[];
  height?: string;
  weight?: string;
  shoe_size?: string;
  clothing_sizes?: {
    top?: string;
    bottom?: string;
  };
  goals?: string[];
  dreams?: string[];
  resume?: string;
  hobbies?: string[];
  family?: string[];
  favorite_foods?: string[];
  favorite_drinks?: string[];
  friends?: string[];
  love_interests?: string[];
  cultural_groups?: string[];
  religion?: string;
  worldview?: string;
}

export interface Context {
  id: string;
  user_id: string;
  name: string;
  ai_name: string;
  content: string;
  voice: {
    id?: string;
    name: string;
    description?: string;
    settings?: {
      stability: number;
      similarity_boost: number;
    };
  };
  is_active: boolean;
  is_default?: boolean;
  created_at: string;
  updated_at: string;
  files?: string[]; // Array of file paths
  personal_info?: PersonalInfo;
  contacts?: Contact[];
  ai_personality?: AIPersonality;
  keywords?: ContextKeyword[];
  personalization_document?: string;
  system_message?: string;
}

export interface Message {
  id: string;
  user_id: string;
  thread_id: string;
  content: string;
  role: 'user' | 'assistant';
  context_id?: string;
  created_at: string;
  files?: string[];
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
  parent_id?: string;
}

export interface UnifiedMessage {
  id: string;
  user_id: string;
  source: 'email' | 'slack' | 'messenger' | 'instagram';
  content: string;
  sender: string;
  read: boolean;
  created_at: string;
}

export interface ThemeColors {
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
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  isCustom?: boolean;
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

export interface Integration {
  id: string;
  type: 'gmail' | 'outlook' | 'slack' | 'google_calendar' | 'zoom' | 'teams';
  status: 'connected' | 'disconnected' | 'error';
  last_synced?: string;
  credentials?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    scope: string[];
  };
  settings?: Record<string, any>;
}

export interface SubscriptionTier {
  id: 'free' | 'pro' | 'enterprise';
  name: string;
  price: number;
  billing_period: 'monthly' | 'yearly';
  features: string[];
  limits: {
    messages_per_day: number;
    storage_gb: number;
    max_integrations: number;
    max_team_members: number;
  };
}

export interface BillingDetails {
  customer_id?: string;
  subscription_id?: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due';
  current_period_end: string;
  cancel_at_period_end: boolean;
  payment_method?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface ApiUsage {
  period_start: string;
  period_end: string;
  total_requests: number;
  requests_by_type: {
    chat: number;
    task: number;
    email: number;
    calendar: number;
  };
  usage_percentage: number;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  notes?: string;
  tags?: string[];
  lastContact?: string;
  relationships?: Array<{
    contactId: string;
    relationship: string;
  }>;
}

export interface AITrait {
  id: string;
  label: string;
  description: string;
  level: number;
}

export interface AIPersonality {
  traits: AITrait[];
  customInstructions?: string;
}

export interface ContextKeyword {
  keyword: string;
  prompt: string;
  description?: string;
  category?: string;
}

export interface User {
    id: string;
    email?: string;
}

export interface Thread {
 id: string;
 user_id: string;
 title: string;
 context_id: string | null;
 created_at: string;
 updated_at: string;
 pinned: boolean;
 deleted_at: string | null;
}