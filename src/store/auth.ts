import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { usePersonalizationStore } from './personalization';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: (onSuccess?: () => void) => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize auth state
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      set({
        user: session.user as User,
        loading: false
      });
    } else {
      set({ loading: false });
    }
  });
  
  return ({
  user: null,
  loading: true,
  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
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
  });
});