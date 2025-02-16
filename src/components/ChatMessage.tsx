import React, { memo, useState, lazy, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import type { Message } from '../types';

// Lazy load syntax highlighter components
const LazyHighlighter = lazy(() => import('./syntax/LazyHighlighter'));

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

interface CodeBlockProps {
  language: string;
  value: string;
}

// Memoize CodeBlock to prevent unnecessary re-renders
const CodeBlock = memo(({ language, value }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
      alert('Failed to copy code to clipboard');
    }
  };

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={copyToClipboard}
          className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-white focus:ring-2 focus:ring-primary focus:outline-none"
          aria-label={copied ? "Code copied" : "Copy code"}
          aria-pressed={copied}
          onKeyDown={(e) => e.key === 'Enter' && copyToClipboard()}
          tabIndex={0}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      <Suspense fallback={
        <div 
          className="animate-pulse bg-gray-700 rounded-lg p-4"
          role="status"
          aria-label="Loading code block"
        >
          <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-600 rounded w-1/2"></div>
        </div>
      }>
        <LazyHighlighter language={language} code={value} />
      </Suspense>
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';

// Memoize markdown components to prevent unnecessary re-renders
const markdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const value = String(children).replace(/\n$/, '');

    if (!inline && match) {
      return (
        <CodeBlock
          language={language}
          value={value}
        />
      );
    }

    return (
      <code
        className={`${className} px-1.5 py-0.5 rounded bg-opacity-20 bg-gray-700 focus:ring-2 focus:ring-primary focus:outline-none`}
        {...props}
      >
        {children}
      </code>
    );
  },
  p: memo(({ children }: { children: React.ReactNode }) => (
    <p className="mb-4 last:mb-0">{children}</p>
  )),
  ul: memo(({ children }: { children: React.ReactNode }) => (
    <ul className="mb-4 list-disc pl-6">{children}</ul>
  )),
  ol: memo(({ children }: { children: React.ReactNode }) => (
    <ol className="mb-4 list-decimal pl-6">{children}</ol>
  )),
  li: memo(({ children }: { children: React.ReactNode }) => (
    <li className="mb-1">{children}</li>
  )),
  blockquote: memo(({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-4">
      {children}
    </blockquote>
  )),
  table: memo(({ children }: { children: React.ReactNode }) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full divide-y divide-gray-300">
        {children}
      </table>
    </div>
  )),
  th: memo(({ children }: { children: React.ReactNode }) => (
    <th className="px-3 py-2 text-left font-semibold bg-gray-100">
      {children}
    </th>
  )),
  td: memo(({ children }: { children: React.ReactNode }) => (
    <td className="px-3 py-2 border-t">{children}</td>
  )),
};

// Memoize the entire ChatMessage component
export const ChatMessage = memo(({ message, isStreaming }: ChatMessageProps) => {
  const isUser = message.role === 'user';

  return (
    <div 
      className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      role="listitem"
    >
      <div
        className={`message-bubble flex max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-primary text-button-text focus-within:ring-2 focus-within:ring-primary-light' 
            : 'bg-muted text-foreground'
        }`}
        style={{
          borderRadius: isUser ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
        }}
      >
        <div 
          className="w-full"
          role={isUser ? "complementary" : "main"}
          aria-label={`${isUser ? "Your" : "Assistant's"} message`}
        >
          {isStreaming ? (
            <div 
              className="flex items-center gap-1"
              role="status"
              aria-label="Assistant is typing"
            >
              <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
              <div className="h-2 w-2 rounded-full bg-current animate-pulse delay-75" />
              <div className="h-2 w-2 rounded-full bg-current animate-pulse delay-150" />
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="markdown-content whitespace-pre-wrap text-base leading-relaxed focus:outline-none"
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';