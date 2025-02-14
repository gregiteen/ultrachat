import React from 'react';
import type { UnifiedMessage } from '../types';
import { Mail, MessageSquare, Instagram, Slack, Check, Trash2 } from 'lucide-react';

interface UnifiedMessageProps {
  message: UnifiedMessage;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function UnifiedMessage({ message, onMarkAsRead, onDelete }: UnifiedMessageProps) {
  const getSourceIcon = () => {
    switch (message.source) {
      case 'email':
        return <Mail className="h-5 w-5 text-blue-600" />;
      case 'slack':
        return <Slack className="h-5 w-5 text-purple-600" />;
      case 'messenger':
        return <MessageSquare className="h-5 w-5 text-green-600" />;
      case 'instagram':
        return <Instagram className="h-5 w-5 text-pink-600" />;
    }
  };

  return (
    <div className={`group relative rounded-lg border p-4 transition-all hover:shadow-md ${
      message.read ? 'bg-white' : 'bg-blue-50'
    }`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">{getSourceIcon()}</div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">{message.sender}</h3>
            <span className="text-sm text-gray-500">
              {new Date(message.created_at).toLocaleString()}
            </span>
          </div>
          <p className="text-gray-700">{message.content}</p>
        </div>
      </div>
      
      <div className="absolute right-4 top-4 hidden space-x-2 group-hover:flex">
        {!message.read && (
          <button
            onClick={() => onMarkAsRead(message.id)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(message.id)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}