import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCog, AlertCircle, X } from 'lucide-react';
import { usePersonalizationStore } from '../store/personalization';

interface PersonalizationWelcomeProps {
  onClose: () => void;
  onSetup: () => void;
}

export function PersonalizationWelcome({ onClose, onSetup }: PersonalizationWelcomeProps) {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);
  const { hasSeenWelcome, loading, initialized, setHasSeenWelcome } = usePersonalizationStore();

  const handleSetup = async () => {
    await setHasSeenWelcome(true);
    onClose();
  };

  const handleMaybeLater = async () => {
    try {
      if (isClosing) return;
      setIsClosing(true);
      await setHasSeenWelcome(true);
      await onClose();
    } catch (error) {
      console.error('Error in maybe later:', error);
      setIsClosing(false);
    }
  };

  const handleBackdropClick = async (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      await setHasSeenWelcome(true);
      onClose();
    }
  };

  useEffect(() => {
    return () => setIsClosing(false);
  }, []);

  // Only show for new users who haven't seen welcome
  if (loading || !initialized || hasSeenWelcome) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-background rounded-lg w-full max-w-2xl shadow-xl">
        <div className="p-6 space-y-6">
          <button
            onClick={handleMaybeLater}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/50"
            disabled={isClosing}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <UserCog className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Set Up Personalization
            </h2>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              Personalization helps Ultra understand you better and provide more relevant,
              contextual responses. To get started:
            </p>

            <ol className="space-y-4 list-decimal pl-6">
              <li>
                <strong className="text-foreground">Step 1: Set Up Your Profile</strong>
                <p className="mt-1">Fill out your preferences and information in the account settings.</p>
              </li>
              <li>
                <strong className="text-foreground">Step 2: Enable Personalization</strong>
                <p className="mt-1">Click the "P" button in the chat to toggle personalization on.</p>
              </li>
            </ol>

            <p>When personalization is active, Ultra can:</p>
            <ul className="space-y-2 list-disc pl-6">
              <li>Use your preferences to tailor recommendations</li>
              <li>Reference your background in relevant discussions</li>
              <li>Consider your goals and interests in suggestions</li>
              <li>Maintain context across conversations</li>
            </ul>

            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Privacy Note:</strong> Your information is encrypted and only accessible
                to you. Ultra will never share your personal details without your explicit
                permission.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={handleMaybeLater}
              className="px-4 py-2 text-sm font-medium text-foreground bg-muted border border-muted rounded-md hover:bg-background"
              disabled={isClosing}
            >
              Maybe Later
            </button>
            <button
              onClick={onSetup}
              className="px-4 py-2 text-sm font-medium text-button-text bg-primary rounded-md hover:bg-secondary"
              disabled={isClosing}
            >
              Set Up Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}