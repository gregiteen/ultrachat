import { supabase } from './supabase';
import { createQuery } from './db';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Theme, ThemeBorderRadius, ThemeColors, ThemeSpacing, ThemeTypography, ThemeAnimation, ThemeElevation } from '../design-system/theme/types';

interface DbTheme {
  id: string;
  user_id: string;
  theme_id: string;
  name: string;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: Record<string, any>;
  animation: Record<string, any>;
  elevation: Record<string, string>;
  border_radius: Record<string, string>;
  created_at: string;
  updated_at: string;
}

// Convert database theme to application theme
function convertToTheme(dbTheme: DbTheme): Theme {
  return {
    id: dbTheme.theme_id,
    isCustom: true,
    name: dbTheme.name,
    colors: dbTheme.colors,
    spacing: dbTheme.spacing,
    typography: dbTheme.typography as ThemeTypography,
    animation: dbTheme.animation as ThemeAnimation,
    elevation: {
      sm: dbTheme.elevation.sm || '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: dbTheme.elevation.md || '0 4px 6px rgba(0, 0, 0, 0.1)',
      lg: dbTheme.elevation.lg || '0 10px 15px rgba(0, 0, 0, 0.1)'
    } as ThemeElevation,
    borderRadius: {
      sm: dbTheme.border_radius.sm || '0.125rem',
      md: dbTheme.border_radius.md || '0.375rem',
      lg: dbTheme.border_radius.lg || '0.5rem',
      full: dbTheme.border_radius.full || '9999px'
    } as ThemeBorderRadius
  };
}

// Convert application theme to database format
function convertToDbTheme(theme: Theme, userId: string): Omit<DbTheme, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    theme_id: theme.id,
    name: theme.name,
    colors: theme.colors,
    spacing: theme.spacing,
    typography: theme.typography,
    animation: theme.animation,
    elevation: {
      sm: theme.elevation.sm,
      md: theme.elevation.md,
      lg: theme.elevation.lg
    },
    border_radius: {
      sm: theme.borderRadius.sm,
      md: theme.borderRadius.md,
      lg: theme.borderRadius.lg,
      full: theme.borderRadius.full
    }
  };
}

export async function getCustomThemes(): Promise<Theme[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Return empty array if not authenticated - this is normal
      return [];
    }

    const result = await createQuery<DbTheme>(supabase, 'custom_themes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .execute();

    if (result.error) {
      const pgError = result.error as PostgrestError;
      if (pgError?.code === '404' || pgError?.code === '42P01') {
        // Table doesn't exist yet - this is normal during initial setup
        return [];
      }
      console.error('Error fetching custom themes:', pgError);
      return [];
    }

    return Array.isArray(result.data) ? result.data.map(convertToTheme) : [];
  } catch (error) {
    console.error('Unexpected error fetching themes:', error);
    return [];
  }
}

export async function createCustomTheme(theme: Theme): Promise<Theme | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to create a theme');
    }

    const dbTheme = convertToDbTheme(theme, user.id);
    const result = await createQuery<DbTheme>(supabase, 'custom_themes')
      .insert(dbTheme)
      .select('*')
      .single()
      .execute();

    if (result.error) {
      const pgError = result.error as PostgrestError;
      if (pgError?.code === '404' || pgError?.code === '42P01') {
        // Table doesn't exist yet - this is normal during initial setup
        return null;
      }
      console.error('Error creating custom theme:', pgError);
      return null;
    }

    if (!result.data || Array.isArray(result.data)) {
      return null;
    }

    return convertToTheme(result.data);
  } catch (error) {
    console.error('Unexpected error creating theme:', error);
    return null;
  }
}

export async function updateCustomTheme(theme: Theme): Promise<Theme | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to update a theme');
    }

    const dbTheme = convertToDbTheme(theme, user.id);
    const result = await createQuery<DbTheme>(supabase, 'custom_themes')
      .update(dbTheme)
      .eq('theme_id', theme.id)
      .eq('user_id', user.id)
      .select('*')
      .single()
      .execute();

    if (result.error) {
      const pgError = result.error as PostgrestError;
      if (pgError?.code === '404' || pgError?.code === '42P01') {
        // Table doesn't exist yet - this is normal during initial setup
        return null;
      }
      console.error('Error updating custom theme:', pgError);
      return null;
    }

    if (!result.data || Array.isArray(result.data)) {
      return null;
    }

    return convertToTheme(result.data);
  } catch (error) {
    console.error('Unexpected error updating theme:', error);
    return null;
  }
}

export async function deleteCustomTheme(themeId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to delete a theme');
    }

    const result = await createQuery<DbTheme>(supabase, 'custom_themes')
      .delete()
      .eq('theme_id', themeId)
      .eq('user_id', user.id)
      .execute();

    if (result.error) {
      const pgError = result.error as PostgrestError;
      if (pgError?.code === '404' || pgError?.code === '42P01') {
        // Table doesn't exist yet - this is normal during initial setup
        return false;
      }
      console.error('Error deleting custom theme:', pgError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error deleting theme:', error);
    return false;
  }
}