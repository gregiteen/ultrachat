import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePersonalizationStore } from '../store/personalization';
import { useAuthStore } from '../store/auth';
import { useMessageStore, useThreadStore } from '../store/chat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { aiPersonalization } from '../lib/ai-personalization';
import type { Task } from '../types';

interface PersonalizationChatbotProps {
  currentPath?: string;
}

export function PersonalizationChatbot({ currentPath }: PersonalizationChatbotProps) {
  const { personalInfo, updatePersonalInfo, initialized: personalizationInitialized, loading: personalizationLoading } = usePersonalizationStore();
  const { initialized: authInitialized, user } = useAuthStore();
  const { messages, sendMessage, loading: messagesLoading } = useMessageStore();
  const { currentThread } = useThreadStore();
  const [isVoiceToTextMode, setIsVoiceToTextMode] = useState(false);
  const [isVoiceToVoiceMode, setIsVoiceToVoiceMode] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-scroll to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send initial message when path changes
  useEffect(() => {
    if (currentPath && messages.length === 0) {
      sendMessage(
        `I notice you're on the personalization page. I'd love to learn more about you to help customize your experience. What would you like to tell me about yourself? We can talk about your interests, work style, or anything else you'd like to share.`,
        [],
        undefined,
        true
      );
    }
  }, [currentPath, messages.length, sendMessage]);

  // Handle message with personalization
  const handleSendMessage = async (
    content: string,
    files?: string[],
    contextId?: string,
    isSystemMessage?: boolean,
    skipAiResponse?: boolean,
    forceSearch?: boolean
  ) => {
    // First send the message normally
    await sendMessage(content, files, contextId, isSystemMessage, true);

    if (!skipAiResponse) {
      // Get AI response with potential field updates
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
      await sendMessage(response.message, [], contextId, true);

      // Update step if provided
      if (response.currentStep !== undefined) {
        setCurrentStep(response.currentStep);
      }
    }
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

  if (!personalizationInitialized || personalizationLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-lg text-muted-foreground">
          Initializing chat...
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
        onSendMessage={handleSendMessage}
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