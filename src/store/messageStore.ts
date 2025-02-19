import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getChatModel } from '../lib/gemini';
import { handleSearch } from '../lib/search-handler';
import { integrationChat } from '../lib/integrations/chat-handler';
import type { Message, MessageVersion } from '../types';
import { usePersonalizationStore } from './personalization';
import { useThreadStore } from './threadStore';
import { useIntegrationsStore } from './integrations';
import { ULTRA_SYSTEM_MESSAGE, PERSONALIZATION_SYSTEM_MESSAGE } from '../lib/ultra-system-message';

interface MessageState {
  messages: Message[];
  loading: boolean;
  error: string | null;
  messageQueue: Map<string, AbortController>;
  retryCount: Map<string, number>;
  pendingUpdates: Set<string>;
  fetchMessages: (threadId: string) => Promise<void>;
  sendMessage: (
    content: string,
    files?: string[],
    contextId?: string,
    isSystemMessage?: boolean,
    skipAiResponse?: boolean,
    forceSearch?: boolean,
    metadata?: { personalization_enabled?: boolean; search_enabled?: boolean; tools_used?: string[] }
  ) => Promise<void>;
  clearThreadMessages: (threadId: string) => void;
  updateMessageContent: (messageId: string, content: string) => Promise<void>;
  regenerateResponse: (messageId: string) => Promise<void>;
  fetchMessageVersions: (messageId: string) => Promise<MessageVersion[]>;
  switchMessageVersion: (messageId: string, versionNumber: number) => Promise<void>;
  cancelMessage: (messageId: string) => void;
  retryMessage: (messageId: string) => Promise<void>;
}

const MAX_RETRIES = 3;
const MESSAGE_TIMEOUT = 30000; // 30 seconds

export const useMessageStore = create<MessageState>((set, get) => {
  const cleanupMessage = (messageId: string) => {
    const state = get();
    state.messageQueue.get(messageId)?.abort();
    state.messageQueue.delete(messageId);
    state.retryCount.delete(messageId);
    state.pendingUpdates.delete(messageId);
  };

  const handleMessageError = async (messageId: string, error: any) => {
    const state = get();
    const currentRetries = state.retryCount.get(messageId) || 0;
    
    if (currentRetries < MAX_RETRIES) {
      state.retryCount.set(messageId, currentRetries + 1);
      await state.retryMessage(messageId);
    } else {
      cleanupMessage(messageId);
      throw error;
    }
  };

  const handleIntegrationCommand = async (
    content: string,
    threadId: string,
    userId: string
  ): Promise<Message | null> => {
    const command = integrationChat.parseCommand(content);
    if (!command) return null;

    const integration = useIntegrationsStore.getState().integrations.find(
      i => i.type === command.service
    );
    if (!integration) {
      throw new Error(`Integration not found: ${command.service}`);
    }

    const response = await integrationChat.executeCommand(
      command,
      integration,
      (progress) => {
        const progressMessage = integrationChat.generateMessage(progress);
        progressMessage.integrations = {
          used: [command.service],
          context: {
            action: command.action
          }
        };
        progressMessage.thread_id = threadId;
        progressMessage.user_id = userId;

        set(state => ({
          messages: [...state.messages, progressMessage]
        }));
      }
    );

    const message = integrationChat.generateMessage(response);
    message.integrations = {
      used: [command.service],
      context: {
        action: command.action
      }
    };
    message.thread_id = threadId;
    message.user_id = userId;

    return message;
  };

  return {
    messages: [],
    loading: false,
    error: null,
    messageQueue: new Map(),
    retryCount: new Map(),
    pendingUpdates: new Set(),

    fetchMessages: async (threadId: string) => {
      set({ loading: true, error: null });
      try {
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select(`
            id, content, role, thread_id, user_id, created_at, version_count
          `)
          .eq('thread_id', threadId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        if (!messages) throw new Error('No messages found');
        set({ messages, loading: false, error: null });

      } catch (error) {
        console.error('Error loading messages:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load messages',
          loading: false 
        });
      }
    },

    clearThreadMessages: (threadId: string) => {
      const state = get();
      state.messageQueue.forEach((controller, messageId) => {
        controller.abort();
        cleanupMessage(messageId);
      });
      set({ messages: [], error: null });
    },

    updateMessageContent: async (messageId: string, content: string) => {
      const state = get();
      if (state.pendingUpdates.has(messageId)) return;

      state.pendingUpdates.add(messageId);
      try {
        const { data: currentMessage } = await supabase
          .from('messages')
          .select('content, version_count')
          .eq('id', messageId)
          .single();

        if (!currentMessage) throw new Error('Message not found');

        const currentVersionNumber = currentMessage.version_count || 1;

        await supabase.from('message_versions').insert({
          message_id: messageId,
          content: currentMessage.content,
          version_number: currentVersionNumber,
          created_by: 'user'
        });

        const { error: updateError } = await supabase
          .from('messages')
          .update({ 
            content,
            version_count: currentVersionNumber + 1
          })
          .eq('id', messageId);

        if (updateError) throw updateError;

        set(state => ({
          messages: state.messages.map(m =>
            m.id === messageId ? { 
              ...m, 
              content,
              version_count: currentVersionNumber + 1
            } : m
          )
        }));
      } finally {
        state.pendingUpdates.delete(messageId);
      }
    },

    sendMessage: async (
      content: string,
      files: string[] = [],
      contextId?: string,
      isSystemMessage?: boolean,
      skipAiResponse?: boolean,
      forceSearch?: boolean,
      metadata?: { personalization_enabled?: boolean; search_enabled?: boolean; tools_used?: string[] }
    ) => {
      set({ error: null });
      const messageId = crypto.randomUUID();
      const abortController = new AbortController();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Please sign in to send messages.');

        let threadId = useThreadStore.getState().currentThread?.id;
        
        if (!threadId) {
          const thread = await useThreadStore.getState().createThread();
          if (!thread) throw new Error('Failed to create conversation');
          threadId = thread.id;
        }

        if (metadata) {
          await supabase
            .from('threads')
            .update({
              personalization_enabled: metadata.personalization_enabled,
              search_enabled: metadata.search_enabled,
              tools_used: metadata.tools_used
            })
            .eq('id', threadId);
        }

        get().messageQueue.set(messageId, abortController);

        const userMessage = {
          id: messageId,
          content,
          role: 'user',
          thread_id: threadId,
          user_id: user.id,
          created_at: new Date().toISOString(),
          version_count: 1
        };

        const { data: msgData, error: msgError } = await supabase
          .from('messages')
          .insert(userMessage)
          .select()
          .single();

        if (msgError) throw msgError;
        if (!msgData) throw new Error('Failed to send message');

        set(state => ({
          messages: [...state.messages, msgData as Message]
        }));

        if (skipAiResponse) {
          cleanupMessage(messageId);
          set({ loading: false });
          return;
        }

        if (integrationChat.isIntegrationCommand(content)) {
          const integrationMessage = await handleIntegrationCommand(
            content,
            threadId,
            user.id
          );

          if (integrationMessage) {
            const { data: intData, error: intError } = await supabase
              .from('messages')
              .insert(integrationMessage)
              .select()
              .single();

            if (intError) throw intError;
            if (!intData) throw new Error('Failed to save integration response');

            set(state => ({
              messages: [...state.messages, intData as Message],
              loading: false
            }));

            cleanupMessage(messageId);
            return;
          }
        }

        const timeoutId = setTimeout(() => {
          abortController.abort();
          handleMessageError(messageId, new Error('Message timed out'));
        }, MESSAGE_TIMEOUT);

        const model = getChatModel();
        const { isActive, personalInfo } = usePersonalizationStore.getState();
        
        const systemMessage = isSystemMessage ? PERSONALIZATION_SYSTEM_MESSAGE : ULTRA_SYSTEM_MESSAGE;
        const chat = model.startChat(systemMessage);
        if (isActive && !isSystemMessage) {
          chat.setPersonalizationContext({
            name: personalInfo.name,
            personalDocument: personalInfo.personalization_document,
            backstory: personalInfo.backstory,
            interests: personalInfo.interests,
            expertise_areas: personalInfo.expertise_areas,
            preferences: {
              communication: {
                tone: personalInfo.communication_preferences?.tone,
                style: personalInfo.communication_style
              },
              learning: {
                style: personalInfo.learning_style
              },
              work: {
                style: personalInfo.work_style
              }
            }
          });
        }

        const aiMessageId = crypto.randomUUID();
        set({ loading: true });

        const { content: enhancedContent, wasSearchPerformed } = await handleSearch(content, forceSearch);
        const messageToSend = wasSearchPerformed ? enhancedContent : content;

        const streamHandler = (text: string) => {
          if (abortController.signal.aborted) return;
          
          if (aiMessageId) {
            set(state => ({
              messages: state.messages.map(m =>
                m.id === aiMessageId
                  ? { ...m, content: text }
                  : m
              )
            }));
          }
        };

        const previousMessages = get().messages;
        for (const msg of previousMessages) {
          await chat.sendMessage(msg.content, false, { signal: abortController.signal });
        }

        const result = await chat.sendMessage(
          messageToSend,
          wasSearchPerformed,
          { 
            onStreamResponse: streamHandler,
            signal: abortController.signal
          }
        );

        clearTimeout(timeoutId);

        let response = result.response.text()
          .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .replace(/^[\s\n]+|[\s\n]+$/g, '')
          .replace(/\n\s*\n/g, '\n\n')
          .replace(/(\*\*.*?\*\*)/g, '$1 ')
          .replace(/(\#\s.*?)\n/g, '$1\n\n')
          .replace(/<small>(.*?)<\/small>/g, '<small>$1</small> ')
          .trim();

        if (!response) throw new Error('No response received from AI');

        const aiMessage = {
          id: aiMessageId,
          content: response,
          role: 'assistant',
          thread_id: threadId,
          user_id: user.id,
          created_at: new Date().toISOString(),
          version_count: 1
        };

        const { data: aiData, error: aiError } = await supabase
          .from('messages')
          .insert(aiMessage)
          .select()
          .single();

        if (aiError) throw aiError;
        if (!aiData) throw new Error('Failed to save AI response');

        set(state => ({
          messages: [...state.messages, aiData as Message],
          loading: false,
        }));

        if (get().messages.length === 2) {
          const title = await getChatModel().generateText(
            `Generate a concise title (max 50 chars) that summarizes this conversation based on: "${content}"\nFormat: Just return the title, nothing else.`
          );
          await supabase
            .from('threads')
            .update({ title })
            .eq('id', threadId);

          await useThreadStore.getState().fetchThreads();
        }

        cleanupMessage(messageId);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Message aborted:', messageId);
          return;
        }
        
        await handleMessageError(messageId, error);
      }
    },

    regenerateResponse: async (messageId: string) => {
      const state = get();
      if (state.pendingUpdates.has(messageId)) return;

      state.pendingUpdates.add(messageId);
      const abortController = new AbortController();
      state.messageQueue.set(messageId, abortController);

      try {
        const messages = get().messages;
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) throw new Error('Message not found');

        const userMessage = messages[messageIndex - 1];
        if (!userMessage || userMessage.role !== 'user') {
          throw new Error('Original user message not found');
        }

        const threadId = messages[messageIndex].thread_id;
        if (!threadId) throw new Error('Thread ID not found');

        const timeoutId = setTimeout(() => {
          abortController.abort();
          handleMessageError(messageId, new Error('Regeneration timed out'));
        }, MESSAGE_TIMEOUT);

        if (integrationChat.isIntegrationCommand(userMessage.content)) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const integrationMessage = await handleIntegrationCommand(
            userMessage.content,
            threadId,
            user.id
          );

          if (integrationMessage) {
            await supabase.from('message_versions').insert({
              message_id: messageId,
              content: messages[messageIndex].content,
              version_number: messages[messageIndex].version_count || 1,
              created_by: 'system'
            });

            const { error: updateError } = await supabase
              .from('messages')
              .update({ 
                content: integrationMessage.content,
                integrations: integrationMessage.integrations,
                version_count: (messages[messageIndex].version_count || 1) + 1
              })
              .eq('id', messageId);

            if (updateError) throw updateError;

            set(state => ({
              messages: state.messages.map(m => 
                m.id === messageId ? { 
                  ...m, 
                  content: integrationMessage.content,
                  integrations: integrationMessage.integrations,
                  version_count: (m.version_count || 1) + 1
                } : m
              ),
              loading: false
            }));

            cleanupMessage(messageId);
            return;
          }
        }

        const model = getChatModel();
        const { isActive, personalInfo } = usePersonalizationStore.getState();
        
        const chat = isActive ? model.startChatWithContext({
          name: personalInfo.name,
          personalDocument: personalInfo.personalization_document,
          backstory: personalInfo.backstory,
          interests: personalInfo.interests,
          expertise_areas: personalInfo.expertise_areas,
          preferences: {
            communication: {
              tone: personalInfo.communication_preferences?.tone,
              style: personalInfo.communication_style
            },
            learning: {
              style: personalInfo.learning_style
            },
            work: {
              style: personalInfo.work_style
            }
          }
        }) : model.startChat();

        const result = await chat.sendMessage(
          userMessage.content,
          false,
          { signal: abortController.signal }
        );

        clearTimeout(timeoutId);

        const response = result.response.text()
          .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();

        await supabase.from('message_versions').insert({
          message_id: messageId,
          content: messages[messageIndex].content,
          version_number: messages[messageIndex].version_count || 1,
          created_by: 'system'
        });

        const { error: updateError } = await supabase
          .from('messages')
          .update({ 
            content: response,
            version_count: (messages[messageIndex].version_count || 1) + 1
          })
          .eq('id', messageId);

        if (updateError) throw updateError;

        set(state => ({
          messages: state.messages.map(m => 
            m.id === messageId ? { 
              ...m, 
              content: response,
              version_count: (m.version_count || 1) + 1
            } : m
          ),
          loading: false
        }));

        cleanupMessage(messageId);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Regeneration aborted:', messageId);
          return;
        }
        
        await handleMessageError(messageId, error);
      } finally {
        state.pendingUpdates.delete(messageId);
      }
    },

    fetchMessageVersions: async (messageId: string) => {
      try {
        const { data, error } = await supabase
          .from('message_versions')
          .select('*')
          .eq('message_id', messageId)
          .order('version_number', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching message versions:', error);
        throw error;
      }
    },

    switchMessageVersion: async (messageId: string, versionNumber: number) => {
      const state = get();
      if (state.pendingUpdates.has(messageId)) return;

      state.pendingUpdates.add(messageId);
      try {
        const { data: versionData, error: versionError } = await supabase
          .from('message_versions')
          .select('content')
          .eq('message_id', messageId)
          .eq('version_number', versionNumber)
          .single();

        if (versionError) throw versionError;
        if (!versionData) throw new Error('Version not found');

        const { error: updateError } = await supabase
          .from('messages')
          .update({ 
            content: versionData.content,
            version_count: versionNumber,
            updated_at: new Date().toISOString()
          })
          .eq('id', messageId);

        if (updateError) throw updateError;

        set(state => ({
          messages: state.messages.map(m =>
            m.id === messageId ? { 
              ...m, 
              content: versionData.content,
              version_count: versionNumber,
              updated_at: new Date().toISOString()
            } : m
          )
        }));
      } catch (error) {
        console.error('Error switching message version:', error);
        throw error;
      } finally {
        state.pendingUpdates.delete(messageId);
      }
    },

    cancelMessage: (messageId: string) => {
      const controller = get().messageQueue.get(messageId);
      if (controller) {
        controller.abort();
        cleanupMessage(messageId);
      }
    },

    retryMessage: async (messageId: string) => {
      const state = get();
      const message = state.messages.find(m => m.id === messageId);
      if (!message) return;

      if (message.role === 'assistant') {
        await state.regenerateResponse(messageId);
      } else {
        const content = message.content;
        await state.sendMessage(content);
      }
    }
  };
});