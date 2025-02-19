import { Theme } from './types';

export const modernLight: Theme = {
  id: 'modern-light',
  name: 'Modern Light',
  colors: {
    background: '#fafafa',
    foreground: '#18181b',
    primary: '#2563eb',
    secondary: '#4b5563',
    muted: '#6b7280',
    'muted-foreground': '#6b7280',
    accent: '#f3f4f6',
    'accent-foreground': '#18181b',
    destructive: '#ef4444',
    'destructive-foreground': '#fafafa',
    border: '#e5e7eb',
    input: '#e5e7eb',
    card: '#ffffff',
    'card-foreground': '#18181b',
    popover: '#ffffff',
    'popover-foreground': '#18181b',
    ring: '#2563eb'
  }
};

export const modernDark: Theme = {
  id: 'modern-dark',
  name: 'Modern Dark',
  colors: {
    background: '#18181b',
    foreground: '#fafafa',
    primary: '#3b82f6',
    secondary: '#6b7280',
    muted: '#6b7280',
    'muted-foreground': '#a1a1aa',
    accent: '#27272a',
    'accent-foreground': '#fafafa',
    destructive: '#ef4444',
    'destructive-foreground': '#fafafa',
    border: '#27272a',
    input: '#27272a',
    card: '#27272a',
    'card-foreground': '#fafafa',
    popover: '#27272a',
    'popover-foreground': '#fafafa',
    ring: '#3b82f6'
  }
};

// Available themes
export const themes: Theme[] = [
  modernLight,
  modernDark,
  {
    id: 'light',
    name: 'Light',
    colors: {
      background: '#ffffff',
      foreground: '#000000',
      primary: '#007bff',
      secondary: '#6c757d',
      muted: '#6c757d',
      'muted-foreground': '#6c757d',
      accent: '#f8f9fa',
      'accent-foreground': '#000000',
      destructive: '#dc3545',
      'destructive-foreground': '#ffffff',
      border: '#dee2e6',
      input: '#dee2e6',
      card: '#ffffff',
      'card-foreground': '#000000',
      popover: '#ffffff',
      'popover-foreground': '#000000',
      ring: '#007bff'
    }
  },
  {
    id: 'dark',
    name: 'Dark',
    colors: {
      background: '#1a1a1a',
      foreground: '#ffffff',
      primary: '#007bff',
      secondary: '#6c757d',
      muted: '#6c757d',
      'muted-foreground': '#a1a1aa',
      accent: '#2d2d2d',
      'accent-foreground': '#ffffff',
      destructive: '#dc3545',
      'destructive-foreground': '#ffffff',
      border: '#2d2d2d',
      input: '#2d2d2d',
      card: '#2d2d2d',
      'card-foreground': '#ffffff',
      popover: '#2d2d2d',
      'popover-foreground': '#ffffff',
      ring: '#007bff'
    }
  },
  {
    id: 'system',
    name: 'System',
    colors: {
      background: '#ffffff',
      foreground: '#000000',
      primary: '#007bff',
      secondary: '#6c757d',
      muted: '#6c757d',
      'muted-foreground': '#6c757d',
      accent: '#f8f9fa',
      'accent-foreground': '#000000',
      destructive: '#dc3545',
      'destructive-foreground': '#ffffff',
      border: '#dee2e6',
      input: '#dee2e6',
      card: '#ffffff',
      'card-foreground': '#000000',
      popover: '#ffffff',
      'popover-foreground': '#000000',
      ring: '#007bff'
    }
  }
];