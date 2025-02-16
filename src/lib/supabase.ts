import { usePersonalizationStore } from '../store/personalization';
import { useAuthStore } from '../store/auth';
import { supabase } from './supabase-client';
import type { Session } from '@supabase/supabase-js';

// Re-export supabase client
export { supabase };

// Initialize auth state
supabase.auth.getSession().then(({ data: { session } }) => {
  console.log('Initial session:', session);
  if (!session) {
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setInitialized(true);
    useAuthStore.getState().setLoading(false);
  } else {
    useAuthStore.getState().setUser(session.user);
    useAuthStore.getState().setInitialized(true);
    useAuthStore.getState().setLoading(false);
  }
});

export function onAuthStateChange(callback: (event: string | undefined, session: Session | null) => void): { unsubscribe: () => void; } {

    return supabase.auth.onAuthStateChange((event: string | undefined, session) => {
        console.log("AUTH STATE CHANGE", event, session)
        if (typeof event === 'string' && event === 'SIGNED_OUT') {
            useAuthStore.getState().setUser(null);
            usePersonalizationStore.getState().setInitialized(false);
            useAuthStore.getState().setInitialized(true);
            callback(event, session);
        } else if (typeof event === 'string' && (event === 'SIGNED_IN' || event === "TOKEN_REFRESHED")) {
            useAuthStore.getState().setUser(session?.user ?? null);
            usePersonalizationStore.getState().setInitialized(true);
            useAuthStore.getState().setInitialized(true);
            callback(event, session);
        }
    }).data.subscription;
}