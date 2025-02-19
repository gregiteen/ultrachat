import React, { createContext, useContext, useEffect, useState } from "react";
import { themes, modernLight } from "./variants";
import { applyTheme, getCurrentTheme, getSystemTheme } from "./utils";
import { useAuth } from "../../lib/auth-service";
import { getCustomThemes, createCustomTheme, updateCustomTheme, deleteCustomTheme } from "../../lib/theme-storage";
import { Theme, ThemeContextValue, ThemeVariant } from "./types";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Initialize with modernLight theme
const initialTheme = modernLight;

const getThemeById = (id: string, allThemes: Theme[]): Theme => {
  return allThemes.find(t => t.id === id) || modernLight;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [themeVariant, setThemeVariant] = useState<ThemeVariant>(getCurrentTheme());
  const [currentTheme, setCurrentTheme] = useState<Theme>(initialTheme);
  const [customThemes, setCustomThemes] = useState<Theme[]>([]);

  // Load custom themes
  useEffect(() => {
    if (user) {
      getCustomThemes().then(setCustomThemes);
    } else {
      setCustomThemes([]);
    }
  }, [user]);

  // Update current theme when variant or custom themes change
  useEffect(() => {
    const allThemes = [...themes, ...customThemes];
    let newTheme: Theme;

    if (themeVariant === 'system') {
      const systemPreference = getSystemTheme();
      newTheme = getThemeById(systemPreference, allThemes);
    } else {
      newTheme = getThemeById(themeVariant, allThemes);
    }
    
    // Apply theme colors immediately
    Object.entries(newTheme.colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
    setCurrentTheme(newTheme);
    // Only apply theme if it's one of our base themes
    if (['light', 'dark', 'system'].includes(themeVariant)) {
      applyTheme(themeVariant);
    } else {
      // For custom themes, apply the closest base theme
      applyTheme(newTheme.id.includes('dark') ? 'dark' : 'light');
    }
  }, [themeVariant, customThemes]);

  // Handle system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (themeVariant === "system") {
        const systemPreference = getSystemTheme();
        const allThemes = [...themes, ...customThemes];
        const systemTheme = getThemeById(systemPreference, allThemes);
        setCurrentTheme(systemTheme);
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themeVariant, customThemes]);

  const value: ThemeContextValue = {
    theme: themeVariant,
    currentTheme,
    setTheme: setThemeVariant,
    themes: [...themes, ...customThemes],
    createCustomTheme: async (name, colors) => {
      const newTheme = await createCustomTheme(name, colors);
      setCustomThemes(prev => [...prev, newTheme]);
      return newTheme;
    },
    updateCustomTheme: async (id, name, colors) => {
      const updatedTheme = await updateCustomTheme(id, name, colors);
      setCustomThemes(prev => prev.map(t => t.id === id ? updatedTheme : t));
      return updatedTheme;
    },
    deleteCustomTheme: async (id) => {
      await deleteCustomTheme(id);
      setCustomThemes(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}