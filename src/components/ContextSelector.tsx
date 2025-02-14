import React from 'react';
import { ChevronDown, Edit } from 'lucide-react';
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
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span>{activeContext?.name || 'No Context'}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <button
              onClick={() => {
                onContextChange(null);
                setIsOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              No Context
            </button>
            {contexts.map((context) => (
              <div
                key={context.id}
                className="flex items-center justify-between px-4 py-2 hover:bg-gray-100"
              >
                <button
                  onClick={() => {
                    onContextChange(context);
                    setIsOpen(false);
                  }}
                  className="flex-1 text-left text-sm text-gray-700"
                >
                  {context.name}
                </button>
                <button
                  onClick={() => {
                    onEditContext(context);
                    setIsOpen(false);
                  }}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}