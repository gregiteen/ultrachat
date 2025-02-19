/**
 * Integration connection pool manager
 */
import type { Integration } from '../../types/integration';
import { rateLimiter } from './rate-limiter';
import { tokenManager } from './token-manager';

interface PooledConnection {
  id: string;
  integration: Integration;
  lastUsed: Date;
  inUse: boolean;
  error?: Error;
  retryCount: number;
}

interface ConnectionOptions {
  timeout?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
}

class ConnectionPool {
  private pool = new Map<string, PooledConnection>();
  private requestQueue: Array<{
    resolve: (connection: PooledConnection) => void;
    reject: (error: Error) => void;
    integration: Integration;
  }> = [];

  private readonly MAX_POOL_SIZE = 50;
  private readonly CONNECTION_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute
  private readonly IDLE_TIMEOUT = 300000; // 5 minutes

  constructor() {
    // Periodic cleanup
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
  }

  /**
   * Get connection from pool
   */
  async getConnection(
    integration: Integration,
    options: ConnectionOptions = {}
  ): Promise<Response> {
    // Check rate limits
    const waitTime = rateLimiter.getWaitTime(integration);
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Get or create connection
    const connection = await this.acquireConnection(integration);

    try {
      // Make request
      const response = await this.makeRequest(connection, options);

      // Update rate limits
      rateLimiter.updateFromResponse(integration, response);

      // Handle rate limiting
      if (response.status === 429) {
        connection.retryCount++;
        const retryAfter = parseInt(response.headers.get('retry-after') || '0');
        const backoff = rateLimiter.calculateBackoff(
          integration,
          connection.retryCount,
          new Error('Rate limited')
        );
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000 || backoff));
        return this.getConnection(integration, options);
      }

      // Handle auth errors
      if (response.status === 401) {
        // Invalidate token and retry
        tokenManager.invalidateToken(integration.id);
        connection.retryCount++;
        if (connection.retryCount <= (options.maxRetries || this.MAX_RETRIES)) {
          return this.getConnection(integration, options);
        }
      }

      // Reset retry count on success
      if (response.ok) {
        connection.retryCount = 0;
        connection.error = undefined;
      }

      return response;
    } catch (error) {
      // Handle connection errors
      connection.error = error instanceof Error ? error : new Error('Request failed');
      connection.retryCount++;

      if (connection.retryCount <= (options.maxRetries || this.MAX_RETRIES)) {
        const backoff = rateLimiter.calculateBackoff(
          integration,
          connection.retryCount,
          connection.error
        );
        await new Promise(resolve => setTimeout(resolve, backoff));
        return this.getConnection(integration, options);
      }

      throw error;
    } finally {
      // Release connection back to pool
      this.releaseConnection(connection);
    }
  }

  /**
   * Acquire connection from pool
   */
  private async acquireConnection(integration: Integration): Promise<PooledConnection> {
    // Check for existing connection
    const existing = Array.from(this.pool.values()).find(
      conn => conn.integration.id === integration.id && !conn.inUse
    );

    if (existing) {
      existing.inUse = true;
      existing.lastUsed = new Date();
      return existing;
    }

    // Create new connection if pool not full
    if (this.pool.size < this.MAX_POOL_SIZE) {
      const connection: PooledConnection = {
        id: crypto.randomUUID(),
        integration,
        lastUsed: new Date(),
        inUse: true,
        retryCount: 0
      };
      this.pool.set(connection.id, connection);
      return connection;
    }

    // Wait for available connection
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.requestQueue.findIndex(
          req => req.resolve === resolve && req.reject === reject
        );
        if (index !== -1) {
          this.requestQueue.splice(index, 1);
          reject(new Error('Connection pool timeout'));
        }
      }, this.CONNECTION_TIMEOUT);

      this.requestQueue.push({
        resolve: (connection) => {
          clearTimeout(timeout);
          resolve(connection);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        integration
      });
    });
  }

  /**
   * Release connection back to pool
   */
  private releaseConnection(connection: PooledConnection): void {
    connection.inUse = false;
    connection.lastUsed = new Date();

    // Check for waiting requests
    if (this.requestQueue.length > 0) {
      const next = this.requestQueue.shift();
      if (next && next.integration.id === connection.integration.id) {
        connection.inUse = true;
        next.resolve(connection);
      } else if (next) {
        // Request is for different integration, keep looking
        this.releaseConnection(connection);
        this.acquireConnection(next.integration)
          .then(next.resolve)
          .catch(next.reject);
      }
    }
  }

  /**
   * Make HTTP request
   */
  private async makeRequest(
    connection: PooledConnection,
    options: ConnectionOptions
  ): Promise<Response> {
    const { integration } = connection;
    const token = await tokenManager.getToken(integration);

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Authorization': `${token.token_type} ${token.access_token}`,
      ...options.headers
    };

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeout || this.CONNECTION_TIMEOUT
    );

    try {
      const response = await fetch(integration.settings?.endpoint || '', {
        headers,
        signal: controller.signal
      });

      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Clean up idle connections
   */
  private cleanup(): void {
    const now = new Date();

    for (const [id, connection] of this.pool.entries()) {
      // Remove idle connections
      if (
        !connection.inUse &&
        now.getTime() - connection.lastUsed.getTime() > this.IDLE_TIMEOUT
      ) {
        this.pool.delete(id);
      }
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    totalConnections: number;
    activeConnections: number;
    queueLength: number;
  } {
    return {
      totalConnections: this.pool.size,
      activeConnections: Array.from(this.pool.values()).filter(c => c.inUse).length,
      queueLength: this.requestQueue.length
    };
  }

  /**
   * Clear connection pool
   */
  clear(): void {
    this.pool.clear();
    this.requestQueue.forEach(request => {
      request.reject(new Error('Connection pool cleared'));
    });
    this.requestQueue = [];
  }
}

export const connectionPool = new ConnectionPool();