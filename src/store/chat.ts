import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getChatModel } from '../lib/gemini';
import type { Message, Thread, MessageArray, ThreadArray } from '../types';
import { createQuery } from '../lib/db';
import { handleSearch } from '../lib/search-handler';
import { verifyDatabaseStructure } from '../lib/db-check';
import { usePersonalizationStore } from './personalization';
import type { PostgrestError } from '@supabase/supabase-js';

// Type guard functions
function isMessage(value: any): value is Message {
  return value && typeof value === 'object' && 'id' in value && 'content' in value;
}

function isThread(value: any): value is Thread {
  return value && typeof value === 'object' && 'id' in value && 'title' in value;
}

// Message store type definitions
interface MessageState {
  messages: MessageArray;
  messageCache: Map<string, MessageArray>;
  hasMoreMessages: boolean;
  currentPage: number;
  loading: boolean;
  sendingMessage: boolean;
  error: string | null;
  streamingMessageId: string | null;
  fetchMessages: (threadId: string, page?: number) => Promise<void>;
  sendMessage: (content: string, files?: string[], contextId?: string, isSystemMessage?: boolean, skipAiResponse?: boolean, forceSearch?: boolean) => Promise<void>;
  clearThreadMessages: (threadId: string) => void;
  updateStreamingMessage: (content: string) => void;
  prefetchNextPage: (threadId: string) => Promise<void>;
}

// Thread store type definitions
interface ThreadState {
  threads: ThreadArray;
  loading: boolean;
  error: string | null;
  currentThreadId: string | null;
  initialized: boolean;
  setInitialized: (value: boolean) => void;
  fetchThreads: () => Promise<void>;
  switchThread: (threadId: string) => Promise<void>;
  renameThread: (threadId: string, title: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  togglePinThread: (threadId: string) => Promise<void>;
}

// Constants
const MESSAGES_PER_PAGE = 50;

// Create the thread store first since message store depends on it
export const useThreadStore = create<ThreadState>((set, get) => ({
  threads: [],
  loading: false,
  error: null,
  currentThreadId: null,
  initialized: false,
  setInitialized: (value: boolean) => set({ initialized: value }),

  fetchThreads: async () => {
    set({ loading: true, error: null });
    try {
      // Verify database structure
      const isValid = await verifyDatabaseStructure();
      if (!isValid) {
        set({ 
          loading: false, 
          error: 'Database structure is being updated. Please wait a moment and try again.' 
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false, error: 'Please sign in to view your conversations.' });
        return;
      }

      // Fetch threads with proper context handling
      const result = await createQuery<Thread>(supabase, 'threads')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .execute();

      // If no threads found, try backup table
      if (!result.data || result.error || (Array.isArray(result.data) && result.data.length === 0)) {
        console.log('No threads found in main table, checking backup...');
        const backupResult = await createQuery<Thread>(supabase, 'threads_backup')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .execute();

        if (backupResult.data && Array.isArray(backupResult.data) && backupResult.data.length > 0) {
          console.log('Found threads in backup table');
          result.data = backupResult.data;
          
          // Copy threads from backup to main table
          for (const thread of backupResult.data) {
            await createQuery<Thread>(supabase, 'threads')
              .insert({
                ...thread,
                updated_at: new Date().toISOString()
              })
              .execute();
          }
          
          // Clear error since we found backup data
          result.error = null;
        }
      }

      if (result.error) {
        const pgError = result.error as PostgrestError;
        if (pgError?.code === '404' || pgError?.code === '42P01') {
          console.error('Error loading threads:', pgError.message);
          set({ error: 'Failed to load conversations. Please try again.', loading: false });
          return;
        }
        throw new Error('Failed to load conversations. Please try again.');
      }

      const threads = Array.isArray(result.data) ? 
        result.data
          .filter(isThread)
          .filter(t => t.id && t.title)
          .sort((a, b) => {
            if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          }) : 
        [];

      set({ threads, loading: false, error: null });
    } catch (error) {
      console.error('Error loading threads:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load conversations',
        loading: false 
      });
    }
  },

  switchThread: async (threadId: string) => {
    set({ error: null });
    
    if (!threadId) {
      set({ currentThreadId: null, error: null });
      useMessageStore.getState().clearThreadMessages('');
      return;
    }

    try {
      // Fetch messages before setting current thread to ensure they load
      await useMessageStore.getState().fetchMessages(threadId);
      set({ currentThreadId: threadId });
    } catch (error) {
      console.error('Error switching thread:', error);
      useMessageStore.getState().clearThreadMessages(threadId);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load messages',
        currentThreadId: null
      });
    }
  },

  renameThread: async (threadId: string, title: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in to rename this conversation.');

      const result = await createQuery<Thread>(supabase, 'threads')
        .update({ title })
        .eq('id', threadId)
        .eq('user_id', user.id)
        .select('*')
        .single()
        .execute();

      if (result.error) {
        const pgError = result.error as PostgrestError;
        if (pgError?.code === '404' || pgError?.code === '42P01') {
          console.warn('Threads table not yet available - this is normal during initial setup');
          return;
        }
        throw new Error('Failed to rename conversation. Please try again.');
      }

      if (!result.data || Array.isArray(result.data)) {
        throw new Error('Invalid response when renaming thread');
      }

      set({
        threads: get().threads.map(thread =>
          thread.id === threadId ? result.data : thread
        ).filter(isThread)
      });
    } catch (error) {
      console.error('Error renaming thread:', error);
      throw error;
    }
  },

  deleteThread: async (threadId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in to delete this conversation.');

      const result = await createQuery<Thread>(supabase, 'threads')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', threadId)
        .eq('user_id', user.id)
        .execute();

      if (result.error) {
        const pgError = result.error as PostgrestError;
        if (pgError?.code === '404' || pgError?.code === '42P01') {
          console.warn('Threads table not yet available - this is normal during initial setup');
          return;
        }
        throw new Error('Failed to delete conversation. Please try again.');
      }

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
      if (!thread) throw new Error('Conversation not found.');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in to update pin status.');

      const result = await createQuery<Thread>(supabase, 'threads')
        .update({ pinned: !thread.pinned })
        .eq('id', threadId)
        .eq('user_id', user.id)
        .select('*')
        .single()
        .execute();

      if (result.error) {
        const pgError = result.error as PostgrestError;
        if (pgError?.code === '404' || pgError?.code === '42P01') {
          console.warn('Threads table not yet available - this is normal during initial setup');
          return;
        }
        throw new Error('Failed to update pin status. Please try again.');
      }

      if (!result.data || Array.isArray(result.data)) {
        throw new Error('Invalid response when toggling pin');
      }

      // Update thread order
      const orderResult = await supabase.rpc('reorder_threads', {
        user_id_param: user.id
      });

      if (orderResult.error) {
        console.error('Error reordering threads:', orderResult.error);
      }

      // Refresh thread list
      await get().fetchThreads();
    } catch (error) {
      console.error('Error toggling thread pin:', error);
      throw error;
    }
  }
}));

// Create the message store
export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  messageCache: new Map(),
  hasMoreMessages: true,
  currentPage: 1,
  loading: false,
  sendingMessage: false,
  error: null,
  streamingMessageId: null,

  fetchMessages: async (threadId: string, page = 1) => {
    set({ loading: true, error: null });
    try {
      // Verify database structure
      const isValid = await verifyDatabaseStructure();
      if (!isValid) {
        set({ 
          loading: false, 
          error: 'Database structure is being updated. Please wait a moment and try again.' 
        });
        return;
      }

      if (page === 1) {
        const cachedMessages = get().messageCache.get(threadId);
        if (cachedMessages) {
          set({ messages: cachedMessages, loading: false });
          get().prefetchNextPage(threadId);
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in to view messages.');

      const result = await createQuery<Message>(supabase, 'messages')
        .select('*', { count: 'exact' })
        .eq('thread_id', threadId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .range((page - 1) * MESSAGES_PER_PAGE, page * MESSAGES_PER_PAGE - 1)
        .execute();

      if (result.error) {
        const pgError = result.error as PostgrestError;
        if (pgError?.code === '404' || pgError?.code === '42P01') {
          console.warn('Messages table not yet available - migrating data:', pgError.message);
          set({ messages: [], loading: true, error: 'Migrating your chat history. Please wait...' });
          return;
        }
        throw new Error('Failed to load messages. Please try again.');
      }

      const messages = Array.isArray(result.data) ? 
        result.data.filter(isMessage).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) : 
        [];
      const hasMore = result.count ? page * MESSAGES_PER_PAGE < result.count : false;

      if (page === 1) {
        get().messageCache.set(threadId, messages);
      }

      set(state => ({
        messages: page === 1 ? messages : [...state.messages, ...messages],
        hasMoreMessages: hasMore,
        currentPage: page,
        loading: false
      }));

      if (hasMore) {
        get().prefetchNextPage(threadId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load messages',
        loading: false 
      });
    }
  },

  sendMessage: async (content: string, files?: string[], contextId?: string, isSystemMessage: boolean = false, skipAiResponse: boolean = false, forceSearch: boolean = false) => {
    set({ sendingMessage: true, error: null });
    try {
      // Verify database structure
      const isValid = await verifyDatabaseStructure();
      if (!isValid) {
        set({ 
          sendingMessage: false, 
          error: 'Database structure is being updated. Please wait a moment and try again.' 
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in to send messages.');

      // Handle search if needed
      const { content: processedContent, wasSearchPerformed } = await handleSearch(content, forceSearch);
      
      // For search operations, use a temporary thread ID
      let threadId = wasSearchPerformed ? 
        'search-' + crypto.randomUUID() : 
        useThreadStore.getState().currentThreadId;

      let messageContextId = contextId;

      // Handle personalization context
      if (!messageContextId && !wasSearchPerformed) {
        const { data: personalization } = await supabase
          .from('user_personalization')
          .select('context_id, is_active')
          .eq('user_id', user.id)
          .single();

        if (personalization?.is_active) {
          messageContextId = personalization.context_id;
        }
      }

      // Create new thread if needed and not a search operation
      if (!threadId && !isSystemMessage && !wasSearchPerformed) {
        const result = await createQuery<Thread>(supabase, 'threads')
          .insert({
            id: crypto.randomUUID(),
            user_id: user.id,
            context_id: messageContextId,
            title: 'New Chat',
            pinned: false,
            deleted_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single()
          .execute();

        if (result.error) {
          const pgError = result.error as PostgrestError;
          if (pgError?.code === '404' || pgError?.code === '42P01') {
            console.warn('Threads table not yet available - this is normal during initial setup');
            return;
          }
          throw new Error('Failed to create conversation. Please try again.');
        }

        if (!result.data || Array.isArray(result.data)) {
          throw new Error('Invalid response when creating thread');
        }

        threadId = result.data.id;
        const newThread = result.data as Thread;
        if (!isSystemMessage) {
          // Update threads list with new thread
          useThreadStore.setState(state => ({
            ...state,
            threads: [newThread, ...state.threads],
            currentThreadId: threadId
          }));
          // Refresh thread list
          useThreadStore.getState().fetchThreads();
        }
      }

      // Create user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        content,
        role: isSystemMessage ? 'system' : 'user',
        thread_id: threadId || 'temp-' + crypto.randomUUID(),
        context_id: messageContextId,
        user_id: user.id,
        files: files || [],
        created_at: new Date().toISOString()
      };
      
      // Show user message immediately
      const currentMessages = get().messages;
      const updatedMessages = [...currentMessages, userMessage].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      set({ messages: updatedMessages, loading: false });

      // Only save message to DB if not a search operation
      if (!wasSearchPerformed) {
        const userResult = await createQuery<Message>(supabase, 'messages')
          .insert(userMessage)
          .select('*')
          .single()
          .execute();

        if (userResult.error) {
          const pgError = userResult.error as PostgrestError;
          if (pgError?.code === '404' || pgError?.code === '42P01') {
            console.warn('Messages table not yet available - migrating data:', pgError.message);
            set({ error: 'Migrating your chat history. Please wait...', sendingMessage: false });
          }
          throw new Error('Failed to send message. Please try again.');
        }
      }

      // Skip AI response for system messages or when requested
      if (isSystemMessage || skipAiResponse) return;

      // Show AI thinking message immediately
      const thinkingMessage: Message = {
        id: 'thinking',
        content: '...',
        role: 'assistant',
        thread_id: userMessage.thread_id,
        user_id: userMessage.user_id,
        context_id: userMessage.context_id,
        files: [],
        created_at: new Date().toISOString()
      };
      const messagesWithThinking = [...updatedMessages, thinkingMessage].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      set({ messages: messagesWithThinking });

      // Get context if provided and not a search operation
      let contextContent = '';
      if (contextId && !wasSearchPerformed) {
        const result = await createQuery<{ content: string }>(supabase, 'contexts')
          .select('content')
          .eq('id', contextId)
          .single()
          .execute();

        const contextData = result.data as { content: string } | null;
        if (contextData?.content) {
          contextContent = `Context: ${contextData.content}\n\n`;
        }
      }

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
              fileContent += `\n\nContent of ${filePath}:\n${fileText.substring(0, 2000)}\n`;
            }
          } catch (error) {
            console.error('Error processing file:', filePath, error);
          }
        }
      }

      // Build message text components
      const messageComponents = [
        contextContent,
        processedContent,
        fileContent
      ];

      // Add personalization for self-queries
      if (content.toLowerCase().includes('who am i')) {
        const personalInfo = usePersonalizationStore.getState().personalInfo;
        const isPersonalizationActive = usePersonalizationStore.getState().isActive;
        
        if (isPersonalizationActive && personalInfo?.personalization_document) {
          console.log('Using personalization for self-query');
          messageComponents.push(`User Context: ${personalInfo.personalization_document}`);
        }
      }

      // Initialize chat with personalization
      const chat = model.startChat();
      
      // Add personalization context if not a search operation
      if (!wasSearchPerformed) {
        const personalInfo = usePersonalizationStore.getState().personalInfo;
        const isPersonalizationActive = usePersonalizationStore.getState().isActive;
        
        if (isPersonalizationActive && personalInfo?.personalization_document) {
          chat.setPersonalizationContext({
            name: personalInfo.name,
            personalDocument: personalInfo.personalization_document,
            preferences: {
              communication: personalInfo.communication_preferences?.tone,
              learning: personalInfo.learning_preferences?.style,
              workStyle: personalInfo.work_preferences?.style
            }
          });
        }
      }

      // Create streaming message for AI response
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        content: '',
        role: 'assistant',
        thread_id: threadId || 'temp-' + crypto.randomUUID(),
        context_id: messageContextId,
        user_id: user.id,
        files: [],
        created_at: new Date().toISOString()
      };

      set({ 
        messages: get().messages.filter(m => m.id !== 'thinking'),
        streamingMessageId: aiMessage.id,
      });

      // Combine all message components
      const messageText = messageComponents.filter(Boolean).join('\n\n');

      // Stream AI response
      const result = await chat.sendMessage(messageText, {
        onStreamResponse: (response) => {
          aiMessage.content = response;
          set({
            messages: [...get().messages
              .filter(m => m.id !== 'thinking')
              .map(m => m.id === aiMessage.id ? aiMessage : m)
              .filter(isMessage)]
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
            streamingMessageId: aiMessage.id
          });
        }
      });

      const response = result.response.text();
      if (!response) {
        throw new Error('No response received from AI. Please try again.');
      }

      // Save final AI response
      aiMessage.content = response;

      // Update thread title with AI summary if this is the first message
      if (!wasSearchPerformed && threadId) {
        const threadMessages = await createQuery<Message>(supabase, 'messages')
          .select('*')
          .eq('thread_id', threadId)
          .order('created_at', { ascending: true })
          .execute();

        if (Array.isArray(threadMessages.data) && threadMessages.data.length === 2) { // Only user message and AI response
          const summaryChat = model.startChat();
          const summaryResponse = await summaryChat.sendMessage(
            `Summarize this conversation in a brief title (max 50 chars):\nUser: ${content}\nAssistant: ${response}`
          );
          const title = summaryResponse.response.text().slice(0, 50);

          await createQuery<Thread>(supabase, 'threads')
            .update({ 
              title,
              updated_at: new Date().toISOString()
            })
            .eq('id', threadId)
            .execute();
        }
      }

      // Only save to DB if not a search operation
      if (!wasSearchPerformed) {
        const aiResult = await createQuery<Message>(supabase, 'messages')
          .insert(aiMessage)
          .select('*')
          .single()
          .execute();

        if (aiResult.error) {
          const pgError = aiResult.error as PostgrestError;
          if (pgError?.code === '404' || pgError?.code === '42P01') {
            console.warn('Messages table not yet available - migrating data:', pgError.message);
            set({
              messages: get().messages
                .filter(m => m.id !== 'thinking')
                .map(m => m.id === aiMessage.id ? aiMessage : m).filter(isMessage),
              streamingMessageId: null
            });
            return;
          }
          throw new Error('Failed to save AI response. Please try again.');
        }

        if (!aiResult.data || Array.isArray(aiResult.data)) {
          throw new Error('Invalid response when saving AI message');
        }

        const finalMessages = [...get().messages
          .filter(m => m.id !== 'thinking')
          .map(m => m.id === aiMessage.id ? aiResult.data : m)
          .filter(isMessage)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())];

        set({ 
          messages: finalMessages,
          streamingMessageId: null
        });
      } else {
        const searchMessages = [...get().messages
          .filter(m => m.id !== 'thinking')
          .map(m => m.id === aiMessage.id ? aiMessage : m)
          .filter(isMessage)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())];
        set({ 
          messages: searchMessages,
          streamingMessageId: null
        });
      }

    } catch (error) {
      console.error('Error in chat:', error);
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        sendingMessage: false,
        streamingMessageId: null
      });
    } finally {
      set({ sendingMessage: false });
    }
  },

  clearThreadMessages: (threadId: string) => {
    get().messageCache.delete(threadId);
    if (threadId === useThreadStore.getState().currentThreadId) {
      set({ messages: [] });
    }
  },

  updateStreamingMessage: (content: string) => {
    const { messages, streamingMessageId } = get();
    if (!streamingMessageId || !content) return;

    const updatedMessages = messages.map(msg =>
      msg.id === streamingMessageId ? { ...msg, content } : msg
    ).filter(isMessage);
    
    set({ messages: updatedMessages });
  },

  prefetchNextPage: async (threadId: string) => {
    const { currentPage, hasMoreMessages, loading } = get();
    if (!hasMoreMessages || loading) return;

    try {
      const result = await createQuery<Message>(supabase, 'messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })
        .range(currentPage * MESSAGES_PER_PAGE, (currentPage + 1) * MESSAGES_PER_PAGE - 1)
        .execute();

      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        const existingMessages = get().messages;
        const prefetchedMessages = [...existingMessages, ...result.data.filter(isMessage)];
        get().messageCache.set(threadId, prefetchedMessages);
      }
    } catch (error) {
      console.warn('Prefetch failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}));