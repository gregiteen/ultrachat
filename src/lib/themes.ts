import type { Theme } from '../types';

export const DESIGNER_THEMES: Theme[] = [
  {
    id: 'modern',
    name: 'Modern',
    colors: {
      background: '#ff0000', // Bright Red
      foreground: '#0000ff', // Bright Blue
      primary: '#00ff00', // Bright Green
      secondary: '#ffff00', // Bright Yellow
      accent: '#ff00ff', // Bright Magenta
      muted: '#00ffff',     // Bright Cyan
      mutedForeground: '#ffffff', // White
      inputBackground: '#000000', // Black
      buttonText: '#000000', // Black
      iconColor: '#ff0000',
      iconHover: '#00ff00'
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      background: '#0F172A',
      foreground: '#E2E8F0',
      primary: '#8B5CF6',
      secondary: '#EC4899',
      accent: '#F0ABFC',
      muted: '#1E293B',
      mutedForeground: '#94A3B8',
      inputBackground: '#1E293B',
      buttonText: '#ffffff',
      iconColor: '#8B5CF6',
      iconHover: '#EC4899'
    },
  },
  // Keep other themes but update their accent colors to match
  {
    id: 'nature',
    name: 'Nature',
    colors: {
      background: '#F8FAFC',
      foreground: '#1E293B',
      primary: '#8B5CF6',
      secondary: '#EC4899',
      accent: '#F0ABFC',
      muted: '#F1F5F9',
      mutedForeground: '#64748B',
      inputBackground: '#ffffff',
      buttonText: '#ffffff',
      iconColor: '#8B5CF6',
      iconHover: '#EC4899'
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      background: '#FFFBF5',
      foreground: '#1C1917',
      primary: '#8B5CF6',
      secondary: '#EC4899',
      accent: '#F0ABFC',
      muted: '#FEF3C7',
      mutedForeground: '#78716C',
      inputBackground: '#ffffff',
      buttonText: '#ffffff',
      iconColor: '#8B5CF6',
      iconHover: '#EC4899'
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      background: '#F0F9FF',
      foreground: '#0C4A6E',
      primary: '#8B5CF6',
      secondary: '#EC4899',
      accent: '#F0ABFC',
      muted: '#E0F2FE',
      mutedForeground: '#64748B',
      inputBackground: '#ffffff',
      buttonText: '#ffffff',
      iconColor: '#8B5CF6',
      iconHover: '#EC4899'
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