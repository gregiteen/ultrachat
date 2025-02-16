import React, { useState } from 'react';
import { formatDateTime } from '../lib/utils';
import LazyHighlighter from './syntax/LazyHighlighter';
import { SearchResults } from './SearchResult';
import { useMessageStore } from '../store/chat';
import { Copy, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageProps {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    created_at: string;
    files?: string[];
    versions?: string[];
  };
}

interface SearchResultData {
  summary: string;
  sources: Array<{
    title: string;
    link: string;
    snippet: string;
    source: string;
    relevanceScore: number;
  }>;
  followUps: Array<{
    text: string;
    type: 'clarification' | 'deeper' | 'related';
  }>;
}

export function ChatMessage({ message }: MessageProps) {
  const isSystem = message.role === 'system';
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const hasFiles = message.files && message.files.length > 0;
  const hasCode = message.content.includes('```');
  const sendMessage = useMessageStore(state => state.sendMessage);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const versions = message.versions || [message.content];

  // Try to parse search results from system messages
  let searchResults: SearchResultData | null = null;
  if (isSystem && message.content.startsWith('{')) {
    try {
      const parsed = JSON.parse(message.content);
      if (parsed.type === 'search_results') {
        searchResults = parsed.data;
      }
    } catch (e) {
      // Not search results JSON, continue with normal rendering
      console.debug('Not search results:', e);
    }
  }

  const extractCodeBlock = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/;
    const match = content.match(codeBlockRegex);
    if (match) {
      return {
        language: match[1] || 'text',
        code: match[2].trim()
      };
    }
    return {
      language: 'text',
      code: content
    };
  };

  const handleFollowUpClick = (question: string) => {
    // Send follow-up question without AI response to avoid duplicate searches
    sendMessage(question, [], undefined, false, true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(versions[currentVersion]);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleRegenerate = async () => {
    if (!isAssistant) return;
    // Find the user's message that triggered this response
    const messages = useMessageStore.getState().messages;
    const index = messages.findIndex(m => m.id === message.id);
    if (index > 0) {
      const userMessage = messages[index - 1];
      // Regenerate response
      await sendMessage(userMessage.content, userMessage.files, userMessage.context_id);
    }
  };

  const renderContent = () => {
    if (searchResults) {
      return (
        <SearchResults
          summary={searchResults.summary}
          sources={searchResults.sources}
          followUps={searchResults.followUps}
          onFollowUpClick={handleFollowUpClick}
        />
      );
    }

    if (hasCode) {
      const codeBlock = extractCodeBlock(versions[currentVersion]);
      return (
        <LazyHighlighter
          language={codeBlock.language}
          code={codeBlock.code}
        />
      );
    }

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        className="prose prose-invert max-w-none"
        components={{
          code({ node, inline, className, children, ...props }) {
            if (inline) {
              return (
                <code className="bg-muted/20 rounded px-1 py-0.5" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <LazyHighlighter
                language={(className || '').replace('language-', '')}
                code={String(children).replace(/\n$/, '')}
              />
            );
          }
        }}
      >
        {versions[currentVersion]}
      </ReactMarkdown>
    );
  };

  return (
    <div className={`px-4 py-2 ${isUser ? 'flex justify-end' : ''}`}>
      {/* Message Header */}
      <div className={`flex items-center gap-2 text-sm text-muted-foreground mb-1 ${isUser ? 'justify-end' : ''}`}>
        <span className="font-medium">
          {isUser ? 'You' : isSystem ? 'System' : 'Assistant'}
        </span>
      </div>

      {/* User Message */}
      {isUser && (
        <div className="inline-block max-w-[80%] bg-primary/90 text-primary-foreground rounded-[20px] px-4 py-2">
          <p>{message.content}</p>
        </div>
      )}

      {/* Assistant Message */}
      {isAssistant && (
        <div className="relative">
          <div className="absolute right-0 top-2 flex items-center gap-2">
            {versions.length > 1 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <button
                  onClick={() => setCurrentVersion(v => Math.max(0, v - 1))}
                  disabled={currentVersion === 0}
                  className="p-1 hover:text-foreground disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm">
                  {currentVersion + 1}/{versions.length}
                </span>
                <button
                  onClick={() => setCurrentVersion(v => Math.min(versions.length - 1, v + 1))}
                  disabled={currentVersion === versions.length - 1}
                  className="p-1 hover:text-foreground disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
            <button
              onClick={handleCopy}
              className="p-1 text-muted-foreground hover:text-foreground"
              title={isCopied ? 'Copied!' : 'Copy to clipboard'}
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={handleRegenerate}
              className="p-1 text-muted-foreground hover:text-foreground"
              title="Regenerate response"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <div className="pr-24">
            {renderContent()}
          </div>
        </div>
      )}

      {/* System Message */}
      {isSystem && (
        <div className="text-foreground">
          {renderContent()}
        </div>
      )}

      {/* File Attachments */}
      {hasFiles && (
        <div className="mt-2 space-y-1">
          {message.files?.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <span>📎</span>
              <span>{file.split('/').pop()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}