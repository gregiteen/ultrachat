import React, { useState, useEffect, useCallback } from 'react';
import { usePersonalizationStore } from '../../store/personalization';
import { FileManager } from '../context/FileManager';
import { PersonalizationChatbot } from '../PersonalizationChatbot';
import { generatePersonalizationPDF } from '../../lib/pdf-generator';
import { VoiceRecorder } from '../VoiceRecorder';
import { MessageSquare, X, Mic, Save } from 'lucide-react';
import type { PersonalInfo } from '../../types';
import { supabase } from '../../lib/supabase';
import { AIPersonalizationService } from '../../lib/ai-personalization';

export function PersonalizationPanel() {
  const { 
    personalInfo, loading, error, updatePersonalInfo 
  } = usePersonalizationStore();
  
  const [isRecording, setIsRecording] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    setShowChatbot(true);
  }, []);

  const handleSave = async () => {
    try {
      const aiService = AIPersonalizationService.getInstance();
      const document = await aiService.generatePersonalizationDocument(
        personalInfo,
        { currentStep: 0, messages: [], extractedInfo: personalInfo, isProcessing: false, error: null }
      );

      const blob = generatePersonalizationPDF(personalInfo);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving personalization:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-muted pb-4">
        <h2 className="text-2xl font-bold text-foreground">Preferences Profile</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-button-text rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save & View Profile
          </button>
          <FileManager />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Personal Information Form */}
      <div className="bg-card rounded-lg p-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Basic Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                <input
                  type="text"
                  value={personalInfo.name || ''}
                  onChange={(e) => updatePersonalInfo({ ...personalInfo, name: e.target.value })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={personalInfo.email || ''}
                  onChange={(e) => updatePersonalInfo({ ...personalInfo, email: e.target.value })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                <input
                  type="tel"
                  value={personalInfo.phone || ''}
                  onChange={(e) => updatePersonalInfo({ ...personalInfo, phone: e.target.value })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Address</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Street</label>
                <input
                  type="text"
                  value={personalInfo.address?.street || ''}
                  onChange={(e) => updatePersonalInfo({
                    ...personalInfo,
                    address: { ...personalInfo.address, street: e.target.value }
                  })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">City</label>
                <input
                  type="text"
                  value={personalInfo.address?.city || ''}
                  onChange={(e) => updatePersonalInfo({
                    ...personalInfo,
                    address: { ...personalInfo.address, city: e.target.value }
                  })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">State</label>
                <input
                  type="text"
                  value={personalInfo.address?.state || ''}
                  onChange={(e) => updatePersonalInfo({
                    ...personalInfo,
                    address: { ...personalInfo.address, state: e.target.value }
                  })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">ZIP</label>
                <input
                  type="text"
                  value={personalInfo.address?.zip || ''}
                  onChange={(e) => updatePersonalInfo({
                    ...personalInfo,
                    address: { ...personalInfo.address, zip: e.target.value }
                  })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Country</label>
                <input
                  type="text"
                  value={personalInfo.address?.country || ''}
                  onChange={(e) => updatePersonalInfo({
                    ...personalInfo,
                    address: { ...personalInfo.address, country: e.target.value }
                  })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Professional */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Professional Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Job Title</label>
                <input
                  type="text"
                  value={personalInfo.job || ''}
                  onChange={(e) => updatePersonalInfo({ ...personalInfo, job: e.target.value })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Company</label>
                <input
                  type="text"
                  value={personalInfo.company || ''}
                  onChange={(e) => updatePersonalInfo({ ...personalInfo, company: e.target.value })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  disabled={loading}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Projects</label>
                <textarea
                  value={personalInfo.projects || ''}
                  onChange={(e) => updatePersonalInfo({ ...personalInfo, projects: e.target.value })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  rows={3}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Personal Details</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Height</label>
                <input
                  type="text"
                  value={personalInfo.height || ''}
                  onChange={(e) => updatePersonalInfo({ ...personalInfo, height: e.target.value })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Weight</label>
                <input
                  type="text"
                  value={personalInfo.weight || ''}
                  onChange={(e) => updatePersonalInfo({ ...personalInfo, weight: e.target.value })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Shoe Size</label>
                <input
                  type="text"
                  value={personalInfo.shoe_size || ''}
                  onChange={(e) => updatePersonalInfo({ ...personalInfo, shoe_size: e.target.value })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Top Size</label>
                <input
                  type="text"
                  value={personalInfo.clothing_sizes?.top || ''}
                  onChange={(e) => updatePersonalInfo({
                    ...personalInfo,
                    clothing_sizes: { ...personalInfo.clothing_sizes, top: e.target.value }
                  })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Bottom Size</label>
                <input
                  type="text"
                  value={personalInfo.clothing_sizes?.bottom || ''}
                  onChange={(e) => updatePersonalInfo({
                    ...personalInfo,
                    clothing_sizes: { ...personalInfo.clothing_sizes, bottom: e.target.value }
                  })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Lists */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Interests & Preferences</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Interests</label>
                <input
                  type="text"
                  value={personalInfo.interests?.join(', ') || ''}
                  onChange={(e) => updatePersonalInfo({
                    ...personalInfo,
                    interests: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  placeholder="What are your interests?"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Hobbies</label>
                <input
                  type="text"
                  value={personalInfo.hobbies?.join(', ') || ''}
                  onChange={(e) => updatePersonalInfo({
                    ...personalInfo,
                    hobbies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  placeholder="What are your hobbies?"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Favorite Foods</label>
                <input
                  type="text"
                  value={personalInfo.favorite_foods?.join(', ') || ''}
                  onChange={(e) => updatePersonalInfo({
                    ...personalInfo,
                    favorite_foods: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  placeholder="What foods do you like?"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Favorite Drinks</label>
                <input
                  type="text"
                  value={personalInfo.favorite_drinks?.join(', ') || ''}
                  onChange={(e) => updatePersonalInfo({
                    ...personalInfo,
                    favorite_drinks: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  placeholder="What drinks do you like?"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Relationships */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Relationships</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Family</label>
                <input
                  type="text"
                  value={personalInfo.family?.join(', ') || ''}
                  onChange={(e) => updatePersonalInfo({
                    ...personalInfo,
                    family: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  placeholder="Tell me about your family"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Friends</label>
                <input
                  type="text"
                  value={personalInfo.friends?.join(', ') || ''}
                  onChange={(e) => updatePersonalInfo({
                    ...personalInfo,
                    friends: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  placeholder="Tell me about your friends"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Love Interests</label>
                <input
                  type="text"
                  value={personalInfo.love_interests?.join(', ') || ''}
                  onChange={(e) => updatePersonalInfo({
                    ...personalInfo,
                    love_interests: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  placeholder="Tell me about your romantic interests"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Cultural Groups</label>
                <input
                  type="text"
                  value={personalInfo.cultural_groups?.join(', ') || ''}
                  onChange={(e) => updatePersonalInfo({
                    ...personalInfo,
                    cultural_groups: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  placeholder="What cultural groups do you identify with?"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Identity */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Identity & Worldview</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Religion</label>
                <input
                  type="text"
                  value={personalInfo.religion || ''}
                  onChange={(e) => updatePersonalInfo({ ...personalInfo, religion: e.target.value })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Worldview</label>
                <input
                  type="text"
                  value={personalInfo.worldview || ''}
                  onChange={(e) => updatePersonalInfo({ ...personalInfo, worldview: e.target.value })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">MBTI Type</label>
                <input
                  type="text"
                  value={personalInfo.mbti || ''}
                  onChange={(e) => updatePersonalInfo({ ...personalInfo, mbti: e.target.value })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Goals & Dreams */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Goals & Dreams</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Goals</label>
                <input
                  type="text"
                  value={personalInfo.goals?.join(', ') || ''}
                  onChange={(e) => updatePersonalInfo({
                    ...personalInfo,
                    goals: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  placeholder="What are your goals?"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Dreams</label>
                <input
                  type="text"
                  value={personalInfo.dreams?.join(', ') || ''}
                  onChange={(e) => updatePersonalInfo({
                    ...personalInfo,
                    dreams: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  placeholder="What are your dreams?"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Health */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Health Information</h4>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Health Concerns</label>
              <input
                type="text"
                value={personalInfo.health_concerns?.join(', ') || ''}
                onChange={(e) => updatePersonalInfo({
                  ...personalInfo,
                  health_concerns: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                placeholder="Any health concerns?"
                disabled={loading}
              />
            </div>
          </div>

          {/* Other */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">Additional Information</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Keywords</label>
                <input
                  type="text"
                  value={personalInfo.keywords?.join(', ') || ''}
                  onChange={(e) => updatePersonalInfo({
                    ...personalInfo,
                    keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  placeholder="Any keywords that describe you?"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Backstory</label>
                <textarea
                  value={personalInfo.backstory || ''}
                  onChange={(e) => updatePersonalInfo({ ...personalInfo, backstory: e.target.value })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  rows={4}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Additional Notes</label>
                <textarea
                  value={personalInfo.freeform || ''}
                  onChange={(e) => updatePersonalInfo({ ...personalInfo, freeform: e.target.value })}
                  className="w-full rounded-md border border-muted bg-input-background text-foreground px-3 py-2"
                  rows={4}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-6 right-6 p-4 bg-primary text-button-text rounded-full shadow-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading}
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {/* Floating Chatbot */}
      {showChatbot && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-background rounded-lg shadow-xl border border-muted overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-muted">
            <h3 className="text-lg font-medium">AI Assistant</h3>
            <div className="flex items-center gap-2">
              <VoiceRecorder 
                onStart={() => setIsRecording(true)} 
                onStop={() => setIsRecording(false)}
                className="p-2 hover:bg-muted/10 rounded-full transition-colors"
              >
                <Mic className="h-5 w-5" />
              </VoiceRecorder>
              <button
                onClick={() => setShowChatbot(false)}
                className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted/10 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="h-[calc(100%-64px)]">
            <PersonalizationChatbot isRecording={isRecording} />
          </div>
        </div>
      )}
    </div>
  );
}