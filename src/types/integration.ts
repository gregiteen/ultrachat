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