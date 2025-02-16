import React, { useEffect } from 'react';
import { useUnifiedInboxStore } from '../store/unified-inbox';
import { UnifiedMessage } from '../components/UnifiedMessage';
import { Inbox, Filter } from 'lucide-react';

export default function UnifiedInbox() {
  const { messages, loading, error, fetchMessages, markAsRead, deleteMessage } = useUnifiedInboxStore();

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Inbox className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Unified Inbox</h1>
                <p className="text-sm text-gray-500">
                  {unreadCount} unread messages
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Message List */}
        <div className="space-y-4 pb-8">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-lg bg-white p-8 text-center">
              <p className="text-gray-500">No messages found</p>
            </div>
          ) : (
            messages.map((message) => (
              <UnifiedMessage
                key={message.id}
                message={message}
                onMarkAsRead={markAsRead}
                onDelete={deleteMessage}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}