import React, { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../design-system/components/base/Tabs';
import { Spinner } from '../design-system/components/feedback/Spinner';
import { Lock, Palette, Plug2, Sparkles, CreditCard } from 'lucide-react';
import { ErrorBoundary } from '../components/ErrorBoundary';

const PersonalizationPanel = lazy(() => import('../components/account/PersonalizationPanel'));
const IntegrationsPanel = lazy(() => import('../components/account/IntegrationsPanel'));
const SubscriptionPanel = lazy(() => import('../components/account/SubscriptionPanel'));
const ThemePanel = lazy(() => import('../components/account/ThemePanel'));
const KeychainManager = lazy(() => import('../components/account/KeychainManager'));

export default function Account() {
  const [activeTab, setActiveTab] = useState('personalization');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Account Settings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="personalization" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Personalization
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Plug2 className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="keychain" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Keychain
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Subscription
          </TabsTrigger>
        </TabsList>

        <ErrorBoundary>
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <Spinner className="h-8 w-8 text-primary" />
            </div>
          }>
            <TabsContent value="personalization">
              {activeTab === 'personalization' && (
                <ErrorBoundary>
                  <PersonalizationPanel />
                </ErrorBoundary>
              )}
            </TabsContent>

            <TabsContent value="integrations">
              {activeTab === 'integrations' && (
                <ErrorBoundary>
                  <IntegrationsPanel />
                </ErrorBoundary>
              )}
            </TabsContent>

            <TabsContent value="keychain">
              {activeTab === 'keychain' && (
                <ErrorBoundary>
                  <KeychainManager />
                </ErrorBoundary>
              )}
            </TabsContent>

            <TabsContent value="theme">
              {activeTab === 'theme' && <ThemePanel />}
            </TabsContent>
          </Suspense>
        </ErrorBoundary>
      </Tabs>
    </div>
  );
}