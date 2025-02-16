import React, { memo, useMemo, useState } from 'react';
import type { UnifiedMessage as UnifiedMessageType } from '../types';
import { Mail, MessageSquare, Instagram, Slack, Check, Trash2 } from 'lucide-react';

interface UnifiedMessageProps {
  message: UnifiedMessageType;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

// Cache source icon mapping
const sourceIcons = {
  email: <Mail className="h-5 w-5 text-blue-600" aria-hidden="true" />,
  slack: <Slack className="h-5 w-5 text-purple-600" aria-hidden="true" />,
  messenger: <MessageSquare className="h-5 w-5 text-green-600" aria-hidden="true" />,
  instagram: <Instagram className="h-5 w-5 text-pink-600" aria-hidden="true" />
} as const;

const UnifiedMessageComponent = memo(({ message, onMarkAsRead, onDelete }: UnifiedMessageProps) => {
  // Memoize date formatting
  const formattedDate = useMemo(() => 
    new Date(message.created_at).toLocaleString(),
    [message.created_at]
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get source icon from cached mapping
  const sourceIcon = sourceIcons[message.source as keyof typeof sourceIcons];

  const handleMarkAsRead = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onMarkAsRead(message.id);
    } catch (err) {
      setError('Failed to mark message as read');
      console.error('Error marking message as read:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onDelete(message.id);
    } catch (err) {
      setError('Failed to delete message');
      console.error('Error deleting message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={`group relative rounded-lg border p-4 transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-primary ${
        message.read ? 'bg-white' : 'bg-blue-50'
      }`}
      role="article"
      aria-labelledby={`message-${message.id}-title`}
      tabIndex={0}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0" aria-label={`Source: ${message.source}`}>
          {sourceIcon}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h3 
              id={`message-${message.id}-title`}
              className="font-medium text-gray-900"
            >
              {message.sender}
            </h3>
            <time 
              className="text-sm text-gray-500"
              dateTime={message.created_at}
            >
              {formattedDate}
            </time>
          </div>
          <p className="text-gray-700">{message.content}</p>
          {error && (
            <p className="text-red-600 text-sm mt-2" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
      
      <div className="absolute right-4 top-4 space-x-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {!message.read && (
          <button
            onClick={handleMarkAsRead}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
            aria-label="Mark as read"
            disabled={isLoading}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <button
          onClick={handleDelete}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
          aria-label="Delete message"
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});

UnifiedMessageComponent.displayName = 'UnifiedMessage';

export { UnifiedMessageComponent as UnifiedMessage };