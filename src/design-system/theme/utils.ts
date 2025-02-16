import type { Theme } from './types';
import { themes } from './variants';
import { generateFadeTransitions, generateReducedMotionStyles } from './animations';

/**
 * Converts a theme object into CSS variables string
 */
export function generateThemeVariables(theme: Theme): string {
  return `
    :root {
      /* Colors */
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

      /* Spacing */
      --space-xs: ${theme.spacing.xs};
      --space-sm: ${theme.spacing.sm};
      --space-md: ${theme.spacing.md};
      --space-lg: ${theme.spacing.lg};
      --space-xl: ${theme.spacing.xl};

      /* Typography */
      --font-sans: ${theme.typography.fontFamily.sans};
      --font-mono: ${theme.typography.fontFamily.mono};
      
      --font-size-xs: ${theme.typography.fontSize.xs};
      --font-size-sm: ${theme.typography.fontSize.sm};
      --font-size-base: ${theme.typography.fontSize.base};
      --font-size-lg: ${theme.typography.fontSize.lg};
      --font-size-xl: ${theme.typography.fontSize.xl};
      --font-size-2xl: ${theme.typography.fontSize['2xl']};

      --font-weight-normal: ${theme.typography.fontWeight.normal};
      --font-weight-medium: ${theme.typography.fontWeight.medium};
      --font-weight-semibold: ${theme.typography.fontWeight.semibold};
      --font-weight-bold: ${theme.typography.fontWeight.bold};

      --line-height-tight: ${theme.typography.lineHeight.tight};
      --line-height-normal: ${theme.typography.lineHeight.normal};
      --line-height-relaxed: ${theme.typography.lineHeight.relaxed};

      /* Animation */
      --duration-fast: ${theme.animation.duration.fast};
      --duration-normal: ${theme.animation.duration.normal};
      --duration-slow: ${theme.animation.duration.slow};

      --ease-in: ${theme.animation.easing.easeIn};
      --ease-out: ${theme.animation.easing.easeOut};
      --ease-in-out: ${theme.animation.easing.easeInOut};

      /* Elevation */
      --elevation-sm: ${theme.elevation.sm};
      --elevation-md: ${theme.elevation.md};
      --elevation-lg: ${theme.elevation.lg};

      /* Border Radius */
      --radius-sm: ${theme.borderRadius.sm};
      --radius-md: ${theme.borderRadius.md};
      --radius-lg: ${theme.borderRadius.lg};
      --radius-full: ${theme.borderRadius.full};
    }

    ${generateFadeTransitions(theme)}
    ${generateReducedMotionStyles()}
  `;
}

/**
 * Applies a theme by injecting CSS variables into the document
 */
export function applyTheme(theme: Theme): void {
  // Remove any existing theme style tag
  const existingStyle = document.getElementById('theme-variables');
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create and inject new theme variables
  const style = document.createElement('style');
  style.id = 'theme-variables';
  style.textContent = generateThemeVariables(theme);
  document.head.appendChild(style);

  // Store the current theme ID in localStorage
  localStorage.setItem('selected-theme', theme.id);

  // Dispatch theme change event
  window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
}

let customThemes: Theme[] = [];

export function setCustomThemes(themes: Theme[]) {
  customThemes = themes;
}

/**
 * Gets a theme by ID
 */
export function getThemeById(id: string): Theme | undefined {
  return themes.find(theme => theme.id === id) || 
         customThemes.find(theme => theme.id === id);
}

/**
 * Gets the currently active theme
 */
export function getCurrentTheme(): Theme {
  const storedThemeId = localStorage.getItem('selected-theme');
  return getThemeById(storedThemeId || 'modern-light') || themes[0];
}

/**
 * Checks if the system prefers dark mode
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Gets the appropriate theme based on system preferences
 */
export function getSystemTheme(): Theme {
  return prefersDarkMode() ? 
    getThemeById('modern-dark') || themes[0] : 
    getThemeById('modern-light') || themes[0];
}

/**
 * Initializes theme system and applies the appropriate theme
 */
export function initializeTheme(): void {
  const storedThemeId = localStorage.getItem('selected-theme');
  const theme = storedThemeId ? 
    getThemeById(storedThemeId) : 
    getSystemTheme();
  
  applyTheme(theme || themes[0]);

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', e => {
      if (!localStorage.getItem('selected-theme')) {
        applyTheme(getSystemTheme());
      }
    });
}