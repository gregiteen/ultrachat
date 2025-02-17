import React, { useState, useEffect } from 'react';
import { elevenlabs, type Voice, type VoiceDesign, type VoiceSettings } from '../../lib/elevenlabs';
import { Spinner } from '../../design-system/components/feedback/Spinner';

interface VoiceDesignerProps {
  onVoiceCreated?: (voice: Voice) => void;
  onClose?: () => void;
}

export function VoiceDesigner({ onVoiceCreated, onClose }: VoiceDesignerProps) {
  const [name, setName] = useState('');
  const [design, setDesign] = useState<VoiceDesign>({
    age: 30,
    gender: 'neutral',
    accent: 'neutral',
    accent_strength: 0.5,
    tempo: 1.0,
    pitch: 1.0,
  });
  const [settings, setSettings] = useState<VoiceSettings>({
    stability: 0.75,
    similarity_boost: 0.75,
    style: 0.5,
    use_speaker_boost: true,
    optimize_streaming_latency: 2,
  });
  const [previewText, setPreviewText] = useState('Hello! This is a preview of how I will sound.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Clean up audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const validateDesignValue = (field: keyof VoiceDesign, value: unknown): boolean => {
    switch (field) {
      case 'age':
        return typeof value === 'number' && value >= 1 && value <= 100;
      case 'gender':
        return value === 'male' || value === 'female' || value === 'neutral';
      case 'accent':
        return typeof value === 'string' && value.length <= 50;
      case 'accent_strength':
      case 'tempo':
      case 'pitch':
        return typeof value === 'number' && value >= 0 && value <= 2;
      default:
        return true;
    }
  };

  const handleDesignChange = (field: keyof VoiceDesign, value: unknown) => {
    if (!validateDesignValue(field, value)) {
      setError(`Invalid value for ${field}`);
      return;
    }
    setError(null);
    setDesign(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateSettingsValue = (field: keyof VoiceSettings, value: unknown): boolean => {
    if (field === 'optimize_streaming_latency') {
      return typeof value === 'number' && value >= 0 && value <= 4;
    }
    return typeof value === 'number' && value >= 0 && value <= 1;
  };

  const handleSettingsChange = (field: keyof VoiceSettings, value: unknown) => {
    if (!validateSettingsValue(field, value)) return;
    setSettings(prev => ({
      ...prev,
      [field]: value as number
    }));
  };

  const generatePreview = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      if (!name.trim() || !previewText.trim()) {
        setError('Name and preview text are required');
        return;
      }
      
      // First generate the voice
      const voice = await elevenlabs.generateVoice({
        name,
        text: previewText,
        design,
      });

      if (!voice?.id) {
        throw new Error('Failed to generate voice');
      }

      // Then generate a preview using the new voice
      setIsLoadingAudio(true);
      const audioBlob = await elevenlabs.textToSpeech({
        text: previewText,
        voice_id: voice.id,
        voice_settings: settings,
      }) as Blob;

      // Clean up old audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      // Create new audio URL
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // Only notify parent if we successfully generated both voice and audio
      if (voice && audioBlob) {
        onVoiceCreated?.(voice);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate voice preview');
    } finally {
      setIsGenerating(false);
      setIsLoadingAudio(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background border border-muted rounded-lg max-w-2xl">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Voice Designer</h2>
        
        {/* Basic Info */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Voice Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-muted bg-input-background"
            placeholder="Enter voice name"
          />
        </div>

        {/* Voice Design Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Age</label>
            <input
              type="number"
              value={design.age}
              onChange={(e) => handleDesignChange('age', parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-md border border-muted bg-input-background"
              min={1}
              max={100}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Gender</label>
            <select
              value={design.gender}
              onChange={(e) => handleDesignChange('gender', e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-muted bg-input-background"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Accent</label>
            <input
              type="text"
              value={design.accent}
              onChange={(e) => handleDesignChange('accent', e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-muted bg-input-background"
              placeholder="e.g., British, American, etc."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Accent Strength</label>
            <input
              type="range"
              value={design.accent_strength}
              onChange={(e) => handleDesignChange('accent_strength', parseFloat(e.target.value))}
              className="w-full"
              min={0}
              max={1}
              step={0.1}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Tempo</label>
            <input
              type="range"
              value={design.tempo}
              onChange={(e) => handleDesignChange('tempo', parseFloat(e.target.value))}
              className="w-full"
              min={0.5}
              max={2.0}
              step={0.1}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Pitch</label>
            <input
              type="range"
              value={design.pitch}
              onChange={(e) => handleDesignChange('pitch', parseFloat(e.target.value))}
              className="w-full"
              min={0.5}
              max={2.0}
              step={0.1}
            />
          </div>
        </div>

        {/* Voice Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Voice Settings</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Stability</label>
              <input
                type="range"
                value={settings.stability}
                onChange={(e) => handleSettingsChange('stability', parseFloat(e.target.value))}
                className="w-full"
                min={0}
                max={1}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Similarity Boost</label>
              <input
                type="range"
                value={settings.similarity_boost}
                onChange={(e) => handleSettingsChange('similarity_boost', parseFloat(e.target.value))}
                className="w-full"
                min={0}
                max={1}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Style</label>
              <input
                type="range"
                value={settings.style}
                onChange={(e) => handleSettingsChange('style', parseFloat(e.target.value))}
                className="w-full"
                min={0}
                max={1}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Latency Optimization</label>
              <select
                value={settings.optimize_streaming_latency}
                onChange={(e) => handleSettingsChange('optimize_streaming_latency', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-md border border-muted bg-input-background"
              >
                <option value={0}>None</option>
                <option value={1}>Low</option>
                <option value={2}>Medium</option>
                <option value={3}>High</option>
                <option value={4}>Maximum</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.use_speaker_boost}
              onChange={(e) => handleSettingsChange('use_speaker_boost', e.target.checked)}
              className="rounded border-muted"
            />
            <label className="text-sm">Use Speaker Boost</label>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Preview</h3>
          
          <div className="space-y-2">
            <textarea
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-muted bg-input-background min-h-[100px]"
              placeholder="Enter text for preview..."
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          {isLoadingAudio ? <Spinner className="w-8 h-8" /> : audioUrl && (
            <audio controls className="w-full">
              <source src={audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={generatePreview}
            disabled={isGenerating || !name || !previewText}
            className="px-4 py-2 bg-primary text-button-text rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate Preview'}
          </button>
        </div>
      </div>
    </div>
  );
}