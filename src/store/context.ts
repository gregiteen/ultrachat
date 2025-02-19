/**
 * Context Store
 * 
 * Note: While this is technically the "context" system in the code,
 * we present it to users as the "assistant" system in the UI.
 * The term "context" is used internally for technical/historical reasons,
 * but all user-facing labels should use "assistant" terminology.
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabase-client';
import type { Context } from '../types';
import { createQuery } from '../lib/db';

interface ContextState {
  contexts: Context[];
  activeContext: Context | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  setInitialized: (value: boolean) => void;
  fetchContexts: () => Promise<void>;
  createContext: (name: string, content: string) => Promise<void>;
  updateContext: (id: string, updates: Partial<Context>) => Promise<void>;
  deleteContext: (id: string) => Promise<void>;
  setActiveContext: (context: Context | null) => void;
}

// Prevent concurrent fetches
let isFetching = false;

export const useContextStore = create<ContextState>((set, get) => ({
  contexts: [],
  activeContext: null,
  loading: false,
  initialized: false,
  error: null,

  fetchContexts: async () => {
    if (isFetching) {
      console.log('Context store - Already fetching contexts, waiting...');
      while (isFetching) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    isFetching = true;
    set({ loading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Try to create default context directly
      const defaultContext: Partial<Context> = {
        name: 'Default Assistant',
        ai_name: 'Default Assistant',
        content: 'I am a helpful AI assistant.',
        user_id: user.id,
        is_active: true,
        voice: {
          name: 'Default Voice',
          settings: {
            stability: 0.75,
            similarity_boost: 0.75
          }
        }
      };

      const createResult = await createQuery<Context>(supabase, 'contexts')
        .insert(defaultContext)
        .select('*')
        .single()
        .execute();

      if (!createResult.error) {
        set({ 
          contexts: [createResult.data as Context],
          activeContext: createResult.data as Context,
          initialized: true,
          loading: false,
          error: null
        });
        return;
      }

      // If insert failed, try to fetch existing contexts
      const result = await createQuery<Context>(supabase, 'contexts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .execute();

      if (result.error) throw result.error;

      const contexts = result.data as Context[];
      
      // Set first context as active if none is selected
      const activeContext = get().activeContext || (contexts.length > 0 ? contexts[0] : null);
      
      set({ 
        contexts,
        activeContext,
        initialized: true,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching contexts:', error);
      // Set initialized even on error to prevent hanging
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch contexts',
        contexts: [],
        activeContext: null,
        initialized: true,
        loading: false
      });
    } finally {
      isFetching = false;
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
        is_active: true,
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

      // First, update any threads and messages that reference this context
      const updateThreads = await createQuery(supabase, 'threads')
        .update({ context_id: null })
        .eq('context_id', id)
        .eq('user_id', user.id)
        .execute();
      
      if (updateThreads.error) throw updateThreads.error;
      
      const updateMessages = await createQuery(supabase, 'messages')
        .update({ context_id: null })
        .eq('context_id', id)
        .eq('user_id', user.id)
        .execute();
      
      if (updateMessages.error) throw updateMessages.error;

      // Delete the context
      const result = await createQuery<Context>(supabase, 'contexts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .execute();

      if (result.error) throw result.error;

      const contexts = get().contexts.filter(context => context.id !== id);
      set({ contexts });
      
      // Update active context if needed
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
  },

  setInitialized: (value: boolean) => {
    set({ initialized: value });
  }
}));