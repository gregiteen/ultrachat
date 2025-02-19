/**
 * Integration chat handler for processing integration commands and responses
 */
import { tokenManager } from './token-manager';
import { rateLimiter } from './rate-limiter';
import { connectionPool } from './connection-pool';
import { integrationHealth } from '../integration-health';
import type { Integration } from '../../types/integration';
import type { Message } from '../../types';

interface IntegrationCommand {
  service: string;
  action: string;
  parameters: Record<string, any>;
  raw: string;
}

interface IntegrationResponse {
  type: 'data' | 'error' | 'status';
  content: any;
  integrations?: {
    used: string[];
    context?: Record<string, any>;
  };
}

class IntegrationChatHandler {
  private readonly COMMAND_REGEX = /^\/(\w+)\s+(\w+)(?:\s+(.+))?$/;

  /**
   * Check if message is an integration command
   */
  isIntegrationCommand(content: string): boolean {
    return this.COMMAND_REGEX.test(content);
  }

  /**
   * Parse integration command
   */
  parseCommand(content: string): IntegrationCommand | null {
    const match = content.match(this.COMMAND_REGEX);
    if (!match) return null;

    const [, service, action, paramString] = match;
    const parameters = this.parseParameters(paramString || '');

    return {
      service,
      action,
      parameters,
      raw: content
    };
  }

  /**
   * Parse command parameters
   */
  private parseParameters(paramString: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Handle quoted strings and JSON
    if (paramString.trim().startsWith('{')) {
      try {
        return JSON.parse(paramString);
      } catch (e) {
        console.debug('Not JSON parameters');
      }
    }

    // Parse key=value pairs
    const matches = paramString.match(/([^\s"]+="[^"]*"|[^\s"]+='[^']*'|[^\s"]+=[^\s"]+)/g) || [];
    
    for (const match of matches) {
      const [key, ...valueParts] = match.split('=');
      let value = valueParts.join('=');
      
      // Remove quotes
      value = value.replace(/^["']|["']$/g, '');
      
      // Convert to appropriate type
      if (value === 'true' || value === 'false') {
        params[key] = value === 'true';
      } else if (!isNaN(Number(value))) {
        params[key] = Number(value);
      } else {
        params[key] = value;
      }
    }

    return params;
  }

  /**
   * Execute integration command
   */
  async executeCommand(
    command: IntegrationCommand,
    integration: Integration,
    onProgress?: (response: IntegrationResponse) => void
  ): Promise<IntegrationResponse> {
    try {
      // Check integration health
      const health = await integrationHealth.checkHealth(integration);
      if (health.status === 'error') {
        throw new Error(`Integration unhealthy: ${health.issues.join(', ')}`);
      }

      // Check rate limits
      const waitTime = rateLimiter.getWaitTime(integration);
      if (waitTime > 0) {
        onProgress?.({
          type: 'status',
          content: `Rate limited. Waiting ${Math.ceil(waitTime / 1000)} seconds...`,
          integrations: {
            used: [command.service],
            context: {
              action: command.action
            }
          }
        });
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      // Get connection
      const response = await connectionPool.getConnection(integration);
      
      // Update rate limits
      rateLimiter.updateFromResponse(integration, response);

      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        type: 'data',
        content: this.formatResponse(data, command),
        integrations: {
          used: [command.service],
          context: {
            action: command.action
          }
        }
      };
    } catch (error) {
      return {
        type: 'error',
        content: error instanceof Error ? error.message : 'Unknown error',
        integrations: {
          used: [command.service],
          context: {
            action: command.action
          }
        }
      };
    }
  }

  /**
   * Format integration response for chat
   */
  private formatResponse(data: any, command: IntegrationCommand): string {
    // Handle different response types
    if (Array.isArray(data)) {
      return this.formatList(data, command);
    }

    if (typeof data === 'object') {
      return this.formatObject(data, command);
    }

    return String(data);
  }

  /**
   * Format list response
   */
  private formatList(data: any[], command: IntegrationCommand): string {
    let output = `Results from ${command.service} ${command.action}:\n\n`;
    
    for (const item of data) {
      if (typeof item === 'object') {
        // Extract key information
        const title = item.title || item.name || item.id;
        const description = item.description || item.summary || '';
        const url = item.url || item.link || '';
        
        output += `• ${title}\n`;
        if (description) output += `  ${description}\n`;
        if (url) output += `  ${url}\n`;
        output += '\n';
      } else {
        output += `• ${item}\n`;
      }
    }

    return output.trim();
  }

  /**
   * Format object response
   */
  private formatObject(data: Record<string, any>, command: IntegrationCommand): string {
    let output = `Result from ${command.service} ${command.action}:\n\n`;

    // Extract common fields
    const title = data.title || data.name || data.id;
    const description = data.description || data.summary || '';
    const url = data.url || data.link || '';
    const status = data.status || data.state;
    const created = data.created_at || data.createdAt;
    const updated = data.updated_at || data.updatedAt;

    if (title) output += `${title}\n`;
    if (description) output += `${description}\n`;
    if (status) output += `Status: ${status}\n`;
    if (created) output += `Created: ${new Date(created).toLocaleString()}\n`;
    if (updated) output += `Updated: ${new Date(updated).toLocaleString()}\n`;
    if (url) output += `\n${url}`;

    return output.trim();
  }

  /**
   * Generate chat message for integration response
   */
  generateMessage(response: IntegrationResponse): Message {
    const message: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: typeof response.content === 'string' 
        ? response.content 
        : this.formatResponse(response.content, {
            service: response.integrations?.used[0] || 'unknown',
            action: response.integrations?.context?.action || 'unknown',
            parameters: response.integrations?.context || {},
            raw: ''
          }),
      created_at: new Date().toISOString()
    };

    message.integrations = response.integrations;

    return message;
  }
}

export const integrationChat = new IntegrationChatHandler();