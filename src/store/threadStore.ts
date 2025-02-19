import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Thread } from '../types';
import { useMessageStore } from './messageStore';

interface ThreadState {
  threads: Thread[];
  currentThread: Thread | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  pendingOperations: Set<string>;
  hasMore: boolean;
  lastFetchedPage: number;
  cache: Map<string, Thread>;
  fetchThreads: () => Promise<void>;
  loadMoreThreads: () => Promise<void>;
  createThread: () => Promise<Thread>;
  selectThread: (threadId: string) => Promise<void>;
  renameThread: (threadId: string, title: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  pinThread: (threadId: string) => Promise<void>;
  batchUpdateThreads: (updates: Partial<Thread>[]) => Promise<void>;
}

const BATCH_SIZE = 20; // Reduced from 50 to improve initial load time

export const useThreadStore = create<ThreadState>((set, get) => {
  // Helper to handle optimistic updates
  const optimisticUpdate = (
    threadId: string,
    update: Partial<Thread>,
    revert: boolean = false
  ) => {
    set(state => ({
      threads: state.threads.map(t => 
        t.id === threadId 
          ? revert 
            ? { ...t, ...state.threads.find(ot => ot.id === threadId) }
            : { ...t, ...update }
          : t
      )
    }));
  };

  // Helper to track pending operations
  const trackOperation = (threadId: string, operation: () => Promise<void>) => {
    const state = get();
    state.pendingOperations.add(threadId);
    
    return operation().finally(() => {
      state.pendingOperations.delete(threadId);
    });
  };

  return {
    threads: [],
    currentThread: null,
    loading: false,
    error: null,
    initialized: false,
    pendingOperations: new Set(),
    hasMore: true,
    lastFetchedPage: 0,
    cache: new Map(),

    fetchThreads: async () => {
      const state = get();
      set({ loading: true, error: null });
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          set({ 
            loading: false, 
            error: null,
            initialized: true,
            threads: [],
            hasMore: false,
            lastFetchedPage: 0
          });
          return;
        }

        // Fetch first batch of threads
        let { data, error } = await supabase
          .from('threads')
          .select('*')
          .eq('user_id', user.id)
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(BATCH_SIZE);

        if (error) {
          // If table doesn't exist yet, just use empty array
          if (error.message?.includes('does not exist')) {
            set({ threads: [], initialized: true, loading: false });
            return;
          }
          throw error;
        }

        // Cache threads
        const cache = new Map<string, Thread>();
        data?.forEach(thread => cache.set(thread.id, thread as Thread));
        
        // Create initial thread if needed
        let threads = data || [];
        if (threads.length === 0) {
          const newThread = await get().createThread().catch(error => {
            console.error('Error creating initial thread:', error);
            return null;
          });
          
          if (newThread) {
            threads = [newThread];
            cache.set(newThread.id, newThread);
          }
          
        }

        set({ 
          threads: data || [],
          currentThread: data?.[0] || null,
          loading: false,
          initialized: true,
          error: null,
          hasMore: threads.length === BATCH_SIZE,
          lastFetchedPage: 1,
          cache
        });
      } catch (error) {
        console.error('Error loading threads:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load conversations',
          loading: false,
          initialized: true,
          threads: [],
          hasMore: false,
          lastFetchedPage: 0
        });
      }
    },

    loadMoreThreads: async () => {
      const state = get();
      if (!state.hasMore || state.loading) return;

      set({ loading: true, error: null });
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('threads')
          .select('*')
          .eq('user_id', user.id)
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .range(state.lastFetchedPage * BATCH_SIZE, (state.lastFetchedPage + 1) * BATCH_SIZE - 1);

        if (error) throw error;

        // Update cache
        data?.forEach(thread => state.cache.set(thread.id, thread as Thread));

        set({ 
          threads: [...state.threads, ...(data || [])],
          loading: false,
          hasMore: (data?.length || 0) === BATCH_SIZE,
          lastFetchedPage: state.lastFetchedPage + 1
        });
      } catch (error) {
        console.error('Error loading more threads:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load more conversations',
          loading: false
        });
      }
    },

    createThread: async () => {
      set({ loading: true, error: null });
      const threadId = crypto.randomUUID();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please sign in to create a new chat');
      }
      
      const newThread: Thread = {
        id: threadId,
        title: 'New Chat',
        pinned: false,
        personalization_enabled: false,
        search_enabled: false,
        tools_used: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id
      };

      // Optimistic update
      set(state => ({
        threads: [newThread, ...state.threads],
        currentThread: newThread, // Set as current thread
        cache: state.cache.set(threadId, newThread)
      }));

      try {
        const { data, error } = await supabase
          .from('threads')
          .insert(newThread)
          .select()
          .single();

        if (error) throw error;
        if (!data) throw new Error('Failed to create thread');

        const thread = data as Thread;

        // Update state with server data and ensure it's selected
        set(state => ({
          loading: false,
          threads: [thread, ...state.threads.filter(t => t.id !== threadId)],
          currentThread: thread,
          cache: state.cache.set(threadId, thread)
        }));
        return thread;
      } catch (error) {
        // Revert optimistic update
        set(state => {
          state.cache.delete(threadId);
          return {
            threads: state.threads.filter(t => t.id !== threadId),
            currentThread: state.currentThread?.id === threadId ? null : state.currentThread,
            error: error instanceof Error ? error.message : 'Failed to create new chat',
            loading: false
          };
        });
        throw error;
      }
    },

    selectThread: async (threadId: string) => {
      if (get().pendingOperations.has(threadId)) return;

      return trackOperation(threadId, async () => {
        set({ loading: true, error: null });
        try {
          // Check cache first
          const cachedThread = get().cache.get(threadId);
          if (cachedThread) {
            set({ currentThread: cachedThread, loading: false });
            return;
          }

          // Fetch from API if not in cache
          const { data, error } = await supabase
            .from('threads')
            .select('*')
            .eq('id', threadId)
            .single();

          if (error) throw error;
          if (!data) throw new Error('Thread not found');
          
          // Update cache and state
          set(state => {
            state.cache.set(threadId, data as Thread);
            return { 
              currentThread: data as Thread,
              threads: [data as Thread, ...state.threads],
              loading: false 
            };
          });
        } catch (error) {
          console.error('Error selecting thread:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to select conversation',
            loading: false 
          });
        }
      });
    },

    renameThread: async (threadId: string, title: string) => {
      if (get().pendingOperations.has(threadId)) return;

      // Optimistic update
      const originalTitle = get().threads.find(t => t.id === threadId)?.title;
      optimisticUpdate(threadId, { title });

      return trackOperation(threadId, async () => {
        try {
          const { data, error } = await supabase
            .from('threads')
            .update({ 
              title,
              updated_at: new Date().toISOString()
            })
            .eq('id', threadId)
            .select()
            .single();

          if (error) throw error;
          if (!data) throw new Error('Failed to rename thread');

          // Update cache
          get().cache.set(threadId, data as Thread);
          set({ loading: false });
        } catch (error) {
          // Revert optimistic update
          if (originalTitle) {
            optimisticUpdate(threadId, { title: originalTitle }, true);
          }
          console.error('Error renaming thread:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to rename conversation',
            loading: false 
          });
        }
      });
    },

    pinThread: async (threadId: string) => {
      if (get().pendingOperations.has(threadId)) return;

      const thread = get().threads.find(t => t.id === threadId);
      if (!thread) return;

      // Optimistic update
      optimisticUpdate(threadId, { pinned: !thread.pinned });

      return trackOperation(threadId, async () => {
        try {
          const { data, error } = await supabase
            .from('threads')
            .update({ 
              pinned: !thread.pinned,
              updated_at: new Date().toISOString()
            })
            .eq('id', threadId)
            .select()
            .single();

          if (error) throw error;
          if (!data) throw new Error('Failed to pin thread');

          // Update cache
          get().cache.set(threadId, data as Thread);
          set({ loading: false });
        } catch (error) {
          // Revert optimistic update
          optimisticUpdate(threadId, { pinned: thread.pinned }, true);
          console.error('Error pinning thread:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to pin conversation',
            loading: false 
          });
        }
      });
    },

    deleteThread: async (threadId: string) => {
      if (get().pendingOperations.has(threadId)) return;

      // Optimistic update
      const deletedThread = get().threads.find(t => t.id === threadId);
      set(state => ({
        threads: state.threads.filter(t => t.id !== threadId),
        currentThread: state.currentThread?.id === threadId ? null : state.currentThread
      }));

      return trackOperation(threadId, async () => {
        try {
          // Delete messages first
          const { error: messagesError } = await supabase
            .from('messages')
            .delete()
            .eq('thread_id', threadId);

          if (messagesError) throw messagesError;

          // Then delete the thread
          const { error: threadError } = await supabase
            .from('threads')
            .delete()
            .eq('id', threadId);

          if (threadError) throw threadError;

          // Clear messages from store and cache
          useMessageStore.getState().clearThreadMessages(threadId);
          get().cache.delete(threadId);
          set({ loading: false });
        } catch (error) {
          // Revert optimistic update
          if (deletedThread) {
            set(state => {
              state.cache.set(threadId, deletedThread);
              return {
                threads: [...state.threads, deletedThread],
                currentThread: state.currentThread?.id === threadId ? deletedThread : state.currentThread,
                error: error instanceof Error ? error.message : 'Failed to delete conversation',
                loading: false
              };
            });
          }
          console.error('Error deleting thread:', error);
        }
      });
    },

    batchUpdateThreads: async (updates: Partial<Thread>[]) => {
      const threadIds = updates.map(u => u.id).filter((id): id is string => !!id);
      if (threadIds.some(id => get().pendingOperations.has(id))) return;

      // Optimistic updates
      for (const update of updates) {
        if (update.id) {
          optimisticUpdate(update.id, update);
        }
      }

      try {
        await Promise.all(updates.map(async update => {
          if (!update.id) return;
          
          return trackOperation(update.id, async () => {
            try {
              const { data, error } = await supabase
                .from('threads')
                .update(update)
                .eq('id', update.id)
                .select()
                .single();

              if (error) throw error;
              if (data) {
                // Update cache
                get().cache.set(update.id!, data as Thread);
              }
            } catch (error) {
              // Revert optimistic update for this thread
              const originalThread = get().threads.find(t => t.id === update.id);
              if (originalThread && update.id) {
                optimisticUpdate(update.id, originalThread, true);
              }
              throw error;
            }
          });
        }));
      } catch (error) {
        console.error('Error in batch update:', error);
        throw error;
      }
    }
  };
});