import { use_mcp_tool } from './mcp';
import type { PersonalizationDocument } from '../types/personalization';

interface GenerationRequest {
  type: 'image' | 'music' | 'video' | 'code' | 'text';
  prompt: string;
  style?: string;
  duration?: number; // for music/video
  resolution?: string; // for images/video
  format?: string;
  variations?: number;
}

interface GeneratedContent {
  type: 'image' | 'music' | 'video' | 'code' | 'text';
  url: string;
  preview_url?: string;
  metadata: {
    prompt: string;
    style?: string;
    duration?: number;
    resolution?: string;
    format: string;
    created_at: string;
  };
  variations?: string[]; // URLs to variations
  storage?: {
    drive_id?: string;
    path?: string;
  };
}

interface VariationResponse {
  urls: string[];
}

interface GenerationResponse {
  url: string;
  preview_url?: string;
}

interface DriveStorageResponse {
  id: string;
  path: string;
}

/**
 * AI-driven creative content generation service
 */
export class AICreativeGeneration {
  private static instance: AICreativeGeneration;
  
  private constructor() {}

  public static getInstance(): AICreativeGeneration {
    if (!AICreativeGeneration.instance) {
      AICreativeGeneration.instance = new AICreativeGeneration();
    }
    return AICreativeGeneration.instance;
  }

  /**
   * Process creative generation requests inline in chat
   */
  public async generateContent(
    request: GenerationRequest,
    personalizationDoc: PersonalizationDocument
  ): Promise<GeneratedContent> {
    // Enhance prompt based on user's preferences and style
    const enhancedPrompt = await this.enhancePrompt(
      request.prompt,
      request.type,
      personalizationDoc
    );

    // Generate content using appropriate service
    const content = await this.generateByType(
      request.type,
      enhancedPrompt,
      request,
      personalizationDoc
    );

    // Save to Google Drive if user prefers storage
    if (personalizationDoc.preferences.storage === 'google_drive') {
      const storedContent = await this.saveToGoogleDrive(content);
      return {
        ...content,
        storage: storedContent.storage
      };
    }

    return content;
  }

  /**
   * Generate variations of existing content
   */
  public async generateVariations(
    content: GeneratedContent,
    count: number,
    personalizationDoc: PersonalizationDocument
  ): Promise<string[]> {
    const variations = await use_mcp_tool<VariationResponse>({
      server_name: this.getServiceForType(content.type),
      tool_name: 'variations.create',
      arguments: {
        source_url: content.url,
        count,
        prompt: content.metadata.prompt,
        style: content.metadata.style
      }
    });

    // Save variations if storage is enabled
    if (personalizationDoc.preferences.storage === 'google_drive') {
      await Promise.all(
        variations.urls.map((variationUrl: string) =>
          this.saveToGoogleDrive({
            ...content,
            url: variationUrl,
            metadata: {
              ...content.metadata,
              created_at: new Date().toISOString()
            }
          })
        )
      );
    }

    return variations.urls;
  }

  /**
   * Enhance generation prompt with AI
   */
  private async enhancePrompt(
    prompt: string,
    type: GenerationRequest['type'],
    personalizationDoc: PersonalizationDocument
  ): Promise<string> {
    return use_mcp_tool<string>({
      server_name: 'gemini',
      tool_name: 'prompt.enhance',
      arguments: {
        prompt,
        type,
        style: personalizationDoc.communication_style,
        interests: personalizationDoc.interests
      }
    });
  }

  /**
   * Generate content based on type
   */
  private async generateByType(
    type: GenerationRequest['type'],
    prompt: string,
    request: GenerationRequest,
    personalizationDoc: PersonalizationDocument
  ): Promise<GeneratedContent> {
    const service = this.getServiceForType(type);
    
    const generated = await use_mcp_tool<GenerationResponse>({
      server_name: service,
      tool_name: 'generate',
      arguments: {
        prompt,
        style: request.style,
        duration: request.duration,
        resolution: request.resolution,
        format: request.format || this.getDefaultFormat(type)
      }
    });

    return {
      type,
      url: generated.url,
      preview_url: generated.preview_url,
      metadata: {
        prompt: request.prompt,
        style: request.style,
        duration: request.duration,
        resolution: request.resolution,
        format: request.format || this.getDefaultFormat(type),
        created_at: new Date().toISOString()
      }
    };
  }

  /**
   * Save generated content to Google Drive
   */
  private async saveToGoogleDrive(
    content: GeneratedContent
  ): Promise<GeneratedContent> {
    const stored = await use_mcp_tool<DriveStorageResponse>({
      server_name: 'google-drive',
      tool_name: 'file.create',
      arguments: {
        name: `Generated ${content.type} - ${new Date().toISOString()}`,
        url: content.url,
        metadata: content.metadata,
        folder: `AI Generated/${content.type.charAt(0).toUpperCase() + content.type.slice(1)}s`
      }
    });

    return {
      ...content,
      storage: {
        drive_id: stored.id,
        path: stored.path
      }
    };
  }

  /**
   * Get appropriate service for content type
   */
  private getServiceForType(type: GenerationRequest['type']): string {
    switch (type) {
      case 'image':
        return 'stable-diffusion';
      case 'music':
        return 'musicgen';
      case 'video':
        return 'runway';
      case 'code':
        return 'gemini';
      case 'text':
        return 'gemini';
      default:
        throw new Error(`Unknown content type: ${type}`);
    }
  }

  /**
   * Get default format for content type
   */
  private getDefaultFormat(type: GenerationRequest['type']): string {
    switch (type) {
      case 'image':
        return 'png';
      case 'music':
        return 'mp3';
      case 'video':
        return 'mp4';
      case 'code':
        return 'text';
      case 'text':
        return 'text';
      default:
        return 'binary';
    }
  }
}

export const aiCreativeGeneration = AICreativeGeneration.getInstance();