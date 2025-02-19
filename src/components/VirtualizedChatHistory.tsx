import React, { useEffect, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useThreadStore } from '../store/threadStore';
import { motion } from 'framer-motion';
import { MessageSquare, Star, Trash2, Plus } from 'lucide-react';

interface VirtualizedChatHistoryProps {
  onThreadSelect?: () => void;
}

export function VirtualizedChatHistory({ onThreadSelect }: VirtualizedChatHistoryProps) {
  const { threads, currentThread, fetchThreads, selectThread, deleteThread, pinThread, createThread } = useThreadStore();

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handleThreadClick = (threadId: string) => {
    selectThread(threadId);
    onThreadSelect?.();
  };

  const handlePinThread = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    await pinThread(threadId);
  };

  const handleDeleteThread = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    await deleteThread(threadId);
  };

  const handleNewChat = async () => {
    try {
      const newThread = await createThread();
      await selectThread(newThread.id);
    } catch (error) {
      console.error('Error creating new thread:', error);
    }
    onThreadSelect?.();
  };

  // Group threads by date with memoization
  const { groupedThreads, sortedDates } = useMemo(() => {
    // Create a Map to track seen thread IDs
    const seenThreads = new Map();
    
    // Group threads by date, ensuring uniqueness
    const groups = threads.reduce((acc, thread) => {
      // Skip if we've seen this thread before
      if (seenThreads.has(thread.id)) {
        return acc;
      }
      seenThreads.set(thread.id, true);

      const date = new Date(thread.created_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(thread);
      return acc;
    }, {} as Record<string, typeof threads>);

    // Sort threads within each group by pinned status and updated_at
    Object.values(groups).forEach(dateThreads => {
      dateThreads.sort((a, b) => {
        if (a.pinned !== b.pinned) {
          return b.pinned ? 1 : -1;
        }
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
    });

    // Sort dates in reverse chronological order
    const dates = Object.keys(groups).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });

    return { groupedThreads: groups, sortedDates: dates };
  }, [threads]);

  const renderThread = (thread: (typeof threads)[0], dateKey: string) => (
    <motion.div
      key={`${dateKey}-${thread.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onClick={() => handleThreadClick(thread.id)}
      className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        currentThread?.id === thread.id
          ? 'bg-primary text-white'
          : 'hover:bg-muted'
      }`}
    >
      <MessageSquare className="h-5 w-5 flex-shrink-0" />
      <span className="flex-1 text-sm font-medium truncate">
        {thread.title || 'New Chat'}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => handlePinThread(e, thread.id)}
          className={`p-1 rounded-lg transition-colors ${
            currentThread?.id === thread.id
              ? 'hover:bg-primary-dark text-white'
              : 'hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground'
          }`}
        >
          <Star
            className={`h-4 w-4 ${thread.pinned ? 'fill-current' : ''}`}
          />
        </button>
        <button
          onClick={(e) => handleDeleteThread(e, thread.id)}
          className={`p-1 rounded-lg transition-colors ${
            currentThread?.id === thread.id
              ? 'hover:bg-primary-dark text-white'
              : 'hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground'
          }`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-4 border-b border-muted">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Thread List */}
      {sortedDates.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">No conversations yet</p>
            <p className="text-sm">Click New Chat to get started</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <Virtuoso
            style={{ height: '100%' }}
            totalCount={sortedDates.length}
            itemContent={(index) => {
              const date = sortedDates[index];
              const dateThreads = groupedThreads[date];
              return (
                <div key={`date-group-${date}`} className="space-y-1 px-2">
                  <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2">
                    <h3 className="text-xs font-medium text-muted-foreground px-3">
                      {date === new Date().toLocaleDateString()
                        ? 'Today'
                        : date === new Date(Date.now() - 86400000).toLocaleDateString()
                        ? 'Yesterday'
                        : date}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {dateThreads.map(thread => renderThread(thread, date))}
                  </div>
                </div>
              );
            }}
          />
        </div>
      )}
    </div>
  );
}
