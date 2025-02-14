import React, { useState, useRef } from 'react';
import { Send, Mic, Paperclip, Image, Edit } from 'lucide-react';
import { useContextStore } from '../store/context';
import { ContextEditor } from './ContextEditor';

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  onUploadFile?: (file: File) => Promise<void>;
  onStartRecording?: () => void;
  isLoading?: boolean;
}

export function ChatInput({
  onSendMessage,
  onUploadFile,
  onStartRecording,
  isLoading = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { contexts, activeContext, setActiveContext } = useContextStore();
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [editingContext, setEditingContext] = useState(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    await onSendMessage(message);
    setMessage('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      await onUploadFile(file);
    }
  };

  const handleEditContext = (context) => {
    setEditingContext(context);
    setShowContextEditor(true);
  };

  return (
    <div className="border-t border-muted bg-background">
      {/* Context Selector */}
      <div className="px-4 py-2 flex flex-wrap gap-2">
        {contexts.map((context) => (
          <button
            key={context.id}
            onClick={() => setActiveContext(context)}
            className={`group relative rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              activeContext?.id === context.id
                ? 'bg-primary text-white'
                : 'bg-muted hover:bg-muted-foreground/10'
            }`}
          >
            {context.name}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditContext(context);
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity p-1"
            >
              <Edit className="h-3 w-3" />
            </button>
          </button>
        ))}
        <button
          onClick={() => {
            setEditingContext(null);
            setShowContextEditor(true);
          }}
          className="rounded-full px-3 py-1 text-sm font-medium bg-muted hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
        >
          + New Context
        </button>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple={false}
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 text-icon-color hover:text-icon-hover transition-colors"
        >
          <Paperclip className="h-6 w-6" />
        </button>
        
        <button
          type="button"
          className="flex-shrink-0 text-icon-color hover:text-icon-hover transition-colors"
        >
          <Image className="h-6 w-6" />
        </button>

        <div className="relative flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full rounded-lg border border-muted bg-input-background text-foreground placeholder:text-muted-foreground px-4 py-2 pr-12 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            rows={1}
            style={{
              resize: 'none',
              minHeight: '44px',
              maxHeight: '200px',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>

        {onStartRecording && (
          <button
            type="button"
            onClick={onStartRecording}
            className="flex-shrink-0 text-icon-color hover:text-icon-hover transition-colors"
            disabled={isLoading}
          >
            <Mic className="h-6 w-6" />
          </button>
        )}

        <button
          type="submit"
          className="flex-shrink-0 rounded-full bg-primary p-2 text-button-text hover:bg-secondary disabled:opacity-50 transition-colors"
          disabled={!message.trim() || isLoading}
        >
          <Send className="h-5 w-5" />
        </button>
      </form>

      {/* Context Editor Modal */}
      {showContextEditor && (
        <ContextEditor
          initialContext={editingContext}
          onClose={() => {
            setShowContextEditor(false);
            setEditingContext(null);
          }}
        />
      )}
    </div>
  );
}