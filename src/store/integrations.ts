import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Integration } from '../types';

interface IntegrationsState {
  integrations: Integration[];
  loading: boolean;
  error: string | null;
  fetchIntegrations: () => Promise<void>;
  connectIntegration: (type: Integration['type']) => Promise<void>;
  disconnectIntegration: (type: Integration['type']) => Promise<void>;
  addCustomIntegration: (data: {
    name: string;
    endpoint: string;
    apiKey: string;
  }) => Promise<void>;
  testCustomIntegration: (id: string) => Promise<void>;
  deleteCustomIntegration: (id: string) => Promise<void>;
  refreshToken: (integrationId: string) => Promise<void>;
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

  connectIntegration: async (type) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Initialize OAuth flow based on integration type
      const authWindow = window.open('', '_blank');
      if (!authWindow) throw new Error('Popup blocked');

      // Handle OAuth callback and token exchange
      const handleCallback = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.type !== 'oauth_callback') return;

        const { code } = event.data;
        
        // Exchange code for tokens
        const { data, error } = await supabase
          .from('integrations')
          .upsert({
            user_id: user.id,
            type,
            status: 'connected',
            credentials: {
              // TODO: Exchange code for actual tokens
              access_token: 'temp_token',
              refresh_token: 'temp_refresh_token',
              expires_at: Date.now() + 3600000,
              scope: [],
            },
          })
          .select()
          .single();

        if (error) throw error;
        
        await get().fetchIntegrations();
        window.removeEventListener('message', handleCallback);
      };

      window.addEventListener('message', handleCallback);
      
      // TODO: Implement proper OAuth flow for each provider
      authWindow.location.href = `https://example.com/oauth/${type}`;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
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
            api_key: apiKey // Note: In production, encrypt this!
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

      // Test the endpoint
      const response = await fetch(integration.settings.endpoint, {
        headers: {
          Authorization: `Bearer ${integration.settings.api_key}`,
        },
      });

      if (!response.ok) throw new Error('API test failed');

      // Update last tested timestamp
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
      // Update status to error
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

      // TODO: Implement token refresh logic for each provider
      const { error } = await supabase
        .from('integrations')
        .update({
          credentials: {
            ...integration.credentials,
            access_token: 'new_token',
            expires_at: Date.now() + 3600000,
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
}));