import React from 'react';
import { useThreadStore, useMessageStore } from '../store/chat';
import { PlusCircle, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function ChatSidebar() {
  const { threads, createThread, selectThread, currentThread } = useThreadStore();
  const { clearThreadMessages } = useMessageStore();

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

  // Sort threads by date
  const sortedThreads = [...threads].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="w-64 h-full bg-background border-r border-muted flex flex-col">
      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-5 w-5" />
          New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {sortedThreads.map((thread) => (
          <button
            key={thread.id}
            onClick={() => handleSelectThread(thread.id)}
            className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors ${
              currentThread?.id === thread.id ? 'bg-muted/50' : ''
            }`}
          >
            <MessageCircle className="h-5 w-5 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate flex-1">
                  {thread.title || 'New Chat'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}