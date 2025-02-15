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
    detectSessionInUrl: true
  }
});

export function onAuthStateChange(callback: (event: string, session: Session | null) => void): { unsubscribe: () => void } {
     return supabase.auth.onAuthStateChange((event, session) => {
        console.log("AUTH STATE CHANGE", event, session)
        if (event === 'SIGNED_OUT') {
            useAuthStore.getState().setUser(null);
        } else if (event === 'SIGNED_IN' || event === "TOKEN_REFRESHED") {
            useAuthStore.getState().setUser(session?.user ?? null);
        }
        callback(event, session);
     }).data.subscription;
}