import React from 'react';
import { UserCog } from 'lucide-react';

interface PersonalizationButtonProps {
  isActive: boolean;
  onToggle: () => void;
  onClick: () => void;
}

export function PersonalizationButton({ isActive, onToggle, onClick }: PersonalizationButtonProps) {
  return (
    <div className="relative group">
      <button
        onClick={onToggle}
        className={`p-2 rounded-lg transition-colors ${
          isActive 
            ? 'bg-primary text-button-text' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title={isActive ? 'Personalization Active' : 'Personalization Disabled'}
      >
        <UserCog className="h-5 w-5" />
      </button>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        {isActive ? 'AI responses use your personal info' : 'AI responses are generic'}
        <br />
        <span className="text-gray-300">Click to {isActive ? 'disable' : 'enable'}</span>
        <br />
        <span className="text-blue-300 cursor-pointer" onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}>
          Manage personalization
        </span>
      </div>
    </div>
  );
}