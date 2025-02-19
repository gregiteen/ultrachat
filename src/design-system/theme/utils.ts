import { themes, modernLight, modernDark } from './variants';
import { Theme, ThemeVariant } from './types';

export function getCurrentTheme(): ThemeVariant {
  return (localStorage.getItem('theme') as ThemeVariant) || 'system';
}

export function getSystemTheme(): ThemeVariant {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getThemeColors(themeId: ThemeVariant | string): Record<string, string> {
  const allThemes = [...themes, modernLight, modernDark];
  
  if (themeId === 'system') {
    const systemTheme = getSystemTheme();
    return allThemes.find(t => t.id === systemTheme)?.colors || modernLight.colors;
  }
  
  // Find the theme by ID
  const theme = allThemes.find(t => t.id === themeId);
  
  // Return the theme colors or fallback to modern light theme
  return theme?.colors || modernLight.colors;
}

export function applyTheme(themeId: ThemeVariant): void {
  const colors = getThemeColors(themeId);
  
  // Apply colors to CSS variables
  Object.entries(colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value);
  });

  // Store theme preference
  localStorage.setItem('theme', themeId);

  // Update data-theme attribute
  document.documentElement.setAttribute('data-theme', 
    themeId === 'system' ? getSystemTheme() : themeId
  );
}