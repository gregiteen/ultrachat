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
  ensureSession: () => Promise<{ session: any; user: User }>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Helper to ensure session is valid and user is set
  const ensureSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No valid session found');
    }
    localStorage.setItem('supabase-auth-token', session.access_token);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No user found in session');
    }
    return { session, user };
  };

  return {
    user: null,
    initialized: false,
    loading: false,
    error: null,
    ensureSession,

    init: async () => {
      set({ loading: true, error: null });
      try {
        const { user } = await ensureSession();
        set({ user: user as User, initialized: true, loading: false });
      } catch (error) {
        // Not logged in or session invalid
        set({ 
          user: null,
          initialized: true,
          loading: false,
          error: null // Don't show error for normal "not logged in" state
        });
        console.log('No active session found');
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
        
        const { user } = await ensureSession();
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

        try {
          const { user } = await ensureSession();
          set({ user: user as User });
        } catch (error) {
          // Expected - new users need to verify email
          set({ 
            user: null,
            error: 'Please check your email for verification link'
          });
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
        
        // Clear auth tokens
        const tokenKey = 'sb-pahtzlskmauifledecwz-auth-token';
        localStorage.removeItem(tokenKey);
        sessionStorage.removeItem(tokenKey);
        localStorage.removeItem('ultrachat-auth-token'); // Remove old token format too
        localStorage.removeItem('supabase-auth-token');
        
        // Sign out from Supabase
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Error in Supabase signOut:', error);
          set({ error: error.message });
          return;
        }
        
        // Reset all state
        set({ 
          user: null,
          error: null,
          loading: false,
          initialized: true
        });
      } catch (error) {
        console.error('Error signing out:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to sign out',
          loading: false
        });
      }
    },

    setUser: (user) => {
      set({ user, initialized: true });
    }
  };
});