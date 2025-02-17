import React from 'react';
import { useThreadStore } from '../store/chat';

interface Props {
  onClose: () => void;
  onSelect: (threadId: string) => void;
}

export function PersonalizationThreadDialog({ onClose, onSelect }: Props) {
  const { threads } = useThreadStore();
  const personalizationThreads = threads.filter(t => t.title.toLowerCase().includes('personalization'));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">Continue Personalization?</h2>
        
        {personalizationThreads.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              You have existing personalization chats. Would you like to continue one of them or start a new one?
            </p>
            <div className="space-y-2 mb-4">
              {personalizationThreads.map(thread => (
                <button
                  key={thread.id}
                  onClick={() => onSelect(thread.id)}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-center justify-between"
                >
                  <span className="text-sm font-medium">{thread.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(thread.updated_at).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            Would you like to start a new personalization chat?
          </p>
        )}
        
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSelect('new')}
            className="px-4 py-2 text-sm bg-primary text-button-text rounded-md hover:bg-primary/90 transition-colors"
          >
            Start New Chat
          </button>
        </div>
      </div>
    </div>
  );
}