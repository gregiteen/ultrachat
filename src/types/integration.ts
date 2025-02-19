export interface IntegrationLogo {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface IntegrationMetadata {
  name: string;
  description: string;
  category: string;
  logo: IntegrationLogo;
  capabilities: string[];
  authType: 'oauth' | 'apiKey' | 'none';
  apiKeyUrl?: string;
  apiKeyPlaceholder?: string;
  apiKeyInstructions?: string;
  docsUrl?: string;
}

export type IntegrationType = 
  | 'gmail' 
  | 'google_calendar' 
  | 'outlook' 
  | 'slack' 
  | 'github' 
  | 'custom'
  | string;

export interface Integration {
  id: string;
  user_id: string;
  type: 'gmail' | 'google_calendar' | 'outlook' | 'slack' | 'github' | 'custom';
  status: 'connected' | 'disconnected' | 'error';
  settings?: {
    name?: string;
    endpoint?: string;
    api_key?: string;
  };
  credentials?: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_at: number;
  };
  last_synced?: string;
  metadata?: {
    name: string;
    description: string;
    capabilities: string[];
    metadata: IntegrationMetadata;
  };
}

export interface LocationContext {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  place?: {
    name: string;
    address: string;
    type: string;
  };
  radius?: number;
}

export interface MediaContent {
  type: 'show' | 'movie' | 'video' | 'music';
  title: string;
  platform: string;
  url: string;
  metadata?: {
    duration?: string;
    genre?: string;
    creator?: string;
  };
}

export interface TaskResult {
  success: boolean;
  task: {
    title: string;
    message?: string;
    due_date?: string;
    priority?: 'high' | 'medium' | 'low';
  };
}

export interface MediaResult {
  success: boolean;
  action: string;
  shared?: boolean;
  content: {
    type: 'show' | 'movie' | 'video' | 'music';
    title: string;
    platform: string;
    url: string;
  };
}

export interface ProductivityResult {
  success: boolean;
  actions: Array<{
    type: string;
    status: string;
    result: {
      title: string;
    };
  }>;
}

export interface SocialResult {
  success: boolean;
  action: string;
  content: {
    text?: string;
    link?: {
      url: string;
      title?: string;
    };
  };
  platforms: string[];
}

export interface AIIntent {
  action: string;
  category: string;
  confidence: number;
  type?: string;
}

export interface SocialMetrics {
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
  reach: {
    impressions: number;
    uniqueViews: number;
  };
  sentiment: {
    score: number;
    keywords: string[];
  };
}