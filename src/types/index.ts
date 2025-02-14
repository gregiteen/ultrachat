import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  created_at: string;
  subscription_tier?: 'free' | 'pro' | 'enterprise';
  subscription_status?: 'active' | 'canceled' | 'past_due';
  subscription_period_end?: string;
}

export interface Context {
  id: string;
  user_id: string;
  name: string;
  content: string;
  is_active: boolean;
  is_default?: boolean;
  created_at: string;
  updated_at: string;
  files?: string[];
  personal_info?: PersonalInfo;
  contacts?: Contact[];
  ai_personality?: AIPersonality;
  keywords?: ContextKeyword[];
  system_message?: string;
}

export interface Message {
  id: string;
  user_id: string;
  content: string;
  role: 'user' | 'assistant';
  context_id?: string;
  created_at: string;
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
  vehicles?: Array<{
    make?: string;
    model?: string;
    year?: string;
    licensePlate?: string;
    insurance?: {
      company?: string;
      policyNumber?: string;
    };
  }>;
  personalityTraits?: {
    mbti?: string;
    enneagram?: string;
    bigFive?: {
      openness?: number;
      conscientiousness?: number;
      extraversion?: number;
      agreeableness?: number;
      neuroticism?: number;
    };
    customTraits?: string[];
  };
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
  name: string;
  traits: AITrait[];
  customInstructions?: string;
}

export interface ContextKeyword {
  keyword: string;
  prompt: string;
  description?: string;
  category?: string;
}