import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { PersonalizationChat } from './context/PersonalizationChat';
import { usePersonalizationStore } from '../store/personalization';

interface PersonalizationButtonProps {
  isActive: boolean;
  onToggle: () => void;
  onClick?: () => void;
}

export function PersonalizationButton({ isActive, onToggle, onClick }: PersonalizationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { personalInfo } = usePersonalizationStore();

  const hasPersonalization = personalInfo && Object.keys(personalInfo).length > 0;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsOpen(true);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onToggle();
    } catch (error) {
      console.error('Error toggling personalization:', error);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={handleToggle}
          className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors ${
            isActive
              ? 'bg-primary text-button-text'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          P
        </button>
        <button
          onClick={handleClick}
          className={`p-1.5 rounded-md transition-colors ${
            hasPersonalization
              ? 'text-primary hover:text-primary/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-4 bg-background border border-muted rounded-lg shadow-xl overflow-hidden">
            <div className="h-full overflow-hidden">
              <PersonalizationChat
                personalInfo={personalInfo}
                setPersonalInfo={usePersonalizationStore.getState().updatePersonalInfo}
                onComplete={() => setIsOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}