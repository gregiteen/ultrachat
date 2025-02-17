import React, { memo, useMemo, useState, useCallback } from 'react';
import type { UnifiedMessage as UnifiedMessageType } from '../types';
import { Mail, MessageSquare, Instagram, Slack, Check, Trash2, Loader2 } from 'lucide-react';

interface UnifiedMessageProps {
  message: UnifiedMessageType;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

// Memoize source icons to prevent unnecessary re-renders
const sourceIcons = {
  email: memo(() => <Mail className="h-5 w-5 text-blue-600" aria-hidden="true" />),
  slack: memo(() => <Slack className="h-5 w-5 text-purple-600" aria-hidden="true" />),
  messenger: memo(() => <MessageSquare className="h-5 w-5 text-green-600" aria-hidden="true" />),
  instagram: memo(() => <Instagram className="h-5 w-5 text-pink-600" aria-hidden="true" />)
} as const;

// Error messages mapping
const errorMessages = {
  markAsRead: 'Failed to mark message as read. Please try again.',
  delete: 'Failed to delete message. Please try again.'
} as const;

const UnifiedMessageComponent = memo(({ message, onMarkAsRead, onDelete }: UnifiedMessageProps) => {
  const [isLoading, setIsLoading] = useState<'markAsRead' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Memoize date formatting
  const formattedDate = useMemo(() => {
    try {
      return new Date(message.created_at).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Date formatting error:', err);
      return message.created_at;
    }
  }, [message.created_at]);

  // Get source icon component
  const SourceIcon = useMemo(() => 
    sourceIcons[message.source as keyof typeof sourceIcons] || sourceIcons.messenger,
    [message.source]
  );

  // Memoize action handlers
  const handleMarkAsRead = useCallback(async () => {
    if (isLoading) return;
    
    try {
      setIsLoading('markAsRead');
      setError(null);
      await onMarkAsRead(message.id);
    } catch (err) {
      setError(errorMessages.markAsRead);
      console.error('Error marking message as read:', err);
    } finally {
      setIsLoading(null);
    }
  }, [message.id, onMarkAsRead, isLoading]);

  const handleDelete = useCallback(async () => {
    if (isLoading) return;
    
    try {
      setIsLoading('delete');
      setError(null);
      await onDelete(message.id);
    } catch (err) {
      setError(errorMessages.delete);
      console.error('Error deleting message:', err);
    } finally {
      setIsLoading(null);
    }
  }, [message.id, onDelete, isLoading]);

  // Clear error after 5 seconds
  const clearError = useCallback(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  // Memoize action buttons
  const ActionButtons = useMemo(() => (
    <div 
      className="absolute right-4 top-4 space-x-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
      role="group"
      aria-label="Message actions"
    >
      {!message.read && (
        <button
          onClick={handleMarkAsRead}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
          aria-label="Mark as read"
          disabled={isLoading !== null}
        >
          {isLoading === 'markAsRead' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      )}
      <button
        onClick={handleDelete}
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
        aria-label="Delete message"
        disabled={isLoading !== null}
      >
        {isLoading === 'delete' ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  ), [message.read, handleMarkAsRead, handleDelete, isLoading]);

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
        <div 
          className="flex-shrink-0" 
          aria-label={`Source: ${message.source}`}
        >
          <SourceIcon />
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
          <p className="text-gray-700 break-words">{message.content}</p>
          {error && (
            <p 
              className="text-red-600 text-sm mt-2 animate-fade-in" 
              role="alert"
              onAnimationEnd={clearError}
            >
              {error}
            </p>
          )}
        </div>
      </div>
      {ActionButtons}
    </div>
  );
});

UnifiedMessageComponent.displayName = 'UnifiedMessage';

export { UnifiedMessageComponent as UnifiedMessage };