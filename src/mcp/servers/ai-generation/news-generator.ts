import { BaseMCPServer, MCPConfig } from '../../../types/mcp';
import { use_mcp_tool } from '../../../lib/mcp';
import { RateLimiter } from '../../utils/rate-limiter';
import { Cache } from '../../utils/cache';

interface NewsGeneratorConfig extends MCPConfig {
  apiKey: string;
  apiUrl: string;
  rateLimit: {
    requests: number;
    period: number;
  };
  cacheConfig: {
    ttl: number;
    maxSize: number;
  };
}

interface NewsGenerationParams {
  topic: string;
  style?: 'formal' | 'casual' | 'technical';
  format?: 'article' | 'summary' | 'bullet-points';
  length?: 'short' | 'medium' | 'long';
  tone?: 'neutral' | 'positive' | 'analytical';
}

interface NewsArticle {
  title: string;
  content: string;
  metadata: {
    topic: string;
    generated_at: string;
    word_count: number;
    style: string;
    format: string;
    tone: string;
  };
}

class NewsGeneratorServer extends BaseMCPServer {
  protected config: NewsGeneratorConfig;
  private rateLimiter: RateLimiter;
  private cache: Cache;

  public readonly capabilities: string[] = [
    'news.generate',
    'news.summarize',
    'news.analyze'
  ];

  public readonly tools: Record<string, (...args: any[]) => Promise<any>> = {
    'news.generate': async (params: NewsGenerationParams): Promise<NewsArticle> => {
      await this.rateLimiter.acquire();

      const cacheKey = this.getCacheKey('generate', params as unknown as Record<string, unknown>);
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;

      try {
        // Use Gemini for content generation
        const content = await use_mcp_tool({
          server_name: 'gemini',
          tool_name: 'content.generate',
          arguments: {
            prompt: this.buildPrompt(params),
            style: params.style || 'formal',
            format: params.format || 'article',
            tone: params.tone || 'neutral',
            max_length: this.getLengthLimit(params.length)
          }
        });

        const article: NewsArticle = {
          title: content.title,
          content: content.body,
          metadata: {
            topic: params.topic,
            generated_at: new Date().toISOString(),
            word_count: content.body.split(/\s+/).length,
            style: params.style || 'formal',
            format: params.format || 'article',
            tone: params.tone || 'neutral'
          }
        };

        await this.cache.set(cacheKey, article);
        return article;
      } catch (error) {
        throw this.normalizeError(error);
      }
    },

    'news.summarize': async (article: NewsArticle): Promise<string> => {
      await this.rateLimiter.acquire();

      try {
        const summary = await use_mcp_tool({
          server_name: 'gemini',
          tool_name: 'content.summarize',
          arguments: {
            content: article.content,
            max_length: 200,
            style: 'concise'
          }
        });

        return summary;
      } catch (error) {
        throw this.normalizeError(error);
      }
    },

    'news.analyze': async (article: NewsArticle): Promise<{
      sentiment: string;
      key_points: string[];
      topics: string[];
      bias_assessment: string;
    }> => {
      await this.rateLimiter.acquire();

      try {
        const analysis = await use_mcp_tool({
          server_name: 'gemini',
          tool_name: 'content.analyze',
          arguments: {
            content: article.content,
            aspects: ['sentiment', 'key_points', 'topics', 'bias']
          }
        });

        return {
          sentiment: analysis.sentiment,
          key_points: analysis.key_points,
          topics: analysis.topics,
          bias_assessment: analysis.bias
        };
      } catch (error) {
        throw this.normalizeError(error);
      }
    }
  };

  constructor(config: NewsGeneratorConfig) {
    super();
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.cache = new Cache(config.cacheConfig);
  }

  private buildPrompt(params: NewsGenerationParams): string {
    return `Generate a ${params.style || 'formal'} news ${params.format || 'article'} about ${params.topic} with a ${params.tone || 'neutral'} tone.`;
  }

  private getLengthLimit(length?: string): number {
    switch (length) {
      case 'short':
        return 300;
      case 'medium':
        return 600;
      case 'long':
        return 1200;
      default:
        return 600;
    }
  }

  private getCacheKey(action: string, params: Record<string, unknown>): string {
    return `news:${action}:${JSON.stringify(params)}`;
  }

  private normalizeError(error: unknown): Error {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as any).response;
      return new Error(
        `News Generator error (${response.status}): ${response.data?.message || response.statusText}`
      );
    }
    return new Error(`News Generator error: ${error instanceof Error ? error.message : String(error)}`);
  }

  async destroy(): Promise<void> {
    await this.cache.clear();
    this.rateLimiter.destroy();
  }
}

export const createNewsGeneratorServer = (config: NewsGeneratorConfig): NewsGeneratorServer => {
  return new NewsGeneratorServer(config);
};