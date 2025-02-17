import { BaseMCPServer, MCPConfig } from '../../../types/mcp';
import { RateLimiter } from '../../utils/rate-limiter';
import { Cache } from '../../utils/cache';
import axios from 'axios';
import { Readable } from 'stream';

interface RiffusionConfig extends MCPConfig {
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

interface GenerationParams {
  prompt: string;
  seed_audio?: string;
  duration: number;
  tempo?: number;
  style?: string;
  instruments?: string[];
  key?: string;
  mode?: 'major' | 'minor';
}

class RiffusionServer extends BaseMCPServer {
  protected config: RiffusionConfig;
  private rateLimiter: RateLimiter;
  private cache: Cache;
  private axiosInstance;

  constructor(config: RiffusionConfig) {
    super();
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.cache = new Cache(config.cacheConfig);

    this.axiosInstance = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      responseType: 'stream'
    });
  }

  capabilities = [
    'audio.generate',
    'audio.variations',
    'audio.extend',
    'audio.remix',
    'style.list'
  ];

  tools = {
    'audio.generate': async (params: GenerationParams) => {
      await this.rateLimiter.acquire();

      const cacheKey = this.getCacheKey('generate', params);
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;

      try {
        const response = await this.axiosInstance.post('/generate', {
          ...params,
          tempo: params.tempo || 120,
          return_segments: true
        });

        // Process streaming response
        const result = await this.processAudioStream(response.data, params);

        // Cache result if not too large
        if (result.size <= this.config.cacheConfig.maxSize) {
          await this.cache.set(cacheKey, result);
        }

        return result;
      } catch (error) {
        throw this.normalizeError(error);
      }
    },

    'audio.variations': async (params: {
      audio_url: string;
      num_variations: number;
      strength: number;
    }) => {
      await this.rateLimiter.acquire();

      try {
        const response = await this.axiosInstance.post('/variations', {
          audio_url: params.audio_url,
          num_variations: params.num_variations || 4,
          strength: params.strength || 0.7
        });

        return this.processAudioStream(response.data, params);
      } catch (error) {
        throw this.normalizeError(error);
      }
    },

    'audio.extend': async (params: {
      audio_url: string;
      duration: number;
      crossfade?: number;
    }) => {
      await this.rateLimiter.acquire();

      try {
        const response = await this.axiosInstance.post('/extend', {
          audio_url: params.audio_url,
          duration: params.duration,
          crossfade: params.crossfade || 2
        });

        return this.processAudioStream(response.data, params);
      } catch (error) {
        throw this.normalizeError(error);
      }
    },

    'audio.remix': async (params: {
      audio_url: string;
      style: string;
      intensity: number;
    }) => {
      await this.rateLimiter.acquire();

      try {
        const response = await this.axiosInstance.post('/remix', {
          audio_url: params.audio_url,
          style: params.style,
          intensity: params.intensity || 0.5
        });

        return this.processAudioStream(response.data, params);
      } catch (error) {
        throw this.normalizeError(error);
      }
    },

    'style.list': async () => {
      const cached = await this.cache.get('styles');
      if (cached) return cached;

      try {
        const response = await this.axiosInstance.get('/styles');
        const styles = response.data;
        await this.cache.set('styles', styles);
        return styles;
      } catch (error) {
        throw this.normalizeError(error);
      }
    }
  };

  /**
   * Process streaming audio response
   */
  private async processAudioStream(
    stream: Readable,
    params: any
  ): Promise<{
    url: string;
    segments?: Array<{
      start: number;
      end: number;
      audio_url: string;
    }>;
    metadata: {
      duration: number;
      format: string;
      size: number;
      params: any;
    };
  }> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let size = 0;

      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
        size += chunk.length;
      });

      stream.on('end', async () => {
        try {
          // Upload combined audio to storage
          const buffer = Buffer.concat(chunks);
          const audioUrl = await this.uploadToStorage(buffer);

          // Get audio metadata
          const metadata = await this.getAudioMetadata(buffer);

          resolve({
            url: audioUrl,
            segments: metadata.segments,
            metadata: {
              duration: metadata.duration,
              format: metadata.format,
              size,
              params
            }
          });
        } catch (error) {
          reject(error);
        }
      });

      stream.on('error', reject);
    });
  }

  /**
   * Upload audio buffer to storage
   */
  private async uploadToStorage(buffer: Buffer): Promise<string> {
    // Implementation would depend on your storage solution
    // This is a placeholder that returns a fake URL
    return `https://storage.example.com/audio/${Date.now()}.mp3`;
  }

  /**
   * Get audio metadata
   */
  private async getAudioMetadata(buffer: Buffer): Promise<{
    duration: number;
    format: string;
    segments?: Array<{
      start: number;
      end: number;
      audio_url: string;
    }>;
  }> {
    // Implementation would depend on your audio processing library
    // This is a placeholder that returns fake metadata
    return {
      duration: 30,
      format: 'mp3',
      segments: [
        {
          start: 0,
          end: 15,
          audio_url: 'https://storage.example.com/segments/1.mp3'
        },
        {
          start: 15,
          end: 30,
          audio_url: 'https://storage.example.com/segments/2.mp3'
        }
      ]
    };
  }

  /**
   * Generate cache key for requests
   */
  private getCacheKey(action: string, params: any): string {
    return `riffusion:${action}:${JSON.stringify(params)}`;
  }

  /**
   * Normalize error format
   */
  private normalizeError(error: any): Error {
    if (error.response) {
      return new Error(
        `Riffusion API error (${error.response.status}): ${error.response.data.message}`
      );
    }
    return new Error(`Riffusion error: ${error.message}`);
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    await this.cache.clear();
    this.rateLimiter.destroy();
  }
}

// Create and export server instance
export const createRiffusionServer = (config: RiffusionConfig) => {
  return new RiffusionServer(config);
};