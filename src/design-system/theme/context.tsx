import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Theme } from './types';
import { themes } from './variants';
import { applyTheme, getCurrentTheme, getSystemTheme } from './utils';
import { useAuthStore } from '../../store/auth';
import { getCustomThemes, createCustomTheme, updateCustomTheme, deleteCustomTheme } from '../../lib/theme-storage';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  allThemes: Theme[];
  designerThemes: Theme[];
  customThemes: Theme[];
  saveCustomTheme: (theme: Theme) => Promise<void>;
  loading: boolean;
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
    try {
      const savedTheme = await createCustomTheme(newTheme);
      if (savedTheme) {
        setCustomThemes(prev => [...prev, savedTheme]);
      }
    } catch (error) {
      console.error('Error saving custom theme:', error);
    }
  };

  const handleUpdateCustomTheme = async (updatedTheme: Theme) => {
    try {
      const result = await updateCustomTheme(updatedTheme);
      if (result) {
        setCustomThemes(prev => 
          prev.map(theme => theme.id === result.id ? result : theme)
        );
      }
    } catch (error) {
      console.error('Error updating custom theme:', error);
    }
  };

  const handleDeleteCustomTheme = async (themeId: string) => {
    try {
      const success = await deleteCustomTheme(themeId);
      if (success) {
        setCustomThemes(prev => prev.filter(theme => theme.id !== themeId));
      }
    } catch (error) {
      console.error('Error deleting custom theme:', error);
    }
  };

  const isCustomTheme = (themeId: string) => {
    return customThemes.some(theme => theme.id === themeId);
  };

  // Initialize theme and load custom themes when auth is ready
  useEffect(() => {
    // Always apply the current theme, even if not initialized
    applyTheme(theme);

    // Only load custom themes when auth is ready and user is logged in
    if (!isInitialized || isLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    const loadCustomThemes = async () => {
      setLoading(true);
      try {
        const themes = await getCustomThemes();
        setCustomThemes(themes);
      } catch (error) {
        console.error('Error loading custom themes:', error);
      }
      setLoading(false);
    }
    loadCustomThemes();
  }, [isInitialized, isLoading, user]);

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
        loading,
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