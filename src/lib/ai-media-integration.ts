import { use_mcp_tool } from './mcp';
import type { PersonalizationDocument } from '../types/personalization';

interface MediaContent {
  type: 'movie' | 'show' | 'video' | 'music';
  title: string;
  platform: 'netflix' | 'hulu' | 'youtube';
  url: string;
  metadata?: {
    duration?: string;
    genre?: string;
    creator?: string;
    rating?: string;
  };
}

interface ShareConfig {
  platforms: string[];
  message?: string;
  visibility?: 'public' | 'private' | 'friends';
  tags?: string[];
}

/**
 * AI-driven media integration service
 */
export class AIMediaIntegration {
  private static instance: AIMediaIntegration;
  
  private constructor() {}

  public static getInstance(): AIMediaIntegration {
    if (!AIMediaIntegration.instance) {
      AIMediaIntegration.instance = new AIMediaIntegration();
    }
    return AIMediaIntegration.instance;
  }

  /**
   * Process natural language media requests
   */
  public async processMediaRequest(
    input: string,
    personalizationDoc: PersonalizationDocument
  ) {
    const prompt = `As an AI assistant, analyze this media-related request and suggest appropriate actions.
    User's request: "${input}"

    Available Media Services:
    - Netflix
    - Hulu
    - YouTube

    User's Preferences:
    ${JSON.stringify(personalizationDoc, null, 2)}

    Return ONLY a JSON object with this structure:
    {
      "intent": {
        "action": "watch" | "share" | "recommend" | "track",
        "platform": string,
        "content_type": "movie" | "show" | "video" | "music"
      },
      "content": {
        "title": string,
        "url": string,
        "metadata": object
      },
      "sharing": {
        "enabled": boolean,
        "platforms": string[],
        "message": string
      }
    }`;

    try {
      const mediaPlan = await use_mcp_tool({
        server_name: 'gemini',
        tool_name: 'generate',
        arguments: { prompt }
      });

      return this.executeMediaPlan(mediaPlan, personalizationDoc);
    } catch (error) {
      console.error('Error processing media request:', error);
      throw error;
    }
  }

  /**
   * Share media content across platforms
   */
  public async shareMedia(
    content: MediaContent,
    config: ShareConfig,
    personalizationDoc: PersonalizationDocument
  ) {
    const shareActions = config.platforms.map(platform => {
      const message = this.generateShareMessage(content, config.message, personalizationDoc);
      
      switch (platform.toLowerCase()) {
        case 'twitter':
          return {
            service: 'twitter',
            action: 'post',
            params: {
              text: message,
              url: content.url,
              visibility: config.visibility
            }
          };

        case 'slack':
          return {
            service: 'slack',
            action: 'message',
            params: {
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: message
                  }
                },
                {
                  type: 'context',
                  elements: [{
                    type: 'mrkdwn',
                    text: `Platform: ${content.platform} | Type: ${content.type}`
                  }]
                }
              ],
              channels: personalizationDoc.integrations?.slack?.preferred_channels
            }
          };

        case 'facebook':
          return {
            service: 'facebook',
            action: 'post',
            params: {
              message,
              link: content.url,
              privacy: config.visibility
            }
          };
      }
    });

    return Promise.all(shareActions.map(action => 
      action && use_mcp_tool({
        server_name: action.service,
        tool_name: action.action,
        arguments: action.params
      })
    ));
  }

  /**
   * Track media consumption and generate insights
   */
  public async trackMediaActivity(
    content: MediaContent,
    personalizationDoc: PersonalizationDocument
  ) {
    // Store activity in user's profile
    await use_mcp_tool({
      server_name: 'personalization',
      tool_name: 'profile.update',
      arguments: {
        media_activity: {
          content,
          timestamp: new Date().toISOString()
        }
      }
    });

    // Generate recommendations based on activity
    return use_mcp_tool({
      server_name: 'recommendation-engine',
      tool_name: 'media.recommend',
      arguments: {
        user_preferences: personalizationDoc,
        recent_activity: content
      }
    });
  }

  /**
   * Execute a media integration plan
   */
  private async executeMediaPlan(
    plan: any,
    personalizationDoc: PersonalizationDocument
  ) {
    const { intent, content, sharing } = plan;

    // Track the content interaction
    await this.trackMediaActivity({
      type: intent.content_type,
      title: content.title,
      platform: intent.platform,
      url: content.url,
      metadata: content.metadata
    }, personalizationDoc);

    // Share if enabled
    if (sharing.enabled) {
      await this.shareMedia(
        {
          type: intent.content_type,
          title: content.title,
          platform: intent.platform,
          url: content.url,
          metadata: content.metadata
        },
        {
          platforms: sharing.platforms,
          message: sharing.message,
          visibility: 'friends'
        },
        personalizationDoc
      );
    }

    return {
      success: true,
      action: intent.action,
      content: {
        title: content.title,
        platform: intent.platform,
        url: content.url
      },
      shared: sharing.enabled
    };
  }

  /**
   * Generate personalized share message
   */
  private generateShareMessage(
    content: MediaContent,
    customMessage: string | undefined,
    personalizationDoc: PersonalizationDocument
  ): string {
    const style = personalizationDoc.communication_style;
    const tone = style.tone === 'professional' ? 'I recommend' : "I'm watching";
    const detail = style.detail_level === 'high' ? 
      ` (${content.metadata?.duration || ''} | ${content.metadata?.genre || ''})` : '';

    return customMessage || 
      `${tone} "${content.title}" on ${content.platform}${detail}`;
  }
}

export const aiMediaIntegration = AIMediaIntegration.getInstance();