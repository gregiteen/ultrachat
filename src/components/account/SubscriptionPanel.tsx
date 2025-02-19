import React from 'react';
import { CreditCard, Zap, Shield, Globe, CheckCircle2 } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Basic features for personal use',
    features: [
      'Basic chat functionality',
      'Standard response time',
      'Community support',
      '5 conversations per day',
    ],
    current: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$10',
    period: 'per month',
    description: 'Advanced features for power users',
    features: [
      'Priority response time',
      'Advanced AI capabilities',
      'Email support',
      'Unlimited conversations',
      'Custom themes',
      'Voice commands',
    ],
    current: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: 'per organization',
    description: 'Custom solutions for teams',
    features: [
      'Dedicated support',
      'Custom integrations',
      'Team collaboration',
      'Advanced analytics',
      'SLA guarantees',
      'Custom AI training',
    ],
    current: false
  }
];

export default function SubscriptionPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Subscription Plans</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choose the plan that best fits your needs.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-lg border ${
              plan.current
                ? 'border-primary'
                : 'border-muted'
            } p-6 space-y-4`}
          >
            <div className="space-y-2">
              <h4 className="text-xl font-semibold">{plan.name}</h4>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">
                  /{plan.period}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {plan.description}
              </p>
            </div>

            <ul className="space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                plan.current
                  ? 'bg-primary/10 text-primary'
                  : 'bg-primary text-button-text hover:bg-primary/90'
              }`}
            >
              {plan.current ? 'Current Plan' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 space-y-6">
        <h4 className="text-lg font-medium">Plan Features</h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex gap-4">
            <Zap className="h-6 w-6 text-primary flex-shrink-0" />
            <div>
              <h5 className="font-medium mb-1">Fast Response Time</h5>
              <p className="text-sm text-muted-foreground">
                Get responses in milliseconds with our optimized infrastructure.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Shield className="h-6 w-6 text-primary flex-shrink-0" />
            <div>
              <h5 className="font-medium mb-1">Enterprise Security</h5>
              <p className="text-sm text-muted-foreground">
                Bank-grade encryption and security measures to protect your data.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Globe className="h-6 w-6 text-primary flex-shrink-0" />
            <div>
              <h5 className="font-medium mb-1">Global Infrastructure</h5>
              <p className="text-sm text-muted-foreground">
                Distributed servers ensure low latency worldwide.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <CreditCard className="h-6 w-6 text-primary flex-shrink-0" />
            <div>
              <h5 className="font-medium mb-1">Flexible Billing</h5>
              <p className="text-sm text-muted-foreground">
                Pay monthly or annually with all major payment methods.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}