import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getChatModel } from '../lib/gemini';
import type { Message } from '../types';

interface Thread {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatState {
  messages: Message[];
  threads: Thread[];
  loading: boolean;
  error: string | null;
  currentThreadId: string | null;
  streamingMessageId: string | null;
  fetchMessages: (threadId: string) => Promise<void>;
  fetchThreads: () => Promise<void>;
  sendMessage: (content: string, contextId?: string) => Promise<void>;
  switchThread: (threadId: string) => Promise<void>;
  clearMessages: () => void;
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

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
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

      const { data: threads, error } = await retryWithBackoff(() => 
        supabase
          .from('threads')
          .select('*')
          .eq('user_id', user.id)
          .not('title', 'eq', 'New Conversation') // Only fetch completed conversations
          .order('updated_at', { ascending: false })
      );

      if (error) throw error;

      const formattedThreads: Thread[] = (threads || []).map(thread => ({
        id: thread.id,
        title: thread.title,
        updatedAt: thread.updated_at
      }));

      set({ threads: formattedThreads });
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

      const { data, error } = await retryWithBackoff(() =>
        supabase
          .from('messages')
          .select('*')
          .eq('thread_id', threadId)
          .order('created_at', { ascending: true })
      );

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

  sendMessage: async (content: string, contextId?: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let threadId = get().currentThreadId;
      
      // Create new thread if needed
      if (!threadId) {
        const { data: thread, error: threadError } = await retryWithBackoff(() =>
          supabase
            .from('threads')
            .insert({
              id: crypto.randomUUID(),
              user_id: user.id,
              context_id: contextId,
              title: 'New Conversation'
            })
            .select()
            .single()
        );

        if (threadError) throw threadError;
        threadId = thread.id;
        set({ currentThreadId: threadId });
      }

      // Get context if provided
      let contextContent = '';
      if (contextId) {
        const { data: context } = await supabase
          .from('contexts')
          .select('content')
          .eq('id', contextId)
          .single();
        
        if (context) {
          contextContent = `Context: ${context.content}\n\n`;
        }
      }

      // Insert user message
      const { data: userMessage, error: userError } = await retryWithBackoff(() =>
        supabase
          .from('messages')
          .insert({
            content,
            role: 'user',
            thread_id: threadId,
            user_id: user.id,
            context_id: contextId
          })
          .select()
          .single()
      );

      if (userError) throw userError;
      const updatedMessages = [...get().messages, userMessage];
      set({ messages: updatedMessages });

      // Create placeholder for streaming response
      const streamingId = crypto.randomUUID();
      const streamingMessage = {
        id: streamingId,
        content: '',
        role: 'assistant' as const,
        thread_id: threadId!,
        user_id: user.id,
        context_id: contextId,
        created_at: new Date().toISOString()
      };
      set(state => ({
        messages: [...state.messages, streamingMessage],
        streamingMessageId: streamingId
      }));

      // Get AI response
      const model = getChatModel();
      const chat = model.startChat({
        history: updatedMessages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
      });

      const result = await chat.sendMessage([
        { text: contextContent + content }
      ]);
      
      const response = result.response.text();

      // Save AI response
      const { data: aiMessage, error: aiError } = await retryWithBackoff(() =>
        supabase
          .from('messages')
          .insert({
            id: streamingId,
            content: response,
            role: 'assistant',
            thread_id: threadId,
            user_id: user.id,
            context_id: contextId
          })
          .select()
          .single()
      );

      if (aiError) throw aiError;
      const finalMessages = [...updatedMessages, aiMessage];
      set(state => ({
        messages: state.messages.map(msg =>
          msg.id === streamingId ? aiMessage : msg
        ),
        streamingMessageId: null
      }));

      // Generate and update thread title
      const title = await generateThreadTitle(finalMessages);
      await retryWithBackoff(() =>
        supabase
          .from('threads')
          .update({ 
            title,
            updated_at: new Date().toISOString()
          })
          .eq('id', threadId)
      );

      await get().fetchThreads();
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
  }
}));