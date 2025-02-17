import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../design-system/components/base/Tabs';
import { PersonalizationPanel } from '../components/account/PersonalizationPanel';
import { IntegrationsPanel } from '../components/account/IntegrationsPanel';
import { SubscriptionPanel } from '../components/account/SubscriptionPanel';
import { ThemePanel } from '../components/account/ThemePanel';
import { KeychainManager } from '../components/account/KeychainManager';
import { ClipboardMonitor } from '../components/account/ClipboardMonitor';
import { Lock, Palette, Plug2, Sparkles, CreditCard } from 'lucide-react';

export default function Account() {
  const [activeTab, setActiveTab] = useState('personalization');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Account Settings</h1>

      {/* Always render ClipboardMonitor to enable API key detection */}
      <ClipboardMonitor />

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

        <TabsContent value="personalization">
          <PersonalizationPanel />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsPanel />
        </TabsContent>

        <TabsContent value="keychain">
          <KeychainManager />
        </TabsContent>

        <TabsContent value="theme">
          <ThemePanel />
        </TabsContent>

        <TabsContent value="subscription">
          <SubscriptionPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}