import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { format, isToday, isYesterday, isSameDay, parseISO } from 'date-fns';
import { Search, X, MoreVertical, Pin, Trash2, Edit2 } from 'lucide-react';
import { useThreadStore } from '../store/chat';
import type { Thread } from '../types';

interface GroupedThread {
  date: Date;
  threads: Thread[];
}

function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 text-gray-900">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
}

interface ThreadActionsProps {
  thread: Thread;
  onClose: () => void;
}

function ThreadActions({ thread, onClose }: ThreadActionsProps) {
  const { deleteThread } = useThreadStore();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(thread.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      await useThreadStore.getState().renameThread(thread.id, newTitle.trim());
      setIsRenaming(false);
      onClose();
    }
  };

  const handleDelete = async () => {
    await deleteThread(thread.id);
    onClose();
  };

  const handleTogglePin = async () => {
    await useThreadStore.getState().togglePinThread(thread.id);
    onClose();
  };

  if (showDeleteConfirm) {
    return (
      <div className="absolute right-0 top-0 mt-8 w-64 bg-background border border-muted rounded-lg shadow-lg p-4 z-50">
        <p className="text-sm mb-4">Are you sure you want to delete this conversation?</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-3 py-1 text-sm rounded hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  if (isRenaming) {
    return (
      <div className="absolute right-0 top-0 mt-8 w-64 bg-background border border-muted rounded-lg shadow-lg p-4 z-50">
        <form onSubmit={handleRename}>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded mb-2"
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsRenaming(false)}
              className="px-3 py-1 text-sm rounded hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 text-sm bg-primary text-button-text rounded hover:bg-primary/90"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="absolute right-0 top-0 mt-8 w-48 bg-background border border-muted rounded-lg shadow-lg py-1 z-50">
      <button
        onClick={handleTogglePin}
        className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center space-x-2"
      >
        <Pin className="h-4 w-4" />
        <span>{thread.pinned ? 'Unpin' : 'Pin'}</span>
      </button>
      <button
        onClick={() => setIsRenaming(true)}
        className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center space-x-2"
      >
        <Edit2 className="h-4 w-4" />
        <span>Rename</span>
      </button>
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-muted flex items-center space-x-2"
      >
        <Trash2 className="h-4 w-4" />
        <span>Delete</span>
      </button>
    </div>
  );
}

export function ChatHistory() {
  const { threads, loading, currentThread, selectThread, createThread } = useThreadStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeThreadMenu, setActiveThreadMenu] = useState<string | null>(null);

  const handleNewChat = async () => {
    try {
      const thread = await createThread();
      await selectThread(thread.id);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const filteredThreads = useMemo(() => {
    if (!searchTerm.trim()) return threads;
    
    return threads.filter(thread => 
      thread.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [threads, searchTerm]);

  const groupedThreads = useMemo(() => {
    return filteredThreads.reduce((groups: GroupedThread[], thread) => {
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
    }, []).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredThreads]);

  const formatDate = useCallback((date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d, yyyy');
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <div className="p-4 border-b border-muted">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-button-text bg-primary rounded-lg hover:bg-secondary transition-colors mb-3"
        >
          <Search className="h-4 w-4" />
          New Chat
        </button>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-8 py-2 rounded-md bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {groupedThreads.length > 0 ? (
          <div>
            {groupedThreads.map(group => (
              <div key={group.date.toISOString()}>
                <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-muted px-4 py-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {formatDate(group.date)}
                  </h3>
                </div>
                <div className="divide-y divide-muted">
                  {group.threads.map((thread) => (
                    <div
                      key={thread.id}
                      className={`relative flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors ${
                        currentThread?.id === thread.id ? 'bg-muted' : ''
                      }`}
                    >
                      <button
                        onClick={() => selectThread(thread.id)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center space-x-2">
                          {thread.pinned && (
                            <Pin className="h-3 w-3 text-primary" />
                          )}
                          <p className="text-sm text-foreground font-medium line-clamp-1">
                            <HighlightedText 
                              text={thread.title || 'New Conversation'} 
                              highlight={searchTerm}
                            />
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {thread.updated_at ? (
                            format(parseISO(thread.updated_at), 'h:mm a')
                          ) : (
                            '--:-- --'
                          )}
                        </p>
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setActiveThreadMenu(activeThreadMenu === thread.id ? null : thread.id)}
                          className="p-1 rounded hover:bg-muted-foreground/10"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {activeThreadMenu === thread.id && (
                          <ThreadActions
                            thread={thread}
                            onClose={() => setActiveThreadMenu(null)}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {threads.length === 0 
              ? 'No conversations yet'
              : `No conversations matching "${searchTerm}"`
            }
          </div>
        )}
      </div>
    </div>
  );
}
