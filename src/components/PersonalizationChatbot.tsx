import React, { useState, useEffect, useRef } from 'react';
import { usePersonalizationStore } from '../store/personalization';
import { AIPersonalizationService } from '../lib/ai-personalization';
import type { PersonalInfo } from '../types';

interface Props {
  isRecording: boolean;
}

export function PersonalizationChatbot({ isRecording }: Props) {
  const { personalInfo, updatePersonalInfo } = usePersonalizationStore();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start chat when mounted
  useEffect(() => {
    handleSendMessage('START_CHAT');
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() && !isRecording) return;

    setIsProcessing(true);
    const newMessages = [...messages, { role: 'user' as const, content }];
    setMessages(newMessages);
    setInput('');

    try {
      const aiService = AIPersonalizationService.getInstance();
      const response = await aiService.generateChatResponse(content, null, {
        currentStep: 0,
        messages: newMessages,
        extractedInfo: personalInfo,
        isProcessing: false,
        error: null
      });

      // Update form fields with any extracted info
      if (response.extractedInfo && Object.keys(response.extractedInfo).length > 0) {
        const updatedInfo = { ...personalInfo };
        
        // Update each field that was extracted
        Object.entries(response.extractedInfo).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // Handle nested objects like address
            if (key === 'address' && typeof value === 'object') {
              updatedInfo.address = { ...updatedInfo.address, ...value };
            }
            // Handle array fields
            else if (Array.isArray(value)) {
              (updatedInfo as any)[key] = value;
            }
            // Handle simple fields
            else {
              updatedInfo[key as keyof PersonalInfo] = value;
            }
          }
        });

        // Update the form
        await updatePersonalInfo(updatedInfo);
      }

      setMessages([...newMessages, { role: 'assistant' as const, content: response.message }]);
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages([
        ...newMessages,
        { role: 'assistant' as const, content: 'I apologize, but I encountered an error. Could you try rephrasing that?' }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'assistant'
                  ? 'bg-muted text-foreground'
                  : 'bg-primary text-button-text'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isProcessing && (
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
      <div className="border-t border-muted p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
            placeholder={isRecording ? 'Listening...' : 'Type a message...'}
            className="flex-1 rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
            disabled={isProcessing || isRecording}
          />
          <button
            onClick={() => handleSendMessage(input)}
            disabled={isProcessing || isRecording || !input.trim()}
            className="px-4 py-2 bg-primary text-button-text rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}