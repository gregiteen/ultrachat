import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePersonalizationStore } from '../store/personalization';
import { useAuthStore } from '../store/auth';
import { useMessageStore, useThreadStore } from '../store/chat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { aiPersonalization } from '../lib/ai-personalization';
import { Spinner } from '../design-system/components/feedback/Spinner';

interface PersonalizationChatbotProps {
  currentPath?: string;
}

export function PersonalizationChatbot({ currentPath }: PersonalizationChatbotProps) {
  const { 
    personalInfo, 
    updatePersonalInfo, 
    initialized: personalizationInitialized, 
    loading: personalizationLoading 
  } = usePersonalizationStore();
  const { initialized: authInitialized, user } = useAuthStore();
  const { messages, sendMessage, loading: messagesLoading } = useMessageStore();
  const { 
    currentThread, 
    initialized: threadsInitialized, 
    loading: threadsLoading,
    createThread,
    selectThread
  } = useThreadStore();
  const [isVoiceToTextMode, setIsVoiceToTextMode] = useState(false);
  const [isVoiceToVoiceMode, setIsVoiceToVoiceMode] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Check if all required stores are initialized
  const isFullyInitialized = authInitialized && personalizationInitialized && threadsInitialized;
  const isLoading = personalizationLoading || threadsLoading || messagesLoading;

  useEffect(() => {
    // Auto-scroll to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize thread if needed
  useEffect(() => {
    const initializeThread = async () => {
      if (isFullyInitialized && !currentThread && !isLoading) {
        try {
          const thread = await createThread();
          if (thread) {
            await selectThread(thread.id);
          }
        } catch (error) {
          console.error('Error creating thread:', error);
          setError('Failed to create conversation. Please try again.');
        }
      }
    };

    initializeThread();
  }, [isFullyInitialized, currentThread, isLoading, createThread, selectThread]);

  // Send initial message when path changes
  useEffect(() => {
    const sendInitialMessage = async () => {
      if (currentPath && messages.length === 0 && currentThread && !isLoading) {
        try {
          await sendMessage(
            `Hi! I'm Ultra, and I'm here to help you fill out your personalization profile. Let's start with your name - what should I call you?`,
            [],
            undefined,
            true
          );
        } catch (error) {
          console.error('Error sending initial message:', error);
          setError('Failed to start conversation. Please try again.');
        }
      }
    };

    sendInitialMessage();
  }, [currentPath, messages.length, currentThread, isLoading, sendMessage]);

  // Handle message with personalization
  const handleSendMessage = async (
    content: string,
    files?: string[],
    contextId?: string,
    isSystemMessage?: boolean,
    skipAiResponse?: boolean,
    forceSearch?: boolean
  ) => {
    try {
      setError(null);
      
      // First send the message normally
      await sendMessage(content, files, contextId, isSystemMessage, true);

      if (!skipAiResponse) {
        // Get AI response with personalization
        const response = await aiPersonalization.generateChatResponse(
          content,
          { currentPath, personalInfo },
          {
            currentStep,
            messages: messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })).concat({ role: 'user' as const, content }),
            extractedInfo: personalInfo,
            isProcessing: false,
            error: null
          }
        );

        // Update fields if AI extracted any info
        if (response.extractedInfo) {
          await updatePersonalInfo(response.extractedInfo);
        }

        // Send AI response
        await sendMessage(response.message, [], contextId, true, false, false);

        // Update step if provided
        if (response.currentStep !== undefined) {
          setCurrentStep(response.currentStep);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  // Show loading state while initializing
  if (!isFullyInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8 text-primary" />
          <div className="text-sm text-muted-foreground">
            Initializing personalization...
          </div>
        </div>
      </div>
    );
  }

  // Show auth state
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-muted-foreground">
          Please log in to use personalization.
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
            key={`${message.id || index}-${message.content}`}
            message={message}
          />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted text-foreground">
              <div className="flex items-center gap-2">
                <Spinner className="h-4 w-4 text-primary" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isVoiceToTextMode={isVoiceToTextMode}
        setIsVoiceToTextMode={setIsVoiceToTextMode}
        isVoiceToVoiceMode={isVoiceToVoiceMode}
        setIsVoiceToVoiceMode={setIsVoiceToVoiceMode}
        isSearchMode={isSearchMode}
        setIsSearchMode={setIsSearchMode}
        disabled={isLoading || !currentThread}
      />
    </div>
  );
}