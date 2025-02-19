import React, { useState, useRef, useEffect } from 'react';
import { usePersonalizationStore } from '../../store/personalization';
import { useAuthStore } from '../../store/auth';
import { FileManager } from '../context/FileManager';
import { PersonalizationAssistant } from './PersonalizationAssistant';
import { generatePersonalizationPDF } from '../../lib/pdf-generator';
import { Save, MessageSquare, X, FileText } from 'lucide-react';
import type { PersonalInfo } from '../../types/personalization';
import { supabase } from '../../lib/supabase';
import { gemini } from '../../lib/gemini';
import { useToastStore } from '../../store/toastStore';
import { PersonalizationForm } from '../PersonalizationForm';

export default function PersonalizationPanel() {
  const { 
    personalInfo = {}, 
    loading: personalizationLoading, 
    error, 
    updatePersonalInfo, 
    initialized: personalizationInitialized,
    init: initPersonalization
  } = usePersonalizationStore();
  
  const { initialized: authInitialized, user } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const chatButtonRef = useRef<HTMLButtonElement>(null);

  // Initialize personalization store
  useEffect(() => {
    initPersonalization();
  }, [initPersonalization]);

  const handleSave = async () => {
    if (isSaving || !user) return;
    setIsSaving(true);
    try {
      // Generate PDF from form fields
      const blob = generatePersonalizationPDF(personalInfo);
      const file = new File([blob], 'preferences-profile.pdf', { type: 'application/pdf' });
      const filePath = `${Date.now()}-preferences-profile.pdf`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Update personalInfo with new file
      const currentFiles = personalInfo.files || [];
      if (!currentFiles.includes(filePath)) {
        await updatePersonalInfo({
          ...personalInfo,
          files: [...currentFiles, filePath]
        });
      }
    } catch (error) {
      console.error('Error saving personalization:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const generatePreferencesProfile = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      // Create a structured profile using Gemini
      const prompt = `Please analyze the following user information and create a structured preferences profile that captures their personality, learning style, work style, and communication preferences. Format the response as a natural, well-organized document.

User Information:
${Object.entries(personalInfo)
  .filter(([key, value]) => value && key !== 'files')
  .map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}: ${value.join(', ')}`;
    }
    return `${key}: ${value}`;
  })
  .join('\n')}

Please organize this into a cohesive profile that:
1. Summarizes their background and personality
2. Details their learning preferences and style
3. Explains their work approach and preferences
4. Describes their communication style
5. Lists their key interests and expertise areas
6. Outlines their goals and aspirations

Format the response as a natural, flowing document that captures their unique characteristics.`;

      const response = await gemini.generateText(prompt);
      
      // Update the personalization document
      await updatePersonalInfo({
        ...personalInfo,
        personalization_document: response
      });

      // Show success message
      useToastStore.getState().showToast({
        message: 'Preferences profile generated successfully',
        type: 'success',
        duration: 3000
      });
    } catch (error) {
      console.error('Error generating preferences profile:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  if (!authInitialized || !user) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-lg text-muted-foreground">
          Please log in to access personalization.
        </div>
      </div>
    );
  }

  if (!personalizationInitialized || personalizationLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className={`text-lg text-muted-foreground ${personalizationLoading ? 'animate-pulse' : ''}`}>
          {error ? (
            <div className="text-destructive">
              Error loading personalization data.
            </div>
          ) : (
            "Loading personalization data..."
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Form Fields */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-muted pb-4">
          <h2 className="text-2xl font-bold text-foreground">Preferences Profile</h2>
          <button
            onClick={generatePreferencesProfile}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-button-text rounded-md hover:bg-secondary transition-colors disabled:opacity-50 mr-4"
          >
            <FileText className="h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Generate Profile'}
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={isSaving || personalizationLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-button-text rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save & View Profile'}
            </button>
            <FileManager />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <PersonalizationForm />
      </div>
      {/* Chat Button */}
      <button
        ref={chatButtonRef}
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 p-4 bg-primary text-button-text rounded-full shadow-lg hover:bg-secondary transition-colors z-50 group"
      >
        {isChatOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </button>
      
      {!isChatOpen && (
        <div className="fixed bottom-20 right-6 p-2 bg-background border border-muted rounded-lg shadow-lg z-40 max-w-[200px] text-sm opacity-0 group-hover:opacity-100 transition-opacity">
          Need help filling out your profile? Chat with Ultra, your AI assistant!
        </div>
      )}

      {/* Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-background border border-muted shadow-lg rounded-lg overflow-hidden z-40">
          <div className="flex items-center justify-between p-4 border-b border-muted bg-muted/50 backdrop-blur-sm">
            <div>
              <h3 className="text-lg font-semibold">Ultra</h3>
              <p className="text-sm text-muted-foreground">Your AI Assistant</p>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="h-[calc(100%-4rem)]">
            <PersonalizationAssistant />
          </div>
        </div>
      )}
    </div>
  );
}