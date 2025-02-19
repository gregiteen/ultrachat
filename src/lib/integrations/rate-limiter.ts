/**
 * Integration rate limiting system
 */
import type { Integration } from '../../types/integration';

interface RateLimitInfo {
  remaining: number;
  reset: Date;
  limit: number;
  window: number;
  retryAfter?: number;
}

interface RateLimitConfig {
  limit: number;
  window: number;
  strategy: 'fixed' | 'sliding' | 'token';
  groupKey?: string;
}

interface RateLimitState {
  info: RateLimitInfo;
  lastUpdated: Date;
  predictions: {
    nextReset: Date;
    estimatedRemaining: number;
  };
}

class RateLimiter {
  private limits = new Map<string, RateLimitState>();
  private readonly DEFAULT_WINDOW = 3600; // 1 hour in seconds
  private readonly PREDICTION_INTERVAL = 60000; // 1 minute
  private readonly CLEANUP_INTERVAL = 3600000; // 1 hour

  constructor() {
    // Periodic cleanup and prediction updates
    setInterval(() => this.updatePredictions(), this.PREDICTION_INTERVAL);
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
  }

  /**
   * Check if request can proceed
   */
  async checkLimit(integration: Integration): Promise<boolean> {
    const config = this.getConfig(integration.type);
    const state = this.limits.get(this.getKey(integration, config));

    // No state means no rate limit info yet
    if (!state) return true;

    // Check if reset time has passed
    if (new Date() > state.info.reset) {
      this.limits.delete(this.getKey(integration, config));
      return true;
    }

    // Check remaining requests
    return state.info.remaining > 0;
  }

  /**
   * Get wait time before next request
   */
  getWaitTime(integration: Integration): number {
    const config = this.getConfig(integration.type);
    const state = this.limits.get(this.getKey(integration, config));

    if (!state) return 0;

    const now = new Date();
    if (now > state.info.reset) return 0;

    if (state.info.remaining > 0) return 0;

    return Math.max(0, state.info.reset.getTime() - now.getTime());
  }

  /**
   * Update rate limit info from response
   */
  updateFromResponse(integration: Integration, response: Response): void {
    const config = this.getConfig(integration.type);
    const key = this.getKey(integration, config);

    // Parse headers based on service
    const info = this.parseHeaders(integration.type, response);
    if (!info) return;

    // Update state
    this.limits.set(key, {
      info,
      lastUpdated: new Date(),
      predictions: this.calculatePredictions(info)
    });
  }

  /**
   * Get rate limit info
   */
  getLimitInfo(integration: Integration): RateLimitInfo | null {
    const config = this.getConfig(integration.type);
    const state = this.limits.get(this.getKey(integration, config));
    return state?.info || null;
  }

  /**
   * Parse rate limit headers
   */
  private parseHeaders(type: string, response: Response): RateLimitInfo | null {
    const headers = response.headers;

    switch (type) {
      case 'github':
        return {
          remaining: parseInt(headers.get('x-ratelimit-remaining') || '0'),
          reset: new Date(parseInt(headers.get('x-ratelimit-reset') || '0') * 1000),
          limit: parseInt(headers.get('x-ratelimit-limit') || '0'),
          window: parseInt(headers.get('x-ratelimit-window') || this.DEFAULT_WINDOW.toString()),
          retryAfter: headers.get('retry-after') 
            ? parseInt(headers.get('retry-after') || '0')
            : undefined
        };

      case 'slack':
        return {
          remaining: parseInt(headers.get('x-rate-limit-remaining') || '0'),
          reset: new Date(parseInt(headers.get('x-rate-limit-reset') || '0') * 1000),
          limit: parseInt(headers.get('x-rate-limit-limit') || '0'),
          window: parseInt(headers.get('x-rate-limit-window') || this.DEFAULT_WINDOW.toString())
        };

      // Add more service-specific parsing
      default:
        // Generic parsing
        const remaining = headers.get('x-ratelimit-remaining') 
          || headers.get('x-rate-limit-remaining')
          || headers.get('ratelimit-remaining');

        const reset = headers.get('x-ratelimit-reset')
          || headers.get('x-rate-limit-reset')
          || headers.get('ratelimit-reset');

        const limit = headers.get('x-ratelimit-limit')
          || headers.get('x-rate-limit-limit')
          || headers.get('ratelimit-limit');

        if (!remaining || !reset || !limit) return null;

        return {
          remaining: parseInt(remaining),
          reset: new Date(parseInt(reset) * 1000),
          limit: parseInt(limit),
          window: this.DEFAULT_WINDOW
        };
    }
  }

  /**
   * Get rate limit configuration
   */
  private getConfig(type: string): RateLimitConfig {
    const configs: Record<string, RateLimitConfig> = {
      github: {
        limit: 5000,
        window: 3600,
        strategy: 'sliding',
        groupKey: 'github-api'
      },
      slack: {
        limit: 100,
        window: 60,
        strategy: 'token',
        groupKey: 'slack-api'
      },
      // Add more service configs
    };

    return configs[type] || {
      limit: 1000,
      window: this.DEFAULT_WINDOW,
      strategy: 'fixed'
    };
  }

  /**
   * Calculate rate limit predictions
   */
  private calculatePredictions(info: RateLimitInfo): {
    nextReset: Date;
    estimatedRemaining: number;
  } {
    const now = new Date();
    const timeUntilReset = info.reset.getTime() - now.getTime();
    const requestRate = (info.limit - info.remaining) / (info.window * 1000);
    const estimatedRequests = requestRate * timeUntilReset;

    return {
      nextReset: info.reset,
      estimatedRemaining: Math.max(0, info.remaining - Math.ceil(estimatedRequests))
    };
  }

  /**
   * Update rate limit predictions
   */
  private updatePredictions(): void {
    const now = new Date();

    for (const [key, state] of this.limits.entries()) {
      // Skip if reset time has passed
      if (now > state.info.reset) {
        this.limits.delete(key);
        continue;
      }

      // Update predictions
      state.predictions = this.calculatePredictions(state.info);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = new Date();

    for (const [key, state] of this.limits.entries()) {
      if (now > state.info.reset) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Get cache key
   */
  private getKey(integration: Integration, config: RateLimitConfig): string {
    return config.groupKey 
      ? `${config.groupKey}:${integration.user_id}`
      : `${integration.type}:${integration.id}:${integration.user_id}`;
  }

  /**
   * Calculate backoff delay
   */
  calculateBackoff(
    integration: Integration,
    attempt: number,
    error?: Error
  ): number {
    const state = this.getLimitInfo(integration);
    
    // If we have a retry-after header, use that
    if (state?.retryAfter) {
      return state.retryAfter * 1000;
    }

    // If we're rate limited, wait until reset
    if (state?.remaining === 0) {
      return Math.max(0, state.reset.getTime() - Date.now());
    }

    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 60000; // 1 minute
    const exponentialDelay = Math.min(
      maxDelay,
      baseDelay * Math.pow(2, attempt - 1)
    );

    // Add jitter (±25%)
    const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
    return exponentialDelay + jitter;
  }
}

export const rateLimiter = new RateLimiter();