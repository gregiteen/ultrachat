import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { PersonalInfo } from '../types';

interface PersonalizationState {
  personalInfo: PersonalInfo;
  isActive: boolean;
  hasSeenWelcome: boolean;
  loading: boolean;
  error: string | null;
  fetchPersonalInfo: () => Promise<void>;
  updatePersonalInfo: (info: PersonalInfo) => Promise<void>;
  togglePersonalization: () => Promise<void>;
  setHasSeenWelcome: (seen: boolean) => Promise<void>;
}

export const usePersonalizationStore = create<PersonalizationState>((set, get) => ({
  personalInfo: {},
  isActive: false,
  hasSeenWelcome: false,
  loading: false,
  error: null,

    fetchPersonalInfo: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let { data, error } = await supabase
        .from('user_personalization')
        .select('personal_info, is_active, has_seen_welcome')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single

      if (error) throw error;
      console.log("Fetched personalization data:", data);

      if (!data) {
        console.log("No personalization data found, creating default entry.");
        const { error: insertError } = await supabase
          .from('user_personalization')
          .upsert({
            user_id: user.id,
            personal_info: {},
            is_active: false,
            has_seen_welcome: false,
          }, { onConflict: 'user_id' }); // Use upsert with onConflict

        if (insertError) throw insertError;

        // Fetch again after inserting
        ({ data, error } = await supabase
          .from('user_personalization')
          .select('personal_info, is_active, has_seen_welcome')
          .eq('user_id', user.id)
          .maybeSingle()); // Use maybeSingle

        if (error) throw error;
        if (!data) throw new Error("Failed to fetch data after creating default entry.");
      }


      set({
        personalInfo: data.personal_info || {},
        isActive: data.is_active || false,
        hasSeenWelcome: data.has_seen_welcome || false
      });
    } catch (error:any) {
      console.error('Error fetching personal info:', error);
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  updatePersonalInfo: async (info: PersonalInfo) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_personalization')
        .upsert({
          user_id: user.id,
          personal_info: info,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      set({ personalInfo: info });
    } catch (error:any) {
      console.error('Error updating personal info:', error);
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  togglePersonalization: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const newIsActive = !get().isActive;
      set({ isActive: newIsActive });

      // Update in database
      await supabase
        .from('user_personalization')
        .upsert({
          user_id: user.id,
          is_active: newIsActive,
          updated_at: new Date().toISOString()
        });

      console.log('Personalization state updated');
    } catch (error:any) {
      console.error('Error toggling personalization:', error);
      // Revert state if update failed
      set({ isActive: !get().isActive });
    }
  },

  setHasSeenWelcome: async (seen: boolean) => {
    console.log("Setting hasSeenWelcome to:", seen);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_personalization')
        .upsert({
          user_id: user.id,
          has_seen_welcome: seen,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' }); // Use upsert with onConflict

      if (error) {
        console.error("Error updating has_seen_welcome in database:", error);
        throw error;
      }

      set({ hasSeenWelcome: seen });
    } catch (error:any) {
      console.error('Error updating welcome state:', error);
    }
  }
}));