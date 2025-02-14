import React from 'react';
import { Shield, Zap, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useSubscriptionStore } from '../../store/subscription';
import type { ApiUsage } from '../../types';

export function AccountOverview() {
  const { user } = useAuthStore();
  const { currentTier, usage } = useSubscriptionStore();

  const formatUsagePercentage = (percentage: number) => {
    return `${Math.round(percentage)}%`;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Account Status */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Account Status</h2>
            <p className="mt-1 text-sm text-gray-500">
              {user?.email} • {currentTier?.name || 'Free'} Plan
            </p>
          </div>
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Current Usage */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Current Usage</h2>
          <Zap className="h-6 w-6 text-yellow-500" />
        </div>
        
        <div className="space-y-4">
          {usage && (
            <>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">API Requests</span>
                  <span className={getUsageColor(usage.usage_percentage)}>
                    {formatUsagePercentage(usage.usage_percentage)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200">
                  <div
                    className={`h-2 rounded-full ${
                      getUsageColor(usage.usage_percentage).replace('text-', 'bg-')
                    }`}
                    style={{ width: `${usage.usage_percentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-600">Chat Messages</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {usage.requests_by_type.chat.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-600">Tasks Created</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {usage.requests_by_type.task.toLocaleString()}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-900">Active Integrations</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {currentTier?.limits.max_integrations || 0}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            <h3 className="text-sm font-medium text-gray-900">Storage Used</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {currentTier?.limits.storage_gb || 0}GB
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            <h3 className="text-sm font-medium text-gray-900">Team Members</h3>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {currentTier?.limits.max_team_members || 1}
          </p>
        </div>
      </div>
    </div>
  );
}