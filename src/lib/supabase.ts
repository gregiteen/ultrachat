import { usePersonalizationStore } from '../store/personalization';
import { createClient } from '@supabase/supabase-js';
import { useAuthStore } from '../store/auth';
import type { Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  }
});

export function onAuthStateChange(callback: (event: string | undefined, session: Session | null) => void): { unsubscribe: () => void; } {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Anon Key:', supabaseAnonKey);
  
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session);
      if (!session) {
        useAuthStore.getState().setUser(null);
      } else {
        useAuthStore.getState().setUser(session.user);
      }
    });

    return supabase.auth.onAuthStateChange((event: string | undefined, session) => {
        console.log("AUTH STATE CHANGE", event, session)
        if (typeof event === 'string' && event === 'SIGNED_OUT') {
            useAuthStore.getState().setUser(null);
            usePersonalizationStore.getState().setInitialized(false);
            callback(event, session);
        } else if (typeof event === 'string' && (event === 'SIGNED_IN' || event === "TOKEN_REFRESHED")) {
            useAuthStore.getState().setUser(session?.user ?? null);
            usePersonalizationStore.getState().setInitialized(true);
            callback(event, session);
        }
    }).data.subscription;
}