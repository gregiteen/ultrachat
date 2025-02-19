import React from 'react';
import { useAuth } from '../lib/auth-service';
import { useTheme } from '../design-system/theme/context';
import { ThemeVariant } from '../design-system/theme/types';

export function ThemeSelector() {
  const { user } = useAuth();
  const { 
    theme, 
    setTheme, 
    themes,
    createCustomTheme,
    updateCustomTheme,
    deleteCustomTheme
  } = useTheme();

  const handleThemeChange = (themeId: string) => {
    // Only set theme if it's a valid ThemeVariant
    if (themeId === 'light' || themeId === 'dark' || themeId === 'system') {
      setTheme(themeId as ThemeVariant);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Theme</h3>
        <p className="text-sm text-muted-foreground">
          Choose your preferred theme
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => handleThemeChange(t.id)}
            className={`
              px-4 py-2 rounded-md text-sm font-medium
              ${theme === t.id ? 'bg-primary text-white' : 'bg-accent hover:bg-accent/80'}
            `}
          >
            {t.name}
          </button>
        ))}
      </div>

      {user && (
        <div className="mt-8">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Custom Themes</h3>
            <p className="text-sm text-muted-foreground">
              Create and manage your custom themes
            </p>
          </div>

          {/* Custom theme management UI here */}
        </div>
      )}
    </div>
  );
}