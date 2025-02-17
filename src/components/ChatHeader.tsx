import React from 'react';
import { MessageSquare } from 'lucide-react';
import { PersonalizationButton } from './PersonalizationButton';
import { usePersonalizationStore } from '../store/personalization';

export function ChatHeader() {
  const { isActive, togglePersonalization } = usePersonalizationStore();

  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <MessageSquare className="h-6 w-6 text-blue-600" />
        <h1 className="text-lg font-semibold text-gray-900">Chat</h1>
      </div>
      <div className="flex items-center gap-4">
        <PersonalizationButton 
          isActive={isActive} 
          onToggle={async () => {
            await togglePersonalization();
          }} 
        />
      </div>
    </div>
  );
}