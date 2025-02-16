import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCog } from 'lucide-react';
import { usePersonalizationStore } from '../store/personalization';

interface PersonalizationWelcomeProps {
  onClose: () => void;
}

export function PersonalizationWelcome({ onClose }: PersonalizationWelcomeProps) {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);
  const { setHasSeenWelcome, error } = usePersonalizationStore();

  const handleSetup = () => {
    navigate('/account?tab=personalization');
    handleClose();
  };

  const handleClose = async () => {
    if (isClosing) return; // Prevent multiple clicks
    setIsClosing(true);
    
    try {
      await setHasSeenWelcome(true);
      if (!error) onClose();
    } catch (error) {
      console.error('Failed to update welcome state:', error);
      setIsClosing(false);
    }
  };

  const handleMaybeLater = async () => {
    try {
      if (isClosing) return; // Prevent multiple clicks
      setIsClosing(true);
      await handleClose();
    } catch (error) {
      console.error('Error in maybe later:', error);
    } finally {
      setIsClosing(false);
    }
  };

  useEffect(() => {
    return () => setIsClosing(false);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-background rounded-lg w-full max-w-2xl shadow-xl">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <UserCog className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Welcome to Personalization
            </h2>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              Personalization helps Ultra understand you better and provide more relevant,
              contextual responses. When enabled, Ultra can:
            </p>

            <ul className="space-y-2 list-disc pl-6">
              <li>Use your preferences to tailor recommendations</li>
              <li>Reference your background in relevant discussions</li>
              <li>Consider your goals and interests in suggestions</li>
              <li>Maintain context across conversations</li>
            </ul>

            <p>
              Your personal information is securely stored and only used to enhance your
              interactions. You can toggle personalization on/off at any time, and manage
              your information in account settings.
            </p>

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
            >
              Maybe Later
            </button>
            <button
              onClick={handleSetup}
              className="px-4 py-2 text-sm font-medium text-button-text bg-primary rounded-md hover:bg-secondary"
            >
              Set Up Personalization
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}