import React from 'react';
import { Button } from './base/Button';
import { useTheme } from '../theme';
import { Settings, Sun, Moon, Loader, Mail, Ghost, Link } from 'lucide-react';

export function ThemeDemo() {
  const { theme, setTheme, themes, systemTheme } = useTheme();

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Theme Selection</h2>
        <div className="flex flex-wrap gap-2">
          {themes.map((t) => (
            <Button
              key={t.id}
              variant={theme.id === t.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTheme(t)}
            >
              {t.name}
            </Button>
          ))}
          <Button
            variant={theme.id === systemTheme.id ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setTheme(systemTheme)}
            icon={theme.id === 'modern-dark' ? <Moon size={16} /> : <Sun size={16} />}
          >
            System
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Button Variants</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" icon={<Settings size={16} />}>
            Primary
          </Button>
          <Button variant="secondary" icon={<Mail size={16} />}>
            Secondary
          </Button>
          <Button variant="ghost" icon={<Ghost size={16} />}>
            Ghost
          </Button>
          <Button variant="link" icon={<Link size={16} />}>
            Link
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Button Sizes</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Button States</h2>
        <div className="flex flex-wrap gap-4">
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
          <Button fullWidth>Full Width</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Theme Preview</h2>
        <div className="grid gap-4 p-4 rounded-lg bg-muted">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Background: {theme.colors.background}</p>
            <p className="text-sm text-muted-foreground">Foreground: {theme.colors.foreground}</p>
            <p className="text-sm text-muted-foreground">Primary: {theme.colors.primary}</p>
            <p className="text-sm text-muted-foreground">Secondary: {theme.colors.secondary}</p>
            <p className="text-sm text-muted-foreground">Accent: {theme.colors.accent}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs">Font Size XS</p>
            <p className="text-sm">Font Size SM</p>
            <p className="text-base">Font Size Base</p>
            <p className="text-lg">Font Size LG</p>
            <p className="text-xl">Font Size XL</p>
            <p className="text-2xl">Font Size 2XL</p>
          </div>
        </div>
      </div>
    </div>
  );
}