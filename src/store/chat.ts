import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getChatModel } from '../lib/gemini';
import type { Message, Thread } from '../types';
import { debounce } from '../lib/utils';
import { QueryBuilder } from '../lib/db';

// Helper function to safely handle response text
const getResponseText = (response: { text: () => string } | null | undefined): string => {
  if (!response?.text) return '';
  try {
    const text = response.text();
    return text || '';
  } catch {
    return '';
  }
};

// Helper function to safely join message parts
const joinMessageParts = (parts: (string | null | undefined)[]): string => {
  return parts
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join('');
};

// LRU Cache implementation with improved type safety
class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: K): V | null {
    const value = this.cache.get(key);
    if (!value) return null;
    
    // Move accessed item to the end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Remove the first item (least recently used)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Custom error types for better error handling
class ChatError extends Error {
  constructor(
    message: string,
    public code: 'AUTH_ERROR' | 'NETWORK_ERROR' | 'DATABASE_ERROR' | 'FILE_ERROR' | 'CACHE_ERROR',
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

// Helper for user-friendly error messages
const getErrorMessage = (error: unknown): string => {
  if (error instanceof ChatError) {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred. Please try again.';
};

// Message store type definitions
interface MessageState {
  messages: Message[];
  messageCache: LRUCache<string, Message[]>;
  hasMoreMessages: boolean;
  currentPage: number;
  loading: boolean;
  sendingMessage: boolean;
  error: string | null;
  streamingMessageId: string | null;
  fetchMessages: (threadId: string, page?: number) => Promise<void>;
  sendMessage: (content: string, files?: string[], contextId?: string) => Promise<void>;
  clearThreadMessages: (threadId: string) => void;
  updateStreamingMessage: (content: string) => void;
  prefetchNextPage: (threadId: string) => Promise<void>;
}

const MESSAGES_PER_PAGE = 25;
const CACHE_SIZE = 10;

// Create the message store first so we can use it in the thread store
export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  messageCache: new LRUCache<string, Message[]>(CACHE_SIZE),
  hasMoreMessages: true,
  currentPage: 1,
  loading: false,
  sendingMessage: false,
  error: null,
  streamingMessageId: null,

  fetchMessages: async (threadId: string, page = 1) => {
    set({ loading: true, error: null });
    try {
      // Check cache first
      if (page === 1) {
        const cachedMessages = get().messageCache.get(threadId);
        if (cachedMessages) {
          set({ messages: cachedMessages, loading: false });
          // Prefetch next page in background
          get().prefetchNextPage(threadId);
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new ChatError(
        'Please sign in to view messages.',
        'AUTH_ERROR'
      );

      const offset = (page - 1) * MESSAGES_PER_PAGE;
      
      const { data, error, count } = await QueryBuilder
        .from(supabase, 'messages')
        .select('*', { count: 'exact' })
        .eq('thread_id', threadId)
        .order('created_at', { ascending: false })
        .range(offset, offset + MESSAGES_PER_PAGE - 1);

      if (error) throw new ChatError(
        'Failed to load messages. Please check your connection.',
        'DATABASE_ERROR',
        true
      );

      const hasMore = count ? offset + MESSAGES_PER_PAGE < count : false;
      const fetchedMessages = (data || []).reverse();

      // Update cache and state
      const existingMessages = page === 1 ? [] : get().messages;
      const newMessages = [...existingMessages, ...fetchedMessages];
      
      if (page === 1 && newMessages.length > 0) {
        get().messageCache.put(threadId, newMessages);
      }

      set({
        messages: newMessages,
        hasMoreMessages: hasMore,
        currentPage: page
      });

      // Prefetch next page if available
      if (hasMore) {
        get().prefetchNextPage(threadId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ error: getErrorMessage(error) });
    } finally {
      set({ loading: false });
    }
  },

  prefetchNextPage: async (threadId: string) => {
    const { currentPage, hasMoreMessages, loading } = get();
    if (!hasMoreMessages || loading) return;

    const nextPage = currentPage + 1;
    const offset = (nextPage - 1) * MESSAGES_PER_PAGE;

    try {
      const { data } = await QueryBuilder
        .from(supabase, 'messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: false })
        .range(offset, offset + MESSAGES_PER_PAGE - 1);

      if (data && data.length > 0) {
        // Store in cache for later use
        const existingMessages = get().messages;
        const prefetchedMessages = [...existingMessages, ...data.reverse()];
        get().messageCache.put(threadId, prefetchedMessages);
      }
    } catch (error) {
      console.error('Error prefetching messages:', error);
      // Don't set error state for prefetch failures
      // as they're not critical to the user experience
      // but log for monitoring
      console.warn('Prefetch failed:', getErrorMessage(error));
    }
  },

  clearThreadMessages: (threadId: string) => {
    get().messageCache.clear();
    if (threadId === useThreadStore.getState().currentThreadId) {
      set({ messages: [] });
    }
  },

  updateStreamingMessage: (content: string) => {
    const { messages, streamingMessageId } = get();
    if (!streamingMessageId || !content) return;

    const updatedMessages = messages.map(msg =>
      msg.id === streamingMessageId ? { ...msg, content } : msg
    );
    
    set({ messages: updatedMessages });
  },

  sendMessage: async (content: string, files?: string[], contextId?: string) => {
    set({ sendingMessage: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new ChatError('Please sign in to send messages.', 'AUTH_ERROR');

      let threadId = useThreadStore.getState().currentThreadId;

      if (!threadId) {
        const { data: thread, error: threadError } = await QueryBuilder
          .from(supabase, 'threads')
          .insert({
            id: crypto.randomUUID(),
            user_id: user.id,
            context_id: contextId,
            title: 'New Conversation'
          })
          .select()
          .single();

        if (threadError) throw new ChatError(
          'Failed to create new conversation. Please try again.',
          'DATABASE_ERROR',
          true
        );
        threadId = thread!.id;
        useThreadStore.getState().switchThread(threadId);
      }

      // Get context if provided
      let contextContent = '';
      if (contextId) {
        const { data: context } = await QueryBuilder
          .from(supabase, 'contexts')
          .select('content')
          .eq('id', contextId)
          .single();

        if (context?.content) {
          contextContent = `Context: ${context.content}\n\n`;
        }
      }

      // Insert user message with optimistic update
      const optimisticMessage = {
        id: crypto.randomUUID(),
        content,
        role: 'user',
        thread_id: threadId,
        user_id: user.id,
        context_id: contextId,
        files: files || [],
        created_at: new Date().toISOString(),
      } as Message;

      // Optimistic update
      const updatedMessages = [...get().messages, optimisticMessage];
      set({ messages: updatedMessages });

      const { data: userMessage, error: userError } = await QueryBuilder
        .from(supabase, 'messages')
        .insert({
          content,
          role: 'user',
          thread_id: threadId,
          user_id: user.id,
          context_id: contextId,
          files: files || []
        })
        .select('*, files')
        .single();

      if (userError) throw new ChatError(
        'Failed to send message. Please try again.',
        'DATABASE_ERROR',
        true
      );

      // Update cache
      get().messageCache.put(threadId, updatedMessages);

      // Handle AI response
      const model = getChatModel();
      let fileContent = '';
      
      if (files?.length) {
        for (const filePath of files) {
          try {
            const { data: fileData } = await supabase.storage
              .from('user-uploads')
              .download(filePath);

            if (fileData) {
              const fileText = await fileData.text();
              if (filePath.match(/\.(txt|md|csv|json|xml)$/)) {
                fileContent += `\n\nContent of ${filePath}:\n${fileText.substring(0, 2000)}\n`;
              } else {
                fileContent += `\n\nUploaded file: ${filePath} (Type: ${fileData.type})\n`;
              }
            }
          } catch (error) {
            console.error('Error processing file:', filePath, error);
            throw new ChatError(
              `Failed to process file: ${filePath}. Please try uploading again.`,
              'FILE_ERROR'
            );
          }
        }
      }

      const chat = model.startChat();
      const messageText = joinMessageParts([contextContent, content, fileContent]);
      const result = await chat.sendMessage(messageText);
      const response = getResponseText(result.response);

      if (!response) {
        throw new ChatError(
          'No response received from AI. Please try again.',
          'NETWORK_ERROR',
          true
        );
      }

      const { data: aiMessage, error: aiError } = await QueryBuilder
        .from(supabase, 'messages')
        .insert({
          content: response,
          role: 'assistant',
          thread_id: threadId,
          user_id: user.id,
          context_id: contextId,
          files: []
        })
        .select()
        .single();

      if (aiError) throw new ChatError(
        'Failed to receive AI response. Please try again.',
        'DATABASE_ERROR',
        true
      );

      // Update messages and cache with AI response
      const finalMessages = [...get().messages, aiMessage!];
      get().messageCache.put(threadId, finalMessages);
      set({ messages: finalMessages });

    } catch (error) {
      console.error('Error in chat:', error);
      set({ error: getErrorMessage(error) });
      throw error;
    } finally {
      set({ sendingMessage: false });
    }
  }
}));

// Thread store type definitions
interface ThreadState {
  threads: Thread[];
  loading: boolean;
  error: string | null;
  currentThreadId: string | null;
  fetchThreads: () => Promise<void>;
  switchThread: (threadId: string) => Promise<void>;
  renameThread: (threadId: string, title: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  togglePinThread: (threadId: string) => Promise<void>;
}

export const useThreadStore = create<ThreadState>((set, get) => ({
  threads: [],
  loading: false,
  error: null,
  currentThreadId: null,

  fetchThreads: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new ChatError(
        'Please sign in to continue.',
        'AUTH_ERROR'
      );

      const { data, error } = await QueryBuilder
        .from(supabase, 'threads')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) throw new ChatError(
        'Failed to load your conversations. Please check your connection.',
        'DATABASE_ERROR',
        true
      );

      const sortedThreads = [...(data || [])].sort((a, b) => {
        return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || 
               new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

      set({ threads: sortedThreads });
    } catch (error) {
      console.error('Error fetching threads:', error);
      set({ error: getErrorMessage(error) });
    } finally {
      set({ loading: false });
    }
  },

  switchThread: async (threadId: string) => {
    set({ currentThreadId: threadId });
    useMessageStore.getState().fetchMessages(threadId);
  },

  renameThread: async (threadId: string, title: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new ChatError(
        'Please sign in to rename this conversation.',
        'AUTH_ERROR'
      );

      const { error } = await QueryBuilder
        .from(supabase, 'threads')
        .update({ title })
        .eq('id', threadId)
        .eq('user_id', user.id);

      if (error) throw new ChatError(
        'Failed to rename conversation. Please try again.',
        'DATABASE_ERROR',
        true
      );

      set({
        threads: get().threads.map(thread =>
          thread.id === threadId ? { ...thread, title } : thread
        )
      });
    } catch (error) {
      console.error('Error renaming thread:', error);
      throw error;
    }
  },

  deleteThread: async (threadId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new ChatError(
        'Please sign in to delete this conversation.',
        'AUTH_ERROR'
      );

      const { error } = await QueryBuilder
        .from(supabase, 'threads')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', threadId)
        .eq('user_id', user.id);

      if (error) throw new ChatError(
        'Failed to delete conversation. Please try again.',
        'DATABASE_ERROR',
        true
      );

      set({
        threads: get().threads.filter(thread => thread.id !== threadId)
      });
      useMessageStore.getState().clearThreadMessages(threadId);
    } catch (error) {
      console.error('Error deleting thread:', error);
      throw error;
    }
  },

  togglePinThread: async (threadId: string) => {
    try {
      const thread = get().threads.find(t => t.id === threadId);
      if (!thread) throw new ChatError(
        'Conversation not found. It may have been deleted.',
        'DATABASE_ERROR',
        false
      );

      const { error } = await QueryBuilder
        .from(supabase, 'threads')
        .update({ pinned: !thread.pinned })
        .eq('id', threadId);

      if (error) throw new ChatError(
        'Failed to update conversation pin status. Please try again.',
        'DATABASE_ERROR'
      );

      const updatedThreads = get().threads.map(t =>
        t.id === threadId ? { ...t, pinned: !t.pinned } : t
      ).sort((a, b) => {
        return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || 
               new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

      set({ threads: updatedThreads });
    } catch (error) {
      console.error('Error toggling thread pin:', error);
      throw error;
    }
  }
}));