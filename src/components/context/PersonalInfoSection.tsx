import React from 'react';
import type { PersonalInfo } from '../../types';
import Select from 'react-select';

interface PersonalInfoSectionProps {
  personalInfo: PersonalInfo;
  setPersonalInfo: (info: PersonalInfo) => void;
}

const MBTI_OPTIONS = [
  { value: 'INTJ', label: 'INTJ - Architect' },
  { value: 'INTP', label: 'INTP - Logician' },
  { value: 'ENTJ', label: 'ENTJ - Commander' },
  { value: 'ENTP', label: 'ENTP - Debater' },
  { value: 'INFJ', label: 'INFJ - Advocate' },
  { value: 'INFP', label: 'INFP - Mediator' },
  { value: 'ENFJ', label: 'ENFJ - Protagonist' },
  { value: 'ENFP', label: 'ENFP - Campaigner' },
  { value: 'ISTJ', label: 'ISTJ - Logistician' },
  { value: 'ISFJ', label: 'ISFJ - Defender' },
  { value: 'ESTJ', label: 'ESTJ - Executive' },
  { value: 'ESFJ', label: 'ESFJ - Consul' },
  { value: 'ISTP', label: 'ISTP - Virtuoso' },
  { value: 'ISFP', label: 'ISFP - Adventurer' },
  { value: 'ESTP', label: 'ESTP - Entrepreneur' },
  { value: 'ESFP', label: 'ESFP - Entertainer' },
];

const ENNEAGRAM_OPTIONS = [
  { value: '1', label: 'Type 1 - The Reformer' },
  { value: '2', label: 'Type 2 - The Helper' },
  { value: '3', label: 'Type 3 - The Achiever' },
  { value: '4', label: 'Type 4 - The Individualist' },
  { value: '5', label: 'Type 5 - The Investigator' },
  { value: '6', label: 'Type 6 - The Loyalist' },
  { value: '7', label: 'Type 7 - The Enthusiast' },
  { value: '8', label: 'Type 8 - The Challenger' },
  { value: '9', label: 'Type 9 - The Peacemaker' },
];

export function PersonalInfoSection({
  personalInfo,
  setPersonalInfo,
}: PersonalInfoSectionProps) {
  const updatePersonalityTraits = (field: string, value: any) => {
    setPersonalInfo({
      ...personalInfo,
      personalityTraits: {
        ...personalInfo.personalityTraits,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-foreground">Personal Information</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Name
          </label>
          <input
            type="text"
            value={personalInfo.name || ''}
            onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
            className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
            placeholder="Full Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Email
          </label>
          <input
            type="email"
            value={personalInfo.email || ''}
            onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
            className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
            placeholder="Email Address"
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">Personality Profile</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              MBTI Type
            </label>
            <Select
              value={MBTI_OPTIONS.find(opt => opt.value === personalInfo.personalityTraits?.mbti)}
              onChange={(option) => updatePersonalityTraits('mbti', option?.value)}
              options={MBTI_OPTIONS}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select MBTI type..."
              isClearable
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              Enneagram Type
            </label>
            <Select
              value={ENNEAGRAM_OPTIONS.find(opt => opt.value === personalInfo.personalityTraits?.enneagram)}
              onChange={(option) => updatePersonalityTraits('enneagram', option?.value)}
              options={ENNEAGRAM_OPTIONS}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select Enneagram type..."
              isClearable
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">Big Five Traits</h4>
        <div className="space-y-4">
          {[
            { key: 'openness', label: 'Openness to Experience' },
            { key: 'conscientiousness', label: 'Conscientiousness' },
            { key: 'extraversion', label: 'Extraversion' },
            { key: 'agreeableness', label: 'Agreeableness' },
            { key: 'neuroticism', label: 'Neuroticism' },
          ].map(({ key, label }) => (
            <div key={key}>
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <label>{label}</label>
                <span>
                  {personalInfo.personalityTraits?.bigFive?.[key as keyof NonNullable<PersonalInfo['personalityTraits']>['bigFive']] || 50}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={
                  personalInfo.personalityTraits?.bigFive?.[key as keyof NonNullable<PersonalInfo['personalityTraits']>['bigFive']] || 50
                }
                onChange={(e) =>
                  setPersonalInfo({
                    ...personalInfo,
                    personalityTraits: {
                      ...personalInfo.personalityTraits,
                      bigFive: {
                        ...personalInfo.personalityTraits?.bigFive,
                        [key]: parseInt(e.target.value),
                      },
                    },
                  })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">Custom Traits</h4>
        <textarea
          value={personalInfo.personalityTraits?.customTraits?.join('\n') || ''}
          onChange={(e) =>
            updatePersonalityTraits(
              'customTraits',
              e.target.value.split('\n').filter(Boolean)
            )
          }
          className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
          placeholder="Enter custom traits (one per line)"
          rows={4}
        />
      </div>
    </div>
  );
}