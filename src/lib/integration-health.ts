/**
 * Integration health monitoring system
 */
import type { Integration } from '../types/integration';
import { supabase } from './supabase';
import { tokenManager } from './integrations/token-manager';
import { rateLimiter } from './integrations/rate-limiter';
import { connectionPool } from './integrations/connection-pool';
import { keychainAudit } from './keychain/audit';
import { AuditAction, AuditSeverity } from './keychain/audit';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'error';
  lastChecked: Date;
  issues: string[];
  details?: {
    responseTime?: number;
    errorCount?: number;
    lastSuccessfulSync?: Date;
    rateLimitRemaining?: number;
    rateLimitReset?: Date;
    connectionStats?: {
      totalConnections: number;
      activeConnections: number;
      queueLength: number;
    };
  };
}

interface HealthStore {
  [integrationId: string]: HealthCheckResult;
}

class IntegrationHealthMonitor {
  private healthStore: HealthStore = {};
  private checkIntervals: { [id: string]: NodeJS.Timeout } = {};
  private retryAttempts: { [id: string]: number } = {};

  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly HEALTH_CHECK_INTERVAL = 300000; // 5 minutes

  async checkHealth(integration: Integration): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const issues: string[] = [];

    try {
      // Check rate limits
      const rateLimit = rateLimiter.getLimitInfo(integration);
      if (rateLimit) {
        const remainingPercentage = rateLimit.remaining / rateLimit.limit;
        if (remainingPercentage < 0.1) { // 10% threshold
          issues.push(`Rate limit near threshold (${Math.round(remainingPercentage * 100)}% remaining)`);
        }
        if (rateLimit.remaining === 0) {
          issues.push(`Rate limit exceeded, resets at ${rateLimit.reset.toISOString()}`);
        }
      }

      // Check token status
      if (integration.credentials) {
        try {
          await tokenManager.getToken(integration);
        } catch (error) {
          issues.push('Token refresh failed');
        }
      }

      // Check API key for API key-based integrations
      if (integration.settings?.api_key && !integration.credentials) {
        try {
          const response = await connectionPool.getConnection(integration);
          if (!response.ok) {
            issues.push('API key validation failed');
          }
        } catch (error) {
          issues.push('API key validation error');
        }
      }

      // Check last sync
      if (integration.last_synced) {
        const lastSync = new Date(integration.last_synced);
        if (Date.now() - lastSync.getTime() > 86400000) { // 24 hours
          issues.push('Integration not synced in last 24 hours');
        }
      }

      // Get connection pool stats
      const connectionStats = connectionPool.getStats();
      if (connectionStats.queueLength > 10) {
        issues.push('High connection queue length');
      }

      const responseTime = Date.now() - startTime;
      const status = issues.length === 0 ? 'healthy' : issues.length < 2 ? 'degraded' : 'error';

      const result: HealthCheckResult = {
        status,
        lastChecked: new Date(),
        issues,
        details: {
          responseTime,
          errorCount: this.retryAttempts[integration.id] || 0,
          lastSuccessfulSync: integration.last_synced ? new Date(integration.last_synced) : undefined,
          rateLimitRemaining: rateLimit?.remaining,
          rateLimitReset: rateLimit?.reset,
          connectionStats
        }
      };

      this.healthStore[integration.id] = result;
      return result;
    } catch (error) {
      const result: HealthCheckResult = {
        status: 'error',
        lastChecked: new Date(),
        issues: ['Health check failed', error instanceof Error ? error.message : 'Unknown error'],
        details: {
          errorCount: (this.retryAttempts[integration.id] || 0) + 1
        }
      };

      this.healthStore[integration.id] = result;
      return result;
    }
  }

  async startMonitoring(integration: Integration): Promise<void> {
    // Clear any existing interval
    if (this.checkIntervals[integration.id]) {
      clearInterval(this.checkIntervals[integration.id]);
    }

    // Initial health check
    const initialHealth = await this.checkHealth(integration);
    
    // If there are issues, attempt recovery
    if (initialHealth.status !== 'healthy') {
      await this.attemptRecovery(integration);
    }

    // Set up regular monitoring
    this.checkIntervals[integration.id] = setInterval(async () => {
      const health = await this.checkHealth(integration);
      
      if (health.status !== 'healthy') {
        await this.attemptRecovery(integration);
      } else {
        // Reset retry attempts on success
        this.retryAttempts[integration.id] = 0;
      }
    }, this.HEALTH_CHECK_INTERVAL);
  }

  async stopMonitoring(integrationId: string): Promise<void> {
    if (this.checkIntervals[integrationId]) {
      clearInterval(this.checkIntervals[integrationId]);
      delete this.checkIntervals[integrationId];
    }
    delete this.healthStore[integrationId];
    delete this.retryAttempts[integrationId];
  }

  private async attemptRecovery(integration: Integration): Promise<void> {
    const attempts = this.retryAttempts[integration.id] || 0;
    
    if (attempts >= this.MAX_RETRY_ATTEMPTS) {
      // Mark integration as error in database
      await supabase
        .from('integrations')
        .update({ 
          status: 'error',
          error_message: 'Max retry attempts exceeded'
        })
        .eq('id', integration.id);

      await keychainAudit.log(
        AuditAction.KEY_EXPIRED,
        AuditSeverity.ERROR,
        integration.user_id,
        {
          keyId: integration.id,
          service: integration.type,
          metadata: {
            attempts,
            reason: 'Max retry attempts exceeded'
          }
        }
      );
      return;
    }

    this.retryAttempts[integration.id] = attempts + 1;

    try {
      // Get fresh token if needed
      if (integration.credentials) {
        await tokenManager.getToken(integration);
      }

      // Test connection
      const response = await connectionPool.getConnection(integration);
      if (!response.ok) {
        throw new Error(`API validation failed: ${response.statusText}`);
      }

      // Update integration status
      await supabase
        .from('integrations')
        .update({ 
          status: 'connected',
          last_synced: new Date().toISOString(),
          error_message: null
        })
        .eq('id', integration.id);

      // Reset retry attempts on success
      this.retryAttempts[integration.id] = 0;

      await keychainAudit.log(
        AuditAction.KEY_ACCESSED,
        AuditSeverity.INFO,
        integration.user_id,
        {
          keyId: integration.id,
          service: integration.type,
          metadata: {
            recovery: 'success',
            attempts
          }
        }
      );
    } catch (error) {
      console.error(`Recovery failed for integration ${integration.id}:`, error);
      
      await keychainAudit.log(
        AuditAction.KEY_ACCESSED,
        AuditSeverity.ERROR,
        integration.user_id,
        {
          keyId: integration.id,
          service: integration.type,
          metadata: {
            recovery: 'failed',
            attempts,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      );

      // Update error message in database
      await supabase
        .from('integrations')
        .update({ 
          error_message: error instanceof Error ? error.message : 'Recovery failed'
        })
        .eq('id', integration.id);
    }
  }

  getHealth(integrationId: string): HealthCheckResult | null {
    return this.healthStore[integrationId] || null;
  }

  getAllHealth(): HealthStore {
    return { ...this.healthStore };
  }
}

export const integrationHealth = new IntegrationHealthMonitor();