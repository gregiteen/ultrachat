const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export interface Voice {
  id: string;
  name: string;
  description?: string;
  preview_url?: string;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
}

export interface TextToSpeechRequest {
  text: string;
  voice_id: string;
  voice_settings?: VoiceSettings;
}

class ElevenLabsAPI {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not found. Voice features will be limited.');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${ELEVENLABS_API_URL}${endpoint}`;
    const headers = {
      'xi-api-key': this.apiKey,
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    
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
  ): Promise<Blob> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const { text, voice_id, voice_settings } = request;
    return this.request<Blob>(`/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice_settings: voice_settings || await this.getDefaultVoiceSettings(),
      }),
    });
  }

  async addVoice(
    name: string,
    files: File[],
    description?: string
  ): Promise<Voice> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const formData = new FormData();
    formData.append('name', name);
    if (description) {
      formData.append('description', description);
    }
    files.forEach((file) => {
      formData.append('files', file);
    });

    return this.request<Voice>('/voices/add', {
      method: 'POST',
      body: formData,
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
    description?: string
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
      }),
    });
  }
}

export const elevenlabs = new ElevenLabsAPI();