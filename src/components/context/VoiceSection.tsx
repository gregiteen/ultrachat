import React, { useState, useEffect } from 'react';
import { Mic, Volume2, RefreshCw } from 'lucide-react';
import { elevenlabs } from '../../lib/elevenlabs';
import type { Voice, VoiceSettings } from '../../lib/elevenlabs';

interface VoiceSectionProps {
  voice: {
    id?: string;
    name: string;
    description?: string;
    settings?: VoiceSettings;
  };
  setVoice: (voice: {
    id?: string;
    name: string;
    description?: string;
    settings?: VoiceSettings;
  }) => void;
}

export function VoiceSection({ voice, setVoice }: VoiceSectionProps) {
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default settings if none provided
  const settings = voice.settings || {
    stability: 0.75,
    similarity_boost: 0.75
  };

  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const voices = await elevenlabs.getVoices();
      setAvailableVoices(voices);      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch voices');
      console.error('Error fetching voices:', err);
    } finally {
      setLoading(false);      
    }
  };

  const playVoicePreview = async (voiceId: string) => {
    setLoading(true);
    try {
      const audioBlob = await elevenlabs.textToSpeech({
        text: "Hello! This is a preview of how I sound.",
        voice_id: voiceId,
        voice_settings: voice.settings
      });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (err) {
      console.error('Error playing voice preview:', err);
    }
    setLoading(false);
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVoice = availableVoices.find(v => v.id === e.target.value);
    if (selectedVoice) {
      setVoice({
        ...voice,
        id: selectedVoice.id,
        name: selectedVoice.name,
        description: selectedVoice.description
      });
    }
  };

  const handleSettingChange = (setting: keyof VoiceSettings, value: number) => {
    setVoice({
      ...voice,
      settings: {
        ...settings,
        [setting]: value
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Voice Selection
        </label>
        <div className="flex gap-2">
          <select            
            value={voice.id || ''}
            onChange={handleVoiceChange}
            className="flex-1 rounded-md border border-muted bg-input-background text-foreground px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"            
          >
            <option value="">Select a voice</option>
            {availableVoices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} {v.description ? `(${v.description})` : ''}
              </option>
            ))}
          </select>          
          <button
            type="button"
            onClick={fetchVoices}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh voices"
          >
            <RefreshCw className="h-5 w-5" />
          </button>          
          {voice.id && (
            <button
              type="button"
              onClick={() => playVoicePreview(voice.id!)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Preview voice"
              disabled={loading}
            >
              <Volume2 className="h-5 w-5" />              
            </button>
          )}
        </div>
        {!voice.id && (
          <input
            type="text"
            value={voice.name}
            onChange={(e) => setVoice({ ...voice, name: e.target.value })}
            placeholder="Or describe the voice (e.g., 'warm, friendly male voice')"
            className="mt-2 w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
          />
        )}
      </div>

      {voice.id && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Stability ({settings.stability})
              </div>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.stability}
              onChange={(e) => handleSettingChange('stability', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Higher values make the voice more consistent but may sound less natural
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Similarity Boost ({settings.similarity_boost})
              </div>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.similarity_boost}
              onChange={(e) => handleSettingChange('similarity_boost', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Higher values make the voice more similar to the original but may reduce quality
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-2">
          {error}
        </p>
      )}
    </div>
  );
}