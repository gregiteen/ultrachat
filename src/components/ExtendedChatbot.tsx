import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useMessageStore, useThreadStore } from '../store/chat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ExtendedChatbotProps {
  currentPath?: string;
}

export function ExtendedChatbot({ currentPath }: ExtendedChatbotProps) {
  const { initialized: authInitialized, user } = useAuthStore();
  const { messages, sendMessage, loading: messagesLoading } = useMessageStore();
  const { currentThread } = useThreadStore();
  const [isVoiceToTextMode, setIsVoiceToTextMode] = useState(false);
  const [isVoiceToVoiceMode, setIsVoiceToVoiceMode] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle page context
  useEffect(() => {
    if (currentThread?.id && messages.length === 0) {
      // Initial message for each page
      const pageContext = getPageContext(location.pathname);
      sendMessage(
        `I'm here to help with ${pageContext.description}. What would you like to do?`,
        [],
        undefined,
        true
      );
    }
  }, [currentThread?.id, messages.length, location.pathname]);

  // Get context for current page
  const getPageContext = (path: string) => {
    const contexts: Record<string, { description: string }> = {
      '/': { description: 'the main dashboard' },
      '/chat': { description: 'chat and conversations' },
      '/tasks': { description: 'task management' },
      '/inbox': { description: 'your unified inbox' },
      '/account': { description: 'account settings and preferences' },
      '/voices': { description: 'voice settings and management' },
      '/browse': { description: 'browser management' },
      '/theme-demo': { description: 'theme customization' }
    };

    return contexts[path] || { description: path.slice(1) + ' page features' };
  };

  if (!authInitialized || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-muted-foreground">
          Please log in to use the chat.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
          />
        ))}
        {messagesLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted text-foreground">
              <span className="inline-block animate-bounce">•</span>
              <span className="inline-block animate-bounce delay-100">•</span>
              <span className="inline-block animate-bounce delay-200">•</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={sendMessage}
        isLoading={messagesLoading}
        isVoiceToTextMode={isVoiceToTextMode}
        setIsVoiceToTextMode={setIsVoiceToTextMode}
        isVoiceToVoiceMode={isVoiceToVoiceMode}
        setIsVoiceToVoiceMode={setIsVoiceToVoiceMode}
        isSearchMode={isSearchMode}
        setIsSearchMode={setIsSearchMode}
      />
    </div>
  );
}