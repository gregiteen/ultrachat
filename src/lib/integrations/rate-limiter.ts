import { IntegrationType } from '../../types/integration';

interface RateLimit {
  remaining: number;
  reset: Date;
  limit: number;
}

interface RateLimitResponse {
  isLimited: boolean;
  limit?: RateLimit;
}

class RateLimiter {
  private limits = new Map<string, RateLimit>();
  private readonly DEFAULT_LIMIT = 5000;
  private readonly DEFAULT_WINDOW = 3600000; // 1 hour in milliseconds

  async getRateLimit(type: IntegrationType): Promise<RateLimitResponse> {
    const now = new Date();
    const limit = this.limits.get(type);

    // If no limit exists or it's expired, create a new one
    if (!limit || now > limit.reset) {
      const newLimit: RateLimit = {
        remaining: this.DEFAULT_LIMIT,
        reset: new Date(now.getTime() + this.DEFAULT_WINDOW),
        limit: this.DEFAULT_LIMIT
      };
      this.limits.set(type, newLimit);
      return {
        isLimited: false,
        limit: newLimit
      };
    }

    // Check if we're rate limited
    if (limit.remaining <= 0) {
      return {
        isLimited: true,
        limit
      };
    }

    // Decrement remaining calls
    limit.remaining--;
    return {
      isLimited: false,
      limit
    };
  }

  resetLimit(type: IntegrationType): void {
    this.limits.delete(type);
  }

  clearLimits(): void {
    this.limits.clear();
  }
}

export const rateLimiter = new RateLimiter();