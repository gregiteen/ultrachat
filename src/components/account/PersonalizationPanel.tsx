import React, { useState } from 'react';
import { useAuth } from '../../lib/auth-service';
import { FileManager } from '../context/FileManager';
import { usePersonalizationStore } from '../../store/personalization';

export function PersonalizationPanel() {
  const { user } = useAuth();
  const { 
    personalInfo, 
    updatePersonalInfo, 
    initialized: personalizationInitialized, 
    loading: personalizationLoading 
  } = usePersonalizationStore();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving || !user) return;
    setIsSaving(true);

    try {
      await updatePersonalInfo(personalInfo);
    } catch (error) {
      console.error('Failed to save personalization:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || !personalizationInitialized || personalizationLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Personalization</h2>
        <p className="text-muted-foreground">
          Customize your experience by providing information about your preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Name
              </label>
              <input
                type="text"
                value={personalInfo.name || ''}
                onChange={(e) => updatePersonalInfo({ ...personalInfo, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Backstory
              </label>
              <textarea
                value={personalInfo.backstory || ''}
                onChange={(e) => updatePersonalInfo({ ...personalInfo, backstory: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background h-24 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Preferences</h3>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Communication Style
              </label>
              <select
                value={personalInfo.communication_style || ''}
                onChange={(e) => updatePersonalInfo({ ...personalInfo, communication_style: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Select a style</option>
                <option value="direct">Direct</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Learning Style
              </label>
              <select
                value={personalInfo.learning_style || ''}
                onChange={(e) => updatePersonalInfo({ ...personalInfo, learning_style: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Select a style</option>
                <option value="visual">Visual</option>
                <option value="auditory">Auditory</option>
                <option value="kinesthetic">Kinesthetic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Work Style
              </label>
              <select
                value={personalInfo.work_style || ''}
                onChange={(e) => updatePersonalInfo({ ...personalInfo, work_style: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Select a style</option>
                <option value="independent">Independent</option>
                <option value="collaborative">Collaborative</option>
                <option value="structured">Structured</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>
        </div>

        {/* Files */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Files</h3>
          <FileManager />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}