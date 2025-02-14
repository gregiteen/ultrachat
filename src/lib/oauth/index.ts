import { supabase } from '../supabase';

const OAUTH_CONFIGS = {
  gmail: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/gmail.modify'],
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  },
  google_calendar: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/calendar'],
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  },
  slack: {
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: ['chat:write', 'channels:read'],
    clientId: import.meta.env.VITE_SLACK_CLIENT_ID,
  },
  zoom: {
    authUrl: 'https://zoom.us/oauth/authorize',
    tokenUrl: 'https://zoom.us/oauth/token',
    scopes: ['meeting:write', 'user:read'],
    clientId: import.meta.env.VITE_ZOOM_CLIENT_ID,
  },
};

export async function initiateOAuth(type: keyof typeof OAUTH_CONFIGS) {
  const config = OAUTH_CONFIGS[type];
  if (!config) throw new Error(`Unsupported integration type: ${type}`);

  // Generate and store state parameter to prevent CSRF
  const state = crypto.randomUUID();
  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('oauth_type', type);

  // Build OAuth URL
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${window.location.origin}/oauth/callback`,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
  });

  // Open OAuth window
  window.open(`${config.authUrl}?${params.toString()}`, '_blank');
}

export async function handleOAuthCallback(code: string, state: string) {
  // Verify state parameter
  const storedState = sessionStorage.getItem('oauth_state');
  const integrationType = sessionStorage.getItem('oauth_type');
  
  if (!storedState || !integrationType || state !== storedState) {
    throw new Error('Invalid OAuth state');
  }

  // Clear stored state
  sessionStorage.removeItem('oauth_state');
  sessionStorage.removeItem('oauth_type');

  // Exchange code for tokens using Supabase Edge Function
  const { data: tokens, error } = await supabase.functions.invoke('oauth-token-exchange', {
    body: { code, type: integrationType },
  });

  if (error) throw error;

  // Store the integration
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error: integrationError } = await supabase
    .from('integrations')
    .upsert({
      user_id: user.id,
      type: integrationType,
      status: 'connected',
      credentials: tokens,
      last_synced: new Date().toISOString(),
    });

  if (integrationError) throw integrationError;

  return { success: true };
}