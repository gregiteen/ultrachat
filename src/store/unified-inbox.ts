import { create } from 'zustand';
import { supabase } from '../lib/supabase-client';
import type { UnifiedMessage } from '../types';

interface UnifiedInboxState {
  messages: UnifiedMessage[];
  loading: boolean;
  error: string | null;
  fetchMessages: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
}

export const useUnifiedInboxStore = create<UnifiedInboxState>((set) => ({
  messages: [],
  loading: false,
  error: null,

  fetchMessages: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('unified_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ messages: (data as UnifiedMessage[] | null) || [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('unified_messages')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        messages: state.messages.map((m) => (m.id === id ? data : m)),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  deleteMessage: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('unified_messages')
        .delete()
        .eq('user_id', user.id)
        .eq('id', id);

      if (error) throw error;
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== id),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },
}));