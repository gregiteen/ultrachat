import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCog } from 'lucide-react';

interface PersonalizationWelcomeProps {
  onClose: () => void;
}

export function PersonalizationWelcome({ onClose }: PersonalizationWelcomeProps) {
  const navigate = useNavigate();

  const handleSetup = () => {
    navigate('/account?tab=personalization');
    onClose();
  };

  useEffect(() => {
    console.log("PersonalizationWelcome component mounted");
    return () => {
      console.log("PersonalizationWelcome component unmounted");
    }
  }, []);

  useEffect(() => {
      console.log("onClose prop:", onClose);
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-gray-500 flex items-center justify-center p-4 z-50">
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
              onClick={() => { console.log("Maybe Later clicked"); onClose(); }}
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