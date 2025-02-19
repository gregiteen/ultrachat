import React, { useEffect, useRef, useCallback } from 'react';
import { useThreadStore } from '../store/threadStore';
import { useMessageStore } from '../store/messageStore';
import { PlusCircle, MessageCircle, Pin, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Spinner } from '../design-system/components/feedback/Spinner';
import { useInView } from 'react-intersection-observer';

export function ChatSidebar() {
  const { 
    threads, 
    createThread, 
    selectThread, 
    currentThread,
    loading,
    error,
    initialized,
    hasMore,
    loadMoreThreads
  } = useThreadStore();
  const { clearThreadMessages } = useMessageStore();

  // Set up infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
    rootMargin: '100px',
  });

  // Load more threads when scrolled to bottom
  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMoreThreads();
    }
  }, [inView, hasMore, loading, loadMoreThreads]);

  const handleNewChat = async () => {
    try {
      console.log('Creating new thread...');
      const thread = await createThread();
      if (thread) {
        console.log('New thread created:', thread.id);
        await selectThread(thread.id);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleSelectThread = async (threadId: string) => {
    try {
      console.log('Selecting thread:', threadId);
      await selectThread(threadId);
    } catch (error) {
      console.error('Error selecting thread:', error);
    }
  };

  // Show loading state
  if (!initialized) {
    return (
      <div className="w-64 h-full bg-background border-r border-muted flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner className="h-8 w-8 text-primary" />
            <div className="text-sm text-muted-foreground">
              Loading conversations...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-64 h-full bg-background border-r border-muted flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 px-4 text-center">
            <div className="text-sm text-destructive">
              {error}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 h-full bg-background border-r border-muted flex flex-col">
      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={handleNewChat}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <PlusCircle className="h-5 w-5" />
          )}
          New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-4 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              No conversations yet. Start a new chat to begin.
            </div>
          </div>
        ) : (
          <>
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => handleSelectThread(thread.id)}
                disabled={loading}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentThread?.id === thread.id ? 'bg-muted/50' : ''
                }`}
              >
                <div className="flex items-center gap-2 flex-shrink-0">
                  <MessageCircle className={`h-5 w-5 ${thread.pinned ? 'text-primary' : ''}`} />
                  {thread.pinned && (
                    <Pin className="h-3 w-3 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate flex-1">
                      {thread.title || 'New Chat'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(thread.updated_at || thread.created_at), { addSuffix: true })}
                  </div>
                </div>
              </button>
            ))}
            {/* Load more trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-4 flex justify-center">
                {loading ? (
                  <Spinner className="h-6 w-6 text-primary" />
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Scroll to load more
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}