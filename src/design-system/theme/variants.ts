import type { Theme } from './types';

export const baseTheme = {
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
      mono: 'JetBrains Mono, Menlo, monospace'
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
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  animation: {
    duration: {
      fast: '100ms',
      normal: '200ms',
      slow: '300ms'
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },
  elevation: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px'
  }
};

export const themes: Theme[] = [
  {
    id: 'professional',
    name: 'Professional',
    ...baseTheme,
    colors: {
      background: '#FFFFFF',
      foreground: '#1A1A1A',
      primary: '#0066CC',
      secondary: '#4D4D4D',
      accent: '#FF6B6B',
      muted: '#F5F5F5',
      mutedForeground: '#737373',
      inputBackground: '#FFFFFF',
      buttonText: '#FFFFFF',
      iconColor: '#0066CC',
      iconHover: '#004C99'
    }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    ...baseTheme,
    colors: {
      background: '#FAFAFA',
      foreground: '#2C2C2C',
      primary: '#000000',
      secondary: '#404040',
      accent: '#808080',
      muted: '#F0F0F0',
      mutedForeground: '#666666',
      inputBackground: '#FFFFFF',
      buttonText: '#FFFFFF',
      iconColor: '#000000',
      iconHover: '#404040'
    }
  },
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    ...baseTheme,
    colors: {
      background: '#18181B',
      foreground: '#FAFAFA',
      primary: '#60A5FA',
      secondary: '#818CF8',
      accent: '#A78BFA',
      muted: '#27272A',
      mutedForeground: '#A1A1AA',
      inputBackground: '#27272A',
      buttonText: '#18181B',
      iconColor: '#60A5FA',
      iconHover: '#3B82F6'
    }
  },
  {
    id: 'modern-light',
    name: 'Modern Light',
    ...baseTheme,
    colors: {
      background: '#FFFFFF',
      foreground: '#18181B',
      primary: '#2563EB',
      secondary: '#4F46E5',
      accent: '#7C3AED',
      muted: '#F4F4F5',
      mutedForeground: '#71717A',
      inputBackground: '#FFFFFF',
      buttonText: '#FFFFFF',
      iconColor: '#2563EB',
      iconHover: '#1D4ED8'
    }
  },
  {
    id: 'soft',
    name: 'Soft',
    ...baseTheme,
    colors: {
      background: '#F8F9FA',
      foreground: '#1F2937',
      primary: '#6366F1',
      secondary: '#8B5CF6',
      accent: '#EC4899',
      muted: '#F3F4F6',
      mutedForeground: '#6B7280',
      inputBackground: '#FFFFFF',
      buttonText: '#FFFFFF',
      iconColor: '#6366F1',
      iconHover: '#4F46E5'
    }
  }
];