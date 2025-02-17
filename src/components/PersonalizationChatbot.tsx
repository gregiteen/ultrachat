import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePersonalizationStore } from '../store/personalization';
import { useAuthStore } from '../store/auth';
import { useMessageStore, useThreadStore } from '../store/chat';
import { AIPersonalization } from '../lib/ai-personalization';
import { PersonalizationThreadDialog } from './PersonalizationThreadDialog';
import type { Task, PersonalInfo } from '../types';


interface Props {
  isRecording: boolean;
  onCreateTask?: () => void;
  onEditTask?: (task: Task) => void;
}

export function PersonalizationChatbot({ isRecording, onCreateTask, onEditTask }: Props) {
  const { personalInfo, updatePersonalInfo, initialized: personalizationInitialized, loading: personalizationLoading } = usePersonalizationStore();
  const { initialized: authInitialized, user } = useAuthStore();
  const { messages, sendMessage } = useMessageStore();
  const { currentThreadId, switchThread } = useThreadStore();
  const [input, setInput] = useState('');
  const [showThreadDialog, setShowThreadDialog] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Get thread ID from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const threadId = params.get('thread');
    if (threadId) {
      handleThreadSelect(threadId);
      setShowThreadDialog(false);
    }
  }, [location.search]);

  useEffect(() => {
    // Auto-scroll to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (authInitialized && user && personalizationInitialized && !personalizationLoading && !showThreadDialog && messages.length === 0) {
      handleSendMessage('START_CHAT');
    }
  }, [authInitialized, user, personalizationInitialized, personalizationLoading, showThreadDialog, messages.length]);

  const handleThreadSelect = async (threadId: string) => {
    try {
      if (threadId === 'new') {
        await switchThread('');
        setShowThreadDialog(false);
      } else {
        await switchThread(threadId);
        setShowThreadDialog(false);
      }
    } catch (error) {
      console.error('Error selecting thread:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!user || (!content.trim() && !isRecording) || showThreadDialog) return;

    setIsProcessing(true);
    setInput('');

    try {
      const aiService = AIPersonalization.getInstance();
      const response = await aiService.generateChatResponse(content, null, {
        currentStep: 0,
        messages: messages.map(m => ({ role: m.role === 'system' ? 'assistant' : m.role, content: m.content })),
        extractedInfo: personalInfo,
        isProcessing: false,
        error: null
      });

      // Update form fields with any extracted info
      if (response.extractedInfo && Object.keys(response.extractedInfo).length > 0) {
        const updatedInfo: PersonalInfo = { ...personalInfo };
        
        // Update each field that was extracted
        Object.entries(response.extractedInfo as Partial<PersonalInfo>).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // Handle nested objects like address
            if (key === 'address' && typeof value === 'object') {
              updatedInfo.address = {
                ...updatedInfo.address,
                ...(value as PersonalInfo['address'])
              };
            }
            else {
              switch (key) {
                case 'interests':
                case 'expertise':
                case 'health_concerns':
                case 'pets':
                case 'goals':
                case 'hobbies':
                  updatedInfo[key] = value as string[];
                  break;
                case 'name':
                case 'email':
                case 'phone':
                case 'job':
                case 'company':
                case 'religion':
                case 'worldview':
                  updatedInfo[key] = value as string;
                  break;
              }
            }
          }
        });

        // Update the form
        await updatePersonalInfo(updatedInfo);
      }

      // Handle task-related commands
      if (response.message.toLowerCase().includes('create a new task') && onCreateTask) {
        onCreateTask();
      } else if (response.message.toLowerCase().includes('edit task') && onEditTask) {
        const taskMatch = response.message.match(/edit task "([^"]+)"/i);
        if (taskMatch && response.extractedInfo?.task) {
          onEditTask(response.extractedInfo.task as Task);
        }
      }

      // Send user message
      await sendMessage(content, [], undefined, true);
      
      // Send AI response
      await sendMessage(response.message, [], undefined, true, true);

      // Handle navigation based on AI response
      if (response.message.toLowerCase().includes('let me take you to')) {
        const match = response.message.match(/let me take you to the (\w+) page/i);
        if (match) {
          const page = match[1].toLowerCase();
          navigate(`/${page}`);
        }
      }

    } catch (error) {
      console.error('Error in chat:', error);
      await sendMessage('I apologize, but I encountered an error. Could you try rephrasing that?', [], undefined, true, true);
    } finally {
      setIsProcessing(false);
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
    <div className="flex flex-col h-full">
      {showThreadDialog && (
        <PersonalizationThreadDialog
          onClose={() => setShowThreadDialog(false)}
          onSelect={handleThreadSelect}
        />
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
            data-role={message.role}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'assistant'
                  ? 'bg-muted text-foreground'
                  : 'bg-primary text-button-text'
              } message ${message.role === 'user' ? 'user-message' : ''}`}
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

      {/* Chat Input */}
      <div className="border-t border-muted p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
            placeholder={isRecording ? 'Listening...' : 'Type a message...'}
            className="flex-1 rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
            disabled={isProcessing || isRecording || showThreadDialog}
          />
          <button
            onClick={() => handleSendMessage(input)}
            disabled={isProcessing || isRecording || !input.trim() || showThreadDialog}
            className="px-4 py-2 bg-primary text-button-text rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}