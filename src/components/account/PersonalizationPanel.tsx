import React from 'react';
import { PersonalInfoSection } from '../context/PersonalInfoSection';
import type { PersonalInfo } from '../../types';

interface PersonalizationPanelProps {
  personalInfo: PersonalInfo;
  setPersonalInfo: (info: PersonalInfo) => void;
}

export function PersonalizationPanel({
  personalInfo,
  setPersonalInfo,
}: PersonalizationPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Personalization</h2>
      </div>

      <div className="bg-card rounded-lg p-6">
        <PersonalInfoSection
          personalInfo={personalInfo}
          setPersonalInfo={setPersonalInfo}
        />
      </div>
    </div>
  );
}