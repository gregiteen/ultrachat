import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Context } from '../types';
import { createQuery } from '../lib/db';

interface ContextState {
  contexts: Context[];
  activeContext: Context | null;
  loading: boolean;
  error: string | null;
  fetchContexts: () => Promise<void>;
  createContext: (name: string, content: string) => Promise<void>;
  updateContext: (id: string, updates: Partial<Context>) => Promise<void>;
  deleteContext: (id: string) => Promise<void>;
  setActiveContext: (context: Context | null) => void;
}

export const useContextStore = create<ContextState>((set, get) => ({
  contexts: [],
  activeContext: null,
  loading: false,
  error: null,

  fetchContexts: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const result = await createQuery<Context>(supabase, 'contexts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .execute();

      if (result.error) throw result.error;

      const contexts = result.data as Context[];
      set({ contexts });

      // Set first context as active if none is selected
      if (!get().activeContext && contexts.length > 0) {
        set({ activeContext: contexts[0] });
      }
    } catch (error) {
      console.error('Error fetching contexts:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch contexts' });
    } finally {
      set({ loading: false });
    }
  },

  createContext: async (name: string, content: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const newContext: Partial<Context> = {
        name,
        ai_name: name,
        content,
        user_id: user.id,
        voice: {
          name: 'Default Voice',
          settings: {
            stability: 0.75,
            similarity_boost: 0.75
          }
        }
      };

      const result = await createQuery<Context>(supabase, 'contexts')
        .insert(newContext)
        .select('*')
        .single()
        .execute();

      if (result.error) throw result.error;

      const contexts = [...get().contexts, result.data as Context];
      set({ contexts });
    } catch (error) {
      console.error('Error creating context:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create context' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateContext: async (id: string, updates: Partial<Context>) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const result = await createQuery<Context>(supabase, 'contexts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*')
        .single()
        .execute();

      if (result.error) throw result.error;

      const updatedContext = result.data as Context;
      const contexts = get().contexts.map(context =>
        context.id === id ? updatedContext : context
      );

      set({ contexts });

      // Update active context if it was the one modified
      if (get().activeContext?.id === id) {
        set({ activeContext: updatedContext });
      }
    } catch (error) {
      console.error('Error updating context:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update context' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteContext: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const result = await createQuery<Context>(supabase, 'contexts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .execute();

      if (result.error) throw result.error;

      const contexts = get().contexts.filter(context => context.id !== id);
      set({ contexts });

      // Clear active context if it was the one deleted
      if (get().activeContext?.id === id) {
        set({ activeContext: contexts[0] || null });
      }
    } catch (error) {
      console.error('Error deleting context:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete context' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  setActiveContext: (context: Context | null) => {
    set({ activeContext: context });
  }
}));