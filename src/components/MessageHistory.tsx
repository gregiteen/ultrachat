import React from 'react';
import { useMessageStore } from '../store/chat';

export function MessageHistory() {
  const { messages, loading, error } = useMessageStore();

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div 
          key={message.id} 
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`max-w-3/4 p-3 rounded-lg ${
              message.role === 'user' 
                ? 'bg-primary text-white' 
                : 'bg-muted'
            }`}
          >
            {message.content}
          </div>
        </div>
      ))}
    </div>
  );
}