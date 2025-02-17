import { aiPersonalization } from './ai-personalization';
import { use_mcp_tool } from './mcp';
import type { PersonalizationDocument } from '../types/personalization';

interface IntegrationAction {
  service: string;
  type: string;
  action: string;
  params: Record<string, any>;
}

interface IntegrationContext {
  category: 'communication' | 'productivity' | 'social' | 'development' | 'storage' | 'media' | 'database';
  action: string;
  service: string;
  type: string;
  data: any;
}

interface IntegrationPlan {
  context: {
    category: 'communication' | 'productivity' | 'social' | 'development' | 'storage' | 'media';
    primary_service: string;
    related_services: string[];
    action_type: 'share' | 'sync' | 'monitor' | 'automate' | 'analyze';
  };
  actions: IntegrationAction[];
  workflow: {
    steps: string[];
    triggers: string[];
    conditions: Record<string, any>;
  };
}

type SupportedService = 'github' | 'slack' | 'google_drive' | 'calendar';

interface ServicePreferences {
  notification_format?: string;
  preferred_channels?: string[];
  preferred_labels?: string[];
  [key: string]: any;
}

/**
 * AI-driven integration hub that enables smart cross-service automation
 */
export class AIIntegrationHub {
  private static instance: AIIntegrationHub;
  
  private constructor() {}

  public static getInstance(): AIIntegrationHub {
    if (!AIIntegrationHub.instance) {
      AIIntegrationHub.instance = new AIIntegrationHub();
    }
    return AIIntegrationHub.instance;
  }

  /**
   * Process natural language integration requests
   */
  public async processIntegrationRequest(
    input: string,
    personalizationDoc: PersonalizationDocument
  ) {
    const prompt = `As an AI assistant, analyze this integration request and create appropriate cross-service automations.
    User's request: "${input}"

    Available Integrations:
    - Communication: Slack, WhatsApp
    - Development: GitHub
    - Storage: Google Drive
    - Social: Twitter, Facebook, Instagram
    - Media: Netflix, Hulu, YouTube
    - Productivity: Feedly, Google Maps

    User's Preferences:
    ${JSON.stringify(personalizationDoc, null, 2)}

    Return ONLY a JSON object with this structure:
    {
      "context": {
        "category": "communication" | "productivity" | "social" | "development" | "storage" | "media",
        "primary_service": string,
        "related_services": string[],
        "action_type": "share" | "sync" | "monitor" | "automate" | "analyze"
      },
      "actions": [{
        "service": string,
        "action": string,
        "params": object
      }],
      "workflow": {
        "steps": string[],
        "triggers": string[],
        "conditions": object
      }
    }`;

    try {
      const integrationPlan = await use_mcp_tool<IntegrationPlan>({
        server_name: 'gemini',
        tool_name: 'generate',
        arguments: { prompt }
      });

      return this.executeIntegrationPlan(integrationPlan, personalizationDoc);
    } catch (error) {
      console.error('Error processing integration request:', error);
      throw error;
    }
  }

  /**
   * Execute the generated integration plan
   */
  private async executeIntegrationPlan(
    plan: IntegrationPlan,
    personalizationDoc: PersonalizationDocument
  ) {
    // Set up workflow based on plan context
    const workflow = {
      trigger: this.getTriggerForContext({
        category: plan.context.category,
        action: plan.context.action_type,
        service: plan.context.primary_service,
        type: plan.context.action_type,
        data: plan.context
      }),
      conditions: this.getConditionsForUser(personalizationDoc),
      actions: plan.actions.map(action => {
        const service = action.service.toLowerCase() as SupportedService;
        const servicePrefs = personalizationDoc.integrations?.[service] as ServicePreferences | undefined;
        
        return {
          type: action.type || 'default',
          service: action.service,
          action: action.action,
          params: {
            ...action.params,
            ...(servicePrefs && {
              notification_format: servicePrefs.notification_format,
              channels: servicePrefs.preferred_channels,
              labels: servicePrefs.preferred_labels
            })
          }
        };
      })
    };

    // Execute immediate actions
    const actionResults = await this.executeActions(workflow.actions);

    // Set up ongoing workflow if needed
    if (plan.workflow.steps.length > 0) {
      await this.setupWorkflows([workflow]);
    }

    return { status: 'success', results: actionResults, workflow };
  }

  /**
   * Smart content sharing across platforms
   */
  public async shareContent(
    content: { text?: string; media?: string; url?: string },
    platforms: string[],
    personalizationDoc: PersonalizationDocument
  ) {
    const actions: IntegrationAction[] = [];

    // Adapt content format based on platform and user preferences
    platforms.forEach(platform => {
      switch (platform.toLowerCase()) {
        case 'twitter':
          actions.push({
            type: 'post',
            service: 'twitter',
            action: 'post.create',
            params: {
              text: this.formatForTwitter(content.text),
              media: content.media,
              style: personalizationDoc.communication_style
            }
          });
          break;

        case 'slack':
          actions.push({
            type: 'message',
            service: 'slack',
            action: 'message.send',
            params: {
              blocks: this.formatForSlack(content),
              channels: personalizationDoc.integrations?.slack?.preferred_channels,
              notification_format: personalizationDoc.integrations?.slack?.notification_format
            }
          });
          break;

        case 'github':
          if (content.url?.includes('github.com')) {
            actions.push({
              type: 'issue',
              service: 'github',
              action: 'issue.create',
              params: {
                title: content.text?.split('\n')[0],
                body: content.text,
                labels: personalizationDoc.integrations?.github?.preferred_labels
              }
            });
          }
          break;
      }
    });

    return this.executeActions(actions);
  }

  /**
   * Monitor and sync content across services
   */
  public async setupContentSync(
    services: string[],
    syncConfig: {
      frequency: 'realtime' | 'hourly' | 'daily';
      filters?: Record<string, any>;
    },
    personalizationDoc: PersonalizationDocument
  ) {
    const workflows = services.map(service => {
      const serviceType = service.toLowerCase() as SupportedService;
      const servicePrefs = personalizationDoc.integrations?.[serviceType] as ServicePreferences | undefined;

      switch (serviceType) {
        case 'github':
          return {
            trigger: 'github.repository.updated',
            actions: [{
              type: 'notification',
              service: 'slack',
              action: 'message.send',
              params: {
                channels: servicePrefs?.preferred_channels,
                format: servicePrefs?.notification_format
              }
            }]
          };

        case 'google_drive':
          return {
            trigger: 'drive.file.modified',
            actions: [{
              type: 'notification',
              service: 'slack',
              action: 'message.send',
              params: {
                channels: servicePrefs?.preferred_channels,
                format: 'summary'
              }
            }]
          };

        case 'slack':
          return {
            trigger: 'slack.message.created',
            actions: [{
              type: 'notification',
              service: 'slack',
              action: 'message.send',
              params: {
                channels: ['#notifications'],
                format: 'digest'
              }
            }]
          };

        default:
          return null;
      }
    });

    return this.setupWorkflows(workflows.filter(Boolean));
  }

  /**
   * Create smart automation workflows
   */
  public async createWorkflow(
    context: IntegrationContext,
    personalizationDoc: PersonalizationDocument
  ) {
    const workflow = {
      trigger: this.getTriggerForContext(context),
      conditions: this.getConditionsForUser(personalizationDoc),
      actions: this.getActionsForContext(context, personalizationDoc)
    };

    return this.setupWorkflows([workflow]);
  }

  /**
   * Execute a series of integration actions
   */
  private async executeActions(actions: IntegrationAction[]) {
    return Promise.all(actions.map(action => 
      use_mcp_tool({
        server_name: action.service,
        tool_name: action.action,
        arguments: action.params
      })
    ));
  }

  /**
   * Set up integration workflows
   */
  private async setupWorkflows(workflows: any[]) {
    return use_mcp_tool({
      server_name: 'workflow-engine',
      tool_name: 'workflow.create',
      arguments: { workflows }
    });
  }

  /**
   * Format content for Twitter
   */
  private formatForTwitter(text?: string): string {
    if (!text) return '';
    return text.length > 280 ? `${text.slice(0, 277)}...` : text;
  }

  /**
   * Format content for Slack
   */
  private formatForSlack(content: { text?: string; media?: string; url?: string }) {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: content.text || ''
        }
      },
      content.media && {
        type: 'image',
        image_url: content.media,
        alt_text: 'Shared media'
      },
      content.url && {
        type: 'context',
        elements: [{
          type: 'mrkdwn',
          text: `Source: ${content.url}`
        }]
      }
    ].filter(Boolean);
  }

  /**
   * Get appropriate trigger for context
   */
  private getTriggerForContext(context: IntegrationContext): string {
    const triggerMap: Record<string, string> = {
      'communication': 'message.received',
      'development': 'repository.updated',
      'social': 'post.created',
      'productivity': 'task.updated',
      'storage': 'file.modified',
      'media': 'content.updated'
    };

    return `${context.service}.${triggerMap[context.category] || 'default'}`;
  }

  /**
   * Get conditions based on user preferences
   */
  private getConditionsForUser(personalizationDoc: PersonalizationDocument) {
    return {
      workingHours: personalizationDoc.integrations?.calendar?.working_hours,
      notificationLevel: personalizationDoc.integrations?.github?.notification_level,
      automationLevel: personalizationDoc.task_preferences?.automation_level
    };
  }

  /**
   * Get appropriate actions for context
   */
  private getActionsForContext(
    context: IntegrationContext,
    personalizationDoc: PersonalizationDocument
  ): IntegrationAction[] {
    const actions: IntegrationAction[] = [];

    // Add notification action if user prefers high communication
    if (personalizationDoc.preferences.communication === 'collaborative') {
      actions.push({
        type: 'notification',
        service: 'slack',
        action: 'message.send',
        params: {
          channels: personalizationDoc.integrations?.slack?.preferred_channels,
          format: personalizationDoc.integrations?.slack?.notification_format
        }
      });
    }

    // Add GitHub action for development context
    if (context.category === 'development' && personalizationDoc.expertise.includes('development')) {
      actions.push({
        type: 'issue',
        service: 'github',
        action: 'issue.create',
        params: {
          labels: personalizationDoc.integrations?.github?.preferred_labels,
          autoAssign: personalizationDoc.integrations?.github?.auto_assign
        }
      });
    }

    return actions;
  }
}

export const aiIntegrationHub = AIIntegrationHub.getInstance();