// Previous theme interfaces remain the same until Theme interface

export interface ThemeIdentification {
  id: string;
  name: string;
  description?: string;
  category?: string;
  preview?: string;
  isCustom?: boolean;
}

export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  mutedForeground: string;
  inputBackground: string;
  buttonText: string;
  iconColor: string;
  iconHover: string;
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ThemeTypography {
  fontFamily: {
    sans: string;
    mono: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

export interface ThemeElevation {
  sm: string;
  md: string;
  lg: string;
}

export interface ThemeBorderRadius {
  sm: string;
  md: string;
  lg: string;
  full: string;
}

export interface ThemeAnimation {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    linear: string;
  };
}

export interface Theme extends ThemeIdentification {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  elevation: ThemeElevation;
  borderRadius: ThemeBorderRadius;
  animation: ThemeAnimation;
}

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}