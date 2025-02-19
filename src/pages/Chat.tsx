import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageHistory } from '../components/MessageHistory';
import { ChatInput } from '../components/ChatInput';
import { useMessageStore } from '../store/chat';
import { QuoteSpinner } from '../components/QuoteSpinner';
import { PersonalizationChatbot } from '../components/PersonalizationChatbot';
import { usePersonalizationStore } from '../store/personalization';
import { useThreadStore } from '../store/threadStore';
import { useAuth } from '../lib/auth-service';

export default function Chat() {
  const navigate = useNavigate();
  const { sendMessage } = useMessageStore();
  const { isActive, hasSeenWelcome, initialized: personalizationInitialized, init: initPersonalization } = usePersonalizationStore();
  const { initialized: threadsInitialized, loading: threadsLoading, currentThread, fetchThreads, createThread } = useThreadStore();
  const { user } = useAuth();

  // Load threads when auth is ready
  useEffect(() => {
    if (user) {
      if (!threadsInitialized && !threadsLoading) {
        initPersonalization().catch(console.error);
        fetchThreads().catch(console.error);
      }
    } else {
      // Redirect to auth if not authenticated
      navigate('/auth');
    }
  }, [user, threadsInitialized, threadsLoading, fetchThreads, navigate]);

  // Create a thread if none exists
  useEffect(() => {
    if (user && threadsInitialized && !threadsLoading && !currentThread) {
      createThread().catch(error => {
        console.error('Error creating thread:', error);
      });
    }
  }, [user, threadsInitialized, threadsLoading, currentThread, createThread]);

  // Show loading state while initializing
  if (!personalizationInitialized || !threadsInitialized || threadsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <QuoteSpinner />
      </div>
    );
  }

  // Handle message sending
  const handleSendMessage = async (
    content: string,
    files?: string[],
    contextId?: string,
    isSystemMessage?: boolean,
    skipAiResponse?: boolean,
    forceSearch?: boolean,
    metadata?: { personalization_enabled?: boolean; search_enabled?: boolean; tools_used?: string[] }
  ) => {
    try {
      await sendMessage(content, files || [], contextId, isSystemMessage, skipAiResponse, forceSearch, metadata);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Show personalization chatbot if not active and welcome not seen */}
      {!isActive && !hasSeenWelcome ? (
        <PersonalizationChatbot />
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Message History - Takes up all space except for input */}
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0"><MessageHistory /></div>
          </div>

          {/* Chat Input - Fixed at bottom, full width */}
          <div className="flex-shrink-0 w-full border-t border-muted bg-background/95 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto px-4">
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={!currentThread}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}