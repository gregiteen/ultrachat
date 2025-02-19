import React from 'react';
import { useMessageStore } from '../store/chat';
import { ChatMessage } from './ChatMessage';
import { Spinner } from '../design-system/components/feedback/Spinner';
import type { Task } from '../types/task';

interface TaskAssistantProps {
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
}

export function TaskAssistant({ onCreateTask, onEditTask }: TaskAssistantProps) {
  const { messages, loading: messagesLoading } = useMessageStore();

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
        {messagesLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted text-foreground">
              <div className="flex items-center gap-2">
                <Spinner className="h-4 w-4 text-primary" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}