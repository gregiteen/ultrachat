import type { Theme } from './types';

export const modernLight: Theme = {
  id: 'modern-light',
  name: 'Modern Light',
  description: 'Clean and minimal light theme',
  category: 'light',
  colors: {
    background: '#FFFFFF',
    foreground: '#1A1A1A',
    primary: '#007AFF',
    secondary: '#6C757D',
    accent: '#5856D6',
    muted: '#F5F5F5',
    mutedForeground: '#6B7280',
    inputBackground: '#F9FAFB',
    buttonText: '#FFFFFF',
    iconColor: '#4B5563',
    iconHover: '#1F2937'
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace'
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75'
    }
  },
  elevation: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px'
  },
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '450ms'
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      linear: 'linear'
    }
  }
};

export const modernDark: Theme = {
  ...modernLight,
  id: 'modern-dark',
  name: 'Modern Dark',
  description: 'Clean and minimal dark theme',
  category: 'dark',
  colors: {
    background: '#1A1A1A',
    foreground: '#FFFFFF',
    primary: '#0A84FF',
    secondary: '#6C757D',
    accent: '#5E5CE6',
    muted: '#2A2A2A',
    mutedForeground: '#9CA3AF',
    inputBackground: '#2D2D2D',
    buttonText: '#FFFFFF',
    iconColor: '#9CA3AF',
    iconHover: '#D1D5DB'
  }
};

export const themes: Theme[] = [
  modernLight,
  modernDark
];

export function getDefaultTheme(): Theme {
  return modernLight;
}

export function getThemeByCategory(category: 'light' | 'dark'): Theme {
  return category === 'dark' ? modernDark : modernLight;
}