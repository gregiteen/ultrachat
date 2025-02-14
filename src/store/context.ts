import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Context } from '../types';

interface ContextState {
  contexts: Context[];
  activeContext: Context | null;
  defaultContext: Context | null;
  loading: boolean;
  error: string | null;
  fetchContexts: () => Promise<void>;
  createContext: (name: string, content: string, files?: string[]) => Promise<void>;
  updateContext: (id: string, updates: Partial<Context> & { files?: string[] }) => Promise<void>;
  deleteContext: (id: string) => Promise<void>;
  setActiveContext: (context: Context | null) => Promise<void>;
  setDefaultContext: (context: Context | null) => Promise<void>;
}

export const useContextStore = create<ContextState>((set, get) => ({
  contexts: [],
  activeContext: null,
  defaultContext: null,
  loading: false,
  error: null,

  fetchContexts: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch contexts and active context state
      const [contextsResponse, activeContextResponse] = await Promise.all([
        supabase
          .from('contexts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('user_settings')
          .select('settings->active_context_id')
          .eq('user_id', user.id)
          .single()
      ]);

      if (contextsResponse.error) throw contextsResponse.error;
      
      const contexts = contextsResponse.data || [];
      const activeContextId = activeContextResponse.data?.settings?.active_context_id;
      
      // Find active and default contexts
      const activeContext = contexts.find(c => c.id === activeContextId);
      const defaultContext = contexts.find(c => c.is_default);
      
      // Use active context from settings, or default context, or first context
      const effectiveActiveContext = activeContext || defaultContext || contexts[0] || null;
      
      set({ 
        contexts,
        activeContext: effectiveActiveContext,
        defaultContext: defaultContext || null
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  createContext: async (name: string, content: string, files?: string[]) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // If this is the first context, make it the default
      const isFirst = get().contexts.length === 0;

      const { data, error } = await supabase
        .from('contexts')
        .insert([{
          name,
          content,
          user_id: user.id,
          files: files || [],
          is_default: isFirst,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Update active context in user settings
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: {
            active_context_id: data.id
          }
        });

      set((state) => ({
        contexts: [data, ...state.contexts],
        activeContext: data,
        defaultContext: isFirst ? data : state.defaultContext
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  updateContext: async (id: string, updates: Partial<Context> & { files?: string[] }) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('contexts')
        .update({
          ...updates,
          files: updates.files || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        contexts: state.contexts.map((c) => (c.id === id ? data : c)),
        activeContext: state.activeContext?.id === id ? data : state.activeContext,
        defaultContext: updates.is_default ? data : (state.defaultContext?.id === id ? null : state.defaultContext)
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  deleteContext: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get context files before deletion
      const { data: context } = await supabase
        .from('contexts')
        .select('files')
        .eq('id', id)
        .single();

      // Delete files from storage if they exist
      if (context?.files?.length) {
        const filePaths = context.files.map(fileName => `${user.id}/files/${fileName}`);
        await supabase.storage
          .from('context-files')
          .remove(filePaths);
      }

      const { error } = await supabase
        .from('contexts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      set((state) => {
        const remainingContexts = state.contexts.filter((c) => c.id !== id);
        const wasDefault = state.defaultContext?.id === id;
        const wasActive = state.activeContext?.id === id;
        
        // If we deleted the active context, set the default or first available as active
        const newActiveContext = wasActive ? (remainingContexts[0] || null) : state.activeContext;
        const newDefaultContext = wasDefault ? (remainingContexts[0] || null) : state.defaultContext;

        // Update active context in user settings if needed
        if (wasActive && newActiveContext) {
          supabase
            .from('user_settings')
            .upsert({
              user_id: user.id,
              settings: {
                active_context_id: newActiveContext.id
              }
            })
            .then(() => {
              console.log('Active context updated in settings after deletion');
            })
            .catch(console.error);
        }

        return {
          contexts: remainingContexts,
          activeContext: newActiveContext,
          defaultContext: newDefaultContext
        };
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  setActiveContext: async (context) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update active context in user settings
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: {
            active_context_id: context?.id || null
          }
        });

      set({ activeContext: context });
    } catch (error) {
      console.error('Error setting active context:', error);
    }
  },

  setDefaultContext: async (context) => {
    if (!context) return;
    
    try {
      await get().updateContext(context.id, { is_default: true });
      set({ defaultContext: context });
    } catch (error) {
      console.error('Error setting default context:', error);
    }
  },
}));