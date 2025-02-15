import { useState } from 'react';
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

export function PersonalInfoSection({
  personalInfo,
  setPersonalInfo,
}: PersonalInfoSectionProps) {
  const [newHobby, setNewHobby] = useState('');
  const [newFood, setNewFood] = useState('');
  const [newDrink, setNewDrink] = useState('');
  const [newPet, setPet] = useState('');
  const [newHealthConcern, setHealthConcern] = useState('');
  const [newGoal, setGoal] = useState('');
  const [newDream, setDream] = useState('');
  const [newFamilyMember, setFamilyMember] = useState('');
  const [newFriend, setFriend] = useState('');
  const [newLoveInterest, setLoveInterest] = useState('');
  const [newCulturalGroup, setCulturalGroup] = useState('');

  const addToArray = (field: keyof PersonalInfo, value: string) => {
    if (!value) return;
    const currentArray = personalInfo[field] as string[] || [];
    setPersonalInfo({
      ...personalInfo,
      [field]: [...currentArray, value],
    });
  };

  const removeFromArray = (field: keyof PersonalInfo, index: number) => {
    const currentArray = personalInfo[field] as string[] || [];
    setPersonalInfo({
      ...personalInfo,
      [field]: currentArray.filter((_, i) => i !== index),
    });
  };

  const renderArrayInput = (
    label: string,
    field: keyof PersonalInfo,
    value: string,
    setValue: (value: string) => void,
    placeholder: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        {label}
      </label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addToArray(field, value);
              setValue('');
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            addToArray(field, value);
            setValue('');
          }}
          className="px-4 py-2 text-sm font-medium text-button-text bg-primary rounded-md hover:bg-secondary disabled:opacity-50"
          disabled={!value}
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(personalInfo[field] as string[] || []).map((item, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-muted/10 rounded-md text-sm"
          >
            {item}
            <button
              type="button"
              onClick={() => removeFromArray(field, index)}
              className="text-red-500 hover:text-red-600"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );

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
            MBTI Type
          </label>
          <Select
            value={MBTI_OPTIONS.find(opt => opt.value === personalInfo.mbti)}
            onChange={(option) => setPersonalInfo({ ...personalInfo, mbti: option?.value })}
            options={MBTI_OPTIONS}
            className="react-select-container"
            classNamePrefix="react-select"
            placeholder="Select MBTI type..."
            isClearable
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Backstory
        </label>
        <textarea
          value={personalInfo.backstory || ''}
          onChange={(e) => setPersonalInfo({ ...personalInfo, backstory: e.target.value })}
          className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
          placeholder="Share your life story and background"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Current Projects
        </label>
        <textarea
          value={personalInfo.projects || ''}
          onChange={(e) => setPersonalInfo({ ...personalInfo, projects: e.target.value })}
          className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
          placeholder="What are you currently working on?"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Job
          </label>
          <input
            type="text"
            value={personalInfo.job || ''}
            onChange={(e) => setPersonalInfo({ ...personalInfo, job: e.target.value })}
            className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
            placeholder="Current Job"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Company
          </label>
          <input
            type="text"
            value={personalInfo.company || ''}
            onChange={(e) => setPersonalInfo({ ...personalInfo, company: e.target.value })}
            className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
            placeholder="Company Name"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Address
        </label>
        <div className="space-y-2">
          <input
            type="text"
            value={personalInfo.address?.street || ''}
            onChange={(e) => setPersonalInfo({
              ...personalInfo,
              address: { ...personalInfo.address, street: e.target.value }
            })}
            className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
            placeholder="Street Address"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={personalInfo.address?.city || ''}
              onChange={(e) => setPersonalInfo({
                ...personalInfo,
                address: { ...personalInfo.address, city: e.target.value }
              })}
              className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
              placeholder="City"
            />
            <input
              type="text"
              value={personalInfo.address?.state || ''}
              onChange={(e) => setPersonalInfo({
                ...personalInfo,
                address: { ...personalInfo.address, state: e.target.value }
              })}
              className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
              placeholder="State"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={personalInfo.address?.zip || ''}
              onChange={(e) => setPersonalInfo({
                ...personalInfo,
                address: { ...personalInfo.address, zip: e.target.value }
              })}
              className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
              placeholder="ZIP Code"
            />
            <input
              type="text"
              value={personalInfo.address?.country || ''}
              onChange={(e) => setPersonalInfo({
                ...personalInfo,
                address: { ...personalInfo.address, country: e.target.value }
              })}
              className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
              placeholder="Country"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={personalInfo.phone || ''}
            onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
            className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
            placeholder="Phone Number"
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

      {renderArrayInput('Pets', 'pets', newPet, setPet, 'Add a pet')}
      {renderArrayInput('Health Concerns', 'health_concerns', newHealthConcern, setHealthConcern, 'Add a health concern')}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Height
          </label>
          <input
            type="text"
            value={personalInfo.height || ''}
            onChange={(e) => setPersonalInfo({ ...personalInfo, height: e.target.value })}
            className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
            placeholder="e.g., 5'10''"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Weight
          </label>
          <input
            type="text"
            value={personalInfo.weight || ''}
            onChange={(e) => setPersonalInfo({ ...personalInfo, weight: e.target.value })}
            className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
            placeholder="e.g., 160 lbs"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Shoe Size
          </label>
          <input
            type="text"
            value={personalInfo.shoe_size || ''}
            onChange={(e) => setPersonalInfo({ ...personalInfo, shoe_size: e.target.value })}
            className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
            placeholder="e.g., US 10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Top Size
          </label>
          <input
            type="text"
            value={personalInfo.clothing_sizes?.top || ''}
            onChange={(e) => setPersonalInfo({
              ...personalInfo,
              clothing_sizes: { ...personalInfo.clothing_sizes, top: e.target.value }
            })}
            className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
            placeholder="e.g., Medium"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Bottom Size
          </label>
          <input
            type="text"
            value={personalInfo.clothing_sizes?.bottom || ''}
            onChange={(e) => setPersonalInfo({
              ...personalInfo,
              clothing_sizes: { ...personalInfo.clothing_sizes, bottom: e.target.value }
            })}
            className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
            placeholder="e.g., 32x32"
          />
        </div>
      </div>

      {renderArrayInput('Goals', 'goals', newGoal, setGoal, 'Add a goal')}
      {renderArrayInput('Dreams', 'dreams', newDream, setDream, 'Add a dream')}

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Resume
        </label>
        <textarea
          value={personalInfo.resume || ''}
          onChange={(e) => setPersonalInfo({ ...personalInfo, resume: e.target.value })}
          className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
          placeholder="Professional experience and qualifications"
          rows={4}
        />
      </div>

      {renderArrayInput('Hobbies', 'hobbies', newHobby, setNewHobby, 'Add a hobby')}
      {renderArrayInput('Family Members', 'family', newFamilyMember, setFamilyMember, 'Add a family member')}
      {renderArrayInput('Favorite Foods', 'favorite_foods', newFood, setNewFood, 'Add a favorite food')}
      {renderArrayInput('Favorite Drinks', 'favorite_drinks', newDrink, setNewDrink, 'Add a favorite drink')}
      {renderArrayInput('Friends', 'friends', newFriend, setFriend, 'Add a friend')}
      {renderArrayInput('Love Interests', 'love_interests', newLoveInterest, setLoveInterest, 'Add a love interest')}
      {renderArrayInput('Cultural Groups', 'cultural_groups', newCulturalGroup, setCulturalGroup, 'Add a cultural group')}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Religion
          </label>
          <input
            type="text"
            value={personalInfo.religion || ''}
            onChange={(e) => setPersonalInfo({ ...personalInfo, religion: e.target.value })}
            className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
            placeholder="Religious beliefs"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Worldview
          </label>
          <input
            type="text"
            value={personalInfo.worldview || ''}
            onChange={(e) => setPersonalInfo({ ...personalInfo, worldview: e.target.value })}
            className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
            placeholder="Personal philosophy or worldview"
          />
        </div>
      </div>
    </div>
  );
}