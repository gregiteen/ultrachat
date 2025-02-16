import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../lib/supabase-client';
import { usePersonalizationStore } from './personalization';

interface AuthState {
  user: User | null;
  initialized: boolean;
  setInitialized: (value: boolean) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: (onSuccess?: () => void) => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  return {
    initialized: false,
    setInitialized: (value: boolean) => set({ initialized: value }),
    user: null,
    loading: true,
    setLoading: (value: boolean) => set({ loading: value }),
  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      const { data: { user } } = await supabase.auth.getUser();
      set({ user: user as User });
    } finally {
      set({ loading: false });
    }
  },
  signUp: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            email,
          },
        },
      });
      if (error) throw error;
    } finally {
      set({ loading: false });
    }
  },
  signOut: async (onSuccess) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signOut();
      set({ loading: false });
      if (error) throw error;
      usePersonalizationStore.getState().setInitialized(false);
      set({ user: null });
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error signing out:', error);
      // Ensure loading is set to false even on error
      set({ loading: false });
    }
  },
  setUser: (user) => set({ user, loading: false }),
  };
});