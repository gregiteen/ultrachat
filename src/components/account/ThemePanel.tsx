import React, { Suspense } from 'react';
import { Palette } from 'lucide-react';
import { ThemeSelector } from '../ThemeSelector';
import { Spinner } from '../../design-system/components/feedback/Spinner';
import { useAuthStore } from '../../store/auth';

export function ThemePanel() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="h-6 w-6 text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center text-muted-foreground">
        Please sign in to access theme settings
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Customize the look and feel of your workspace
          </p>
        </div>
        <Palette className="h-6 w-6 text-muted-foreground" />
      </div>

      <div className="theme-scope rounded-lg border border-muted bg-background p-6">
        <Suspense fallback={<Spinner className="h-6 w-6 text-primary" />}>
          <ThemeSelector />
        </Suspense>
      </div>
    </div>
  );
}