import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-service';
import { useMessageStore, useThreadStore } from '../store/chat';
import { usePersonalizationStore } from '../store/personalization';

export function PersonalizationChatbot() {
  const { user } = useAuth();
  const { 
    personalInfo, 
    updatePersonalInfo, 
    initialized: personalizationInitialized, 
    loading: personalizationLoading 
  } = usePersonalizationStore();
  const { messages, sendMessage, loading: messagesLoading } = useMessageStore();
  const { threads, loading: threadsLoading } = useThreadStore();
  const [inputValue, setInputValue] = useState('');

  // Check if all required stores are initialized
  const isFullyInitialized = personalizationInitialized;
  const isLoading = personalizationLoading || threadsLoading || messagesLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !user) return;

    const content = inputValue.trim();
    setInputValue('');

    try {
      await sendMessage(
        content,
        [], // files
        undefined, // contextId
        false, // isSystemMessage
        false, // skipAiResponse
        false, // forceSearch
        { personalization_enabled: true } // metadata
      );
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">
          Please sign in to use the personalization chatbot
        </div>
      </div>
    );
  }

  if (!isFullyInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Messages */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-accent'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border rounded-md bg-background"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}