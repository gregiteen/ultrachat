import React, { useEffect } from 'react';
import { MessageHistory } from '../components/MessageHistory';
import { ChatSidebar } from '../components/ChatSidebar';
import { ChatInput } from '../components/ChatInput';
import { useMessageStore } from '../store/chat';
import { usePersonalizationStore } from '../store/personalization';
import { PersonalizationChatbot } from '../components/PersonalizationChatbot';
import { useThreadStore } from '../store/threadStore';
import { useAuthStore } from '../store/auth';

export default function Chat() {
  const { sendMessage } = useMessageStore();
  const { isActive, hasSeenWelcome, initialized: personalizationInitialized } = usePersonalizationStore();
  const { initialized: threadsInitialized, loading: threadsLoading, currentThread, fetchThreads } = useThreadStore();
  const { initialized: authInitialized } = useAuthStore();

  // Ensure threads are loaded
  useEffect(() => {
    if (authInitialized && !threadsInitialized && !threadsLoading) {
      fetchThreads().catch(console.error);
    }
  }, [authInitialized, threadsInitialized, threadsLoading, fetchThreads]);

  // Show loading state while initializing
  if (!authInitialized || !personalizationInitialized || !threadsInitialized || threadsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg text-muted-foreground">
          Loading your conversations...
        </div>
      </div>
    );
  }

  const handleSendMessage = async (
    content: string,
    files?: string[],
    contextId?: string,
    isSystemMessage?: boolean,
    skipAiResponse?: boolean,
    forceSearch?: boolean
  ) => {
    try {
      await sendMessage(content, files, contextId, isSystemMessage, skipAiResponse, forceSearch);
    } catch (error) {
      console.error('Error sending message:', error);
      // Could add toast notification here
    }
  };

  // Show empty state if no thread selected
  if (!currentThread && (isActive || hasSeenWelcome)) {
    return (
      <div className="flex h-full">
        {/* Sidebar */}
        <ChatSidebar />

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">
              No conversation selected
            </h3>
            <p className="text-sm text-muted-foreground">
              Select a conversation from the sidebar or start a new one
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <ChatSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Show personalization chatbot if not active and welcome not seen */}
        {!isActive && !hasSeenWelcome && (
          <PersonalizationChatbot />
        )}

        {/* Main chat interface */}
        {(isActive || hasSeenWelcome) && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <MessageHistory />
            </div>

            {/* Input */}
            <div className="flex-shrink-0">
              <ChatInput 
                onSendMessage={handleSendMessage}
                disabled={!currentThread} // Disable input if no thread selected
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}