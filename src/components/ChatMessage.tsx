import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { formatDateTime } from '../lib/utils';
import LazyHighlighter from './syntax/LazyHighlighter';
import { SearchResults } from './SearchResult';
import { useMessageStore } from '../store/chat';
import { useContextStore } from '../store/context';
import { Copy, RotateCcw, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { Spinner } from '../design-system/components/feedback/Spinner';
import { motion } from 'framer-motion';
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
    context_id?: string;
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

export const ChatMessage: React.FC<MessageProps> = ({ message }) => {
  const isSystem = message.role === 'system';
  const isUser = message.role === 'user';
  const isThinking = message.id === 'thinking';
  const isAssistant = message.role === 'assistant';
  const hasFiles = message.files && message.files.length > 0;
  const hasCode = message.content.includes('```');
  const isLoading = useMessageStore(state => state.sendingMessage);
  const activeContext = useContextStore(state => state.activeContext);
  const sendMessage = useMessageStore(state => state.sendMessage);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  
  const versions = useMemo(() => 
    message.versions || [message.content], 
    [message.versions, message.content]
  );

  // Try to parse search results from system messages
  const searchResults = useMemo(() => {
    if (!message.content.startsWith('{')) return null;
    try {
      const parsed = JSON.parse(message.content);
      return parsed.type === 'search_results' ? parsed.data as SearchResultData : null;
    } catch (e) {
      console.debug('Not search results:', e);
      return null;
    }
  }, [message.content]);

  const extractCodeBlock = useCallback((content: string) => {
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
  }, []);

  const handleFollowUpClick = useCallback((question: string) => {
    sendMessage(question, [], undefined, false, true);
  }, [sendMessage]);

  // Cleanup copy timeout
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isCopied) {
      timeout = setTimeout(() => setIsCopied(false), 2000);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isCopied]);
  
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(versions[currentVersion]);
      setIsCopied(true);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  }, [versions, currentVersion]);

  const handleRegenerate = useCallback(async () => {
    if (!isAssistant) return;
    const messages = useMessageStore.getState().messages;
    const index = messages.findIndex(m => m.id === message.id);
    if (index > 0) {
      const userMessage = messages[index - 1];
      await sendMessage(userMessage.content, userMessage.files, userMessage.context_id);
    }
  }, [isAssistant, message.id, sendMessage]);

  const markdownComponents = useMemo(() => ({
    code({ node, inline, className, children, ...props }: any) {
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
  }), []);

  const renderContent = useCallback(() => {
    if (isThinking) {
      return (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="h-4 w-4" />
          <span className="animate-pulse">
            {activeContext?.ai_name || 'Assistant'} is thinking
            <span className="inline-block">...</span>
          </span>
        </div>
      );
    }

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
      const { language, code } = extractCodeBlock(versions[currentVersion]);
      return (
        <LazyHighlighter
          language={language}
          code={code}
        />
      );
    }

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        className="prose prose-invert max-w-none [&_p]:mb-4 last:[&_p]:mb-0 [&_cite]:text-xs [&_cite]:text-muted-foreground"
        components={markdownComponents}
      >
        {versions[currentVersion]}
      </ReactMarkdown>
    );
  }, [
    isThinking,
    activeContext?.ai_name,
    searchResults,
    hasCode,
    versions,
    currentVersion,
    extractCodeBlock,
    handleFollowUpClick,
    markdownComponents
  ]);

  return (
    <div className={`px-4 py-2 ${isUser ? 'flex justify-end' : ''}`}>
      {/* User Message */}
      {isUser && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block max-w-[80%] bg-primary text-primary-foreground rounded-[20px] rounded-tr-sm px-4 py-2"
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </motion.div>
      )}

      {/* Assistant Message */}
      {(isAssistant || isThinking) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-muted/10 rounded-[20px] rounded-tl-sm px-4 py-2 max-w-[80%]"
        >
          {/* Message Controls */}
          <div className="absolute right-4 top-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1">
            {versions.length > 1 && !isThinking && (
              <div className="flex items-center gap-1 text-muted-foreground border-r border-muted pr-2">
                <button
                  onClick={() => setCurrentVersion(v => Math.max(0, v - 1))}
                  disabled={currentVersion === 0}
                  className="p-1 hover:text-foreground disabled:opacity-50 transition-colors"
                  aria-label="Previous version"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium">
                  {currentVersion + 1}/{versions.length}
                </span>
                <button
                  onClick={() => setCurrentVersion(v => Math.min(versions.length - 1, v + 1))}
                  disabled={currentVersion === versions.length - 1}
                  className="p-1 hover:text-foreground disabled:opacity-50 transition-colors"
                  aria-label="Next version"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
            {!isThinking && (
            <>
              <button
                onClick={handleCopy}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title={isCopied ? 'Copied!' : 'Copy to clipboard'}
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={handleRegenerate}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Regenerate response"
                disabled={isLoading}
              >
                <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </>
            )}
          </div>

          {/* Message Content */}
          <div className="pr-32">
            {renderContent()}
          </div>

          {/* Follow-up Questions */}
          {!searchResults && !isThinking && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => handleFollowUpClick("Can you explain that in more detail?")}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted/10 hover:bg-muted/20 px-2 py-1 rounded-full transition-colors"
              >
                <MessageSquare className="h-3 w-3" />
                Explain more
              </button>
              <button
                onClick={() => handleFollowUpClick("What are some practical examples of this?")}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted/10 hover:bg-muted/20 px-2 py-1 rounded-full transition-colors"
              >
                <MessageSquare className="h-3 w-3" />
                Show examples
              </button>
              <button
                onClick={() => handleFollowUpClick("What are the key takeaways?")}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted/10 hover:bg-muted/20 px-2 py-1 rounded-full transition-colors"
              >
                <MessageSquare className="h-3 w-3" />
                Key takeaways
              </button>
            </div>
          )}
        </motion.div>
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
};