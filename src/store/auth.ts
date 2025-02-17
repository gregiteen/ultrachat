import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  loading: false,
  error: null,

  init: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        set({ user: session.user, initialized: true });
      } else {
        set({ user: null, initialized: true, error: null });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to initialize auth',
        user: null,
        initialized: true
      });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found after sign in');

      set({ user: user as User });
    } catch (error) {
      console.error('Error signing in:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to sign in' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
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

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        set({ user: user as User });
      }
    } catch (error) {
      console.error('Error signing up:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to sign up' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error in Supabase signOut:', error);
        set({ error: error.message });
        return;
      }
      
      set({ user: null });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },

  setUser: (user) => {
    set({ user, initialized: true });
  }
}));