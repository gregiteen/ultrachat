import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCog } from 'lucide-react';
import { usePersonalizationStore } from '../store/personalization';

interface PersonalizationWelcomeProps {
  onClose: () => void;
  onSetup: () => void;
}

export function PersonalizationWelcome({ onClose, onSetup }: PersonalizationWelcomeProps) {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);
  const { personalInfo } = usePersonalizationStore();

  const handleSetup = async () => {
    // Call onClose to update state and close modal
    onClose();
  };

  const handleMaybeLater = async () => {
    try {
      if (isClosing) return; // Prevent multiple clicks
      setIsClosing(true);
      
      // Call onClose to update state and close modal
      await onClose();
    } catch (error) {
      console.error('Error in maybe later:', error);
      setIsClosing(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop itself, not its children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    return () => setIsClosing(false);
  }, []);

  // Don't show the welcome popup if there's already personalization info
  const hasPersonalInfo = () => {
    // Check basic fields
    if (personalInfo.name || personalInfo.email || personalInfo.phone) return true;
    // Check arrays
    if (personalInfo.interests && personalInfo.interests.length > 0) return true;
    if (personalInfo.expertise && personalInfo.expertise.length > 0) return true;
    if (personalInfo.hobbies && personalInfo.hobbies.length > 0) return true;
    // Check nested objects
    if (personalInfo.address?.street || personalInfo.address?.city) return true;
    if (personalInfo.clothing_sizes?.top || personalInfo.clothing_sizes?.bottom) return true;
    // Check other significant fields
    if (personalInfo.backstory || personalInfo.projects || personalInfo.resume) return true;
    return false;
  };

  if (hasPersonalInfo()) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
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
              disabled={isClosing}
            >
              Maybe Later
            </button>
            <button
              onClick={onSetup}
              className="px-4 py-2 text-sm font-medium text-button-text bg-primary rounded-md hover:bg-secondary"
              disabled={isClosing}
            >
              Set Up Personalization
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}