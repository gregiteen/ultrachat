import React, { useState } from 'react';
import { AIPersonalizationChat } from './AIPersonalizationChat';
import type { PersonalInfo } from '../../types';

interface PersonalizationInterfaceProps {
  initialPersonalInfo?: PersonalInfo;
  onComplete?: () => void;
}

export function PersonalizationInterface({
  initialPersonalInfo = {},
  onComplete
}: PersonalizationInterfaceProps) {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(initialPersonalInfo);

  const handleFormChange = (field: keyof PersonalInfo, value: any) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete?.();
  };

  return (
    <div className="flex h-full gap-4">
      {/* AI Chat Section */}
      <div className="flex-1 border border-muted rounded-lg overflow-hidden">
        <AIPersonalizationChat
          personalInfo={personalInfo}
          setPersonalInfo={setPersonalInfo}
          onComplete={onComplete}
        />
      </div>

      {/* Form Fields Section */}
      <div className="w-96 border border-muted rounded-lg p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground">Basic Information</h3>
            <input
              type="text"
              value={personalInfo.name || ''}
              onChange={(e) => handleFormChange('name', e.target.value)}
              placeholder="Name"
              className="w-full px-3 py-2 rounded-md border border-muted bg-input-background text-foreground"
            />
            <input
              type="email"
              value={personalInfo.email || ''}
              onChange={(e) => handleFormChange('email', e.target.value)}
              placeholder="Email"
              className="w-full px-3 py-2 rounded-md border border-muted bg-input-background text-foreground"
            />
          </div>

          {/* Professional Information */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground">Professional Information</h3>
            <input
              type="text"
              value={personalInfo.job || ''}
              onChange={(e) => handleFormChange('job', e.target.value)}
              placeholder="Job Title"
              className="w-full px-3 py-2 rounded-md border border-muted bg-input-background text-foreground"
            />
            <input
              type="text"
              value={personalInfo.company || ''}
              onChange={(e) => handleFormChange('company', e.target.value)}
              placeholder="Company"
              className="w-full px-3 py-2 rounded-md border border-muted bg-input-background text-foreground"
            />
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground">Interests & Expertise</h3>
            <div className="flex gap-2 flex-wrap">
              {personalInfo.interests?.map((interest, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-secondary/10 text-secondary rounded-full text-sm flex items-center gap-1"
                >
                  {interest}
                  <button
                    onClick={() => {
                      const newInterests = [...(personalInfo.interests || [])];
                      newInterests.splice(index, 1);
                      handleFormChange('interests', newInterests);
                    }}
                    className="hover:text-primary"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add interest"
                className="flex-1 px-3 py-2 rounded-md border border-muted bg-input-background text-foreground"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    if (input.value.trim()) {
                      handleFormChange('interests', [...(personalInfo.interests || []), input.value.trim()]);
                      input.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Expertise */}
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              {personalInfo.expertise?.map((item, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-secondary/10 text-secondary rounded-full text-sm flex items-center gap-1"
                >
                  {item}
                  <button
                    onClick={() => {
                      const newExpertise = [...(personalInfo.expertise || [])];
                      newExpertise.splice(index, 1);
                      handleFormChange('expertise', newExpertise);
                    }}
                    className="hover:text-primary"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add expertise"
                className="flex-1 px-3 py-2 rounded-md border border-muted bg-input-background text-foreground"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    if (input.value.trim()) {
                      handleFormChange('expertise', [...(personalInfo.expertise || []), input.value.trim()]);
                      input.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground">Additional Information</h3>
            <textarea
              value={personalInfo.freeform || ''}
              onChange={(e) => handleFormChange('freeform', e.target.value)}
              placeholder="Share anything else you'd like me to know..."
              className="w-full px-3 py-2 rounded-md border border-muted bg-input-background text-foreground min-h-[100px]"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-primary text-button-text rounded-md hover:bg-secondary transition-colors"
          >
            Complete Personalization
          </button>
        </form>
      </div>
    </div>
  );
}