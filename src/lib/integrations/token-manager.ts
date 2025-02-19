/**
 * Integration token management system
 */
import { supabase } from '../supabase-client';
import type { Integration } from '../../types/integration';
import { keychainCache } from '../keychain/cache';
import { keychainAudit } from '../keychain/audit';
import { AuditAction, AuditSeverity } from '../keychain/audit';

interface TokenInfo {
  access_token: string;
  refresh_token?: string;
  expires_at: Date;
  scope?: string[];
  token_type: string;
}

interface TokenCache {
  tokens?: TokenInfo;
  lastRefresh: Date;
  refreshInProgress?: Promise<TokenInfo>;
}

class TokenManager {
  private tokenCache = new Map<string, TokenCache>();
  private readonly REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes before expiry
  private readonly MAX_CACHE_SIZE = 100;
  private readonly CACHE_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // Periodic cache cleanup
    setInterval(() => this.cleanupCache(), this.CACHE_CLEANUP_INTERVAL);
  }

  /**
   * Get valid token for integration
   */
  async getToken(integration: Integration): Promise<TokenInfo> {
    const cached = this.tokenCache.get(integration.id);

    // Check if refresh already in progress
    if (cached?.refreshInProgress) {
      return cached.refreshInProgress;
    }

    // Check if token needs refresh
    if (this.needsRefresh(cached?.tokens)) {
      return this.refreshToken(integration);
    }

    // Return cached token
    if (cached?.tokens) {
      return cached.tokens;
    }

    // Initial token fetch
    return this.refreshToken(integration);
  }

  /**
   * Refresh token for integration
   */
  private async refreshToken(integration: Integration): Promise<TokenInfo> {
    const cached = this.tokenCache.get(integration.id);

    // Create refresh promise
    const refreshPromise = this.performRefresh(integration);
    
    // Cache the promise
    this.tokenCache.set(integration.id, {
      tokens: cached?.tokens,
      lastRefresh: cached?.lastRefresh || new Date(),
      refreshInProgress: refreshPromise
    });

    try {
      const tokens = await refreshPromise;
      
      // Cache successful result
      this.tokenCache.set(integration.id, {
        tokens,
        lastRefresh: new Date(),
        refreshInProgress: undefined
      });

      return tokens;
    } catch (error) {
      // Clear failed refresh
      const current = this.tokenCache.get(integration.id);
      if (current?.refreshInProgress === refreshPromise) {
        this.tokenCache.set(integration.id, {
          ...current,
          refreshInProgress: undefined
        });
      }
      throw error;
    }
  }

  /**
   * Perform token refresh
   */
  private async performRefresh(integration: Integration): Promise<TokenInfo> {
    const { type, credentials } = integration;
    if (!credentials?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      // Get refresh configuration
      const config = this.getRefreshConfig(type);
      
      // Perform refresh
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: credentials.refresh_token,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          scope: config.scope
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Calculate expiration
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

      const tokens: TokenInfo = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || credentials.refresh_token,
        expires_at: expiresAt,
        scope: data.scope?.split(' '),
        token_type: data.token_type
      };

      // Store in keychain
      await keychainCache.cacheKey({
        id: integration.id,
        name: `${type}_token`,
        key: tokens.access_token,
        service: type,
        userId: integration.user_id,
        encrypted: true,
        version: 1,
        createdAt: new Date(),
        metadata: {
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at.toISOString(),
          scope: tokens.scope,
          token_type: tokens.token_type
        }
      }, integration.user_id);

      // Update integration record
      await supabase
        .from('integrations')
        .update({
          credentials: {
            ...credentials,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: tokens.expires_at.toISOString()
          },
          last_synced: new Date().toISOString(),
          status: 'connected',
          error_message: null
        })
        .eq('id', integration.id);

      // Log successful refresh
      await keychainAudit.log(
        AuditAction.KEY_ROTATED,
        AuditSeverity.INFO,
        integration.user_id,
        {
          keyId: integration.id,
          service: type,
          metadata: {
            scope: tokens.scope,
            expires_at: tokens.expires_at
          }
        }
      );

      return tokens;
    } catch (error) {
      // Log refresh failure
      await keychainAudit.log(
        AuditAction.KEY_ROTATED, // Using KEY_ROTATED with error instead of a separate action
        AuditSeverity.ERROR,
        integration.user_id,
        {
          keyId: integration.id,
          service: type,
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      );

      // Update integration status
      await supabase
        .from('integrations')
        .update({
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Token refresh failed'
        })
        .eq('id', integration.id);

      throw error;
    }
  }

  /**
   * Check if token needs refresh
   */
  private needsRefresh(tokens?: TokenInfo): boolean {
    if (!tokens?.expires_at) return true;

    const now = new Date();
    return tokens.expires_at.getTime() - now.getTime() < this.REFRESH_BUFFER;
  }

  /**
   * Get refresh configuration for integration type
   */
  private getRefreshConfig(type: string): {
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    scope: string;
  } {
    const configs: Record<string, {
      tokenUrl: string;
      clientId: string;
      clientSecret: string;
      scope: string;
    }> = {
      github: {
        tokenUrl: 'https://github.com/login/oauth/access_token',
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        scope: 'repo user'
      },
      slack: {
        tokenUrl: 'https://slack.com/api/oauth.v2.access',
        clientId: process.env.SLACK_CLIENT_ID!,
        clientSecret: process.env.SLACK_CLIENT_SECRET!,
        scope: 'chat:write channels:read'
      },
      google: {
        tokenUrl: 'https://oauth2.googleapis.com/token',
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        scope: 'https://www.googleapis.com/auth/calendar.readonly'
      }
    };

    const config = configs[type];
    if (!config) {
      throw new Error(`No refresh configuration for integration type: ${type}`);
    }

    return config;
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = new Date();
    
    // Remove expired entries
    for (const [id, cache] of this.tokenCache.entries()) {
      if (this.needsRefresh(cache.tokens) && !cache.refreshInProgress) {
        this.tokenCache.delete(id);
      }
    }

    // Enforce cache size limit
    if (this.tokenCache.size > this.MAX_CACHE_SIZE) {
      // Remove oldest entries
      const sorted = Array.from(this.tokenCache.entries())
        .sort(([, a], [, b]) => a.lastRefresh.getTime() - b.lastRefresh.getTime());

      const toRemove = sorted.slice(0, sorted.length - this.MAX_CACHE_SIZE);
      for (const [id] of toRemove) {
        this.tokenCache.delete(id);
      }
    }
  }

  /**
   * Invalidate cached token
   */
  invalidateToken(integrationId: string): void {
    this.tokenCache.delete(integrationId);
  }

  /**
   * Clear entire token cache
   */
  clearCache(): void {
    this.tokenCache.clear();
  }
}

export const tokenManager = new TokenManager();