import { create } from 'zustand';
import { supabase } from '../lib/supabase-client';
import type { Integration } from '../types/integration';

interface IntegrationsState {
  integrations: Integration[];
  loading: boolean;
  error: string | null;
  fetchIntegrations: () => Promise<void>;
  addIntegration: (integration: Omit<Integration, 'id' | 'user_id'>) => Promise<void>;
  updateIntegration: (id: string, updates: Partial<Integration>) => Promise<void>;
  deleteIntegration: (id: string) => Promise<void>;
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

      set({ integrations: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching integrations:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch integrations',
        loading: false 
      });
    }
  },

  addIntegration: async (integration) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('integrations')
        .insert({
          ...integration,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create integration');

      set(state => ({
        integrations: [...state.integrations, data],
        loading: false
      }));
    } catch (error) {
      console.error('Error adding integration:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add integration',
        loading: false 
      });
      throw error;
    }
  },

  updateIntegration: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Integration not found');

      set(state => ({
        integrations: state.integrations.map(i => 
          i.id === id ? { ...i, ...data } : i
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating integration:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update integration',
        loading: false 
      });
      throw error;
    }
  },

  deleteIntegration: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        integrations: state.integrations.filter(i => i.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting integration:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete integration',
        loading: false 
      });
      throw error;
    }
  }
}));