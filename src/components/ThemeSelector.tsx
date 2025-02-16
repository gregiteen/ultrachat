import React, { useState } from 'react';
import { Check, Plus, Palette } from 'lucide-react';
import { DESIGNER_THEMES } from '../lib/themes';
import type { Theme } from '../types';

interface ThemeSelectorProps {
  currentTheme: Theme;
  customThemes: Theme[];
  onThemeChange: (theme: Theme) => void;
  onCustomThemeAdd: (theme: Theme) => void;
  onCustomThemeDelete: (themeId: string) => void;
}

export function ThemeSelector({
  currentTheme,
  customThemes,
  onThemeChange,
  onCustomThemeAdd,
  onCustomThemeDelete,
}: ThemeSelectorProps) {
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customTheme, setCustomTheme] = useState<Theme>({
    id: '',
    name: '',
    colors: {
      background: '#ffffff',
      foreground: '#000000',
      primary: '#2563eb',
      secondary: '#4f46e5',
      accent: '#f59e0b',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      inputBackground: '#ffffff',
      buttonText: '#ffffff',
      iconColor: '#2563eb',
      iconHover: '#1d4ed8',
    },
    isCustom: true,
  });

  const handleCustomThemeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTheme.name) return;

    onCustomThemeAdd({
      ...customTheme,
      id: `custom-${Date.now()}`,
    });
    setShowCustomizer(false);
    setCustomTheme({
      ...customTheme,
      name: '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DESIGNER_THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onThemeChange(theme)}
            className={`flex items-center gap-2 rounded-lg border p-4 transition-colors ${
              currentTheme.id === theme.id
                ? `border-2 border-${theme.colors.primary}`
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex flex-1 items-center gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  <div
                    className="h-6 w-6 rounded-full"
                    style={{ background: theme.colors.primary }}
                    title="Primary"
                  />
                  <div
                    className="h-6 w-6 rounded-full"
                    style={{ background: theme.colors.secondary }}
                    title="Secondary"
                  />
                  <div
                    className="h-6 w-6 rounded-full"
                    style={{ background: theme.colors.accent }}
                    title="Accent"
                  />
                </div>
                <div
                  className="h-2 w-full rounded"
                  style={{ background: theme.colors.muted }}
                  title="Muted"
                />
              </div>
              <div className="text-left">
                <p className="font-medium">{theme.name}</p>
                <p className="text-sm text-gray-500">Designer Theme</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Custom Themes */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Custom Themes</h3>
          <button
            onClick={() => setShowCustomizer(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Theme
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          {customThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme)}
              className={`flex items-center gap-2 rounded-lg border p-4 transition-colors ${
                currentTheme.id === theme.id
                  ? `border-2 border-${theme.colors.primary}`
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex flex-1 items-center gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1">
                    <div
                      className="h-6 w-6 rounded-full"
                      style={{ background: theme.colors.primary }}
                      title="Primary"
                    />
                    <div
                      className="h-6 w-6 rounded-full"
                      style={{ background: theme.colors.secondary }}
                      title="Secondary"
                    />
                    <div
                      className="h-6 w-6 rounded-full"
                      style={{ background: theme.colors.accent }}
                      title="Accent"
                    />
                  </div>
                  <div
                    className="h-2 w-full rounded"
                    style={{ background: theme.colors.muted }}
                    title="Muted"
                  />
                </div>
                <div className="text-left">
                  <p className="font-medium">{theme.name}</p>
                  <p className="text-sm text-gray-500">Custom Theme</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCustomThemeDelete(theme.id);
                }}
                className="ml-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Theme Creator */}
      {showCustomizer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-medium">Create Custom Theme</h3>
              <button
                onClick={() => setShowCustomizer(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCustomThemeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Theme Name
                </label>
                <input
                  type="text"
                  value={customTheme.name}
                  onChange={(e) =>
                    setCustomTheme({ ...customTheme, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(customTheme.colors).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3">
                        <Palette className="h-4 w-4 text-gray-400" />
                      </span>
                      <input
                        type="color"
                        value={value}
                        onChange={(e) =>
                          setCustomTheme({
                            ...customTheme,
                            colors: {
                              ...customTheme.colors,
                              [key]: e.target.value,
                            },
                          })
                        }
                        className="block w-full flex-1 rounded-none rounded-r-md border border-gray-300 h-10 cursor-pointer"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCustomizer(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Create Theme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}