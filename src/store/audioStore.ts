import { create } from 'zustand';
import { playTextToSpeech as playTTS } from '../lib/elevenlabs';

export interface Track {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  url: string;
}

interface AudioState {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  isVoicePlaying: boolean;
  playTextToSpeech: (text: string, id: string) => Promise<void>;
  togglePlayback: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  setCurrentTrack: (track: Track) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  queue: [],
  isVoicePlaying: false,

  playTextToSpeech: async (text: string, id: string) => {
    try {
      set({ isVoicePlaying: true });
      await playTTS(text, id);
    } catch (error) {
      console.error('Error playing text to speech:', error);
    } finally {
      set({ isVoicePlaying: false });
    }
  },

  togglePlayback: () => {
    set(state => ({ isPlaying: !state.isPlaying }));
  },

  nextTrack: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack) return;

    const currentIndex = queue.findIndex(track => track.id === currentTrack.id);
    if (currentIndex === -1 || currentIndex === queue.length - 1) {
      set({ currentTrack: null, isPlaying: false });
    } else {
      set({ currentTrack: queue[currentIndex + 1] });
    }
  },

  previousTrack: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack) return;

    const currentIndex = queue.findIndex(track => track.id === currentTrack.id);
    if (currentIndex <= 0) {
      set({ currentTrack: null, isPlaying: false });
    } else {
      set({ currentTrack: queue[currentIndex - 1] });
    }
  },

  addToQueue: (track: Track) => {
    set(state => ({
      queue: [...state.queue, track],
      currentTrack: state.currentTrack || track
    }));
  },

  removeFromQueue: (trackId: string) => {
    set(state => ({
      queue: state.queue.filter(track => track.id !== trackId),
      currentTrack: state.currentTrack?.id === trackId ? null : state.currentTrack
    }));
  },

  setCurrentTrack: (track: Track) => {
    set({ currentTrack: track, isPlaying: true });
  }
}));