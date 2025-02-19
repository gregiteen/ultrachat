import React, { useState, useEffect, useCallback } from 'react';
import { elevenlabs, Voice, VoiceAgent as VoiceAgentType, VoiceSettings } from '../../lib/elevenlabs';

interface VoiceAgentProps {
  voiceId?: string;
  onAgentCreated?: (agent: VoiceAgentType) => void;
}

export const VoiceAgent: React.FC<VoiceAgentProps> = ({ voiceId, onAgentCreated }) => {
  const [voice, setVoice] = useState<Voice | null>(null);
  const [agent, setAgent] = useState<VoiceAgentType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch voice data if voiceId is provided
  useEffect(() => {
    if (voiceId) {
      elevenlabs.getVoiceById(voiceId)
        .then(setVoice)
        .catch(err => setError(err.message));
    }
  }, [voiceId]);

  const createAgent = useCallback(async () => {
    if (!voice) return;
    
    setIsCreating(true);
    setError(null);

    try {
      const newAgent = await elevenlabs.createVoiceAgent(
        voice,
        {
          type: 'assistant',
          traits: ['helpful', 'friendly', 'professional'],
          context: 'An AI assistant helping users with their tasks',
        },
        {
          flows: [
            {
              trigger: 'hello',
              response: 'Hello! How can I assist you today?',
            },
            {
              trigger: 'thank you',
              response: "You're welcome! Is there anything else I can help you with?",
            },
          ],
          fallbacks: [
            "I'm here to help. What would you like to know?",
            "I didn't quite catch that. Could you please rephrase?",
          ],
        }
      );

      setAgent(newAgent);
      onAgentCreated?.(newAgent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create voice agent');
    } finally {
      setIsCreating(false);
    }
  }, [voice, onAgentCreated]);

  const speak = useCallback(async (text: string) => {
    if (!agent) return;

    try {
      const audioStream = await elevenlabs.agentSpeak(agent.id, text);
      if (audioStream instanceof ReadableStream) {
        // Handle streaming audio
        const audioContext = new AudioContext();
        const source = audioContext.createBufferSource();
        
        // Convert stream to audio buffer
        const reader = audioStream.getReader();
        const chunks: Uint8Array[] = [];
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        
        const blob = new Blob(chunks, { type: 'audio/mpeg' });
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
      } else {
        // Handle non-streaming audio (Blob)
        const audio = new Audio(URL.createObjectURL(audioStream));
        audio.play();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate speech');
    }
  }, [agent]);

  return (
    <div className="p-4 space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {voice && !agent && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Voice: {voice.name}</h3>
          <button
            onClick={createAgent}
            disabled={isCreating}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isCreating ? 'Creating Agent...' : 'Create Voice Agent'}
          </button>
        </div>
      )}

      {agent && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Agent: {agent.voice.name}</h3>
            <span className="text-sm text-gray-500">ID: {agent.id}</span>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Personality</h4>
            <div className="flex flex-wrap gap-2">
              {agent.personality.traits.map((trait, index) => (
                <span
                  key={index}
                  className="bg-gray-100 px-2 py-1 rounded text-sm"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Test Speech</h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter text to speak..."
                className="flex-1 px-3 py-2 border rounded"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    speak((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input') as HTMLInputElement;
                  speak(input.value);
                  input.value = '';
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                Speak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};