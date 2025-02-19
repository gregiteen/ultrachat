import React from 'react';
import { Plug2, Plus } from 'lucide-react';

export default function IntegrationsPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Connected Services</h3>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-button-text rounded-md hover:bg-secondary transition-colors">
          <Plus className="h-4 w-4" />
          Add Integration
        </button>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-muted rounded-lg">
        <Plug2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No integrations yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
          Connect your favorite services to enhance your experience.
        </p>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-button-text rounded-md hover:bg-secondary transition-colors">
          <Plus className="h-4 w-4" />
          Browse Integrations
        </button>
      </div>
    </div>
  );
}