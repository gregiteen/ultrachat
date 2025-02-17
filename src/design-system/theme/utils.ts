import type { Theme } from './types';
import { themes } from './variants';
import { generateFadeTransitions, generateReducedMotionStyles } from './animations';

// Cache for generated CSS strings
const cssCache = new Map<string, string>();

// Debounce theme change events
let themeChangeTimeout: NodeJS.Timeout;

/**
 * Converts a theme object into CSS variables string with caching
 */
export function generateThemeVariables(theme: Theme): string {
  const cacheKey = `theme-${theme.id}`;
  
  if (cssCache.has(cacheKey)) {
    return cssCache.get(cacheKey)!;
  }

  const css = `
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

    /* Theme transition styles */
    :root {
      transition: background-color 0.3s ease,
                  color 0.3s ease;
    }

    /* Theme-specific transitions */
    [data-theme="${theme.id}"] * {
      transition: background-color 0.3s ease,
                  border-color 0.3s ease,
                  color 0.3s ease,
                  box-shadow 0.3s ease;
    }

    ${generateFadeTransitions(theme)}
    ${generateReducedMotionStyles()}
  `;

  cssCache.set(cacheKey, css);
  return css;
}

/**
 * Safely applies a theme by injecting CSS variables into the document
 */
export function applyTheme(theme: Theme): void {
  try {
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

    // Update data-theme attribute
    document.documentElement.setAttribute('data-theme', theme.id);

    // Store the current theme ID in localStorage
    localStorage.setItem('selected-theme', theme.id);

    // Debounce theme change event
    clearTimeout(themeChangeTimeout);
    themeChangeTimeout = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
    }, 100);
  } catch (error) {
    console.error('Failed to apply theme:', error);
    // Fallback to default theme
    if (theme.id !== themes[0].id) {
      applyTheme(themes[0]);
    }
  }
}

// Theme registry for custom themes
const themeRegistry = new Map<string, Theme>();

/**
 * Registers custom themes
 */
export function registerCustomThemes(newThemes: Theme[]): void {
  newThemes.forEach(theme => {
    if (!theme.id || !theme.name) {
      console.warn('Invalid theme:', theme);
      return;
    }
    themeRegistry.set(theme.id, theme);
  });
}

/**
 * Gets a theme by ID with type safety
 */
export function getThemeById(id: string): Theme | undefined {
  return themes.find(theme => theme.id === id) || 
         themeRegistry.get(id);
}

/**
 * Gets the currently active theme with fallback
 */
export function getCurrentTheme(): Theme {
  try {
    const storedThemeId = localStorage.getItem('selected-theme');
    return getThemeById(storedThemeId || 'modern-light') || themes[0];
  } catch {
    return themes[0];
  }
}

/**
 * Checks if the system prefers dark mode
 */
export function prefersDarkMode(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

/**
 * Gets the appropriate theme based on system preferences
 */
export function getSystemTheme(): Theme {
  return prefersDarkMode() ? 
    getThemeById('modern-dark') || themes[0] : 
    getThemeById('modern-light') || themes[0];
}

// Media query for system theme changes
let systemThemeQuery: MediaQueryList | null = null;

/**
 * Initializes theme system and applies the appropriate theme
 */
export function initializeTheme(): void {
  try {
    const storedThemeId = localStorage.getItem('selected-theme');
    const theme = storedThemeId ? 
      getThemeById(storedThemeId) : 
      getSystemTheme();
    
    applyTheme(theme || themes[0]);

    // Clean up existing listener
    if (systemThemeQuery) {
      systemThemeQuery.removeEventListener('change', handleSystemThemeChange);
    }

    // Listen for system theme changes
    systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemThemeQuery.addEventListener('change', handleSystemThemeChange);
  } catch (error) {
    console.error('Failed to initialize theme:', error);
    applyTheme(themes[0]);
  }
}

function handleSystemThemeChange(e: MediaQueryListEvent): void {
  if (!localStorage.getItem('selected-theme')) {
    applyTheme(getSystemTheme());
  }
}

// Clean up on module unload
export function cleanup(): void {
  if (systemThemeQuery) {
    systemThemeQuery.removeEventListener('change', handleSystemThemeChange);
    systemThemeQuery = null;
  }
  cssCache.clear();
  clearTimeout(themeChangeTimeout);
}