import { create } from 'zustand';
import type { User } from '../types';
import { supabase, mapSupabaseUser } from '../lib/supabase';
import type { AuthError } from '@supabase/supabase-js';

interface SupabaseError {
  error?: {
    message: string;
  };
}

interface AuthState {
  user: User | null;
  initialized: boolean;
  loading: boolean;
  loadingType: 'init' | 'signin' | 'signup' | 'signout' | null;
  error: string | null;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  ensureSession: () => Promise<{ session: any; user: User }>;
}

// Helper to clear auth tokens
const clearAuthTokens = () => {
  const tokenKeys = [
    'sb-pahtzlskmauifledecwz-auth-token',
  ].forEach(key => localStorage.removeItem(key));
};

export const useAuthStore = create<AuthState>((set, get) => {
  // Helper to ensure session is valid and user is set
  const ensureSession = async () => {
    console.log('Auth - Ensuring session validity');
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Auth - Got session:', session ? 'yes' : 'no');

    if (!session?.access_token) {
      clearAuthTokens();
      throw new Error('No valid session found');
    }

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    console.log('Auth - Got user:', supabaseUser?.id || 'no');

    if (!supabaseUser) {
      clearAuthTokens();
      throw new Error('No supabaseUser found in session. Please sign in again.');
    }
    
    const now = new Date().toISOString();
    const user: User = {
      id: supabaseUser.id,
      aud: supabaseUser.aud || 'authenticated',
      role: supabaseUser.role || 'user',
      email: supabaseUser.email,
      email_confirmed_at: supabaseUser.email_confirmed_at,
      phone: supabaseUser.phone,
      app_metadata: supabaseUser.app_metadata || {},
      user_metadata: supabaseUser.user_metadata || {}, 
      identities: supabaseUser.identities?.map(identity => ({
        id: identity.id,
        user_id: identity.user_id,
        identity_data: identity.identity_data || {},
        provider: identity.provider,
        last_sign_in_at: identity.last_sign_in_at || now,
        created_at: identity.created_at || now,
        updated_at: identity.updated_at || now
      })),
      created_at: supabaseUser.created_at || now,
      updated_at: supabaseUser.updated_at || now
    };
    return { session, user };
  };

  return {
    user: null,
    initialized: false,
    loading: false,
    loadingType: null,
    error: null,
    ensureSession,

    init: async () => {
      // Reset state first
      set({
        user: null,
        initialized: false,
        loading: true,
        loadingType: null,
        error: null
      });

      try {
        console.log('Auth - Starting initialization');
        const { data: { session } } = await supabase.auth.getSession();
        
        // Just check if we have a session
        const user = session?.user ? mapSupabaseUser(session.user) : null;
        set({ 
          user,
          initialized: true,
          error: null,
          loading: false,
          loadingType: null
        });
        console.log('Auth - Initialization complete');
      } catch (error) {
        console.error('Auth - Init error:', error);
        set({ 
          user: null,
          initialized: true,
          error: null,
          loading: false,
          loadingType: null
        });
      }
    },

    signIn: async (email: string, password: string) => {
      try {
        console.log('Auth - Starting sign in process');
        set({ loading: true, loadingType: 'signin', error: null, initialized: false });
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        try {
          // Wait a moment for session to be established
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const { session, user } = await ensureSession();
          set({ 
            user: user,
            error: null,
            loading: false,
            loadingType: null,
            initialized: true
          });
          console.log('Auth - Sign in successful');
        } catch (sessionError) {
          console.error('Auth - Session error after sign in:', sessionError);
          clearAuthTokens();
          throw new Error('Failed to establish session. Please try again.');
        }
      } catch (error) {
        const err = error as Error | AuthError | SupabaseError;
        const errorMessage = (err as SupabaseError).error?.message || (err instanceof Error ? err.message : 'Failed to sign in');
        console.error('Auth - Sign in error:', errorMessage);
        clearAuthTokens();
        set({ error: errorMessage, user: null, loading: false, loadingType: null, initialized: true });
        throw error;
      }
    },

    signUp: async (email: string, password: string) => {
      try {
        console.log('Auth - Starting sign up process');
        set({ loading: true, loadingType: 'signup', error: null, initialized: false });
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

        // New users need to verify email
        console.log('Auth - Sign up successful, verification email sent');
        set({ 
          user: null,
          error: null,
          loading: false,
          loadingType: null,
          initialized: true
        });
        return; // Let the UI handle the verification message
      } catch (error) {
        const err = error as Error | AuthError | SupabaseError;
        const errorMessage = (err as SupabaseError).error?.message || (err instanceof Error ? err.message : 'Failed to sign up');
        console.error('Auth - Sign up error:', errorMessage);
        set({ 
          error: errorMessage,
          loading: false,
          loadingType: null,
          initialized: true
        });
        throw error;
      }
    },

    signOut: async () => {
      try {
        console.log('Auth - Starting sign out process');
        set({ loading: true, loadingType: 'signout', error: null, initialized: false });
        
        // Clear auth tokens first
        clearAuthTokens();
        
        // Sign out from Supabase
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Auth - Error in Supabase signOut:', error);
          set({ error: error.message, loading: false });
          return;
        }
        
        // Clear session storage
        window.sessionStorage.clear();
        console.log('Auth - Session storage cleared');
        
        // Reset all state
        set({ 
          user: null,
          error: null,
          loading: false,
          loadingType: null,
          initialized: false // Reset initialized state to trigger fresh init on next login
        });
        
        console.log('Auth - Sign out completed');
      } catch (error) {
        console.error('Auth - Error signing out:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to sign out',
          loading: false,
          loadingType: null,
          initialized: true
        });
        throw error; // Re-throw to allow handling by UI
      }
    },

    setUser: (user) => {
      console.log('Auth - Setting user:', user?.id || 'null');
      set({ 
        user,
        initialized: true,
        loading: false,
        loadingType: null
      });
    }
  };
});