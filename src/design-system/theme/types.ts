export type ThemeVariant = 'light' | 'dark' | 'system' | 'modern-light' | 'modern-dark';

export interface Theme {
  id: string;
  name: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    muted: string;
    'muted-foreground': string;
    accent: string;
    'accent-foreground': string;
    destructive: string;
    'destructive-foreground': string;
    border: string;
    input: string;
    card: string;
    'card-foreground': string;
    popover: string;
    'popover-foreground': string;
    ring: string;
  };
}

export interface ThemeContextValue {
  theme: ThemeVariant;
  currentTheme: Theme;
  setTheme: (theme: ThemeVariant) => void;
  themes: Theme[];
  createCustomTheme: (name: string, colors: Record<string, string>) => Promise<Theme>;
  updateCustomTheme: (id: string, name: string, colors: Record<string, string>) => Promise<Theme>;
  deleteCustomTheme: (id: string) => Promise<void>;
}