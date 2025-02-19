import { supabase } from "./supabase-client";
import { tokenManager } from "./integrations/token-manager";
import { rateLimiter } from "./integrations/rate-limiter";
import { Integration, IntegrationType } from "../types/integration";

type HealthStatus = Integration['status'];

interface HealthCheck {
  status: HealthStatus;
  lastChecked: Date;
  error?: string;
}

const healthChecks = new Map<string, HealthCheck>();

export const integrationHealth = {
  async checkHealth(type: IntegrationType): Promise<HealthCheck> {
    const authResponse = await supabase.auth.getUser();
    const user = authResponse.data.user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const lastCheck = healthChecks.get(`${type}-${user.id}`);
    if (lastCheck && Date.now() - lastCheck.lastChecked.getTime() < 300000) {
      return lastCheck;
    }

    try {
      // Get integration
      const { data: integration, error: integrationError } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', type)
        .single();

      if (integrationError) throw integrationError;
      if (!integration) throw new Error('Integration not found');

      // Check token validity
      const token = await tokenManager.getToken(integration);
      if (!token) {
        throw new Error('No valid token found');
      }

      // Check rate limits
      const rateLimitResponse = await rateLimiter.getRateLimit(type);
      if (rateLimitResponse.isLimited) {
        throw new Error('Rate limit exceeded');
      }

      // Get integration settings
      const { data: settings, error: settingsError } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', type)
        .single();

      if (settingsError) throw settingsError;
      if (!settings) throw new Error('Integration not configured');

      // Verify API access
      const response = await fetch(settings.endpoint + '/health', {
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API health check failed: ${response.statusText}`);
      }

      const healthCheck: HealthCheck = {
        status: 'connected',
        lastChecked: new Date()
      };

      healthChecks.set(`${type}-${user.id}`, healthCheck);
      return healthCheck;

    } catch (error) {
      const healthCheck: HealthCheck = {
        status: 'error',
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };

      healthChecks.set(`${type}-${user.id}`, healthCheck);
      return healthCheck;
    }
  },

  async updateStatus(
    type: IntegrationType,
    status: HealthStatus,
    error?: string
  ): Promise<void> {
    const authResponse = await supabase.auth.getUser();
    const user = authResponse.data.user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error: updateError } = await supabase
        .from('integration_settings')
        .update({
          status,
          last_error: error,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('type', type);

      if (updateError) throw updateError;

      healthChecks.set(`${type}-${user.id}`, {
        status,
        lastChecked: new Date(),
        error
      });
    } catch (error) {
      console.error('Failed to update integration status:', error);
      throw error;
    }
  },

  async getLastCheck(type: IntegrationType): Promise<HealthCheck | null> {
    const authResponse = await supabase.auth.getUser();
    const user = authResponse.data.user;
    if (!user) {
      return null;
    }
    return healthChecks.get(`${type}-${user.id}`) || null;
  },

  async clearCache(type: IntegrationType): Promise<void> {
    const authResponse = await supabase.auth.getUser();
    const user = authResponse.data.user;
    if (!user) {
      return;
    }
    healthChecks.delete(`${type}-${user.id}`);
  }
};