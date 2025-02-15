import React, { useEffect } from 'react';
import { Palette } from 'lucide-react';
import { useSettingsStore } from '../../store/settings';
import { ThemeSelector } from '../ThemeSelector';
import { applyTheme, removeTheme } from '../../lib/themes';

export function ThemePanel() {
  useEffect(() => {
    return () => removeTheme();
  }, []);

  const { settings, updateSettings, addCustomTheme, deleteCustomTheme } = useSettingsStore();

  const handleThemeChange = async (theme: typeof settings.theme) => {
    try {
      await updateSettings({
        ...settings,
        theme,
      });
      applyTheme(theme);
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  };

  const handleCustomThemeAdd = async (theme: typeof settings.theme) => {
    try {
      await addCustomTheme(theme);
      handleThemeChange(theme);
    } catch (error) {
      console.error('Failed to add custom theme:', error);
    }
  };

  const handleCustomThemeDelete = async (themeId: string) => {
    try {
      await deleteCustomTheme(themeId);
    } catch (error) {
      console.error('Failed to delete custom theme:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
          <p className="mt-1 text-sm text-gray-500">
            Customize the look and feel of your workspace
          </p>
        </div>
        <Palette className="h-6 w-6 text-gray-400" />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <ThemeSelector
          currentTheme={settings.theme}
          customThemes={settings.customThemes}
          onThemeChange={handleThemeChange}
          onCustomThemeAdd={handleCustomThemeAdd}
          onCustomThemeDelete={handleCustomThemeDelete}
        />
      </div>

      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-600">
        Your theme preferences will be saved and applied across all your devices.
      </div>
    </div>
  );
}