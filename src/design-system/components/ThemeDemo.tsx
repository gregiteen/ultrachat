import React from 'react';
import { Button } from './base/Button';
import { useTheme } from '../theme';
import { Settings, Sun, Moon, Mail, Ghost, Link, Palette } from 'lucide-react';
import type { Theme } from '../theme/types';

function ThemeButton({ theme, isSelected, onClick }: { 
  theme: Theme; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <Button
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.foreground,
        borderColor: isSelected ? theme.colors.primary : theme.colors.muted,
      }}
      size="sm"
      onClick={onClick}
      className={`relative ${isSelected ? 'ring-2 ring-offset-2' : ''}`}
    >
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <div
            className="h-3 w-3 rounded-full"
            style={{ background: theme.colors.primary }}
          />
          <div
            className="h-3 w-3 rounded-full"
            style={{ background: theme.colors.secondary }}
          />
          <div
            className="h-3 w-3 rounded-full"
            style={{ background: theme.colors.accent }}
          />
        </div>
        {theme.name}
      </div>
    </Button>
  );
}

export function ThemeDemo() {
  const { theme, setTheme, allThemes, systemTheme } = useTheme();

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Theme Selection</h2>
        <div className="flex flex-wrap gap-2">
          {allThemes.map((t) => (
            <ThemeButton
              key={t.id}
              theme={t}
              isSelected={theme.id === t.id}
              onClick={() => setTheme(t)}
            />
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
        <div className="grid gap-6 p-6 rounded-lg border border-muted">
          {/* Color Swatches */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(Object.entries(theme.colors) as Array<[keyof Theme['colors'], string]>).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-md border border-muted"
                    style={{ backgroundColor: value }}
                  />
                  <div>
                    <p className="text-sm font-medium">{key}</p>
                    <p className="text-xs text-muted-foreground">{value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Typography Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Typography</h3>
            <div className="grid gap-4">
              <div className="space-y-1">
                <p className="text-2xl font-bold">Heading 1</p>
                <p className="text-xl font-semibold">Heading 2</p>
                <p className="text-lg font-medium">Heading 3</p>
              </div>
              <div className="space-y-2">
                <p className="text-base">
                  Body text with <strong>bold</strong>, <em>italic</em>, and{' '}
                  <a href="#" className="text-primary hover:text-secondary underline">
                    links
                  </a>
                  .
                </p>
                <p className="text-sm text-muted-foreground">
                  Secondary text in a muted color.
                </p>
              </div>
            </div>
          </div>
          
          {/* Component Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Components</h3>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Input field"
                  className="rounded-md border border-muted bg-input-background px-3 py-2"
                />
              </div>
              <div className="space-y-2">
                <select className="rounded-md border border-muted bg-input-background px-3 py-2">
                  <option>Select option</option>
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="check" className="rounded border-muted" />
                  <label htmlFor="check" className="text-sm">Checkbox</label>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="radio" id="radio" name="radio" className="border-muted" />
                  <label htmlFor="radio" className="text-sm">Radio</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}