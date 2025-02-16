import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Theme } from './types';
import { themes } from './variants';
import { applyTheme, getCurrentTheme, getSystemTheme } from './utils';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: Theme[];
  systemTheme: Theme;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getCurrentTheme());
  const systemTheme = getSystemTheme();

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  // Initialize theme on mount
  useEffect(() => {
    applyTheme(theme);
  }, []);

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
        themes,
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