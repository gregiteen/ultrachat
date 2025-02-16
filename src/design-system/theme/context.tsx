import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Theme } from './types';
import { themes } from './variants';
import { applyTheme, getCurrentTheme, getSystemTheme, setCustomThemes } from './utils';
import { useAuthStore } from '../../store/auth';
import { getCustomThemes, saveCustomTheme, updateCustomTheme, deleteCustomTheme } from '../../lib/theme-storage';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  allThemes: Theme[];
  designerThemes: Theme[];
  customThemes: Theme[];
  saveCustomTheme: (theme: Theme) => Promise<void>;
  updateCustomTheme: (theme: Theme) => Promise<void>;
  deleteCustomTheme: (themeId: string) => Promise<void>;
  isCustomTheme: (themeId: string) => boolean;
  systemTheme: Theme;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getCurrentTheme());
  const [loading, setLoading] = useState(true);
  const [customThemes, setCustomThemes] = useState<Theme[]>([]);
  const systemTheme = getSystemTheme();

  const isInitialized = useAuthStore((state) => state.initialized);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.loading);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  const handleSaveCustomTheme = async (newTheme: Theme) => {
    const { data, error } = await saveCustomTheme(newTheme);
    if (error) {
      console.error('Error saving custom theme:', error);
      return;
    }
    if (data) {
      setCustomThemes(prev => [...prev, data]);
    }
  };

  const handleUpdateCustomTheme = async (updatedTheme: Theme) => {
    const { data, error } = await updateCustomTheme(updatedTheme);
    if (error) {
      console.error('Error updating custom theme:', error);
      return;
    }
    if (data) {
      setCustomThemes(prev => 
        prev.map(theme => theme.id === data.id ? data : theme)
      );
    }
  };

  const handleDeleteCustomTheme = async (themeId: string) => {
    const { error } = await deleteCustomTheme(themeId);
    if (error) {
      console.error('Error deleting custom theme:', error);
      return;
    }
    setCustomThemes(prev => prev.filter(theme => theme.id !== themeId));
  };

  const isCustomTheme = (themeId: string) => {
    return customThemes.some(theme => theme.id === themeId);
  };

  // Initialize theme and load custom themes when auth is ready
  useEffect(() => {
    if (isInitialized && !isLoading) {
      applyTheme(theme);
      
      if (user) {
        const loadCustomThemes = async () => {
          setLoading(true);
          const { data, error } = await getCustomThemes();
          if (error) console.error('Error loading custom themes:', error);
          if (data) {
            setCustomThemes(data);
            setCustomThemes(data); // Update the utils with custom themes
          }
          setLoading(false);
        };
        loadCustomThemes();
      } else {
        setLoading(false);
      }
    }
  }, [isInitialized, isLoading, user]);

  // Update custom themes in utils when they change
  useEffect(() => {
    setCustomThemes(customThemes);
  }, [customThemes]);

  // Listen for theme change events
  useEffect(() => {
    const handleThemeChange = (e: CustomEvent<Theme>) => {
      setThemeState(e.detail);
    };

    window.addEventListener('themechange', handleThemeChange as EventListener);
    return () => {
      window.removeEventListener('themechange', handleThemeChange as EventListener);
    };
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        allThemes: [...themes, ...customThemes],
        designerThemes: themes,
        customThemes,
        saveCustomTheme: handleSaveCustomTheme,
        updateCustomTheme: handleUpdateCustomTheme,
        deleteCustomTheme: handleDeleteCustomTheme,
        isCustomTheme,
        systemTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}