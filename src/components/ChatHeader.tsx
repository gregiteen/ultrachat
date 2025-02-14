import React, { useState } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import { ContextSelector } from './ContextSelector';
import { ContextEditor } from './ContextEditor';
import { useContextStore } from '../store/context';
import type { Context } from '../types';

export function ChatHeader() {
  const { contexts, activeContext, setActiveContext } = useContextStore();
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [editingContext, setEditingContext] = useState<Context | null>(null);

  const handleEditContext = (context: Context) => {
    setEditingContext(context);
    setShowContextEditor(true);
  };

  const handleNewContext = () => {
    setEditingContext(null);
    setShowContextEditor(true);
  };

  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <MessageSquare className="h-6 w-6 text-blue-600" />
        <h1 className="text-lg font-semibold text-gray-900">Chat</h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleNewContext}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Plus className="h-4 w-4" />
          New Context
        </button>

        <ContextSelector
          contexts={contexts}
          activeContext={activeContext}
          onContextChange={setActiveContext}
          onEditContext={handleEditContext}
        />
      </div>

      {showContextEditor && (
        <ContextEditor
          initialContext={editingContext || undefined}
          onClose={() => {
            setShowContextEditor(false);
            setEditingContext(null);
          }}
        />
      )}
    </div>
  );
}