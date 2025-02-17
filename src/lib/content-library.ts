import { use_mcp_tool } from './mcp';
import { aiCreativeGeneration } from './ai-creative-generation';
import type { PersonalizationDocument } from '../types/personalization';
import type { GeneratedContent } from './ai-creative-generation';

interface LibraryItem {
  id: string;
  type: 'image' | 'music' | 'video' | 'code' | 'text' | 'document';
  title: string;
  description?: string;
  url: string;
  preview_url?: string;
  thumbnail_url?: string;
  created_at: string;
  modified_at: string;
  metadata: {
    prompt?: string;
    source: 'generated' | 'uploaded' | 'saved';
    format: string;
    size?: number;
    duration?: number;
    resolution?: string;
    tags: string[];
    folder: string;
    storage_info: {
      service: 'google_drive' | 'local' | 'cloud';
      id?: string;
      path?: string;
    };
  };
  permissions: {
    public: boolean;
    shared_with?: string[];
    editable: boolean;
  };
}

interface LibraryFolder {
  id: string;
  name: string;
  path: string;
  type: 'system' | 'user' | 'smart';
  item_count: number;
  total_size: number;
  created_at: string;
  modified_at: string;
  metadata?: {
    icon?: string;
    color?: string;
    auto_organize?: boolean;
  };
}

interface SearchOptions {
  query?: string;
  types?: string[];
  folders?: string[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  source?: 'generated' | 'uploaded' | 'saved';
}

/**
 * Content Library Service
 * Manages all generated and saved content with smart organization
 */
export class ContentLibrary {
  private static instance: ContentLibrary;
  
  private constructor() {}

  public static getInstance(): ContentLibrary {
    if (!ContentLibrary.instance) {
      ContentLibrary.instance = new ContentLibrary();
    }
    return ContentLibrary.instance;
  }

  /**
   * Save generated content to library
   */
  public async saveGenerated(
    content: GeneratedContent,
    personalizationDoc: PersonalizationDocument
  ): Promise<LibraryItem> {
    // Create library item
    const item: LibraryItem = {
      id: Math.random().toString(36).substr(2, 9),
      type: content.type,
      title: `Generated ${content.type} - ${new Date().toLocaleString()}`,
      url: content.url,
      preview_url: content.preview_url,
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      metadata: {
        prompt: content.metadata.prompt,
        source: 'generated',
        format: content.metadata.format,
        tags: this.generateTags(content, personalizationDoc),
        folder: `Generated/${content.type}s`,
        storage_info: {
          service: 'google_drive',
          ...content.storage
        }
      },
      permissions: {
        public: false,
        editable: true
      }
    };

    // Store in database
    const stored = await use_mcp_tool({
      server_name: 'supabase',
      tool_name: 'library.store',
      arguments: { item }
    });

    // Create smart folders if needed
    await this.updateSmartFolders(stored, personalizationDoc);

    return stored;
  }

  /**
   * Search library content
   */
  public async searchContent(
    options: SearchOptions,
    personalizationDoc: PersonalizationDocument
  ): Promise<LibraryItem[]> {
    // Get base results
    let results = await use_mcp_tool({
      server_name: 'supabase',
      tool_name: 'library.search',
      arguments: options
    });

    // Enhance search with AI
    if (options.query) {
      results = await this.enhanceSearchResults(
        results,
        options.query,
        personalizationDoc
      );
    }

    return results;
  }

  /**
   * Get or create folder
   */
  public async getFolder(
    path: string,
    create: boolean = false
  ): Promise<LibraryFolder> {
    const folder = await use_mcp_tool({
      server_name: 'supabase',
      tool_name: 'folder.get',
      arguments: { path }
    });

    if (!folder && create) {
      return this.createFolder(path);
    }

    return folder;
  }

  /**
   * Generate content preview
   */
  public async generatePreview(
    item: LibraryItem,
    type: 'thumbnail' | 'preview'
  ): Promise<string> {
    return use_mcp_tool({
      server_name: 'media-processor',
      tool_name: 'preview.generate',
      arguments: {
        url: item.url,
        type,
        content_type: item.type
      }
    });
  }

  /**
   * Share content
   */
  public async shareContent(
    item: LibraryItem,
    platforms: string[],
    message?: string
  ): Promise<void> {
    const sharePromises = platforms.map(platform =>
      use_mcp_tool({
        server_name: platform,
        tool_name: 'content.share',
        arguments: {
          url: item.url,
          title: item.title,
          description: message || item.description,
          preview: item.preview_url || item.thumbnail_url
        }
      })
    );

    await Promise.all(sharePromises);
  }

  /**
   * Create a new folder
   */
  private async createFolder(path: string): Promise<LibraryFolder> {
    const parts = path.split('/');
    const name = parts[parts.length - 1];

    const folder: LibraryFolder = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      path,
      type: path.startsWith('Generated/') ? 'system' : 'user',
      item_count: 0,
      total_size: 0,
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString()
    };

    return use_mcp_tool({
      server_name: 'supabase',
      tool_name: 'folder.create',
      arguments: { folder }
    });
  }

  /**
   * Generate tags for content
   */
  private generateTags(
    content: GeneratedContent,
    personalizationDoc: PersonalizationDocument
  ): string[] {
    const tags = new Set<string>();

    // Add type-based tags
    tags.add(content.type);
    tags.add(`generated-${content.type}`);

    // Add style tags if present
    if (content.metadata.style) {
      tags.add(`style-${content.metadata.style}`);
    }

    // Add user interest-based tags
    const interests = personalizationDoc.interests;
    const prompt = content.metadata.prompt.toLowerCase();
    interests.forEach(interest => {
      if (prompt.includes(interest.toLowerCase())) {
        tags.add(interest);
      }
    });

    return Array.from(tags);
  }

  /**
   * Update smart folders
   */
  private async updateSmartFolders(
    item: LibraryItem,
    personalizationDoc: PersonalizationDocument
  ): Promise<void> {
    // Get or create smart folders based on content
    const smartFolders = await this.getSmartFoldersForItem(
      item,
      personalizationDoc
    );

    // Update folder metadata
    const updatePromises = smartFolders.map(folder =>
      use_mcp_tool({
        server_name: 'supabase',
        tool_name: 'folder.update',
        arguments: {
          path: folder.path,
          updates: {
            item_count: folder.item_count + 1,
            total_size: folder.total_size + (item.metadata.size || 0),
            modified_at: new Date().toISOString()
          }
        }
      })
    );

    await Promise.all(updatePromises);
  }

  /**
   * Get smart folders for item
   */
  private async getSmartFoldersForItem(
    item: LibraryItem,
    personalizationDoc: PersonalizationDocument
  ): Promise<LibraryFolder[]> {
    const folders: LibraryFolder[] = [];

    // Add to type-based folder
    folders.push(await this.getFolder(`Generated/${item.type}s`, true));

    // Add to interest-based folders
    const relevantInterests = personalizationDoc.interests.filter(interest =>
      item.metadata.tags.includes(interest)
    );

    for (const interest of relevantInterests) {
      folders.push(await this.getFolder(`Interests/${interest}`, true));
    }

    // Add to style-based folders if applicable
    const styleTag = item.metadata.tags.find(tag => tag.startsWith('style-'));
    if (styleTag) {
      folders.push(await this.getFolder(`Styles/${styleTag.replace('style-', '')}`, true));
    }

    return folders;
  }

  /**
   * Enhance search results with AI
   */
  private async enhanceSearchResults(
    results: LibraryItem[],
    query: string,
    personalizationDoc: PersonalizationDocument
  ): Promise<LibraryItem[]> {
    // Use AI to understand search intent
    const searchContext = await use_mcp_tool({
      server_name: 'gemini',
      tool_name: 'search.analyze',
      arguments: {
        query,
        user_preferences: personalizationDoc
      }
    });

    // Re-rank results based on relevance
    const rankedResults = await use_mcp_tool({
      server_name: 'gemini',
      tool_name: 'search.rank',
      arguments: {
        results,
        context: searchContext,
        user_preferences: personalizationDoc
      }
    });

    return rankedResults;
  }
}

export const contentLibrary = ContentLibrary.getInstance();