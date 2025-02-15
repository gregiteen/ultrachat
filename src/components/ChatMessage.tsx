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

  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`message-bubble flex max-w-[80%] rounded-lg px-4 py-3`}
        style={
          isUser
            ? { backgroundColor: 'blue', color: 'white', borderRadius: '20px 4px 20px 20px' }
            : { backgroundColor: 'yellow', color: 'black', borderRadius: '4px 20px 20px 20px' }
        }
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {isStreaming ? (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
              <div className="h-2 w-2 rounded-full bg-current animate-pulse delay-75" />
              <div className="h-2 w-2 rounded-full bg-current animate-pulse delay-150" />
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="whitespace-pre-wrap text-[15px] leading-relaxed"
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}