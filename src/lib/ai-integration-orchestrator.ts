import { aiTaskAutomation } from './ai-task-automation';
import { aiMediaIntegration } from './ai-media-integration';
import { aiProductivityIntegration } from './ai-productivity-integration';
import { aiSocialIntegration } from './ai-social-integration';
import { aiPersonalization } from './ai-personalization';
import type { PersonalizationDocument } from '../types/personalization';
import type { PersonalInfo } from '../types';

interface IntegrationContext {
  type: 'task' | 'media' | 'productivity' | 'social';
  action: string;
  data: any;
  location?: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
    place?: {
      name: string;
      address: string;
    };
  };
}

interface IntegrationResult {
  success: boolean;
  action: string;
  data: any;
  suggestions?: string[];
  followUp?: {
    type: string;
    message: string;
  };
}

/**
 * AI Integration Orchestrator
 * Coordinates between different AI integration services and provides
 * a unified interface for the chat system
 */
export class AIIntegrationOrchestrator {
  private static instance: AIIntegrationOrchestrator;
  
  private constructor() {}

  public static getInstance(): AIIntegrationOrchestrator {
    if (!AIIntegrationOrchestrator.instance) {
      AIIntegrationOrchestrator.instance = new AIIntegrationOrchestrator();
    }
    return AIIntegrationOrchestrator.instance;
  }

  /**
   * Process integration requests from chat
   */
  public async processIntegrationRequest(
    input: string,
    personalInfo: PersonalInfo,
    personalizationDoc: PersonalizationDocument,
    context?: IntegrationContext
  ): Promise<IntegrationResult> {
    try {
      // Detect integration type from input
      const integrationContext = context || await this.detectIntegrationType(
        input,
        personalizationDoc
      );

      // Route to appropriate integration service
      switch (integrationContext.type) {
        case 'task':
          return this.handleTaskIntegration(
            input,
            personalInfo,
            personalizationDoc,
            integrationContext
          );

        case 'media':
          return this.handleMediaIntegration(
            input,
            personalizationDoc,
            integrationContext
          );

        case 'productivity':
          return this.handleProductivityIntegration(
            input,
            personalizationDoc,
            integrationContext
          );

        case 'social':
          return this.handleSocialIntegration(
            input,
            personalizationDoc,
            integrationContext
          );

        default:
          throw new Error(`Unknown integration type: ${integrationContext.type}`);
      }
    } catch (error) {
      console.error('Integration error:', error);
      return {
        success: false,
        action: 'error',
        data: {
          message: 'Failed to process integration request',
          error: error.message
        }
      };
    }
  }

  /**
   * Handle task-related integrations
   */
  private async handleTaskIntegration(
    input: string,
    personalInfo: PersonalInfo,
    personalizationDoc: PersonalizationDocument,
    context: IntegrationContext
  ): Promise<IntegrationResult> {
    const result = await aiTaskAutomation.processTaskRequest(
      input,
      personalInfo,
      personalizationDoc
    );

    // Set up cross-service integrations based on task type
    if (result.success) {
      const task = result.task;

      // Media-related task
      if (task.title.toLowerCase().includes('watch') || 
          task.title.toLowerCase().includes('video')) {
        await aiMediaIntegration.processMediaRequest(
          task.title,
          personalizationDoc
        );
      }

      // Location-based task
      if (context.location) {
        await aiProductivityIntegration.createLocationBasedTask(
          task,
          context.location,
          personalizationDoc
        );
      }

      // Social sharing task
      if (task.title.toLowerCase().includes('post') || 
          task.title.toLowerCase().includes('share')) {
        await aiSocialIntegration.processSocialRequest(
          task.title,
          personalizationDoc
        );
      }
    }

    return {
      success: result.success,
      action: 'task_created',
      data: result.task,
      suggestions: this.generateTaskSuggestions(result.task, personalizationDoc)
    };
  }

  /**
   * Handle media-related integrations
   */
  private async handleMediaIntegration(
    input: string,
    personalizationDoc: PersonalizationDocument,
    context: IntegrationContext
  ): Promise<IntegrationResult> {
    const result = await aiMediaIntegration.processMediaRequest(
      input,
      personalizationDoc
    );

    // Set up cross-service integrations
    if (result.success && result.content) {
      // Share to social if it's a recommendation
      if (result.action === 'recommend') {
        await aiSocialIntegration.createCrossplatformPost(
          {
            content: {
              text: `Watching: ${result.content.title}`,
              link: {
                url: result.content.url,
                title: result.content.title
              }
            },
            platforms: ['twitter', 'facebook']
          },
          personalizationDoc
        );
      }

      // Create task for long-form content
      if (result.content.type === 'show' || result.content.type === 'movie') {
        await aiTaskAutomation.processTaskRequest(
          `Watch ${result.content.title}`,
          personalizationDoc
        );
      }
    }

    return {
      success: result.success,
      action: result.action,
      data: result.content,
      suggestions: this.generateMediaSuggestions(result.content, personalizationDoc)
    };
  }

  /**
   * Handle productivity-related integrations
   */
  private async handleProductivityIntegration(
    input: string,
    personalizationDoc: PersonalizationDocument,
    context: IntegrationContext
  ): Promise<IntegrationResult> {
    const result = await aiProductivityIntegration.processProductivityRequest(
      input,
      personalizationDoc,
      context.location
    );

    // Set up cross-service integrations
    if (result.success) {
      // Share important updates to social
      if (result.actions.some(a => a.type === 'track' && a.status === 'completed')) {
        await aiSocialIntegration.processSocialRequest(
          `Updated: ${result.actions[0].result.title}`,
          personalizationDoc
        );
      }

      // Create tasks for follow-ups
      if (result.actions.some(a => a.type === 'schedule')) {
        await aiTaskAutomation.processTaskRequest(
          `Follow up on ${result.actions[0].result.title}`,
          personalizationDoc
        );
      }
    }

    return {
      success: result.success,
      action: 'productivity_action',
      data: result.actions,
      suggestions: this.generateProductivitySuggestions(result.actions, personalizationDoc)
    };
  }

  /**
   * Handle social media integrations
   */
  private async handleSocialIntegration(
    input: string,
    personalizationDoc: PersonalizationDocument,
    context: IntegrationContext
  ): Promise<IntegrationResult> {
    const result = await aiSocialIntegration.processSocialRequest(
      input,
      personalizationDoc
    );

    // Set up cross-service integrations
    if (result.success) {
      // Track engagement metrics
      if (result.action === 'post' || result.action === 'share') {
        await aiProductivityIntegration.processFeedItems(
          [{
            title: result.content.text || '',
            url: result.content.link?.url || '',
            source: result.platforms[0],
            published: new Date().toISOString(),
            summary: result.content.text || '',
            categories: personalizationDoc.interests
          }],
          personalizationDoc
        );
      }

      // Create follow-up tasks
      if (result.action === 'analyze') {
        await aiTaskAutomation.processTaskRequest(
          `Review social media metrics for ${result.platforms.join(', ')}`,
          personalizationDoc
        );
      }
    }

    return {
      success: result.success,
      action: result.action,
      data: {
        content: result.content,
        platforms: result.platforms
      },
      suggestions: this.generateSocialSuggestions(result, personalizationDoc)
    };
  }

  /**
   * Detect integration type from input
   */
  private async detectIntegrationType(
    input: string,
    personalizationDoc: PersonalizationDocument
  ): Promise<IntegrationContext> {
    const intent = await aiPersonalization.detectIntent(input, {
      messages: [],
      extractedInfo: {}
    });

    // Map intent to integration type
    const type = this.mapIntentToIntegrationType(intent, input);

    return {
      type,
      action: intent.action,
      data: {
        category: intent.category,
        confidence: intent.confidence
      }
    };
  }

  /**
   * Map AI intent to integration type
   */
  private mapIntentToIntegrationType(
    intent: any,
    input: string
  ): IntegrationContext['type'] {
    if (intent.category === 'task' || input.toLowerCase().includes('task')) {
      return 'task';
    }
    if (intent.category === 'media' || 
        input.toLowerCase().includes('watch') || 
        input.toLowerCase().includes('video')) {
      return 'media';
    }
    if (intent.category === 'productivity' || 
        input.toLowerCase().includes('schedule') || 
        input.toLowerCase().includes('reminder')) {
      return 'productivity';
    }
    if (intent.category === 'social' || 
        input.toLowerCase().includes('post') || 
        input.toLowerCase().includes('share')) {
      return 'social';
    }
    return 'task'; // Default to task
  }

  /**
   * Generate contextual suggestions
   */
  private generateTaskSuggestions(task: any, personalizationDoc: PersonalizationDocument): string[] {
    const suggestions = [];
    
    if (task.due_date) {
      suggestions.push('Add this to my calendar');
    }
    if (task.priority === 'high') {
      suggestions.push('Share this with my team');
    }
    if (personalizationDoc.preferences.communication === 'collaborative') {
      suggestions.push('Create subtasks for my team');
    }

    return suggestions;
  }

  private generateMediaSuggestions(content: any, personalizationDoc: PersonalizationDocument): string[] {
    const suggestions = [];
    
    if (content.type === 'show' || content.type === 'movie') {
      suggestions.push('Add to my watch list');
    }
    if (personalizationDoc.preferences.communication === 'collaborative') {
      suggestions.push('Share with friends');
    }
    if (content.platform === 'youtube') {
      suggestions.push('Save to playlist');
    }

    return suggestions;
  }

  private generateProductivitySuggestions(actions: any[], personalizationDoc: PersonalizationDocument): string[] {
    const suggestions = [];
    
    if (actions.some(a => a.type === 'schedule')) {
      suggestions.push('Set up recurring schedule');
    }
    if (actions.some(a => a.type === 'track')) {
      suggestions.push('Show me analytics');
    }
    if (personalizationDoc.task_preferences?.automation_level === 'high') {
      suggestions.push('Automate this workflow');
    }

    return suggestions;
  }

  private generateSocialSuggestions(result: any, personalizationDoc: PersonalizationDocument): string[] {
    const suggestions = [];
    
    if (result.action === 'post') {
      suggestions.push('Show post analytics');
    }
    if (result.platforms.length < 3) {
      suggestions.push('Share on other platforms');
    }
    if (personalizationDoc.task_preferences?.automation_level === 'high') {
      suggestions.push('Create posting schedule');
    }

    return suggestions;
  }
}

export const aiIntegrationOrchestrator = AIIntegrationOrchestrator.getInstance();