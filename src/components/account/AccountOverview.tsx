import React from 'react';
import { useAuth } from '../../lib/auth-service';
import { useSubscriptionStore } from '../../store/subscription';
import { Shield, Zap, BarChart3 } from 'lucide-react';

export function AccountOverview() {
  const { user } = useAuth();
  const { currentTier, usage } = useSubscriptionStore();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">Account Overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.email} • {currentTier?.name || 'Free'} Plan
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Shield className="h-5 w-5" />
            <h3 className="font-medium">Security</h3>
          </div>
          <p className="text-2xl font-semibold">
            {usage?.security_score || 'N/A'}
          </p>
          <p className="text-sm text-muted-foreground">Security Score</p>
        </div>

        <div className="p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Zap className="h-5 w-5" />
            <h3 className="font-medium">Usage</h3>
          </div>
          <p className="text-2xl font-semibold">
            {usage?.api_calls || 0}
          </p>
          <p className="text-sm text-muted-foreground">API Calls This Month</p>
        </div>

        <div className="p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2 text-primary mb-2">
            <BarChart3 className="h-5 w-5" />
            <h3 className="font-medium">Storage</h3>
          </div>
          <p className="text-2xl font-semibold">
            {usage?.storage_used || '0'} MB
          </p>
          <p className="text-sm text-muted-foreground">Storage Used</p>
        </div>
      </div>

      {/* Plan Details */}
      {currentTier && (
        <div className="p-4 bg-card rounded-lg border">
          <h3 className="text-lg font-medium mb-4">Plan Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">{currentTier.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span className="font-medium">
                ${currentTier.price}/month
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">API Limit</span>
              <span className="font-medium">
                {currentTier.api_limit.toLocaleString()} calls/month
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Storage Limit</span>
              <span className="font-medium">
                {currentTier.storage_limit} MB
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}