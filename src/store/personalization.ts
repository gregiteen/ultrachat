import { create } from 'zustand';
import { supabase } from '../lib/supabase-client';
import type { PersonalInfo, PersonalizationDocument } from '../types/personalization';
import { useToastStore } from './toastStore';

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
  resetPersonalization: () => Promise<void>;
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
    const state = get();
    if (state.initialized || state.loading) return;

    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ 
          initialized: true,
          loading: false,
          error: null,
          personalInfo: defaultPersonalInfo,
          isActive: false,
          hasSeenWelcome: false
        });
        return;
      }

      // Load personalization data
      const { data, error } = await supabase
        .from('user_personalization')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If table doesn't exist yet, just use defaults
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          set({ 
            initialized: true,
            loading: false,
            error: null,
            personalInfo: defaultPersonalInfo,
            isActive: false,
            hasSeenWelcome: false
          });
          return;
        }
        throw error;
      }

      // Set initial state based on whether we have personalization data
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
          initialized: true,
          loading: false,
          error: null,
          personalInfo: loadedInfo,
          isActive: data.is_active || false,
          hasSeenWelcome: data.has_seen_welcome || false
        });
      } else {
        // No data found, set defaults and initialized state
        set({ 
          initialized: true,
          loading: false,
          error: null,
          personalInfo: defaultPersonalInfo,
          isActive: false,
          hasSeenWelcome: false
        });
      }
    } catch (error) {
      console.error('Error initializing personalization:', error);
      set({ 
        error: 'Failed to initialize personalization',
        initialized: true,
        loading: false,
        personalInfo: defaultPersonalInfo,
        isActive: false,
        hasSeenWelcome: false
      });
    }
  },

  togglePersonalization: async () => {
    const currentState = get().isActive;
    let prevState = currentState;
    
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const message = 'Please sign in to use personalization';
        set({ error: message });
        useToastStore.getState().showToast({ 
          message,
          type: 'error',
          duration: 3000
        });
        return;
      }

      const newState = !currentState;
      
      // Don't allow activation if no personalization document or it's empty
      if (newState && !get().personalInfo.personalization_document?.trim()) {
        const message = 'Please complete your personalization profile first';
        set({ error: message, loading: false });
        useToastStore.getState().showToast({ 
          message,
          type: 'error',
          duration: 3000
        });
        return;
      }

      // Keep track of current state for rollback
      const prevState = get().isActive;

      const { error } = await supabase
        .from('user_personalization')
        .upsert({
          user_id: user.id,
          is_active: newState,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      // Update local state after successful server update
      set({ isActive: newState, error: null });
      
      // Show success toast
      useToastStore.getState().showToast({
        message: newState ? 'Personalization enabled' : 'Personalization disabled',
        type: 'success',
        duration: 2000
      });
    } catch (error) {
      console.error('Error toggling personalization:', error);
      // Revert state on error
      set({ isActive: prevState, error: 'Failed to toggle personalization' });
      // Show error toast
      useToastStore.getState().showToast({ 
        message: 'Failed to toggle personalization. Please try again.', 
        type: 'error',
        duration: 3000
      });
    } finally {
      set({ loading: false });
    }
  },

  updatePersonalInfo: async (updates) => {
    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ error: 'Please sign in to update personalization' });
        return;
      }

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
    } finally {
      set({ loading: false });
    }
  },

  loadPersonalInfo: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ 
          personalInfo: defaultPersonalInfo,
          isActive: false,
          hasSeenWelcome: false
        });
        return;
      }

      const { data, error } = await supabase
        .from('user_personalization')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If table doesn't exist yet, just use defaults
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          return;
        }
        throw error;
      }

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
          isActive: data.is_active,
          hasSeenWelcome: data.has_seen_welcome || false,
          error: null
        });
      }
    } catch (error) {
      console.error('Error loading personal info:', error);
      set({ 
        error: 'Failed to load personal info',
        personalInfo: defaultPersonalInfo,
        isActive: false,
        hasSeenWelcome: false
      });
    }
  },

  setHasSeenWelcome: async (value: boolean) => {
    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ error: 'Please sign in to update preferences' });
        return;
      }

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
      set({ error: 'Failed to update welcome status' });
    } finally {
      set({ loading: false });
    }
  },

  resetPersonalization: async () => {
    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ error: 'Please sign in to reset personalization' });
        return;
      }

      // Reset in database
      const { error } = await supabase
        .from('user_personalization')
        .upsert({
          user_id: user.id,
          ...defaultPersonalInfo,
          is_active: false,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Reset local state
      set({
        personalInfo: defaultPersonalInfo,
        isActive: false,
        error: null
      });
    } catch (error) {
      console.error('Error resetting personalization:', error);
      set({ error: 'Failed to reset personalization' });
    }
    set({ loading: false });
  }
}));