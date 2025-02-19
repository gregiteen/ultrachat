/**
 * OAuth token refresh implementation for various services
 */
import { supabase } from '../supabase';
import type { Integration } from '../../types/integration';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface RefreshConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
}

const REFRESH_CONFIGS: Record<string, RefreshConfig> = {
  github: {
    tokenUrl: 'https://github.com/login/oauth/access_token',
    clientId: process.env.VITE_GITHUB_CLIENT_ID!,
    clientSecret: process.env.VITE_GITHUB_CLIENT_SECRET!,
    scope: 'repo user'
  },
  slack: {
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    clientId: process.env.VITE_SLACK_CLIENT_ID!,
    clientSecret: process.env.VITE_SLACK_CLIENT_SECRET!,
    scope: 'chat:write channels:read'
  },
  google: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.VITE_GOOGLE_CLIENT_ID!,
    clientSecret: process.env.VITE_GOOGLE_CLIENT_SECRET!,
    scope: 'https://www.googleapis.com/auth/calendar.readonly'
  }
  // Add more service configurations as needed
};

export class TokenRefreshManager {
  private refreshPromises = new Map<string, Promise<void>>();

  /**
   * Refresh OAuth token for an integration
   */
  async refreshToken(integration: Integration): Promise<void> {
    // Check if refresh already in progress
    if (this.refreshPromises.has(integration.id)) {
      return this.refreshPromises.get(integration.id);
    }

    const refreshPromise = this.performRefresh(integration);
    this.refreshPromises.set(integration.id, refreshPromise);

    try {
      await refreshPromise;
    } finally {
      this.refreshPromises.delete(integration.id);
    }
  }

  private async performRefresh(integration: Integration): Promise<void> {
    if (!integration.credentials?.refresh_token) {
      throw new Error('No refresh token available');
    }

    const config = REFRESH_CONFIGS[integration.type];
    if (!config) {
      throw new Error(`No refresh configuration for ${integration.type}`);
    }

    try {
      // Get new tokens
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: integration.credentials.refresh_token,
          grant_type: 'refresh_token',
          scope: config.scope
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token refresh failed: ${error}`);
      }

      const data: TokenResponse = await response.json();

      // Calculate expiration
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

      // Update credentials in database
      const { error: updateError } = await supabase
        .from('integrations')
        .update({
          credentials: {
            access_token: data.access_token,
            refresh_token: data.refresh_token || integration.credentials.refresh_token,
            expires_at: expiresAt.toISOString()
          },
          status: 'connected',
          last_synced: new Date().toISOString()
        })
        .eq('id', integration.id);

      if (updateError) {
        throw updateError;
      }

      console.log(`Successfully refreshed token for ${integration.type} integration ${integration.id}`);
    } catch (error) {
      console.error(`Token refresh failed for ${integration.type} integration ${integration.id}:`, error);

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
  needsRefresh(integration: Integration): boolean {
    if (!integration.credentials?.expires_at) {
      return false;
    }

    const expiresAt = new Date(integration.credentials.expires_at);
    const now = new Date();

    // Refresh if token expires in less than 5 minutes
    return expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;
  }

  /**
   * Pre-emptively refresh token if it's close to expiring
   */
  async refreshIfNeeded(integration: Integration): Promise<void> {
    if (this.needsRefresh(integration)) {
      await this.refreshToken(integration);
    }
  }
}

export const tokenRefresh = new TokenRefreshManager();