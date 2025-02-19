const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export interface Voice {
  id: string;
  name: string;
  description?: string;
  preview_url?: string;
  category?: 'premade' | 'cloned' | 'generated';
  labels?: Record<string, string>;
  samples?: VoiceSample[];
  design?: VoiceDesign;
  sharing?: {
    status: 'private' | 'public';
    link?: string;
  };
}

export interface VoiceSample {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  preview_url?: string;
  duration: number;
}

export interface VoiceDesign {
  text?: string;
  age?: number;
  gender?: 'male' | 'female' | 'neutral';
  accent?: string;
  accent_strength?: number;
  style?: string;
  tempo?: number;
  pitch?: number;
  emotion?: string;
  use_case?: string;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
  optimize_streaming_latency?: 0 | 1 | 2 | 3 | 4;
}

export interface VoiceAgent {
  id: string;
  voice: Voice;
  settings: VoiceSettings;
  personality: {
    type: string;
    traits: string[];
    context: string;
  };
  conversation: {
    flows: ConversationFlow[];
    fallbacks: string[];
  };
}

export interface ConversationFlow {
  trigger: string;
  response: string;
}

export interface VoiceModel {
  model_id: string;
  name: string;
  description: string;
  token_cost_factor: number;
}

export interface TextToSpeechRequest {
  text: string;
  voice_id: string;
  voice_settings?: VoiceSettings;
  model_id?: string;
  output_format?: 'mp3_44100_128' | 'mp3_44100_64' | 'pcm_16000' | 'pcm_22050' | 'pcm_24000' | 'pcm_44100';
  stream?: boolean;
}

export interface HistoryItem {
  id: string;
  text: string;
  voice_id: string;
  voice_name: string;
  date_unix: number;
  character_count: number;
  content_type: string;
  state: 'created' | 'processing' | 'failed' | 'done';
}

export interface VoiceGenerationOptions {
  name: string;
  text: string;
  design?: VoiceDesign;
  labels?: Record<string, string>;
}

export interface UserSubscription {
  tier: string;
  character_count: number;
  character_limit: number;
  can_extend_character_limit: boolean;
}

interface RequestOptions extends RequestInit {
  maxRetries?: number;
  retryDelay?: number;
  shouldRetry?: (error: any) => boolean;
}

class ElevenLabsAPI {
  private apiKey: string;
  private activeStreams: Map<string, ReadableStream> = new Map();
  private voiceCache: Map<string, Voice> = new Map();
  private settingsCache: Map<string, VoiceSettings> = new Map();

  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not found. Voice features will be limited.');
    }
  }

  private async retryRequest<T>(
    url: string,
    options: RequestOptions
  ): Promise<Response> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      shouldRetry = (error) => error.status >= 500,
      ...fetchOptions
    } = options;

    let lastError: any;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, fetchOptions);
        if (response.ok || !shouldRetry(response)) {
          return response;
        }
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error;
      }
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
    throw lastError;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${ELEVENLABS_API_URL}${endpoint}`;
    const headers = {
      'xi-api-key': this.apiKey,
      ...options.headers,
    };
    
    const response = await this.retryRequest(url, { ...options, headers });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(
        error?.detail || `API request failed: ${response.statusText}`
      );
    }

    // Handle both JSON and binary responses
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    return response.blob() as Promise<T>;
  }

  async getVoices(): Promise<Voice[]> {
    const data = await this.request<{ voices: Voice[] }>('/voices');
    return data.voices;
  }

  async getVoiceById(voiceId: string): Promise<Voice> {
    // Check cache first
    const cachedVoice = this.voiceCache.get(voiceId);
    if (cachedVoice) {
      return cachedVoice;
    }

    const voice = await this.request<Voice>(`/voices/${voiceId}`);
    this.voiceCache.set(voiceId, voice);
    return voice;
  }

  async getDefaultVoiceSettings(): Promise<VoiceSettings> {
    if (!this.apiKey) {
      return {
        stability: 0.75,
        similarity_boost: 0.75
      };
    }

    const data = await this.request<{ default_voice_settings: VoiceSettings }>(
      '/voices/settings/default'
    );
    return data.default_voice_settings;
  }

  async textToSpeech(
    request: TextToSpeechRequest
  ): Promise<Blob | ReadableStream> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const { text, voice_id, voice_settings, model_id, output_format, stream } = request;
    
    // Default to highest optimization for streaming
    const optimizedSettings = {
      ...voice_settings,
      optimize_streaming_latency: stream ? 4 : undefined,
      use_speaker_boost: true,
    };

    if (stream) {
      const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voice_id}/stream`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice_settings: optimizedSettings || await this.getDefaultVoiceSettings(),
          model_id,
          output_format,
        }),
      });

      if (!response.ok) {
        throw new Error(`Streaming request failed: ${response.statusText}`);
      }

      const stream = response.body;
      if (!stream) {
        throw new Error('No stream returned from API');
      }

      this.activeStreams.set(voice_id, stream);
      return stream;
    }

    return this.request<Blob>(`/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice_settings: optimizedSettings || await this.getDefaultVoiceSettings(),
        model_id,
        output_format,
      }),
    });
  }

  async stopStream(voiceId: string): Promise<void> {
    const stream = this.activeStreams.get(voiceId);
    if (stream && 'cancel' in stream) {
      (stream as any).cancel();
      this.activeStreams.delete(voiceId);
    }
  }

  async addVoice(
    name: string,
    files: File[],
    description?: string,
    labels?: Record<string, string>
  ): Promise<Voice> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const formData = new FormData();
    formData.append('name', name);
    if (description) {
      formData.append('description', description);
    }
    if (labels) {
      formData.append('labels', JSON.stringify(labels));
    }
    files.forEach((file) => {
      formData.append('files', file);
    });

    return this.request<Voice>('/voices/add', {
      method: 'POST',
      body: formData,
    });
  }

  async generateVoice(options: VoiceGenerationOptions): Promise<Voice> {
    return this.request<Voice>('/voices/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });
  }

  async deleteVoice(voiceId: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    await this.request(`/voices/${voiceId}`, {
      method: 'DELETE',
    });
  }

  async editVoice(
    voiceId: string,
    name: string,
    description?: string,
    labels?: Record<string, string>
  ): Promise<Voice> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    return this.request<Voice>(`/voices/${voiceId}/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        labels,
      }),
    });
  }

  async getVoiceSettings(voiceId: string): Promise<VoiceSettings> {
    // Check cache first
    const cachedSettings = this.settingsCache.get(voiceId);
    if (cachedSettings) {
      return cachedSettings;
    }

    const settings = await this.request<VoiceSettings>(`/voices/${voiceId}/settings`);
    this.settingsCache.set(voiceId, settings);
    return settings;
  }

  async editVoiceSettings(
    voiceId: string,
    settings: VoiceSettings
  ): Promise<void> {
    await this.request(`/voices/${voiceId}/settings/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings)
    });
  }

  async getHistory(pageSize: number = 100, startAfter?: string): Promise<HistoryItem[]> {
    const params = new URLSearchParams({
      page_size: pageSize.toString(),
    });
    if (startAfter) {
      params.append('start_after', startAfter);
    }
    
    const data = await this.request<{ history: HistoryItem[] }>(`/history?${params}`);
    return data.history;
  }

  async getHistoryItem(historyItemId: string): Promise<HistoryItem & { audio: Blob }> {
    return this.request<HistoryItem & { audio: Blob }>(`/history/${historyItemId}`);
  }

  async deleteHistoryItem(historyItemId: string): Promise<void> {
    await this.request(`/history/${historyItemId}`, {
      method: 'DELETE',
    });
  }

  async downloadHistoryItems(historyItemIds: string[]): Promise<Blob> {
    return this.request<Blob>('/history/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        history_item_ids: historyItemIds,
      }),
    });
  }

  async shareVoice(voiceId: string): Promise<string> {
    const data = await this.request<{ link: string }>(`/voices/${voiceId}/share`, {
      method: 'POST',
    });
    return data.link;
  }

  async getSharedVoice(voiceId: string): Promise<Voice> {
    return this.request<Voice>(`/shared-voices/${voiceId}`);
  }

  async getModels(): Promise<VoiceModel[]> {
    const data = await this.request<{ models: VoiceModel[] }>('/models');
    return data.models;
  }

  async getUserSubscription(): Promise<UserSubscription> {
    return this.request<UserSubscription>('/user/subscription');
  }

  async getVoiceSamples(voiceId: string): Promise<VoiceSample[]> {
    const data = await this.request<{ samples: VoiceSample[] }>(`/voices/${voiceId}/samples`);
    return data.samples;
  }

  async addVoiceSample(voiceId: string, file: File): Promise<VoiceSample> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<VoiceSample>(`/voices/${voiceId}/samples/add`, {
      method: 'POST',
      body: formData,
    });
  }

  // Voice Agent Methods
  private agents: Map<string, VoiceAgent> = new Map();

  async createVoiceAgent(
    voice: Voice,
    personality: VoiceAgent['personality'],
    conversation: VoiceAgent['conversation']
  ): Promise<VoiceAgent> {
    const settings = await this.getVoiceSettings(voice.id);
    
    const agent: VoiceAgent = {
      id: `agent_${Date.now()}`,
      voice,
      settings: {
        ...settings,
        stability: 0.85, // Higher stability for consistent agent responses
        similarity_boost: 0.85, // Higher similarity for consistent voice
        use_speaker_boost: true,
      },
      personality,
      conversation,
    };

    this.agents.set(agent.id, agent);
    return agent;
  }

  async getVoiceAgent(agentId: string): Promise<VoiceAgent | undefined> {
    return this.agents.get(agentId);
  }

  async agentSpeak(
    agentId: string,
    text: string,
    stream: boolean = true
  ): Promise<Blob | ReadableStream> {
    const agent = await this.getVoiceAgent(agentId);
    if (!agent) {
      throw new Error(`Voice agent ${agentId} not found`);
    }

    // Process text through conversation flows
    let processedText = text;
    for (const flow of agent.conversation.flows) {
      if (text.toLowerCase().includes(flow.trigger.toLowerCase())) {
        processedText = flow.response;
        break;
      }
    }

    // If no flow matched and text is empty, use a fallback
    if (!processedText && agent.conversation.fallbacks.length > 0) {
      processedText = agent.conversation.fallbacks[
        Math.floor(Math.random() * agent.conversation.fallbacks.length)
      ];
    }

    return this.textToSpeech({
      text: processedText,
      voice_id: agent.voice.id,
      voice_settings: agent.settings,
      stream,
      output_format: 'mp3_44100_128',
    });
  }
}

export const elevenlabs = new ElevenLabsAPI();