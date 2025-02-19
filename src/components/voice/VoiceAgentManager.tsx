import React, { useState, useEffect } from 'react';
import { elevenlabs, Voice, VoiceAgent as VoiceAgentType } from '../../lib/elevenlabs';
import { VoiceAgent } from './VoiceAgent';

export const VoiceAgentManager: React.FC = () => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [agents, setAgents] = useState<VoiceAgentType[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available voices on component mount
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const availableVoices = await elevenlabs.getVoices();
        setVoices(availableVoices);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch voices');
        setIsLoading(false);
      }
    };

    fetchVoices();
  }, []);

  const handleAgentCreated = (newAgent: VoiceAgentType) => {
    setAgents(prev => [...prev, newAgent]);
    setSelectedVoiceId(null); // Reset selection after creation
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const agent = await elevenlabs.getVoiceAgent(agentId);
      if (agent) {
        // Remove the agent
        setAgents(prev => prev.filter(a => a.id !== agentId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Voice Agents</h2>
        {voices.length > 0 && !selectedVoiceId && (
          <div className="flex items-center gap-2">
            <select
              className="px-3 py-2 border rounded"
              value={selectedVoiceId || ''}
              onChange={(e) => setSelectedVoiceId(e.target.value || null)}
            >
              <option value="">Select a voice</option>
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button
            className="float-right"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {selectedVoiceId && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h3 className="font-medium">Create New Agent</h3>
          </div>
          <VoiceAgent
            voiceId={selectedVoiceId}
            onAgentCreated={handleAgentCreated}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div key={agent.id} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
              <h3 className="font-medium">{agent.voice.name}</h3>
              <button
                onClick={() => handleDeleteAgent(agent.id)}
                className="text-red-500 hover:text-red-600"
              >
                Delete
              </button>
            </div>
            <VoiceAgent voiceId={agent.voice.id} />
          </div>
        ))}
      </div>

      {agents.length === 0 && !selectedVoiceId && (
        <div className="text-center py-8 text-gray-500">
          No voice agents created yet. Select a voice to create one.
        </div>
      )}
    </div>
  );
};