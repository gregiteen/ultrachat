import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { DESIGNER_THEMES } from '../lib/themes';
import type { Settings, Theme } from '../types';

interface SettingsState {
  settings: Settings;
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  addCustomTheme: (theme: Theme) => Promise<void>;
  deleteCustomTheme: (themeId: string) => Promise<void>;
}

const defaultSettings: Settings = {
  theme: DESIGNER_THEMES[0],
  customThemes: [],
  notifications: {
    email: true,
    push: true,
  },
  volume: 50,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          // Settings don't exist yet, create with defaults
          const { error: insertError } = await supabase
            .from('user_settings')
            .insert({
              user_id: user.id,
              settings: defaultSettings,
            });

          if (insertError) throw insertError;
          set({ settings: defaultSettings });
        } else {
          throw error;
        }
      } else if (data) {
        set({ settings: data.settings });
      } else {
        // No settings found, create with defaults
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            settings: defaultSettings,
          });

        if (insertError) throw insertError;
        set({ settings: defaultSettings });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      set({ error: 'Failed to load settings' });
    } finally {
      set({ loading: false });
    }
  },

  updateSettings: async (newSettings: Settings) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: newSettings,
        });

      if (error) throw error;
      set({ settings: newSettings });
    } catch (error) {
      console.error('Error updating settings:', error);
      set({ error: 'Failed to update settings' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addCustomTheme: async (theme: Theme) => {
    const { settings } = get();
    const newSettings = {
      ...settings,
      customThemes: [...settings.customThemes, theme],
    };
    await get().updateSettings(newSettings);
  },

  deleteCustomTheme: async (themeId: string) => {
    const { settings } = get();
    const newSettings = {
      ...settings,
      customThemes: settings.customThemes.filter((t) => t.id !== themeId),
      // If the deleted theme was active, switch to the default theme
      theme: settings.theme.id === themeId ? DESIGNER_THEMES[0] : settings.theme,
    };
    await get().updateSettings(newSettings);
  },
}));