import { create } from 'zustand';
import { elevenlabs } from '../lib/elevenlabs';
import type { Track } from '../types/audio';

interface AudioState {
  currentTrack: Track | null;
  currentVoice: Track | null;
  queue: Track[];
  voiceQueue: Track[];
  activeBlobs: Map<string, string>; // Track blob URLs for cleanup
  isPlaying: boolean;
  isVoicePlaying: boolean;
  musicVolume: number;
  voiceVolume: number;
  isMuted: boolean;
  addToQueue: (track: Track) => void;
  addToVoiceQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  removeFromVoiceQueue: (trackId: string) => void;
  stopPlayback: (trackId: string) => void;
  stopVoicePlayback: (trackId: string) => void;
  playTextToSpeech: (text: string, messageId: string) => Promise<void>;
  setVolumes: (music: number, voice: number) => void;
  setMuted: (muted: boolean) => void;
  clearQueue: () => void;
  setIsPlaying: (playing: boolean) => void;
  setIsVoicePlaying: (playing: boolean) => void;
}

export const useAudioStore = create<AudioState>((set, get) => {
  // Helper function to clean up blob URLs
  const cleanupBlobUrl = (trackId: string): boolean => {
    const state = get();
    const blobUrl = state.activeBlobs.get(trackId);
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      state.activeBlobs.delete(trackId);
      return true;
    }
    return false;
  };

  // Helper function to ensure volume is within bounds
  const normalizeVolume = (volume: number): number => 
    Math.max(0, Math.min(1, volume));

  return {
    currentTrack: null,
    currentVoice: null,
    queue: [],
    voiceQueue: [],
    activeBlobs: new Map(),
    isPlaying: false,
    isVoicePlaying: false,
    musicVolume: 0.5,
    voiceVolume: 1.0,
    isMuted: false,

    setVolumes: (music: number, voice: number) => {
      set({ 
        musicVolume: normalizeVolume(music), 
        voiceVolume: normalizeVolume(voice)
      });
    },

    setMuted: (muted: boolean) => {
      set({ isMuted: muted });
    },

    setIsPlaying: (playing: boolean) => {
      set({ isPlaying: playing });
    },

    setIsVoicePlaying: (playing: boolean) => {
      set({ isVoicePlaying: playing });
    },

    addToQueue: (track: Track) => {
      set(state => ({
        queue: [...state.queue, track],
        currentTrack: state.currentTrack || track,
        isPlaying: true
      }));
    },

    addToVoiceQueue: (track: Track) => {
      set(state => ({
        voiceQueue: [...state.voiceQueue, track],
        currentVoice: state.currentVoice || track,
        isVoicePlaying: true
      }));
    },

    removeFromQueue: (trackId: string) => {
      const state = get();
      const wasCurrentTrack = state.currentTrack?.id === trackId;
      
      // Clean up resources
      cleanupBlobUrl(trackId);

      set(state => ({
        queue: state.queue.filter(t => t.id !== trackId),
        currentTrack: wasCurrentTrack ? null : state.currentTrack,
        isPlaying: wasCurrentTrack ? false : state.isPlaying
      }));
    },

    removeFromVoiceQueue: (trackId: string) => {
      const state = get();
      const wasCurrentVoice = state.currentVoice?.id === trackId;
      
      // Clean up resources
      cleanupBlobUrl(trackId);

      set(state => ({
        voiceQueue: state.voiceQueue.filter(t => t.id !== trackId),
        currentVoice: wasCurrentVoice ? null : state.currentVoice,
        isVoicePlaying: wasCurrentVoice ? false : state.isVoicePlaying
      }));
    },

    stopPlayback: (trackId: string) => {
      const state = get();
      const wasCurrentTrack = state.currentTrack?.id === trackId;
      
      // Clean up resources
      cleanupBlobUrl(trackId);

      if (wasCurrentTrack) {
        set(state => ({
          isPlaying: false,
          currentTrack: null,
          queue: state.queue.filter(t => t.id !== trackId)
        }));
      }
    },

    stopVoicePlayback: (trackId: string) => {
      const state = get();
      const wasCurrentVoice = state.currentVoice?.id === trackId;
      
      // Clean up resources
      cleanupBlobUrl(trackId);

      if (wasCurrentVoice) {
        set(state => ({
          isVoicePlaying: false,
          currentVoice: null,
          voiceQueue: state.voiceQueue.filter(t => t.id !== trackId)
        }));
      }
    },

    playTextToSpeech: async (text: string, messageId: string) => {
      const state = get();
      let newBlobUrl: string | undefined;

      try {
        // Stop any existing playback for this message
        if (state.activeBlobs.has(messageId)) {
          state.stopVoicePlayback(messageId);
        }

        // Get audio blob from ElevenLabs
        const audioBlob = await elevenlabs.textToSpeech({
          text,
          voice_id: 'EXAVITQu4vr4xnSDxMaL', // Default voice
          output_format: 'mp3_44100_128'
        });

        if (!(audioBlob instanceof Blob)) {
          throw new Error('Invalid audio response');
        }

        // Create object URL for the blob
        newBlobUrl = URL.createObjectURL(audioBlob);
        state.activeBlobs.set(messageId, newBlobUrl);

        // Create track object
        const track: Track = {
          id: messageId,
          title: text.slice(0, 50) + '...',
          artist: 'AI Assistant',
          duration: 0, // Will be set when audio loads
          source: 'tts',
          url: newBlobUrl,
          isPlaying: true,
          addedAt: new Date()
        };

        // Add to queue and start playing
        state.addToVoiceQueue(track);

      } catch (error) {
        console.error('Error playing text to speech:', error);
        
        // Clean up resources on error
        if (newBlobUrl) {
          URL.revokeObjectURL(newBlobUrl);
        }
        if (state.currentVoice?.id === messageId) {
          state.stopVoicePlayback(messageId);
        }
        
        throw error;
      }
    },

    clearQueue: () => {
      const state = get();
      // Clean up all blob URLs
      state.activeBlobs.forEach(url => URL.revokeObjectURL(url));
      state.activeBlobs.clear();
      
      set({ 
        queue: [],
        voiceQueue: [],
        currentTrack: null,
        currentVoice: null,
        isPlaying: false,
        isVoicePlaying: false
      });
    }
  };
});