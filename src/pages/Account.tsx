import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { PersonalizationPanel } from '../components/account/PersonalizationPanel';
import { IntegrationsPanel } from '../components/account/IntegrationsPanel';
import { ThemePanel } from '../components/account/ThemePanel';
import { SubscriptionPanel } from '../components/account/SubscriptionPanel';
import { usePersonalizationStore } from '../store/personalization';

type TabType = 'personalization' | 'integrations' | 'theme' | 'subscription';

export default function Account() {
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'personalization';
  const { setHasSeenWelcome } = usePersonalizationStore();

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b border-muted">
        <div className="px-6">
          <nav className="flex space-x-8">
            <button
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'personalization'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('tab', 'personalization');
                window.history.pushState({}, '', `?${newParams.toString()}`);
              }}
            >
              Personalization
            </button>
            <button
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'integrations'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('tab', 'integrations');
                window.history.pushState({}, '', `?${newParams.toString()}`);
              }}
            >
              Integrations
            </button>
            <button
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'theme'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('tab', 'theme');
                window.history.pushState({}, '', `?${newParams.toString()}`);
              }}
            >
              Theme
            </button>
            <button
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'subscription'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('tab', 'subscription');
                window.history.pushState({}, '', `?${newParams.toString()}`);
              }}
            >
              Subscription
            </button>
          </nav>
        </div>
      </div>
      <div className="flex-1 p-6">
        {activeTab === 'personalization' && (
          <div className="h-full">
            <PersonalizationPanel />
          </div>
        )}
        {activeTab === 'integrations' && <IntegrationsPanel />}
        {activeTab === 'theme' && <ThemePanel />}
        {activeTab === 'subscription' && <SubscriptionPanel />}
      </div>
    </div>
  );
}