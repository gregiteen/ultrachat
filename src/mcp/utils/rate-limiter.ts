/**
 * Rate limiter for API requests
 * Uses token bucket algorithm for efficient rate limiting
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;
  private readonly refillInterval: number;

  constructor(config: {
    requests: number;  // max requests per period
    period: number;    // period in milliseconds
  }) {
    this.maxTokens = config.requests;
    this.tokens = config.requests;
    this.lastRefill = Date.now();
    this.refillInterval = config.period;
    this.refillRate = config.requests / (config.period / 1000); // tokens per second
  }

  /**
   * Acquire a token for making a request
   */
  async acquire(): Promise<void> {
    await this.refill();
    
    if (this.tokens < 1) {
      const waitTime = this.getWaitTime();
      await new Promise(resolve => setTimeout(resolve, waitTime));
      await this.refill();
    }

    this.tokens--;
  }

  /**
   * Refill tokens based on elapsed time
   */
  private async refill(): Promise<void> {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const newTokens = (timePassed / 1000) * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }

  /**
   * Calculate wait time until next token is available
   */
  private getWaitTime(): number {
    const tokensNeeded = 1 - this.tokens;
    return (tokensNeeded / this.refillRate) * 1000;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Reset state
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }
}