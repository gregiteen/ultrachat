import React, { useState, useEffect } from 'react';
import { Plus, Palette, Loader, Eye, Check, X } from 'lucide-react';
import type { Theme, ThemeColors } from '../design-system/theme/types';
import { useTheme } from '../design-system/theme/context';
import { baseTheme } from '../design-system/theme/variants';
import { ColorPicker } from '../design-system/components/base/ColorPicker';
import { useAuthStore } from '../store/auth';
import { applyTheme } from '../lib/themes';

interface ThemeFormState {
  id: string;
  name: string;
  colors: ThemeColors;
}

const defaultColors: ThemeColors = {
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
};

function ThemeButton({ theme, isSelected, onSelect, onDelete }: {
  theme: Theme;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.foreground,
        borderColor: isSelected ? theme.colors.primary : 'transparent',
        boxShadow: isSelected ? `0 0 0 2px ${theme.colors.primary}` : 'none',
      }}
      className={`flex items-center gap-2 rounded-lg border-2 p-4 transition-all hover:scale-[1.02] ${
        isSelected ? 'ring-2 ring-offset-2' : 'hover:shadow-lg'
      } relative`}
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
          <p className="font-medium" style={{ color: theme.colors.foreground }}>{theme.name}</p>
          <p className="text-sm" style={{ color: theme.colors.mutedForeground }}>
            {theme.isCustom ? 'Custom Theme' : 'Designer Theme'}
          </p>
        </div>
        <div className="absolute top-2 right-2">
          {isSelected && (
            <div className="h-2 w-2 rounded-full bg-current"
                 style={{ color: theme.colors.primary }} />
          )}
        </div>
      </div>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="ml-2 rounded-full p-1 hover:bg-muted hover:text-red-600"
          style={{ color: theme.colors.mutedForeground }}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </button>
  );
}

export function ThemeSelector() {
  const { 
    theme: currentTheme, 
    setTheme, 
    designerThemes, 
    customThemes, 
    saveCustomTheme, 
    deleteCustomTheme 
  } = useTheme();
  
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.initialized);
          
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customTheme, setCustomTheme] = useState<ThemeFormState>({
    id: '',
    name: '',
    colors: defaultColors,
  });

  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeColor, setActiveColor] = useState<{ key: keyof ThemeColors; value: string } | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Restore current theme when modal is closed
  useEffect(() => {
    if (!showCustomizer && currentTheme) {
      applyTheme(currentTheme);
    }
  }, [showCustomizer, currentTheme]);

  const handlePreviewToggle = () => {
    if (isPreviewMode) {
      applyTheme(currentTheme);
    } else {
      applyTheme(previewTheme || customTheme as Theme);
    }
    setIsPreviewMode(!isPreviewMode);
  };

  const handleCustomThemeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTheme.name) return;
    
    const newTheme: Theme = {
      ...customTheme,
      id: `custom-${Date.now()}`,
      spacing: baseTheme.spacing,
      typography: baseTheme.typography,
      animation: baseTheme.animation,
      elevation: baseTheme.elevation,
      borderRadius: baseTheme.borderRadius,
      colors: customTheme.colors,
      name: customTheme.name,
      isCustom: true,
    };
    saveCustomTheme(newTheme).then(() => setTheme(newTheme));

    setShowCustomizer(false);
    setPreviewTheme(null);
    setCustomTheme({
      id: '',
      name: '',
      colors: defaultColors,
    });
  };

  const handleColorPickerChange = (key: keyof ThemeColors, value: string) => {
    const updatedColors = {
      ...customTheme.colors,
      [key]: value,
    };
    
    setCustomTheme(prev => ({
      ...prev,
      colors: updatedColors,
    }));

    // Create preview theme
    const preview: Theme = {
      ...baseTheme,
      id: 'preview',
      name: customTheme.name || 'Preview',
      colors: updatedColors,
      isCustom: true,
    };
    setPreviewTheme(preview);
    if (isPreviewMode) {
      applyTheme(preview);
    }
  };

  const colorKeys = Object.keys(defaultColors) as Array<keyof ThemeColors>;

  return (
    <div className="theme-scope space-y-4">
      {/* Designer Themes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {designerThemes.map((theme) => (
          <ThemeButton
            key={theme.id}
            theme={theme}
            isSelected={currentTheme.id === theme.id}
            onSelect={() => {
              // Preview the theme first
              setPreviewTheme(theme);
              applyTheme(theme);
              setIsPreviewMode(true);
              
              // Show preview controls
              setShowCustomizer(true);
              setCustomTheme({
                ...theme,
                colors: { ...theme.colors }
              });
            }}
          />
        ))}
      </div>

      {/* Custom Themes Section */}
      {user && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Custom Themes</h3>
            <button
              onClick={() => {
                setShowCustomizer(true);
                setPreviewTheme(null);
                setIsPreviewMode(false);
                setCustomTheme({
                  id: '',
                  name: '',
                  colors: defaultColors,
                });
              }}
              className="flex items-center gap-2 rounded-lg border border-muted px-3 py-1 text-sm hover:bg-muted transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Theme
            </button>
          </div>

          {!isInitialized ? (
            <div className="flex items-center justify-center py-4">
              <Loader className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {customThemes.map((theme) => (
                <ThemeButton
                  key={theme.id}
                  theme={theme}
                  isSelected={currentTheme.id === theme.id}
                  onSelect={() => {
                    // Preview the theme first
                    setPreviewTheme(theme);
                    applyTheme(theme);
                    setIsPreviewMode(true);
                    
                    // Show preview controls
                    setShowCustomizer(true);
                    setCustomTheme({
                      ...theme,
                      colors: { ...theme.colors }
                    });
                  }}
                  onDelete={() => deleteCustomTheme(theme.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom Theme Creator Modal */}
      {showCustomizer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl rounded-lg bg-background p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">{previewTheme ? 'Apply Theme' : 'Create Custom Theme'}</h3>
              <button
                onClick={() => {
                  setShowCustomizer(false);
                  setPreviewTheme(null);
                  setIsPreviewMode(false);
                  applyTheme(currentTheme);
                  setCustomTheme({ id: '', name: '', colors: defaultColors });
                }}
                className="text-mutedForeground hover:text-foreground"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if (previewTheme) { setTheme(previewTheme); setShowCustomizer(false); } else { handleCustomThemeSubmit(e); } }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Theme Name (required)
                </label>
                <input
                  type="text"
                  value={customTheme.name}
                  onChange={(e) =>
                    setCustomTheme({ ...customTheme, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-muted bg-inputBackground px-3 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  disabled={previewTheme !== null}
                  required
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {colorKeys.map((key) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveColor({ key, value: customTheme.colors[key] });
                        setShowColorPicker(true);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-md border border-muted hover:border-primary"
                    >
                      <div
                        className="h-6 w-6 rounded border border-muted"
                        style={{ backgroundColor: customTheme.colors[key] }}
                      />
                      <span className="text-sm font-mono">
                        {customTheme.colors[key].toUpperCase()}
                      </span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between gap-3 pt-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePreviewToggle}
                    className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      isPreviewMode
                        ? 'bg-primary text-buttonText'
                        : 'border border-muted text-foreground hover:bg-muted'
                    }`}
                  >
                    {isPreviewMode ? <Check className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {isPreviewMode ? 'Previewing' : 'Preview'}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTheme(previewTheme || customTheme as Theme)}
                    className="flex items-center gap-2 rounded-md border border-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                    disabled={!previewTheme}
                  >
                    Apply
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomizer(false);
                      setPreviewTheme(null);
                      setIsPreviewMode(false);
                      applyTheme(currentTheme);
                      setCustomTheme({ id: '', name: '', colors: defaultColors });
                    }}
                    className="rounded-md border border-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-buttonText hover:bg-secondary transition-colors disabled:opacity-50"
                    disabled={!customTheme.name}
                  >
                    {previewTheme ? 'Apply Theme' : 'Save Theme'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Color Picker Dialog */}
      {showColorPicker && activeColor && (
        <div className="theme-scope fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative bg-background rounded-lg shadow-xl max-w-md w-full p-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowColorPicker(false)}
              className="absolute top-2 right-2 text-mutedForeground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-medium mb-4">
              Choose {activeColor.key.charAt(0).toUpperCase() + activeColor.key.slice(1)} Color
            </h3>
            <ColorPicker
              value={activeColor.value}
              onChange={(color) => {
                handleColorPickerChange(activeColor.key, color);
              }}
              label="Select Color"
            />
          </div>
        </div>
      )}
    </div>
  );
}