import React, { useState, useEffect } from 'react';
import { ChatMessage } from '../ChatMessage';
import { usePersonalizationStore } from '../../store/personalization';
import type { 
  PersonalizationChatState, 
  PersonalizationMessage,
  AIResponse,
  PersonalizationIntent
} from '../../types/personalization';
import { AIPersonalizationService } from '../../lib/ai-personalization';
import type { PersonalInfo } from '../../types';

interface AIPersonalizationChatProps {
  personalInfo: PersonalInfo;
  setPersonalInfo: (info: PersonalInfo) => void;
  onComplete?: () => void;
  selectedFile?: string | null;
}

export function AIPersonalizationChat({ 
  personalInfo, 
  setPersonalInfo, 
  onComplete,
  selectedFile 
}: AIPersonalizationChatProps) {
  const aiService = AIPersonalizationService.getInstance();
  
  const [state, setState] = useState<PersonalizationChatState>({
    currentStep: 0,
    messages: [],
    extractedInfo: {},
    isProcessing: false,
    error: null
  });

  const [input, setInput] = useState('');

  // Initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      console.log('Initializing chat...');
      if (state.messages.length === 0) {
        setState(prev => ({ ...prev, isProcessing: true, error: null }));
        try {
          const response = await aiService.generateChatResponse(
            'START_CHAT',
            null,
            { ...state, messages: [] }
          );
          console.log('Received initial response:', response);

          const greeting: PersonalizationMessage = {
            id: 'greeting',
            user_id: '',
            thread_id: '',
            content: response.message,
            role: 'assistant',
            type: 'greeting',
            created_at: new Date().toISOString()
          };
          
          setState(prev => ({
            ...prev,
            messages: [greeting],
            isProcessing: false
          }));
        } catch (error) {
          console.error('Error initializing chat:', error);
          setState(prev => ({
            ...prev,
            error: 'Failed to start chat. Please refresh the page.',
            isProcessing: false
          }));
        }
      }
    };
    initializeChat();
  }, []);

  // Handle file selection
  useEffect(() => {
    const handleFileSelection = async () => {
      console.log('Handling file selection:', selectedFile);
      if (selectedFile) {
        setState(prev => ({ ...prev, isProcessing: true, error: null }));
        try {
          const response = await aiService.generateChatResponse(
            `FILE_SELECTED:${selectedFile}`,
            null,
            state
          );
          console.log('Received file response:', response);

          const fileMessage: PersonalizationMessage = {
            id: `file-${Date.now()}`,
            user_id: '',
            thread_id: '',
            content: response.message,
            role: 'assistant',
            type: 'question',
            created_at: new Date().toISOString()
          };

          setState(prev => ({
            ...prev,
            messages: [...prev.messages, fileMessage],
            isProcessing: false
          }));
        } catch (error) {
          console.error('Error handling file:', error);
          setState(prev => ({
            ...prev,
            error: 'Failed to process file. Please try again.',
            isProcessing: false
          }));
        }
      }
    };
    handleFileSelection();
  }, [selectedFile]);

  // Handle user input submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    console.log('Handling user input:', input);
    // Add user message
    const userMessage: PersonalizationMessage = {
      id: `user-${Date.now()}`,
      user_id: '',
      thread_id: '',
      content: input,
      role: 'user',
      type: 'response',
      created_at: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isProcessing: true,
      error: null
    }));

    try {
      console.log('Detecting intent...');
      // Detect intent from user input
      const detectedIntent = await aiService.detectIntent(input, {
        ...state,
        messages: [...state.messages, userMessage]
      });
      
      console.log('Generating AI response...');
      // Generate AI response based on intent
      const aiResponse = await aiService.generateChatResponse(
        input,
        null, // No files for this request
        {
          ...state,
          messages: [...state.messages, userMessage]
        }
      );
      console.log('Received AI response:', aiResponse);

      // Update state with AI response
      const aiMessage: PersonalizationMessage = {
        id: `ai-${Date.now()}`,
        user_id: '',
        thread_id: '',
        content: aiResponse.message,
        role: 'assistant',
        type: aiResponse.type,
        intent: aiResponse.intent,
        suggestions: aiResponse.suggestions,
        created_at: new Date().toISOString()
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        extractedInfo: {
          ...prev.extractedInfo,
          ...aiResponse.extractedInfo
        },
        isProcessing: false
      }));

      // Update personal info if new information was extracted
      if (aiResponse.extractedInfo) {
        setPersonalInfo({
          ...personalInfo,
          ...aiResponse.extractedInfo
        });
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to process your message. Please try again.',
        isProcessing: false
      }));
    }

    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {state.messages.map((msg) => (
          <div key={msg.id} className={msg.role === 'user' ? 'ml-auto' : ''}>
            <ChatMessage message={msg} />
            {msg.suggestions && msg.suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {msg.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(suggestion)}
                    className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm hover:bg-secondary/20 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{state.error}</span>
            <p className="text-sm mt-1">Please try again or refresh the page if the problem persists.</p>
          </div>
        )}
        {state.isProcessing && (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <div className="animate-pulse">Thinking...</div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-muted">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
            placeholder="Type your response..."
            disabled={state.isProcessing}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-button-text rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
            disabled={state.isProcessing || !input.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}