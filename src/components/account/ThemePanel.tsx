import React from 'react';
import { Palette } from 'lucide-react';
import { ThemeSelector } from '../ThemeSelector';

export function ThemePanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
          <p className="mt-1 text-sm text-mutedForeground">
            Customize the look and feel of your workspace
          </p>
        </div>
        <Palette className="h-6 w-6 text-mutedForeground" />
      </div>

      <div className="theme-scope rounded-lg border border-muted bg-background p-6">
        <ThemeSelector />
      </div>

      <div className="rounded-lg bg-muted p-4 text-sm text-primary">
        Your theme preferences will be saved and applied across all your devices.
      </div>
    </div>
  );
}