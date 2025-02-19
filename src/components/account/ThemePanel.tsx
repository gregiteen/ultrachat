import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../../design-system/theme/context';
import { modernLight, modernDark } from '../../design-system/theme/variants';

export default function ThemePanel() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    {
      ...modernLight,
      icon: Sun,
      description: 'Light theme for daytime use'
    },
    {
      ...modernDark,
      icon: Moon,
      description: 'Dark theme for nighttime use'
    },
    {
      ...modernLight,
      id: 'system',
      name: 'System',
      icon: Monitor,
      description: 'Follows your system preferences'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Theme Preferences</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choose your preferred theme to customize your experience.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {themeOptions.map(({ id, name, icon: Icon, description }) => (
          <button
            key={id}
            onClick={() => setTheme({ ...modernLight, id })}
            className={`flex flex-col items-center p-6 rounded-lg border transition-all ${
              theme.id === id
                ? 'border-primary bg-primary/5'
                : 'border-muted hover:border-primary/50'
            }`}
          >
            <Icon className={`h-8 w-8 mb-4 ${theme.id === id ? 'text-primary' : 'text-muted-foreground'}`} />
            <h4 className={`text-sm font-medium mb-2 ${theme.id === id ? 'text-primary' : 'text-foreground'}`}>
              {name}
            </h4>
            <p className="text-xs text-muted-foreground text-center">
              {description}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h4 className="text-sm font-medium mb-2">Theme Preview</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 w-full bg-background rounded" />
            <div className="h-4 w-3/4 bg-primary rounded" />
            <div className="h-4 w-1/2 bg-secondary rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-card rounded" />
            <div className="h-4 w-3/4 bg-accent rounded" />
            <div className="h-4 w-1/2 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}