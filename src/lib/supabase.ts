import { createClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const storageKey = supabaseUrl ? 'sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token' : '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please ensure VITE_SUPABASE_URL and ' +
    'VITE_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

// Create the Supabase client with configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Prefer': 'return=representation'
    }
  }
});

// Initialize session from storage
export async function initSession() {
  try {
    // Get stored session data from localStorage
    const storedSession = localStorage.getItem(storageKey);
    if (!storedSession) {
      console.log('No stored session found');
      return;
    }

    // Get current session
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    // If we have a stored session but no current session or different session, try to restore it
    if (!currentSession?.access_token && storedSession) {
      console.log('Restoring session from storage');
      const parsedSession = JSON.parse(storedSession);
      
      // First set the session
      await supabase.auth.setSession(parsedSession);
      
      // Then refresh it to ensure it's valid
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;
      await supabase.auth.setSession(parsedSession);
    }
  } catch (error) {
    console.error('Error restoring session:', error);
  }
}

// Helper to map Supabase user to our User type
export function mapSupabaseUser(user: any) {
  const now = new Date().toISOString();
  return {
    id: user.id,
    aud: user.aud || 'authenticated',
    role: user.role || 'user',
    email: user.email,
    email_confirmed_at: user.email_confirmed_at,
    phone: user.phone,
    app_metadata: user.app_metadata || {},
    user_metadata: user.user_metadata || {},
    identities: user.identities?.map((identity: any) => ({
      id: identity.id,
      user_id: identity.user_id,
      identity_data: identity.identity_data || {},
      provider: identity.provider,
      last_sign_in_at: identity.last_sign_in_at || now,
      created_at: identity.created_at || now,
      updated_at: identity.updated_at || now
    })),
    created_at: user.created_at || now,
    updated_at: user.updated_at || now
  };
}

// Handle auth state changes
export function onAuthStateChange(callback: (event: string | undefined, session: Session | null) => void): { unsubscribe: () => void; } {
  return supabase.auth.onAuthStateChange((event: string | undefined, session) => {
    console.log("Auth State Change:", event, session?.user?.id);
    callback(event, session);
  }).data.subscription;
}