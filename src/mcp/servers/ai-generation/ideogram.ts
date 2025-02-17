import { BaseMCPServer, MCPConfig } from '../../../types/mcp';
import axios, { AxiosResponse } from 'axios';
import { RateLimiter } from '../../utils/rate-limiter';
import { Cache } from '../../../mcp/utils/cache';

interface IdeogramConfig extends MCPConfig {
  apiKey: string;
  apiUrl: string;
  rateLimit: {
    requests: number;
    period: number; // in milliseconds
  };
  cacheConfig: {
    ttl: number; // in milliseconds
    maxSize: number; // in bytes
  };
}

interface GenerationParams {
  prompt: string;
  style?: string;
  resolution?: string;
  num_steps?: number;
  seed?: number;
  negative_prompt?: string;
  batch_size?: number;
}

class IdeogramServer extends BaseMCPServer {
  private config: IdeogramConfig;
  private rateLimiter: RateLimiter;
  private cache: Cache;
  private axiosInstance;

  constructor(config: IdeogramConfig) {
    super();
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.cache = new Cache(config.cacheConfig);
    
    this.axiosInstance = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Set up error interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      this.handleApiError.bind(this)
    );
  }

  capabilities = [
    'image.generate',
    'image.variations',
    'image.upscale',
    'style.list',
    'model.info'
  ];

  tools = {
    'image.generate': async (params: GenerationParams) => {
      await this.rateLimiter.acquire();
      
      // Check cache first
      const cacheKey = this.getCacheKey('generate', params);
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;

      try {
        const response = await this.axiosInstance.post('/generations', {
          ...params,
          num_steps: params.num_steps || 50,
          resolution: params.resolution || '1024x1024'
        });

        const result = {
          images: response.data.images.map((img: any) => ({
            url: img.url,
            seed: img.seed,
            resolution: img.resolution
          })),
          metadata: {
            prompt: params.prompt,
            style: params.style,
            model: response.data.model,
            processing_time: response.data.processing_time
          }
        };

        // Cache successful result
        await this.cache.set(cacheKey, result);
        return result;
      } catch (error) {
        throw this.normalizeError(error);
      }
    },

    'image.variations': async (params: {
      image_url: string;
      num_variations?: number;
      style?: string;
    }) => {
      await this.rateLimiter.acquire();

      try {
        const response = await this.axiosInstance.post('/variations', {
          image_url: params.image_url,
          num_variations: params.num_variations || 4,
          style: params.style
        });

        return {
          variations: response.data.images.map((img: any) => ({
            url: img.url,
            seed: img.seed
          })),
          metadata: {
            source_image: params.image_url,
            style: params.style,
            model: response.data.model
          }
        };
      } catch (error) {
        throw this.normalizeError(error);
      }
    },

    'image.upscale': async (params: {
      image_url: string;
      scale: number;
    }) => {
      await this.rateLimiter.acquire();

      try {
        const response = await this.axiosInstance.post('/upscale', {
          image_url: params.image_url,
          scale: params.scale || 2
        });

        return {
          url: response.data.image.url,
          metadata: {
            original_url: params.image_url,
            scale: params.scale,
            final_resolution: response.data.image.resolution
          }
        };
      } catch (error) {
        throw this.normalizeError(error);
      }
    },

    'style.list': async () => {
      const cached = await this.cache.get('styles');
      if (cached) return cached;

      try {
        const response = await this.axiosInstance.get('/styles');
        await this.cache.set('styles', response.data.styles);
        return response.data.styles;
      } catch (error) {
        throw this.normalizeError(error);
      }
    },

    'model.info': async () => {
      const cached = await this.cache.get('model_info');
      if (cached) return cached;

      try {
        const response = await this.axiosInstance.get('/model/info');
        await this.cache.set('model_info', response.data);
        return response.data;
      } catch (error) {
        throw this.normalizeError(error);
      }
    }
  };

  /**
   * Generate cache key for requests
   */
  private getCacheKey(action: string, params: any): string {
    return `ideogram:${action}:${JSON.stringify(params)}`;
  }

  /**
   * Handle API errors
   */
  private async handleApiError(error: any) {
    if (error.response?.status === 429) {
      // Rate limit exceeded - wait and retry
      const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return this.axiosInstance.request(error.config);
    }

    throw this.normalizeError(error);
  }

  /**
   * Normalize error format
   */
  private normalizeError(error: any): Error {
    if (error.response) {
      return new Error(
        `Ideogram API error (${error.response.status}): ${error.response.data.message}`
      );
    }
    return new Error(`Ideogram error: ${error.message}`);
  }

  /**
   * Clean up resources
   */
  async destroy() {
    await this.cache.clear();
    this.rateLimiter.destroy();
  }
}

// Create and export server instance
export const createIdeogramServer = (config: IdeogramConfig) => {
  return new IdeogramServer(config);
};