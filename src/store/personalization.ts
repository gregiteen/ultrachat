import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { PersonalInfo } from '../types';
import { AIPersonalizationService } from '../lib/ai-personalization';
import { processPersonalInfo } from '../lib/utils';

interface PersonalizationState {
  personalInfo: PersonalInfo;
  loading: boolean;
  error: string | null;
  isActive: boolean;
  hasSeenWelcome: boolean;
  snoozedForSession: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  fetchPersonalInfo: () => Promise<void>;
  updatePersonalInfo: (info: PersonalInfo) => Promise<void>;
  togglePersonalization: () => Promise<void>;
  setHasSeenWelcome: (seen: boolean) => Promise<void>;
  setInitialized: (init: boolean) => void;
}

export const usePersonalizationStore = create<PersonalizationState>((set, get) => ({
  personalInfo: {},
  loading: false,
  error: null,
  isActive: false,
  hasSeenWelcome: false,
  snoozedForSession: false,
  initialized: false,

  init: async () => {
    if (!get().initialized) {
      await get().fetchPersonalInfo();
    }
  },

  fetchPersonalInfo: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let { data, error } = await supabase
        .from('user_personalization')
        .select('personal_info, is_active, has_seen_welcome')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { error: insertError } = await supabase
          .from('user_personalization')
          .insert({
            user_id: user.id,
            personal_info: {},
            is_active: false,
            has_seen_welcome: false
          });

        if (insertError) throw insertError;
        data = { personal_info: {}, is_active: false, has_seen_welcome: false };
      }

      set({
        personalInfo: data.personal_info || {},
        isActive: data.is_active,
        hasSeenWelcome: data.has_seen_welcome,
        initialized: true
      });
    } catch (error: any) {
      console.error('Error fetching personal info:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  updatePersonalInfo: async (info: PersonalInfo) => {
    const currentInfo = get().personalInfo;
    // Update local state immediately for responsive UI
    set({ personalInfo: { ...currentInfo, ...info } });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Process arrays and update database
      const processedInfo = processPersonalInfo({ ...currentInfo, ...info });
      const { error: updateError } = await supabase
        .from('user_personalization')
        .update({
          personal_info: processedInfo,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        // Revert on error
        set({ personalInfo: currentInfo });
        throw updateError;
      }
    } catch (error: any) {
      console.error('Error updating personal info:', error);
      set({ error: error.message });
    }
  },

  togglePersonalization: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const newIsActive = !get().isActive;

      // Update existing row
      const { error } = await supabase
        .from('user_personalization')
        .update({
          is_active: newIsActive,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      set({ isActive: newIsActive });
    } catch (error: any) {
      console.error('Error toggling personalization:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  setHasSeenWelcome: async (seen: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_personalization')
        .update({
          has_seen_welcome: seen,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Check if there's personalization data
      const state = get();
      const hasData = !!(
        state.personalInfo.name || 
        state.personalInfo.email || 
        state.personalInfo.phone ||
        (state.personalInfo.interests && state.personalInfo.interests.length > 0) ||
        state.personalInfo.backstory || 
        state.personalInfo.projects || 
        state.personalInfo.resume
      );

      set({
        hasSeenWelcome: seen && hasData,
        snoozedForSession: !seen || !hasData
      });
    } catch (error: any) {
      console.error('Error updating welcome status:', error);
      throw new Error('Failed to update welcome status. Please try again.');
    }
  },

  setInitialized: (init: boolean) => {
    set({ initialized: init });
  }
}));

// Initialize store on import
usePersonalizationStore.getState().init();