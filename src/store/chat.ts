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
          .order('updated_at', { ascending: false })

      if (error) throw error;
      console.log("Fetch Threads - Raw Data:", data);

      // Handle potential null data
      set({ threads: data || [] } as Partial<ChatState>);

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
          .order('created_at', { ascending: true })

        console.log("Fetch Messages - Raw Data:", data); // Log raw data
        console.log("Fetch Messages - Error:", error); // Log error
      if (error) throw error;

      // Handle potential null data
      set({ messages: data || [], currentThreadId: threadId } as Partial<ChatState>);

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
    } as Partial<ChatState>);
  },

  sendMessage: async (content: string, files?: string[], contextId?: string) => {
    set({ loading: true, error: null});
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
          .single() as PostgrestSingleResponse<Thread>; // Explicit type

        if (threadError) throw threadError;
        threadId = thread!.id; // Use definite assignment assertion
        set({ currentThreadId: threadId } as Partial<ChatState>);
      }

      // Get context if provided
      let contextContent = '';
      if (contextId) {
        const { data: context, error: contextError } = await supabase
          .from('contexts')
          .select('content')
          .eq('id', contextId)
          .single() as { data: { content: string }, error: any }; // Explicit type
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

      console.log('Sending message:', messageData); // Log the data being sent

      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert(messageData)
        .select('*, files') // Explicitly select the 'files' column
        .single() as PostgrestSingleResponse<Message>; // Explicit type

      if (userError) throw userError;
      set({ messages: [...get().messages, userMessage!] } as Partial<ChatState>); // Add new message and use definite assignment

      // TODO: Handle AI response and streaming
        const model = getChatModel();

        let fileContent = '';
        if (files && files.length > 0) {
            for (const filePath of files) {
                try {
                    const { data: fileData, error: fileError } = await supabase.storage.from('user-uploads').download(filePath);

                    if (fileError) {
                        console.error("Error downloading file:", fileError);
                        continue; // Skip this file and continue with the next
                    }
                    if (!fileData) {
                        console.error("File data is null:", filePath);
                        continue;
                    }

                    const fileText = await fileData.text();

                    // Basic file type check and content handling
                    if (filePath.endsWith('.txt') || filePath.endsWith('.md') || filePath.endsWith('.csv') || filePath.endsWith('.json') || filePath.endsWith('.xml')) {
                        fileContent += `\n\nContent of ${filePath}:\n${fileText.substring(0, 2000)}\n`;
                    } else {
                        fileContent += `\n\nUploaded file: ${filePath} (Type: ${fileData.type})\n`;
                    }


                }
                catch (error) {
                    console.error("Error processing file:", filePath, error);
                }
            }
        }

        const chat = model.startChat({
            history: [
              {
                role: "user",
                parts: [{ text: "hi"}],
              },
              {
                role: "model",
                parts: [{ text: "hello, how can i help?"}],
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
        .single() as PostgrestSingleResponse<Message>;

        if (aiError) throw aiError;
        set({ messages: [...get().messages, aiMessage!] } as Partial<ChatState>);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      console.error('Error in chat:', errorMessage);
      set({ error: errorMessage });
      throw error; // Re-throw to be handled by caller
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