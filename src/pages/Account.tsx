import React, { useState, useEffect } from 'react';
import { Settings, CreditCard, Plug, Palette } from 'lucide-react';
import { AccountOverview } from '../components/account/AccountOverview';
import { IntegrationsPanel } from '../components/account/IntegrationsPanel';
import { SubscriptionPanel } from '../components/account/SubscriptionPanel';
import { ThemePanel } from '../components/account/ThemePanel';
import { useSubscriptionStore } from '../store/subscription';
import { useIntegrationsStore } from '../store/integrations';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Settings },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

export default function Account() {
  const [activeTab, setActiveTab] = useState('overview');
  const { fetchSubscription } = useSubscriptionStore();
  const { fetchIntegrations } = useIntegrationsStore();

  useEffect(() => {
    fetchSubscription();
    fetchIntegrations();
  }, [fetchSubscription, fetchIntegrations]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          </div>

          {/* Tabs */}
          <div className="mb-8 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium ${
                    activeTab === id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="py-4">
            {activeTab === 'overview' && <AccountOverview />}
            {activeTab === 'subscription' && <SubscriptionPanel />}
            {activeTab === 'integrations' && <IntegrationsPanel />}
            {activeTab === 'appearance' && <ThemePanel />}
          </div>
        </div>
      </div>
    </div>
  );
}