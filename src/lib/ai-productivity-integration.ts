import { use_mcp_tool } from './mcp';
import type { PersonalizationDocument } from '../types/personalization';
import type { Task } from '../types';

interface LocationContext {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  place?: {
    name: string;
    address: string;
    type: string;
  };
  radius?: number; // in meters
}

interface FeedItem {
  title: string;
  url: string;
  source: string;
  published: string;
  summary: string;
  categories: string[];
}

interface ProductivityAction {
  type: 'read' | 'navigate' | 'schedule' | 'remind' | 'track';
  service: string;
  data: any;
}

/**
 * AI-driven productivity integration service
 */
export class AIProductivityIntegration {
  private static instance: AIProductivityIntegration;
  
  private constructor() {}

  public static getInstance(): AIProductivityIntegration {
    if (!AIProductivityIntegration.instance) {
      AIProductivityIntegration.instance = new AIProductivityIntegration();
    }
    return AIProductivityIntegration.instance;
  }

  /**
   * Process natural language productivity requests
   */
  public async processProductivityRequest(
    input: string,
    personalizationDoc: PersonalizationDocument,
    location?: LocationContext
  ) {
    const prompt = `As an AI assistant, analyze this productivity-related request and suggest appropriate actions.
    User's request: "${input}"

    Available Services:
    - Feedly (RSS and news)
    - Google Maps (Navigation and location)

    Current Location: ${location ? JSON.stringify(location) : 'Not provided'}
    
    User's Preferences:
    ${JSON.stringify(personalizationDoc, null, 2)}

    Return ONLY a JSON object with this structure:
    {
      "intent": {
        "action": "read" | "navigate" | "schedule" | "remind" | "track",
        "service": string,
        "context": object
      },
      "location_aware": boolean,
      "actions": [{
        "service": string,
        "action": string,
        "params": object
      }],
      "integrations": {
        "calendar": boolean,
        "tasks": boolean,
        "notifications": boolean
      }
    }`;

    try {
      const productivityPlan = await use_mcp_tool({
        server_name: 'gemini',
        tool_name: 'generate',
        arguments: { prompt }
      });

      return this.executeProductivityPlan(productivityPlan, personalizationDoc, location);
    } catch (error) {
      console.error('Error processing productivity request:', error);
      throw error;
    }
  }

  /**
   * Create location-based tasks and reminders
   */
  public async createLocationBasedTask(
    task: Partial<Task>,
    location: LocationContext,
    personalizationDoc: PersonalizationDocument
  ) {
    // Create the task with location context
    const createdTask = await use_mcp_tool({
      server_name: 'task-automation',
      tool_name: 'task.create',
      arguments: {
        ...task,
        location_context: {
          ...location,
          reminder_radius: this.getPreferredRadius(personalizationDoc)
        }
      }
    });

    // Set up location-based reminders
    if (personalizationDoc.task_preferences?.reminder_frequency !== 'low') {
      await use_mcp_tool({
        server_name: 'google-maps',
        tool_name: 'location.watch',
        arguments: {
          coordinates: location.coordinates,
          radius: location.radius || this.getPreferredRadius(personalizationDoc),
          on_enter: {
            notification: {
              title: `Reminder: ${task.title}`,
              body: `You're near ${location.place?.name}. Don't forget to ${task.title}`,
              priority: task.priority
            }
          }
        }
      });
    }

    return createdTask;
  }

  /**
   * Process and organize feed items
   */
  public async processFeedItems(
    items: FeedItem[],
    personalizationDoc: PersonalizationDocument
  ) {
    // Filter and sort items based on user interests
    const relevantItems = items.filter(item =>
      this.isRelevantToUser(item, personalizationDoc)
    );

    // Group items by category
    const groupedItems = this.groupItemsByCategory(relevantItems);

    // Create a digest if user prefers detailed summaries
    if (personalizationDoc.communication_style.detail_level === 'high') {
      await this.createContentDigest(groupedItems, personalizationDoc);
    }

    // Share important items if user is collaborative
    if (personalizationDoc.preferences.communication === 'collaborative') {
      await this.shareRelevantItems(
        relevantItems.filter(item => this.isHighPriority(item, personalizationDoc)),
        personalizationDoc
      );
    }

    return groupedItems;
  }

  /**
   * Execute a productivity integration plan
   */
  private async executeProductivityPlan(
    plan: any,
    personalizationDoc: PersonalizationDocument,
    location?: LocationContext
  ) {
    const actions: ProductivityAction[] = [];

    // Handle location-aware actions
    if (plan.location_aware && location) {
      actions.push({
        type: 'track',
        service: 'google-maps',
        data: {
          location,
          radius: this.getPreferredRadius(personalizationDoc)
        }
      });
    }

    // Set up integrations
    if (plan.integrations.calendar) {
      actions.push({
        type: 'schedule',
        service: 'calendar',
        data: {
          event: {
            title: plan.intent.context.title,
            location: location?.place,
            reminders: personalizationDoc.integrations?.calendar?.reminder_times
          }
        }
      });
    }

    if (plan.integrations.tasks) {
      actions.push({
        type: 'remind',
        service: 'task-automation',
        data: {
          task: {
            title: plan.intent.context.title,
            location_context: location,
            priority: this.derivePriority(plan.intent.context, personalizationDoc)
          }
        }
      });
    }

    // Execute all actions
    const results = await Promise.all(
      actions.map(action =>
        use_mcp_tool({
          server_name: action.service,
          tool_name: `${action.type}.execute`,
          arguments: action.data
        })
      )
    );

    return {
      success: true,
      actions: results.map((result, index) => ({
        type: actions[index].type,
        service: actions[index].service,
        status: 'completed',
        result
      }))
    };
  }

  /**
   * Create a content digest from feed items
   */
  private async createContentDigest(
    groupedItems: Record<string, FeedItem[]>,
    personalizationDoc: PersonalizationDocument
  ) {
    const digest = Object.entries(groupedItems).map(([category, items]) => ({
      category,
      items: items.map(item => ({
        title: item.title,
        summary: item.summary,
        source: item.source,
        url: item.url
      }))
    }));

    // Share digest based on user preferences
    if (personalizationDoc.integrations?.slack?.use_threads) {
      await use_mcp_tool({
        server_name: 'slack',
        tool_name: 'message.send',
        arguments: {
          channel: personalizationDoc.integrations.slack.preferred_channels[0],
          blocks: this.formatDigestForSlack(digest),
          thread_ts: new Date().getTime().toString()
        }
      });
    }

    return digest;
  }

  /**
   * Share relevant items with team
   */
  private async shareRelevantItems(
    items: FeedItem[],
    personalizationDoc: PersonalizationDocument
  ) {
    const shareActions = items.map(item => ({
      service: 'slack',
      action: 'message.send',
      params: {
        channel: personalizationDoc.integrations?.slack?.preferred_channels[0],
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${item.title}*\n${item.summary}`
            }
          },
          {
            type: 'context',
            elements: [{
              type: 'mrkdwn',
              text: `Source: ${item.source} | Category: ${item.categories.join(', ')}`
            }]
          }
        ]
      }
    }));

    return Promise.all(
      shareActions.map(action =>
        use_mcp_tool({
          server_name: action.service,
          tool_name: action.action,
          arguments: action.params
        })
      )
    );
  }

  /**
   * Check if feed item is relevant to user
   */
  private isRelevantToUser(item: FeedItem, personalizationDoc: PersonalizationDocument): boolean {
    const userInterests = personalizationDoc.interests;
    const userExpertise = personalizationDoc.expertise;

    return item.categories.some(category =>
      userInterests.includes(category.toLowerCase()) ||
      userExpertise.includes(category.toLowerCase())
    );
  }

  /**
   * Group feed items by category
   */
  private groupItemsByCategory(items: FeedItem[]): Record<string, FeedItem[]> {
    return items.reduce((groups, item) => {
      const category = item.categories[0] || 'uncategorized';
      return {
        ...groups,
        [category]: [...(groups[category] || []), item]
      };
    }, {} as Record<string, FeedItem[]>);
  }

  /**
   * Format digest for Slack
   */
  private formatDigestForSlack(digest: Array<{
    category: string;
    items: Array<{
      title: string;
      summary: string;
      url: string;
    }>;
  }>): any[] {
    return digest.flatMap(({ category, items }) => [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: category
        }
      },
      ...items.map(item => ({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*<${item.url}|${item.title}>*\n${item.summary}`
        }
      })),
      { type: 'divider' }
    ]);
  }

  /**
   * Get preferred reminder radius based on user preferences
   */
  private getPreferredRadius(personalizationDoc: PersonalizationDocument): number {
    switch (personalizationDoc.task_preferences?.reminder_frequency) {
      case 'high':
        return 100; // 100 meters
      case 'low':
        return 500; // 500 meters
      default:
        return 250; // 250 meters
    }
  }

  /**
   * Derive task priority based on context and user preferences
   */
  private derivePriority(
    context: {
      deadline?: string;
      location?: LocationContext;
    },
    personalizationDoc: PersonalizationDocument
  ): 'high' | 'medium' | 'low' {
    if (context.deadline && personalizationDoc.task_preferences?.automation_level === 'high') {
      return 'high';
    }
    if (context.location && personalizationDoc.task_preferences?.reminder_frequency === 'high') {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Check if feed item is high priority
   */
  private isHighPriority(item: FeedItem, personalizationDoc: PersonalizationDocument): boolean {
    return (
      personalizationDoc.expertise.some(exp => 
        item.categories.includes(exp) || 
        item.title.toLowerCase().includes(exp.toLowerCase())
      ) ||
      personalizationDoc.goals.some(goal =>
        item.title.toLowerCase().includes(goal.toLowerCase())
      )
    );
  }
}

export const aiProductivityIntegration = AIProductivityIntegration.getInstance();