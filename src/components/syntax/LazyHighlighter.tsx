import React, { useMemo, lazy, Suspense } from 'react';
import { Spinner } from '../../design-system/components/feedback/Spinner';
import type { CSSProperties } from 'react';

// Lazy load the syntax highlighter
const SyntaxHighlighter = lazy(() => 
  import('react-syntax-highlighter').then(({ Prism }) => ({ 
    default: Prism 
  }))
);

interface LazyHighlighterProps {
  language: string;
  code: string;
}

interface PreTagProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export default function LazyHighlighter({ language, code }: LazyHighlighterProps) {
  // Memoize base theme styles
  const baseTheme = useMemo(() => ({
    'pre[class*="language-"]': {
      backgroundColor: '#1a1b26',
      margin: 0,
      borderRadius: '0.5rem',
      padding: '1rem',
      outline: 'none',
    } as CSSProperties,
    'code[class*="language-"]': {
      textShadow: 'none',
      fontSize: '0.9rem',
      lineHeight: 1.5,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    } as CSSProperties,
  }), []);

  // Memoize custom styles
  const customStyle = useMemo((): CSSProperties => ({
    padding: '1rem',
    margin: 0,
    borderRadius: '0.5rem',
    backgroundColor: '#1a1b26',
  }), []);

  // Memoize code tag props
  const codeTagProps = useMemo(() => ({
    className: 'text-sm font-mono',
    style: {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    } as CSSProperties,
  }), []);

  // Memoize PreTag component
  const PreTag = useMemo(() => {
    return function PreTag({ children, className, ...props }: PreTagProps) {
      return (
        <pre 
          {...props}
          tabIndex={0}
          aria-label={`${language || 'plain text'} code example`}
          className={`${className || ''} focus:outline-none focus:ring-2 focus:ring-primary`}
        >
          {children}
        </pre>
      );
    };
  }, [language]);

  // Loading fallback component
  const LoadingFallback = useMemo(() => (
    <div className="flex items-center justify-center p-4 bg-muted/10 rounded-lg min-h-[100px]">
      <Spinner size="sm" />
    </div>
  ), []);

  return (
    <div
      role="region"
      aria-label={`Code block in ${language || 'plain text'}`}
      className="relative focus-within:ring-2 focus-within:ring-primary focus:outline-none rounded-lg overflow-hidden"
    >
      <Suspense fallback={LoadingFallback}>
        <SyntaxHighlighter
          language={language || 'text'}
          style={baseTheme}
          PreTag={PreTag}
          codeTagProps={codeTagProps}
          customStyle={customStyle}
          wrapLongLines={true}
          showLineNumbers={code.split('\n').length > 1}
        >
          {code.trim()}
        </SyntaxHighlighter>
      </Suspense>
    </div>
  );
}