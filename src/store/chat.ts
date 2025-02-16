import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getChatModel } from '../lib/gemini';
import type { Message, Thread } from '../types';
import { PostgrestResponse, PostgrestSingleResponse, PostgrestMaybeSingleResponse } from '@supabase/supabase-js';

interface ChatState {
  messages: Message[];
  threads: Thread[];
  loading: boolean;
  error: string | null;
  currentThreadId: string | null;
  streamingMessageId: string | null;
  fetchMessages: (threadId: string) => Promise<void>;
  fetchThreads: () => Promise<void>;
  sendMessage: (content: string, files?: string[], contextId?: string) => Promise<void>;
  switchThread: (threadId: string) => Promise<void>;
  clearMessages: () => void;
  renameThread: (threadId: string, title: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  togglePinThread: (threadId: string) => Promise<void>;
  updateStreamingMessage: (content: string) => void;
}

async function generateThreadTitle(messages: Message[]): Promise<string> {
  const model = getChatModel();
  const prompt = `Based on this conversation, generate a very concise title (max 30 chars) that captures the main topic. Be direct and specific.

Conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Generate only the title, nothing else.`;

  const result = await model.generateContent(prompt);
  let title = result.response.text().trim();

  // Remove any AI Generated suffix if present
  title = title.replace(/\s*-?\s*AI\s*Generated\s*$/i, '');

  // Truncate if too long
  if (title.length > 30) {
    title = title.substring(0, 27) + '...';
  }

  return title;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  threads: [],
  loading: false,
  error: null,
  currentThreadId: null,
  streamingMessageId: null,

  fetchThreads: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      console.log("Fetch Threads - Raw Data:", data);

      // Sort threads with pinned ones first
      const sortedThreads = [...(data || [])].sort((a, b) => {
        return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

      set({ threads: sortedThreads });

    } catch (error) {
      console.error('Error fetching threads:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch threads' });
    } finally {
      set({ loading: false });
    }
  },

  fetchMessages: async (threadId: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      console.log("Fetch Messages - Raw Data:", data);
      console.log("Fetch Messages - Error:", error);
      if (error) throw error;

      set({ messages: data || [], currentThreadId: threadId });

    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch messages' });
    } finally {
      set({ loading: false });
    }
  },

  updateStreamingMessage: (content: string) => {
    const { messages, streamingMessageId } = get();
    if (!streamingMessageId) return;

    set({
      messages: messages.map(msg =>
        msg.id === streamingMessageId
          ? { ...msg, content }
          : msg
      )
    });
  },

  sendMessage: async (content: string, files?: string[], contextId?: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let threadId = get().currentThreadId;

      // Create new thread if needed
      if (!threadId) {
        const { data: thread, error: threadError } = await supabase
          .from('threads')
          .insert({
            id: crypto.randomUUID(),
            user_id: user.id,
            context_id: contextId,
            title: 'New Conversation'
          })
          .select()
          .single();

        if (threadError) throw threadError;
        threadId = thread!.id;
        set({ currentThreadId: threadId });
      }

      // Get context if provided
      let contextContent = '';
      if (contextId) {
        const { data: context, error: contextError } = await supabase
          .from('contexts')
          .select('content')
          .eq('id', contextId)
          .single();

        if (contextError) {
          console.error("Error fetching context:", contextError);
        }

        if (context) {
          contextContent = `Context: ${context.content}\n\n`;
        }
      }

      // Insert user message
      const messageData = {
        content,
        role: 'user',
        thread_id: threadId,
        user_id: user.id,
        context_id: contextId,
        files: files || []
      };

      console.log('Sending message:', messageData);

      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert(messageData)
        .select('*, files')
        .single();

      if (userError) throw userError;
      set({ messages: [...get().messages, userMessage!] });

      // Handle AI response
      const model = getChatModel();

      let fileContent = '';
      if (files && files.length > 0) {
        for (const filePath of files) {
          try {
            const { data: fileData, error: fileError } = await supabase.storage
              .from('user-uploads')
              .download(filePath);

            if (fileError) {
              console.error("Error downloading file:", fileError);
              continue;
            }
            if (!fileData) {
              console.error("File data is null:", filePath);
              continue;
            }

            const fileText = await fileData.text();

            if (filePath.endsWith('.txt') || filePath.endsWith('.md') || filePath.endsWith('.csv') || filePath.endsWith('.json') || filePath.endsWith('.xml')) {
              fileContent += `\n\nContent of ${filePath}:\n${fileText.substring(0, 2000)}\n`;
            } else {
              fileContent += `\n\nUploaded file: ${filePath} (Type: ${fileData.type})\n`;
            }
          } catch (error) {
            console.error("Error processing file:", filePath, error);
          }
        }
      }

      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: "hi" }],
          },
          {
            role: "model",
            parts: [{ text: "hello, how can i help?" }],
          },
        ],
      });

      const result = await chat.sendMessage(contextContent + content + fileContent);
      const response = result.response.text();
      console.log(response);

      const { data: aiMessage, error: aiError } = await supabase
        .from('messages')
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

      if (aiError) throw aiError;
      set({ messages: [...get().messages, aiMessage!] });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      console.error('Error in chat:', errorMessage);
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  switchThread: async (threadId: string) => {
    await get().fetchMessages(threadId);
  },

  clearMessages: () => {
    set({ messages: [], currentThreadId: null });
  },

  renameThread: async (threadId: string, title: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('threads')
        .update({ title })
        .eq('id', threadId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
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
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('threads')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', threadId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      set({
        threads: get().threads.filter(thread => thread.id !== threadId)
      });
    } catch (error) {
      console.error('Error deleting thread:', error);
      throw error;
    }
  },

  togglePinThread: async (threadId: string) => {
    try {
      const thread = get().threads.find(t => t.id === threadId);
      if (!thread) throw new Error('Thread not found');

      const { error } = await supabase
        .from('threads')
        .update({ pinned: !thread.pinned })
        .eq('id', threadId);

      if (error) throw error;

      // Update local state and re-sort threads
      const updatedThreads = get().threads.map(t =>
        t.id === threadId ? { ...t, pinned: !t.pinned } : t
      ).sort((a, b) => {
        return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

      set({ threads: updatedThreads });
    } catch (error) {
      console.error('Error toggling thread pin:', error);
      throw error;
    }
  }
}));