import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Context } from '../types';
import type { Track, Playlist } from '../types/audio';
import type { PersonalInfo } from '../types/personalization';

interface PersonalizationState {
  contexts: Context[];
  initialized: boolean;
  loading: boolean;
  error: string | null;
  activeContext: Context | null;
  currentTrack: Track | null;
  queue: Track[];
  personalInfo: PersonalInfo;
  personalInfoInitialized: boolean;
  playlists: Playlist[];
  setActiveContext: (context: Context | null) => void;
  setCurrentTrack: (track: Track | null) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  createPlaylist: (name: string) => Promise<void>;
  addToPlaylist: (playlistId: string, track: Track) => Promise<void>;
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  createContext: (name: string, content: string) => Promise<void>;
  updateContext: (id: string, updates: Partial<Context>) => Promise<void>;
  deleteContext: (id: string) => Promise<void>;
  loadContexts: () => Promise<void>;
  updatePersonalInfo: (updates: Partial<PersonalInfo>) => Promise<void>;
  loadPersonalInfo: () => Promise<void>;
}

export const usePersonalizationStore = create<PersonalizationState>((set, get) => ({
  contexts: [],
  initialized: false,
  loading: false,
  error: null,
  activeContext: null,
  currentTrack: null,
  personalInfo: {
    name: '',
    preferences: [],
    interests: [],
    communication_style: '',
    learning_style: '',
    expertise_areas: [],
    voice_settings: null
  },
  queue: [],
  personalInfoInitialized: false,
  playlists: [],

  setActiveContext: (context) => set({ activeContext: context }),

  setCurrentTrack: (track) => set({ currentTrack: track }),

  addToQueue: (track) => set(state => ({
    queue: [...state.queue, track]
  })),

  removeFromQueue: (trackId) => set(state => ({
    queue: state.queue.filter(track => track.id !== trackId)
  })),

  clearQueue: () => set({ queue: [] }),

  createPlaylist: async (name) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('playlists')
        .insert([
          {
            user_id: user.id,
            name,
            tracks: [],
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;

      set(state => ({
        playlists: [...state.playlists, data[0]]
      }));
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw error;
    }
  },

  addToPlaylist: async (playlistId, track) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const playlist = get().playlists.find(p => p.id === playlistId);
      if (!playlist) throw new Error('Playlist not found');

      const { error } = await supabase
        .from('playlists')
        .update({
          tracks: [...playlist.tracks, track]
        })
        .eq('id', playlistId)
        .eq('user_id', user.id);

      if (error) throw error;

      set(state => ({
        playlists: state.playlists.map(p =>
          p.id === playlistId
            ? { ...p, tracks: [...p.tracks, track] }
            : p
        )
      }));
    } catch (error) {
      console.error('Error adding to playlist:', error);
      throw error;
    }
  },

  removeFromPlaylist: async (playlistId, trackId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const playlist = get().playlists.find(p => p.id === playlistId);
      if (!playlist) throw new Error('Playlist not found');

      const { error } = await supabase
        .from('playlists')
        .update({
          tracks: playlist.tracks.filter(t => t.id !== trackId)
        })
        .eq('id', playlistId)
        .eq('user_id', user.id);

      if (error) throw error;

      set(state => ({
        playlists: state.playlists.map(p =>
          p.id === playlistId
            ? { ...p, tracks: p.tracks.filter(t => t.id !== trackId) }
            : p
        )
      }));
    } catch (error) {
      console.error('Error removing from playlist:', error);
      throw error;
    }
  },

  createContext: async (name, content) => {
    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('contexts')
        .insert([
          {
            user_id: user.id,
            name,
            content,
            is_active: true
          }
        ])
        .select();

      if (error) throw error;

      set(state => ({
        contexts: [...state.contexts, data[0]]
      }));
    } catch (error) {
      console.error('Error creating context:', error);
      set({ error: 'Failed to create context' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateContext: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('contexts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      set(state => ({
        contexts: state.contexts.map(context =>
          context.id === id ? { ...context, ...updates } : context
        )
      }));
    } catch (error) {
      console.error('Error updating context:', error);
      set({ error: 'Failed to update context' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteContext: async (id) => {
    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('contexts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      set(state => ({
        contexts: state.contexts.filter(context => context.id !== id),
        activeContext: state.activeContext?.id === id ? null : state.activeContext
      }));
    } catch (error) {
      console.error('Error deleting context:', error);
      set({ error: 'Failed to delete context' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadContexts: async () => {
    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: contexts, error } = await supabase
        .from('contexts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      set({
        contexts,
        initialized: true,
        activeContext: contexts.find(context => context.is_active) || null
      });
    } catch (error) {
      console.error('Error loading contexts:', error);
      set({ error: 'Failed to load contexts' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updatePersonalInfo: async (updates) => {
    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_personalization')
        .upsert({
          user_id: user.id,
          ...get().personalInfo,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      set(state => ({
        personalInfo: {
          ...state.personalInfo,
          ...updates
        }
      }));
    } catch (error) {
      console.error('Error updating personal info:', error);
      set({ error: 'Failed to update personal info' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadPersonalInfo: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_personalization')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      set({ personalInfo: data || get().personalInfo, personalInfoInitialized: true });
    } catch (error) {
      console.error('Error loading personal info:', error);
      set({ error: 'Failed to load personal info' });
    }
  }
}));