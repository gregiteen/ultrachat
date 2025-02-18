import { createClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create the Supabase client with configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token',
    storage: window.localStorage, // Use local storage for better persistence
  },
  global: {
    headers: {
      'X-Client-Info': 'ultrachat-bolt',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Prefer': 'return=representation'
    }
  }
});

// Handle auth state changes
export function onAuthStateChange(callback: (event: string | undefined, session: Session | null) => void): { unsubscribe: () => void; } {
  return supabase.auth.onAuthStateChange((event: string | undefined, session) => {
    localStorage.setItem('sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token', session?.access_token || '');
    console.log("AUTH STATE CHANGE", event, session);
    callback(event, session);
  }).data.subscription;
}