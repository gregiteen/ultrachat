import React, { useState, useEffect } from 'react';
import { Settings, CreditCard, Plug, Palette, User } from 'lucide-react';
import { AccountOverview } from '../components/account/AccountOverview';
import { IntegrationsPanel } from '../components/account/IntegrationsPanel';
import { SubscriptionPanel } from '../components/account/SubscriptionPanel';
import { ThemePanel } from '../components/account/ThemePanel';
import { PersonalizationPanel } from '../components/account/PersonalizationPanel';
import { useSubscriptionStore } from '../store/subscription';
import { useIntegrationsStore } from '../store/integrations';
import { usePersonalizationStore } from '../store/personalization';
import { useSettingsStore } from '../store/settings';
import { useSearchParams } from 'react-router-dom';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Settings },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'personalization', label: 'Personalization', icon: User },
];

export default function Account() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { fetchSubscription, loading: subLoading } = useSubscriptionStore();
  const { fetchIntegrations, loading: intLoading } = useIntegrationsStore();
  const { personalInfo, fetchPersonalInfo, updatePersonalInfo, loading: persLoading } = usePersonalizationStore();
  const { fetchSettings, loading: settingsLoading } = useSettingsStore();

  useEffect(() => {
    const initializeData = async () => {
      setError(null);
      setLoading(true);
      try {
        await Promise.all([fetchSubscription(), fetchIntegrations(), fetchPersonalInfo(), fetchSettings()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load account data');
        console.error('Error loading account data:', err);
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, [fetchSubscription, fetchIntegrations, fetchPersonalInfo]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-8 rounded-lg bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          )}
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
          {!loading && <div className="py-4">
            {activeTab === 'overview' && <AccountOverview />}
            {activeTab === 'subscription' && <SubscriptionPanel />}
            {activeTab === 'integrations' && <IntegrationsPanel />}
            {activeTab === 'appearance' && <ThemePanel />}
            {activeTab === 'personalization' && (
              <PersonalizationPanel
                personalInfo={personalInfo}
                setPersonalInfo={updatePersonalInfo}
              />
            )}
          </div>}
        </div>
      </div>
    </div>
  );
}