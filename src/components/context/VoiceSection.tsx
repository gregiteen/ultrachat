import React, { useState, useEffect } from 'react';
import { Mic, Volume2, RefreshCw, Plus, Wand2 } from 'lucide-react';
import { elevenlabs, type Voice as ElevenLabsVoice } from '../../lib/elevenlabs';
import { VoiceCloner } from '../voice/VoiceCloner';
import { VoiceDesigner } from '../voice/VoiceDesigner';
import { VoiceGallery } from '../voice/VoiceGallery';
import type { Voice, VoiceSettings } from '../../types';

interface VoiceSectionProps {
  voice: Voice;
  setVoice: (voice: Voice) => void;
}

export function VoiceSection({ voice, setVoice }: VoiceSectionProps) {
  const [availableVoices, setAvailableVoices] = useState<ElevenLabsVoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVoiceGallery, setShowVoiceGallery] = useState(false);
  const [showVoiceCloner, setShowVoiceCloner] = useState(false);
  const [showVoiceDesigner, setShowVoiceDesigner] = useState(false);

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
      if (audioBlob instanceof Blob) {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      }
    } catch (err) {
      console.error('Error playing voice preview:', err);
    }
    setLoading(false);
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVoice = availableVoices.find(v => v.id === e.target.value);
    if (selectedVoice) {
      setVoice({
        id: selectedVoice.id,
        name: selectedVoice.name,
        description: selectedVoice.description,
        settings: settings
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

  const handleVoiceCreated = (newVoice: ElevenLabsVoice) => {
    setVoice({
      id: newVoice.id,
      name: newVoice.name,
      description: newVoice.description,
      settings: settings
    });
    setShowVoiceCloner(false);
    setShowVoiceDesigner(false);
    fetchVoices();
  };

  const handleVoiceSelect = (selectedVoice: ElevenLabsVoice) => {
    setVoice({
      id: selectedVoice.id,
      name: selectedVoice.name,
      description: selectedVoice.description,
      settings: settings
    });
    setShowVoiceGallery(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-foreground">
            Voice Selection
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowVoiceCloner(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:text-secondary transition-colors"
            >
              <Plus className="h-3 w-3" />
              Clone Voice
            </button>
            <button
              type="button"
              onClick={() => setShowVoiceDesigner(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:text-secondary transition-colors"
            >
              <Wand2 className="h-3 w-3" />
              Design Voice
            </button>
            <button
              type="button"
              onClick={() => setShowVoiceGallery(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:text-secondary transition-colors"
            >
              Browse All
            </button>
          </div>
        </div>

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

      {/* Voice Gallery Modal */}
      {showVoiceGallery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <VoiceGallery
              onVoiceSelect={handleVoiceSelect}
              onClose={() => setShowVoiceGallery(false)}
            />
          </div>
        </div>
      )}

      {/* Voice Cloner Modal */}
      {showVoiceCloner && (
        <VoiceCloner
          onVoiceCreated={handleVoiceCreated}
          onClose={() => setShowVoiceCloner(false)}
        />
      )}

      {/* Voice Designer Modal */}
      {showVoiceDesigner && (
        <VoiceDesigner
          onVoiceCreated={handleVoiceCreated}
          onClose={() => setShowVoiceDesigner(false)}
        />
      )}
    </div>
  );
}