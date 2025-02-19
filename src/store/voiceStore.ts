import { create } from 'zustand';
import { elevenlabs, Voice, VoiceAgent, VoiceSettings } from '../lib/elevenlabs';

interface VoiceState {
  voices: Voice[];
  agents: VoiceAgent[];
  selectedVoiceId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchVoices: () => Promise<void>;
  createAgent: (voice: Voice, personality: VoiceAgent['personality'], conversation: VoiceAgent['conversation']) => Promise<void>;
  deleteAgent: (agentId: string) => Promise<void>;
  setSelectedVoice: (voiceId: string | null) => void;
  getVoiceSettings: (voiceId: string) => Promise<VoiceSettings>;
  updateVoiceSettings: (voiceId: string, settings: VoiceSettings) => Promise<void>;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  voices: [],
  agents: [],
  selectedVoiceId: null,
  isLoading: false,
  error: null,

  fetchVoices: async () => {
    set({ isLoading: true, error: null });
    try {
      const voices = await elevenlabs.getVoices();
      set({ voices, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch voices',
        isLoading: false,
      });
    }
  },

  createAgent: async (voice, personality, conversation) => {
    set({ isLoading: true, error: null });
    try {
      const agent = await elevenlabs.createVoiceAgent(voice, personality, conversation);
      set((state) => ({
        agents: [...state.agents, agent],
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to create agent',
        isLoading: false,
      });
    }
  },

  deleteAgent: async (agentId) => {
    set({ isLoading: true, error: null });
    try {
      const agent = await elevenlabs.getVoiceAgent(agentId);
      if (agent) {
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== agentId),
          isLoading: false,
        }));
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete agent',
        isLoading: false,
      });
    }
  },

  setSelectedVoice: (voiceId) => {
    set({ selectedVoiceId: voiceId });
  },

  getVoiceSettings: async (voiceId) => {
    try {
      return await elevenlabs.getVoiceSettings(voiceId);
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch voice settings',
      });
      throw err;
    }
  },

  updateVoiceSettings: async (voiceId, settings) => {
    set({ isLoading: true, error: null });
    try {
      await elevenlabs.editVoiceSettings(voiceId, settings);
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update voice settings',
        isLoading: false,
      });
      throw err;
    }
  },
}));