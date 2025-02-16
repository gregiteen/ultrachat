import { supabase } from './supabase';
import type { Theme, ThemeColors } from '../design-system/theme/types';
import { createQuery } from './db';
import { baseTheme } from '../design-system/theme/variants';

interface CustomThemeRecord {
  id: string;
  user_id: string;
  theme_id: string;
  name: string;
  colors: ThemeColors;
  spacing: typeof baseTheme.spacing;
  typography: typeof baseTheme.typography;
  animation: typeof baseTheme.animation;
  elevation: typeof baseTheme.elevation;
  border_radius: typeof baseTheme.borderRadius;
  created_at: string;
  updated_at: string;
}

type QueryResult<T> = {
  data: T | null;
  error: any;
};

function transformThemeRecord(record: CustomThemeRecord): Theme {
  return {
    id: record.theme_id,
    name: record.name,
    colors: record.colors,
    isCustom: true,
    spacing: record.spacing,
    typography: record.typography,
    animation: record.animation,
    elevation: record.elevation,
    borderRadius: record.border_radius,
  };
}

export async function saveCustomTheme(theme: Theme): Promise<QueryResult<Theme>> {
  const result = await createQuery<CustomThemeRecord>(supabase, 'custom_themes')
    .insert({
      theme_id: theme.id,
      name: theme.name,
      colors: theme.colors,
      spacing: theme.spacing || baseTheme.spacing,
      typography: theme.typography || baseTheme.typography,
      animation: theme.animation || baseTheme.animation,
      elevation: theme.elevation || baseTheme.elevation,
      border_radius: theme.borderRadius || baseTheme.borderRadius,
    })
    .select('*')
    .single()
    .execute();

  if (result.error) {
    console.error('Error saving custom theme:', result.error);
    return { data: null, error: result.error };
  }

  const record = result.data as CustomThemeRecord;
  if (!record) {
    return { data: null, error: new Error('No data returned') };
  }

  return {
    data: transformThemeRecord(record),
    error: null,
  };
}

export async function updateCustomTheme(theme: Theme): Promise<QueryResult<Theme>> {
  const result = await createQuery<CustomThemeRecord>(supabase, 'custom_themes')
    .eq('theme_id', theme.id)
    .update({
      name: theme.name,
      colors: theme.colors,
      spacing: theme.spacing || baseTheme.spacing,
      typography: theme.typography || baseTheme.typography,
      animation: theme.animation || baseTheme.animation,
      elevation: theme.elevation || baseTheme.elevation,
      border_radius: theme.borderRadius || baseTheme.borderRadius,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()
    .execute();

  if (result.error) {
    console.error('Error updating custom theme:', result.error);
    return { data: null, error: result.error };
  }

  const record = result.data as CustomThemeRecord;
  if (!record) {
    return { data: null, error: new Error('No data returned') };
  }

  return {
    data: transformThemeRecord(record),
    error: null,
  };
}

export async function deleteCustomTheme(themeId: string): Promise<{ error: any }> {
  const result = await createQuery<CustomThemeRecord>(supabase, 'custom_themes')
    .eq('theme_id', themeId)
    .delete()
    .execute();

  if (result.error) {
    console.error('Error deleting custom theme:', result.error);
  }

  return { error: result.error };
}

export async function getCustomThemes(): Promise<{ data: Theme[]; error: any }> {
  const result = await createQuery<CustomThemeRecord>(supabase, 'custom_themes')
    .select('*')
    .order('created_at', { ascending: false })
    .execute();

  if (result.error) {
    console.error('Error fetching custom themes:', result.error);
    return { data: [], error: result.error };
  }

  const records = Array.isArray(result.data) ? result.data : [];
  return {
    data: records.map(transformThemeRecord),
    error: null,
  };
}