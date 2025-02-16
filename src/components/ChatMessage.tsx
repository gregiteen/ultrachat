import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import type { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

interface CodeBlockProps {
  language: string;
  value: string;
}

function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={copyToClipboard}
          className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-white"
          title="Copy code"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          padding: '1rem',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';

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
        <div className="w-full">
          {isStreaming ? (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
              <div className="h-2 w-2 rounded-full bg-current animate-pulse delay-75" />
              <div className="h-2 w-2 rounded-full bg-current animate-pulse delay-150" />
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="markdown-content whitespace-pre-wrap text-base leading-relaxed"
              components={{
                code({ node, inline, className, children, ...props }) {
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
                      className={`${className} px-1.5 py-0.5 rounded bg-opacity-20 bg-gray-700`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p({ children }) {
                  return <p className="mb-4 last:mb-0">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="mb-4 list-disc pl-6">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="mb-4 list-decimal pl-6">{children}</ol>;
                },
                li({ children }) {
                  return <li className="mb-1">{children}</li>;
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-4">
                      {children}
                    </blockquote>
                  );
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full divide-y divide-gray-300">
                        {children}
                      </table>
                    </div>
                  );
                },
                th({ children }) {
                  return (
                    <th className="px-3 py-2 text-left font-semibold bg-gray-100">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return <td className="px-3 py-2 border-t">{children}</td>;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}