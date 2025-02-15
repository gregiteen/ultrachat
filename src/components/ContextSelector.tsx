import React from 'react';
import { Edit } from 'lucide-react';
import type { Context } from '../types';

interface ContextSelectorProps {
  contexts: Context[];
  activeContext: Context | null;
  onContextChange: (context: Context | null) => void;
  onEditContext: (context: Context) => void;
}

export function ContextSelector({
  contexts,
  activeContext,
  onContextChange,
  onEditContext,
}: ContextSelectorProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {contexts.map((context) => (
        <div key={context.id} className="flex-none flex items-center gap-1">
          <button
            onClick={() => onContextChange(context)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeContext?.id === context.id
                ? 'bg-primary text-button-text'
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
          >
            {context.name}
          </button>
          <button
            onClick={() => onEditContext(context)}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}