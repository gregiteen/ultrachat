import type { Theme } from '../types';

export const DESIGNER_THEMES: Theme[] = [
  {
    id: 'modern',
    name: 'Modern',
    colors: {
      background: '#ffffff',
      foreground: '#1E293B',
      primary: '#2563EB',
      secondary: '#3B82F6',
      accent: '#60A5FA',
      muted: '#F8FAFC',
      mutedForeground: '#64748B',
      inputBackground: '#ffffff',
      buttonText: '#ffffff',
      iconColor: '#2563EB',
      iconHover: '#1D4ED8'
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      background: '#0A0F1E',
      foreground: '#E2E8F0',
      primary: '#6366F1',
      secondary: '#818CF8',
      accent: '#A5B4FC',
      muted: '#1E293B',
      mutedForeground: '#94A3B8',
      inputBackground: '#1E293B',
      buttonText: '#ffffff',
      iconColor: '#6366F1',
      iconHover: '#4F46E5'
    },
  },
  {
    id: 'nature',
    name: 'Nature',
    colors: {
      background: '#F8FAF5',
      foreground: '#1B4332',
      primary: '#059669',
      secondary: '#10B981',
      accent: '#34D399',
      muted: '#ECFDF5',
      mutedForeground: '#4B5563',
      inputBackground: '#ffffff',
      buttonText: '#ffffff',
      iconColor: '#059669',
      iconHover: '#047857'
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      background: '#FEF2F2',
      foreground: '#1C1917',
      primary: '#DC2626',
      secondary: '#EF4444',
      accent: '#F87171',
      muted: '#FEE2E2',
      mutedForeground: '#6B7280',
      inputBackground: '#ffffff',
      buttonText: '#ffffff',
      iconColor: '#DC2626',
      iconHover: '#B91C1C'
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      background: '#ECFEFF',
      foreground: '#0C4A6E',
      primary: '#0891B2',
      secondary: '#06B6D4',
      accent: '#22D3EE',
      muted: '#CFFAFE',
      mutedForeground: '#475569',
      inputBackground: '#ffffff',
      buttonText: '#ffffff',
      iconColor: '#0891B2',
      iconHover: '#0E7490'
    },
  },
];

export function generateCSSVariables(theme: Theme): string {
  return `
    :root {
      --background: ${theme.colors.background};
      --foreground: ${theme.colors.foreground};
      --primary: ${theme.colors.primary};
      --secondary: ${theme.colors.secondary};
      --accent: ${theme.colors.accent};
      --muted: ${theme.colors.muted};
      --muted-foreground: ${theme.colors.mutedForeground};
      --input-background: ${theme.colors.inputBackground};
      --button-text: ${theme.colors.buttonText};
      --icon-color: ${theme.colors.iconColor};
      --icon-hover: ${theme.colors.iconHover};
    }
  `;
}

export function applyTheme(theme: Theme) {
    console.log("Applying theme:", theme);
  // Remove any existing theme style tag
  const existingStyle = document.getElementById('theme-style');
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create and apply new theme style
  const style = document.createElement('style');
  style.id = 'theme-style';
  style.textContent = generateCSSVariables(theme);
  document.head.appendChild(style);
}

export function removeTheme() {
  const existingStyle = document.getElementById('theme-style');
  if (existingStyle) {
    existingStyle.remove();
  }
}