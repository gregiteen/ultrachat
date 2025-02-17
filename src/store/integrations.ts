import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Integration } from '../types';
import { initiateGmailOAuth, exchangeGmailCode, refreshGmailToken } from '../lib/oauth/gmail';
import { initiateCalendarOAuth, exchangeCalendarCode, refreshCalendarToken } from '../lib/oauth/calendar';
import { GmailExecutor } from '../lib/agents/executors/gmail';
import { CalendarExecutor } from '../lib/agents/executors/calendar';

interface IntegrationsState {
  integrations: Integration[];
  loading: boolean;
  error: string | null;
  fetchIntegrations: () => Promise<void>;
  connectIntegration: (type: Integration['type'], config?: { name?: string; apiKey?: string }) => Promise<void>;
  disconnectIntegration: (type: Integration['type']) => Promise<void>;
  addCustomIntegration: (data: {
    name: string;
    endpoint: string;
    apiKey: string;
  }) => Promise<void>;
  testCustomIntegration: (id: string) => Promise<void>;
  deleteCustomIntegration: (id: string) => Promise<void>;
  refreshToken: (integrationId: string) => Promise<void>;
  connectGmail: () => Promise<void>;
  connectOutlook: () => Promise<void>;
  getGmailExecutor: () => Promise<GmailExecutor | null>;
  connectCalendar: () => Promise<void>;
  getCalendarExecutor: () => Promise<CalendarExecutor | null>;
}

export const useIntegrationsStore = create<IntegrationsState>((set, get) => ({
  integrations: [],
  loading: false,
  error: null,

  fetchIntegrations: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      set({ integrations: data || [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  connectIntegration: async (type, config) => {
    // Handle OAuth-based integrations
    if (['gmail', 'google_calendar', 'outlook'].includes(type)) {
      switch (type) {
        case 'gmail':
          return get().connectGmail();
        case 'google_calendar':
          return get().connectCalendar();
        case 'outlook':
          return get().connectOutlook();
      }
    }

    // Handle API key-based integrations
    if (config?.apiKey) {
      set({ loading: true, error: null });
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
          .from('integrations')
          .upsert({
            user_id: user.id,
            type,
            status: 'connected',
            settings: {
              name: config.name || 'UltraChat',
              api_key: config.apiKey
            },
            last_synced: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        await get().fetchIntegrations();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'An error occurred' });
      } finally {
        set({ loading: false });
      }
      return;
    }

    throw new Error(`Invalid integration configuration for type: ${type}`);
  },

  disconnectIntegration: async (type) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('user_id', user.id)
        .eq('type', type);

      if (error) throw error;
      await get().fetchIntegrations();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  addCustomIntegration: async ({ name, endpoint, apiKey }) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('integrations')
        .insert({
          user_id: user.id,
          type: 'custom',
          status: 'connected',
          settings: {
            name,
            endpoint,
            api_key: apiKey
          }
        })
        .select()
        .single();

      if (error) throw error;
      await get().fetchIntegrations();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  testCustomIntegration: async (id) => {
    set({ loading: true, error: null });
    try {
      const integration = get().integrations.find(i => i.id === id);
      if (!integration?.settings?.endpoint) {
        throw new Error('Invalid integration');
      }

      const response = await fetch(integration.settings.endpoint, {
        headers: {
          Authorization: `Bearer ${integration.settings.api_key}`,
        },
      });

      if (!response.ok) throw new Error('API test failed');

      const { error } = await supabase
        .from('integrations')
        .update({
          last_synced: new Date().toISOString(),
          status: 'connected'
        })
        .eq('id', id);

      if (error) throw error;
      await get().fetchIntegrations();
    } catch (error) {
      await supabase
        .from('integrations')
        .update({
          status: 'error'
        })
        .eq('id', id);

      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  deleteCustomIntegration: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id)
        .eq('type', 'custom');

      if (error) throw error;
      await get().fetchIntegrations();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  refreshToken: async (integrationId) => {
    set({ loading: true, error: null });
    try {
      const integration = get().integrations.find(i => i.id === integrationId);
      if (!integration?.credentials?.refresh_token) {
        throw new Error('No refresh token available');
      }

      let newCredentials;
      switch (integration.type) {
        case 'gmail':
          newCredentials = await refreshGmailToken(integration.credentials.refresh_token);
          break;
        case 'google_calendar':
          newCredentials = await refreshCalendarToken(integration.credentials.refresh_token);
          break;
        default:
          throw new Error(`Unsupported integration type: ${integration.type}`);
      }

      const { error } = await supabase
        .from('integrations')
        .update({
          credentials: {
            ...integration.credentials,
            ...newCredentials,
          },
        })
        .eq('id', integrationId);

      if (error) throw error;
      await get().fetchIntegrations();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  connectGmail: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const authUrl = await initiateGmailOAuth();
      const authWindow = window.open(authUrl, '_blank');
      if (!authWindow) throw new Error('Popup blocked');

      const handleCallback = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.type !== 'oauth_callback') return;

        const { code } = event.data;
        const credentials = await exchangeGmailCode(code);

        const { error } = await supabase
          .from('integrations')
          .upsert({
            user_id: user.id,
            type: 'gmail',
            status: 'connected',
            credentials,
          })
          .select()
          .single();

        if (error) throw error;
        
        await get().fetchIntegrations();
        window.removeEventListener('message', handleCallback);
      };

      window.addEventListener('message', handleCallback);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  connectCalendar: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const authUrl = await initiateCalendarOAuth();
      const authWindow = window.open(authUrl, '_blank');
      if (!authWindow) throw new Error('Popup blocked');

      const handleCallback = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.type !== 'oauth_callback') return;

        const { code } = event.data;
        const credentials = await exchangeCalendarCode(code);

        const { error } = await supabase
          .from('integrations')
          .upsert({
            user_id: user.id,
            type: 'google_calendar',
            status: 'connected',
            credentials,
          })
          .select()
          .single();

        if (error) throw error;
        
        await get().fetchIntegrations();
        window.removeEventListener('message', handleCallback);
      };

      window.addEventListener('message', handleCallback);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  connectOutlook: async () => {
    // TODO: Implement Outlook OAuth flow
    throw new Error('Outlook integration not implemented yet');
  },

  getGmailExecutor: async () => {
    const integration = get().integrations.find(i => i.type === 'gmail');
    if (!integration?.credentials) return null;

    // Check if token needs refresh
    if (integration.credentials.expires_at < Date.now()) {
      await get().refreshToken(integration.id);
      // Get updated integration after refresh
      const updatedIntegration = get().integrations.find(i => i.type === 'gmail');
      if (!updatedIntegration?.credentials) return null;
      return new GmailExecutor(updatedIntegration.credentials);
    }

    return new GmailExecutor(integration.credentials);
  },

  getCalendarExecutor: async () => {
    const integration = get().integrations.find(i => i.type === 'google_calendar');
    if (!integration?.credentials) return null;

    // Check if token needs refresh
    if (integration.credentials.expires_at < Date.now()) {
      await get().refreshToken(integration.id);
      // Get updated integration after refresh
      const updatedIntegration = get().integrations.find(i => i.type === 'google_calendar');
      if (!updatedIntegration?.credentials) return null;
      return new CalendarExecutor(updatedIntegration.credentials);
    }

    return new CalendarExecutor(integration.credentials);
  },
}));