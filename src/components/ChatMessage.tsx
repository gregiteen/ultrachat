import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';
  console.log("ChatMessage - isUser:", isUser, "content:", message.content);

  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`message-bubble flex max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-primary text-button-text'
            : 'bg-muted text-foreground'
        }`}
        style={{
          borderRadius: isUser ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
        }}
      >
        <div>
          {isStreaming ? (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
              <div className="h-2 w-2 rounded-full bg-current animate-pulse delay-75" />
              <div className="h-2 w-2 rounded-full bg-current animate-pulse delay-150" />
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="whitespace-pre-wrap text-base leading-relaxed"
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}