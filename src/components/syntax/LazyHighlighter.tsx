import React, { useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface LazyHighlighterProps {
  language: string;
  code: string;
}

export default function LazyHighlighter({ language, code }: LazyHighlighterProps) {
  const customizedStyle = useMemo(() => ({
    ...oneDark,
    'pre[class*="language-"]': {
      ...oneDark['pre[class*="language-"]'],
      backgroundColor: '#1a1b26', // Darker background for better contrast
      margin: 0,
      borderRadius: '0.5rem',
      padding: '1rem',
      outline: 'none',
    },
    'code[class*="language-"]': {
      ...oneDark['code[class*="language-"]'],
      textShadow: 'none', // Remove text shadow for better readability
      fontSize: '0.9rem',
      lineHeight: '1.5',
    },
  }), []);

  return (
    <div
      role="region"
      aria-label={`Code block in ${language || 'plain text'}`}
      className="focus-within:ring-2 focus-within:ring-primary focus:outline-none rounded-lg"
    >
      <SyntaxHighlighter
        language={language || 'text'}
        style={customizedStyle}
        PreTag={({ children, ...props }) => (
          <pre 
            {...props}
            tabIndex={0}
            aria-label={`${language || 'plain text'} code example`}
          >
            {children}
          </pre>
        )}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}