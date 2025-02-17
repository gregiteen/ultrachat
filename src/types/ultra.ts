/**
 * UltraChat Bolt Core Types
 */

import type { PersonalizationDocument } from './personalization';

/**
 * Content types
 */
export type ContentType = 'image' | 'video' | 'voice' | 'text' | 'presentation';

/**
 * Content formats
 */
export type ContentFormat = 'raw' | 'processed' | 'optimized' | 'final';

/**
 * Delivery channels
 */
export type DeliveryChannel = 'email' | 'slack' | 'chat' | 'notification' | 'default';

/**
 * Options for Ultra operations
 */
export interface UltraOptions {
  // Recipients and targeting
  with?: string | string[];
  team?: string | string[];
  audience?: 'all' | 'team' | 'specific';

  // Style and format
  style?: 'formal' | 'casual' | 'technical' | 'creative';
  type?: ContentType;
  format?: 'detailed' | 'summary' | 'highlights';
  quality?: 'high' | 'medium' | 'draft';

  // Timing and urgency
  when?: string | Date | string[];
  urgency?: 'high' | 'medium' | 'low';
  schedule?: 'now' | 'later' | 'best_time';

  // Context and metadata
  context?: Record<string, any>;
  tags?: string[];
  category?: string;
  project?: string;
}

/**
 * Result from Ultra operations
 */
export interface UltraResult<T = any> {
  success: boolean;
  data: T;
  next?: () => Promise<UltraResult<T>>;
  improve?: () => Promise<UltraResult<T>>;
  metadata?: {
    timing?: {
      created: string;
      updated: string;
      scheduled?: string;
    };
    stats?: {
      views?: number;
      engagement?: number;
      completion?: number;
    };
    context?: {
      source?: string;
      related?: string[];
      thread?: string;
    };
  };
}

/**
 * Content types that can be created
 */
export interface UltraContent {
  type: ContentType;
  data: any;
  metadata: {
    created: string;
    creator: string;
    version: number;
    format: ContentFormat;
    size?: number;
    duration?: number;
    dimensions?: {
      width: number;
      height: number;
    };
  };
  context?: {
    project?: string;
    thread?: string;
    related?: string[];
  };
}

/**
 * Delivery configuration
 */
export interface UltraDelivery {
  channels: DeliveryChannel[];
  format: ContentType;
  timing: {
    scheduled: string;
    timezone: string;
  };
  targeting: {
    recipients: string[];
    groups: string[];
    conditions?: {
      presence?: boolean;
      status?: string;
      timezone?: string;
    };
  };
  tracking: {
    required: boolean;
    metrics: string[];
    notifications: boolean;
  };
}

/**
 * Helper types
 */
export type UltraPromise<T> = Promise<UltraResult<T>>;

export type UltraHandler<T = any> = (
  input: string | UltraContent,
  options?: UltraOptions
) => UltraPromise<T>;

export type UltraProcessor<T = any> = (
  content: UltraContent,
  options?: UltraOptions
) => UltraPromise<T>;

export type UltraTransformer<T = any> = (
  input: T,
  options?: UltraOptions
) => UltraPromise<T>;

/**
 * Error handling
 */
export interface UltraError extends Error {
  code: string;
  context?: Record<string, any>;
  retry?: boolean;
  suggestions?: string[];
}

/**
 * Context management
 */
export interface UltraContext {
  current: {
    user: string;
    project?: string;
    focus?: string;
  };
  history: Array<{
    action: string;
    timestamp: string;
    context: Record<string, any>;
  }>;
  preferences: PersonalizationDocument;
  state: {
    workflows: Record<string, any>;
    connections: Record<string, any>;
    resources: Record<string, any>;
  };
}

/**
 * Resource management
 */
export interface UltraResource {
  id: string;
  type: string;
  status: 'active' | 'pending' | 'completed';
  data: Record<string, any>;
  metadata: Record<string, any>;
}