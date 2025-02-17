import { BaseMCPServer, MCPConfig } from '../../../types/mcp';
import { RateLimiter } from '../../utils/rate-limiter';
import { Cache } from '../../utils/cache';
import { Readable } from 'stream';

interface ElevenLabsConfig extends MCPConfig {
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

interface VoiceGenerationParams {
  text: string;
  voice_id: string;
  model_id?: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  pronunciation_dictionary_locators?: string[];
}

interface VoiceCloneParams {
  name: string;
  description?: string;
  files: Array<{
    data: Buffer;
    mime_type: string;
  }>;
  labels?: Record<string, string>;
}

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

interface Voice {
  id: string;
  name: string;
  settings: VoiceSettings;
}

interface AudioMetadata {
  duration: number;
  format: string;
  size: number;
}

interface AudioResponse {
  url: string;
  metadata: AudioMetadata;
}

class ElevenLabsServer extends BaseMCPServer {
  protected config: ElevenLabsConfig;
  private rateLimiter: RateLimiter;
  private cache: Cache;
  private voiceCache: Map<string, Voice>;

  public readonly capabilities: string[] = [
    'voice.generate',
    'voice.clone',
    'voice.list',
    'voice.settings',
    'voice.stream'
  ];

  public readonly tools: Record<string, (...args: any[]) => Promise<any>> = {
    'voice.generate': async (params: VoiceGenerationParams): Promise<AudioResponse> => {
      await this.rateLimiter.acquire();

      const cacheKey = this.getCacheKey('generate', params as unknown as Record<string, unknown>);
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;

      try {
        const response = await this.makeRequest('/text-to-speech', {
          method: 'POST',
          body: JSON.stringify({
            text: params.text,
            voice_id: params.voice_id,
            model_id: params.model_id || 'eleven_monolingual_v1',
            voice_settings: params.voice_settings
          }),
          headers: {
            'Content-Type': 'application/json'
          },
          responseType: 'stream'
        });

        const result = await this.processAudioStream(response);

        if (result.metadata.size <= this.config.cacheConfig.maxSize) {
          await this.cache.set(cacheKey, result);
        }

        return result;
      } catch (error) {
        throw this.normalizeError(error);
      }
    },

    'voice.clone': async (params: VoiceCloneParams): Promise<Voice> => {
      await this.rateLimiter.acquire();

      try {
        const formData = new FormData();
        formData.append('name', params.name);
        if (params.description) {
          formData.append('description', params.description);
        }
        
        params.files.forEach((file, index) => {
          formData.append(
            `files`,
            new Blob([file.data], { type: file.mime_type }),
            `sample_${index}.wav`
          );
        });

        if (params.labels) {
          formData.append('labels', JSON.stringify(params.labels));
        }

        const response = await this.makeRequest('/voices/add', {
          method: 'POST',
          body: formData
        });

        const voice = response.data as Voice;
        this.voiceCache.set(voice.id, { ...voice });

        return voice;
      } catch (error) {
        throw this.normalizeError(error);
      }
    },

    'voice.list': async (): Promise<Voice[]> => {
      const cached = await this.cache.get('voices');
      if (cached) return cached;

      try {
        const response = await this.makeRequest('/voices');
        const voices = response.data as Voice[];
        
        // Update voice cache
        voices.forEach(voice => {
          this.voiceCache.set(voice.id, { ...voice });
        });

        await this.cache.set('voices', voices);
        return voices;
      } catch (error) {
        throw this.normalizeError(error);
      }
    },

    'voice.settings': async (voiceId: string): Promise<VoiceSettings> => {
      // Check voice cache first
      const cached = this.voiceCache.get(voiceId);
      if (cached?.settings) return cached.settings;

      try {
        const response = await this.makeRequest(`/voices/${voiceId}/settings`);
        const settings = response.data as VoiceSettings;
        
        // Update voice cache
        if (this.voiceCache.has(voiceId)) {
          const voice = this.voiceCache.get(voiceId)!;
          voice.settings = settings;
          this.voiceCache.set(voiceId, voice);
        }

        return settings;
      } catch (error) {
        throw this.normalizeError(error);
      }
    },

    'voice.stream': async (params: VoiceGenerationParams): Promise<ReadableStream<Uint8Array>> => {
      await this.rateLimiter.acquire();

      try {
        const response = await this.makeRequest('/text-to-speech/stream', {
          method: 'POST',
          body: JSON.stringify({
            text: params.text,
            voice_id: params.voice_id,
            model_id: params.model_id || 'eleven_monolingual_v1',
            voice_settings: params.voice_settings
          }),
          headers: {
            'Content-Type': 'application/json'
          },
          responseType: 'stream'
        });

        return response.body as ReadableStream<Uint8Array>;
      } catch (error) {
        throw this.normalizeError(error);
      }
    }
  };

  constructor(config: ElevenLabsConfig) {
    super();
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.cache = new Cache(config.cacheConfig);
    this.voiceCache = new Map();

    // Initialize voice cache
    this.loadVoices().catch(console.error);
  }

  /**
   * Make authenticated request to ElevenLabs API
   */
  private async makeRequest(
    endpoint: string,
    options: RequestInit & { responseType?: string } = {}
  ): Promise<any> {
    const url = `${this.config.apiUrl}${endpoint}`;
    const headers = {
      'xi-api-key': this.config.apiKey,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (options.responseType === 'stream') {
      return response.body;
    }

    return response.json();
  }

  /**
   * Process streaming audio response
   */
  private async processAudioStream(
    stream: ReadableStream<Uint8Array>
  ): Promise<AudioResponse> {
    return new Promise<AudioResponse>((resolve, reject) => {
      const chunks: Buffer[] = [];
      let size = 0;

      const reader = stream.getReader();

      const processText = async (result: ReadableStreamReadResult<Uint8Array>): Promise<void> => {
        try {
          if (result.done) {
            const buffer = Buffer.concat(chunks);
            const metadata = await this.getAudioMetadata(buffer);
            const url = await this.uploadToStorage(buffer);
            
            resolve({
              url,
              metadata: {
                ...metadata,
                size
              }
            });
            return;
          }

          chunks.push(Buffer.from(result.value));
          size += result.value.length;
          const nextResult = await reader.read();
          return processText(nextResult);
        } catch (error) {
          reject(error);
        }
      };

      reader.read()
        .then(processText)
        .catch(reject);
    });
  }

  /**
   * Upload audio to storage
   */
  private async uploadToStorage(buffer: Buffer): Promise<string> {
    // Implementation would depend on your storage solution
    return `https://storage.example.com/audio/${Date.now()}.mp3`;
  }

  /**
   * Get audio metadata
   */
  private async getAudioMetadata(buffer: Buffer): Promise<{
    duration: number;
    format: string;
  }> {
    // Implementation would depend on your audio processing library
    return {
      duration: 30,
      format: 'mp3'
    };
  }

  /**
   * Load available voices
   */
  private async loadVoices(): Promise<void> {
    try {
      await this.tools['voice.list']();
    } catch (error) {
      console.error('Failed to load voices:', error);
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(action: string, params: Record<string, unknown>): string {
    return `elevenlabs:${action}:${JSON.stringify(params)}`;
  }

  /**
   * Normalize error format
   */
  private normalizeError(error: unknown): Error {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as any).response;
      return new Error(
        `ElevenLabs API error (${response.status}): ${response.data?.message || response.statusText}`
      );
    }
    return new Error(`ElevenLabs error: ${error instanceof Error ? error.message : String(error)}`);
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    await this.cache.clear();
    this.rateLimiter.destroy();
    this.voiceCache.clear();
  }
}

// Create and export server instance
export const createElevenLabsServer = (config: ElevenLabsConfig): ElevenLabsServer => {
  return new ElevenLabsServer(config);
};