import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { useMessageStore, useThreadStore } from '../store/chat';
import { ChatMessage } from './ChatMessage';
import type { Message } from '../types';
import { withErrorBoundary } from './ErrorBoundary';
import { Spinner } from '../design-system/components/feedback/Spinner';

const OVERSCAN_COUNT = 20;
const INTERSECTION_THRESHOLD = 0.5;
const SCROLL_DEBOUNCE_MS = 100;

const VirtualizedChatHistory: React.FC = () => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [error, setError] = useState<string | null>(null);
  
  const {
    messages,
    hasMoreMessages,
    loading,
    fetchMessages,
    currentPage
  } = useMessageStore();
  
  const { currentThreadId } = useThreadStore();

  const loadMore = useCallback(async () => {
    try {
      if (!loading && hasMoreMessages && currentThreadId) {
        const nextPage = currentPage + 1;
        await fetchMessages(currentThreadId, nextPage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more messages';
      setError(errorMessage);
      console.error('Error loading messages:', err);
    }
  }, [loading, hasMoreMessages, currentThreadId, currentPage, fetchMessages]);

  // Memoize intersection observer options
  const observerOptions = useMemo(() => ({
    threshold: INTERSECTION_THRESHOLD,
    root: null,
    rootMargin: '100px',
  }), []);

  // Optimized intersection observer setup
  useEffect(() => {
    if (!currentThreadId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          loadMore();
        }
      },
      observerOptions
    );

    const firstMessage = document.querySelector('[data-message-id]');
    if (firstMessage) {
      observer.observe(firstMessage);
    }

    return () => {
      observer.disconnect();
    };
  }, [loadMore, observerOptions, currentThreadId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (virtuosoRef.current && messages.length > 0) {
      virtuosoRef.current.scrollToIndex({
        index: messages.length - 1,
        behavior: 'smooth',
      });
    }
  }, [messages.length]);

  // Error recovery
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Memoize scroll handler with debouncing
  const scrollHandler = useMemo(() => {
    let scrollTimeout: NodeJS.Timeout;
    return () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (virtuosoRef.current) {
          virtuosoRef.current.scrollToIndex({
            index: messages.length - 1,
            behavior: 'smooth',
          });
        }
      }, SCROLL_DEBOUNCE_MS);
    };
  }, [messages.length]);

  // Cleanup scroll handler
  useEffect(() => {
    return () => {
      const scroller = document.querySelector('[data-virtuoso-scroller]');
      if (scroller) {
        scroller.removeEventListener('scroll', scrollHandler);
      }
    };
  }, [scrollHandler]);

  if (error) {
    return (
      <div 
        role="alert"
        className="flex h-full items-center justify-center text-red-500 p-4"
      >
        <p>{error}</p>
        <button 
          onClick={() => { setError(null); loadMore(); }}
          className="ml-2 underline hover:text-red-600"
          aria-label="Retry loading messages"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading && messages.length === 0) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="flex-1 h-full">
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        startReached={loadMore}
        overscan={OVERSCAN_COUNT}
        role="log"
        aria-label="Chat message history"
        tabIndex={0}
        scrollerRef={(el: HTMLElement | Window | null) => {
          if (el) {
            el.addEventListener('scroll', scrollHandler, { passive: true });
          }
        }}
        itemContent={(_, message: Message) => (
          <div 
            key={message.id}
            data-message-id={message.id}
            className="p-2"
            role="article"
            aria-label={`Message from ${message.role}`}
          >
            <ChatMessage message={message} />
          </div>
        )}
        followOutput="smooth"
        alignToBottom
        initialTopMostItemIndex={messages.length - 1}
        components={{
          Header: () => loading ? <LoadingSpinner size="small" /> : null,
        }}
      />
    </div>
  );
};

const LoadingSpinner = ({ size }: { size: 'small' | 'large' }) => (
  <div className="flex h-full items-center justify-center p-2">
    <Spinner size={size === 'large' ? 'lg' : 'sm'} color="primary" />
  </div>
);

export default withErrorBoundary(VirtualizedChatHistory, {
  onError: (error, errorInfo) => {
    console.error('Chat history error:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }
});