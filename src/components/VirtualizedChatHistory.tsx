import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useMessageStore, useThreadStore } from '../store/chat';
import { ChatMessage } from './ChatMessage';
import type { Message } from '../types';
import { withErrorBoundary } from './ErrorBoundary';

const OVERSCAN_COUNT = 20;
const INTERSECTION_THRESHOLD = 0.5;
const PERFORMANCE_BUFFER_SIZE = 100;

const VirtualizedChatHistory: React.FC = () => {
  const virtuosoRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const {
    messages,
    hasMoreMessages,
    loading,
    fetchMessages,
    currentPage
  } = useMessageStore();
  
  const { currentThreadId } = useThreadStore();

  // Performance monitoring
  const performanceMetrics = useRef<{
    renderTimes: number[];
    scrollTimes: number[];
  }>({
    renderTimes: [],
    scrollTimes: []
  });

  const trackPerformance = useCallback((metric: 'render' | 'scroll', time: number) => {
    const metrics = performanceMetrics.current[`${metric}Times`];
    metrics.push(time);
    
    if (metrics.length > PERFORMANCE_BUFFER_SIZE) {
      const avg = metrics.reduce((a, b) => a + b, 0) / metrics.length;
      console.debug(`Average ${metric} time:`, avg.toFixed(2), 'ms');
      metrics.length = 0; // Clear buffer
    }
  }, []);

  const renderStartTime = useRef(Date.now());

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

  // Set up intersection observer for more efficient loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: INTERSECTION_THRESHOLD }
    );
    const firstMessage = document.querySelector('[data-message-id]');
    if (firstMessage) observer.observe(firstMessage);
    return () => observer.disconnect();
  }, [loadMore]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (virtuosoRef.current && messages.length > 0) {
      (virtuosoRef.current as any).scrollToIndex({
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
      }, 5000); // Clear error after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Track render performance
  useEffect(() => {
    const renderTime = Date.now() - renderStartTime.current;
    trackPerformance('render', renderTime);
    renderStartTime.current = Date.now();
  });

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
        scrollerRef={useCallback((el: HTMLElement | Window | null) => {
          if (el) {
            el.addEventListener('scroll', () => {
              trackPerformance('scroll', performance.now());
            }, { passive: true });
          }
        }, [trackPerformance])}
        itemContent={(index, message: Message) => (
          <div 
            data-message-id={message.id}
            className="p-2"
            role="article"
            aria-label={`Message from ${message.role}`}
          >
            <ChatMessage
              message={message}
            />
          </div>
        )}
        followOutput="smooth"
        alignToBottom
        initialTopMostItemIndex={messages.length - 1}
        components={{
          Header: () =>
            loading ? <LoadingSpinner size="small" /> : null,
        }}
      />
    </div>
  );
};

interface LoadingSpinnerProps {
  size: 'small' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size }) => {
  const dimensions = size === 'large' ? 'h-8 w-8' : 'h-5 w-5';
  
  return (
    <div 
      className="flex h-full items-center justify-center p-2"
      role="status"
      aria-label="Loading messages"
    >
      <div 
        className={`animate-spin rounded-full ${dimensions} border-b-2 border-primary`}
        aria-hidden="true"
      />
      <span className="sr-only">
        Loading messages
      </span>
    </div>
  );
};

export default withErrorBoundary(VirtualizedChatHistory, {
  onError: (error, errorInfo) => {
    console.error('Chat history error:', error);
    console.error('Component stack:', errorInfo.componentStack);
    // You could send this to an error tracking service
    // trackError(error, errorInfo);
  }
});