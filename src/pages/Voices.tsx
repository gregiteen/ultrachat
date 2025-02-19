import React, { useEffect, useState } from 'react';
import { useVoiceStore } from '../store/voiceStore';
import { VoiceAgentManager } from '../components/voice/VoiceAgentManager';
import { VoiceSettings } from '../lib/elevenlabs';
import { useToastStore } from '../store/toastStore';

const Voices: React.FC = () => {
  const {
    voices,
    agents,
    isLoading,
    error,
    fetchVoices,
    getVoiceSettings,
    updateVoiceSettings,
  } = useVoiceStore();

  const { showToast } = useToastStore();
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [settings, setSettings] = useState<VoiceSettings | null>(null);

  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  useEffect(() => {
    if (selectedVoice) {
      getVoiceSettings(selectedVoice)
        .then(setSettings)
        .catch(() => {
          showToast({
            message: 'Failed to load voice settings',
            type: 'error',
          });
        });
    } else {
      setSettings(null);
    }
  }, [selectedVoice, getVoiceSettings, showToast]);

  const handleSettingsUpdate = async () => {
    if (!selectedVoice || !settings) return;

    try {
      await updateVoiceSettings(selectedVoice, settings);
      showToast({
        message: 'Voice settings updated successfully',
        type: 'success',
      });
    } catch (err) {
      showToast({
        message: 'Failed to update voice settings',
        type: 'error',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Voice Management</h1>
        {isLoading && (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <VoiceAgentManager />
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Voice Settings</h2>
            <select
              className="w-full px-3 py-2 border rounded mb-4"
              value={selectedVoice || ''}
              onChange={(e) => setSelectedVoice(e.target.value || null)}
            >
              <option value="">Select a voice</option>
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>

            {settings && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Stability ({settings.stability})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.stability}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        stability: parseFloat(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Similarity Boost ({settings.similarity_boost})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.similarity_boost}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        similarity_boost: parseFloat(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Speaker Boost
                  </label>
                  <input
                    type="checkbox"
                    checked={settings.use_speaker_boost || false}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        use_speaker_boost: e.target.checked,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Streaming Latency Optimization
                  </label>
                  <select
                    value={settings.optimize_streaming_latency || 0}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        optimize_streaming_latency: parseInt(e.target.value) as 0 | 1 | 2 | 3 | 4,
                      })
                    }
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value={0}>None</option>
                    <option value={1}>Level 1</option>
                    <option value={2}>Level 2</option>
                    <option value={3}>Level 3</option>
                    <option value={4}>Maximum</option>
                  </select>
                </div>

                <button
                  onClick={handleSettingsUpdate}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Save Settings
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Active Agents</h2>
            {agents.length === 0 ? (
              <p className="text-gray-500">No active voice agents</p>
            ) : (
              <ul className="space-y-2">
                {agents.map((agent) => (
                  <li
                    key={agent.id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <span>{agent.voice.name}</span>
                    <span className="text-sm text-gray-500">
                      {agent.personality.type}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Voices;