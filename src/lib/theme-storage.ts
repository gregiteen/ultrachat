import { Theme } from '../design-system/theme/types';

// Mock storage for custom themes
const STORAGE_KEY = 'custom-themes';

export async function getCustomThemes(): Promise<Theme[]> {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function createCustomTheme(name: string, colors: Record<string, string>): Promise<Theme> {
  const themes = await getCustomThemes();
  const newTheme: Theme = {
    id: Math.random().toString(36).substring(7),
    name,
    colors
  };
  
  themes.push(newTheme);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
  return newTheme;
}

export async function updateCustomTheme(id: string, name: string, colors: Record<string, string>): Promise<Theme> {
  const themes = await getCustomThemes();
  const index = themes.findIndex(t => t.id === id);
  
  if (index === -1) {
    throw new Error(`Theme with id ${id} not found`);
  }

  const updatedTheme: Theme = {
    id,
    name,
    colors
  };

  themes[index] = updatedTheme;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
  return updatedTheme;
}

export async function deleteCustomTheme(id: string): Promise<void> {
  const themes = await getCustomThemes();
  const filtered = themes.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}