import React, { useState } from 'react';
import { FileManager } from './FileManager';
import { AIPersonalizationChat } from './AIPersonalizationChat';
import { usePersonalizationStore } from '../../store/personalization';
import type { PersonalInfo } from '../../types';

interface PersonalizationChatProps {
  personalInfo: PersonalInfo;
  setPersonalInfo: (info: PersonalInfo) => void;
  onComplete?: () => void;
}

export function PersonalizationChat({ 
  personalInfo, 
  setPersonalInfo,
  onComplete 
}: PersonalizationChatProps) {
  const { isActive } = usePersonalizationStore();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
  };

  if (!isActive) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <h3 className="text-xl font-semibold">Personalization is Disabled</h3>
        <p className="text-muted-foreground">
          Enable personalization to access file management and AI-powered chat features.
          Your personalization settings and files will be preserved even when disabled.
        </p>
        <button
          onClick={() => usePersonalizationStore.getState().togglePersonalization()}
          className="px-4 py-2 bg-primary text-button-text rounded-md hover:bg-secondary transition-colors"
        >
          Enable Personalization
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      <FileManager onFileSelect={handleFileSelect} />
      <div className="flex-1">
        <AIPersonalizationChat
          personalInfo={personalInfo}
          setPersonalInfo={setPersonalInfo}
          selectedFile={selectedFile}
          onComplete={onComplete}
        />
      </div>
    </div>
  );
}