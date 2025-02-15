import React from 'react';
import { format, isToday, isYesterday, isSameDay, parseISO } from 'date-fns';
import { useChatStore } from '../store/chat';

interface GroupedThread {
  date: Date;
  threads: Array<{
    id: string;
    title: string;
    updated_at: string;
  }>;
}

export function ChatHistory() {
  const { threads, loading, switchThread, currentThreadId } = useChatStore();

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Group threads by date
  const groupedThreads = threads.reduce((groups: GroupedThread[], thread) => {
    const date = parseISO(thread.updated_at);
    const existingGroup = groups.find(g => isSameDay(g.date, date));

    if (existingGroup) {
      existingGroup.threads.push(thread);
    } else {
      groups.push({
        date,
        threads: [thread]
      });
    }

    return groups;
  }, []);

  // Sort groups by date (newest first)
  groupedThreads.sort((a, b) => b.date.getTime() - a.date.getTime());

  const formatDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <div className="p-4 border-b border-muted">
        <h2 className="text-lg font-semibold text-foreground">Chat History</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {groupedThreads.map(group => (
          <div key={group.date.toISOString()}>
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-muted px-4 py-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {formatDate(group.date)}
              </h3>
            </div>
            <div className="divide-y divide-muted">
              {group.threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => switchThread(thread.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors ${
                    currentThreadId === thread.id ? 'bg-muted' : ''
                  }`}
                >
                  <p className="text-sm text-foreground font-medium line-clamp-1">
                    {thread.title || 'New Conversation'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {thread.updated_at ? (
                      format(parseISO(thread.updated_at), 'h:mm a')
                    ) : (
                      '--:-- --'
                    )}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))}
        {threads.length === 0 && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No conversations yet
          </div>
        )}
      </div>
    </div>
  );
}