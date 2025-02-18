import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { PersonalInfo, PersonalizationDocument } from '../types/personalization';

interface PersonalizationState {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  hasSeenWelcome: boolean;
  isActive: boolean;
  personalInfo: PersonalInfo;
  init: () => Promise<void>;
  updatePersonalInfo: (updates: Partial<PersonalInfo>) => Promise<void>;
  loadPersonalInfo: () => Promise<void>;
  setHasSeenWelcome: (value: boolean) => Promise<void>;
  togglePersonalization: () => Promise<void>;
}

const defaultPersonalInfo: PersonalInfo = {
  name: '',
  email: '',
  phone: '',
  preferences: [],
  interests: [],
  expertise_areas: [],
  communication_style: '',
  learning_style: '',
  work_style: '',
  goals: [],
  backstory: '',
  projects: '',
  resume: '',
  personalization_document: '',
  communication_preferences: {
    tone: ''
  },
  learning_preferences: {
    style: ''
  },
  work_preferences: {
    style: ''
  }
};

function createPersonalizationDocument(info: PersonalInfo): string {
  return `
Name: ${info.name || ''}
Background: ${info.backstory || ''}
Interests: ${info.interests?.join(', ') || ''}
Expertise Areas: ${info.expertise_areas?.join(', ') || ''}
Communication Style: ${info.communication_style || ''}
Learning Style: ${info.learning_style || ''}
Work Style: ${info.work_style || ''}
Goals: ${info.goals?.join(', ') || ''}
Current Projects: ${info.projects || ''}

Preferences:
- Communication: ${info.communication_preferences?.tone || ''}
- Learning: ${info.learning_preferences?.style || ''}
- Work: ${info.work_preferences?.style || ''}
`.trim();
}

export const usePersonalizationStore = create<PersonalizationState>((set, get) => ({
  initialized: false,
  loading: false,
  error: null,
  hasSeenWelcome: false,
  isActive: false,
  personalInfo: defaultPersonalInfo,

  init: async () => {
    try {
      set({ loading: true, error: null });
      await get().loadPersonalInfo();
      set({ initialized: true });
    } catch (error) {
      console.error('Error initializing personalization:', error);
      set({ error: 'Failed to initialize personalization' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  togglePersonalization: async () => {
    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const newState = !get().isActive;

      const { error } = await supabase
        .from('user_personalization')
        .upsert({
          user_id: user.id,
          ...get().personalInfo,
          is_active: newState,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      set({ isActive: newState });
    } catch (error) {
      console.error('Error toggling personalization:', error);
      set({ error: 'Failed to toggle personalization' });
    } finally {
      set({ loading: false });
    }
  },

  updatePersonalInfo: async (updates) => {
    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const updatedInfo: PersonalInfo = {
        ...get().personalInfo,
        ...updates
      };

      // Generate personalization document
      const personalizationDoc = createPersonalizationDocument(updatedInfo);
      const finalUpdates = {
        ...updatedInfo,
        personalization_document: personalizationDoc
      };

      const { error } = await supabase
        .from('user_personalization')
        .upsert({
          user_id: user.id,
          ...finalUpdates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      set({ personalInfo: finalUpdates });
    } catch (error) {
      console.error('Error updating personal info:', error);
      set({ error: 'Failed to update personal info' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadPersonalInfo: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_personalization')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // Ensure all required fields exist with defaults
        const loadedInfo: PersonalInfo = {
          ...defaultPersonalInfo,
          ...data,
          communication_preferences: {
            ...defaultPersonalInfo.communication_preferences,
            ...data.communication_preferences
          },
          learning_preferences: {
            ...defaultPersonalInfo.learning_preferences,
            ...data.learning_preferences
          },
          work_preferences: {
            ...defaultPersonalInfo.work_preferences,
            ...data.work_preferences
          }
        };

        set({ 
          personalInfo: loadedInfo,
          isActive: data.is_active || false,
          hasSeenWelcome: data.has_seen_welcome || false
        });
      }
    } catch (error) {
      console.error('Error loading personal info:', error);
      set({ error: 'Failed to load personal info' });
    }
  },

  setHasSeenWelcome: async (value: boolean) => {
    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_personalization')
        .upsert({
          user_id: user.id,
          ...get().personalInfo,
          has_seen_welcome: value,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      set({ hasSeenWelcome: value });
    } catch (error) {
      console.error('Error updating welcome status:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));