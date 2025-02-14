import React from 'react';
import { Check, Zap } from 'lucide-react';
import { useSubscriptionStore } from '../../store/subscription';
import type { SubscriptionTier } from '../../types';

const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    billing_period: 'monthly',
    features: [
      'Up to 100 messages per day',
      '1GB storage',
      'Basic email integration',
      'Task management',
    ],
    limits: {
      messages_per_day: 100,
      storage_gb: 1,
      max_integrations: 1,
      max_team_members: 1,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    billing_period: 'monthly',
    features: [
      'Unlimited messages',
      '10GB storage',
      'All integrations',
      'Priority support',
      'Advanced analytics',
    ],
    limits: {
      messages_per_day: -1, // unlimited
      storage_gb: 10,
      max_integrations: -1, // unlimited
      max_team_members: 5,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 49,
    billing_period: 'monthly',
    features: [
      'Unlimited everything',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'Custom AI training',
    ],
    limits: {
      messages_per_day: -1,
      storage_gb: 100,
      max_integrations: -1,
      max_team_members: -1,
    },
  },
];

export function SubscriptionPanel() {
  const { currentTier, changeTier, loading } = useSubscriptionStore();

  const handleUpgrade = async (tierId: SubscriptionTier['id']) => {
    try {
      await changeTier(tierId);
    } catch (error) {
      console.error('Failed to upgrade:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
        <Zap className="h-6 w-6 text-yellow-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {SUBSCRIPTION_TIERS.map((tier) => {
          const isCurrentTier = currentTier?.id === tier.id;
          return (
            <div
              key={tier.id}
              className={`rounded-lg border ${
                isCurrentTier ? 'border-blue-600' : 'border-gray-200'
              } bg-white p-6 shadow-sm`}
            >
              <div className="flex flex-col items-start">
                <h3 className="text-lg font-semibold text-gray-900">
                  {tier.name}
                </h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">
                    ${tier.price}
                  </span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="mt-6 space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(tier.id)}
                  disabled={loading || isCurrentTier}
                  className={`mt-8 w-full rounded-lg px-4 py-2 text-sm font-medium ${
                    isCurrentTier
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50`}
                >
                  {isCurrentTier
                    ? 'Current Plan'
                    : loading
                    ? 'Processing...'
                    : `Upgrade to ${tier.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-600">
        Need a custom plan? Contact our sales team for enterprise solutions.
      </div>
    </div>
  );
}