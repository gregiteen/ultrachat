import React, { useState, useEffect } from 'react';
import { X, Save, Bell, Moon, Sun, Volume2, Plug, Plus } from 'lucide-react';
import { useSettingsStore } from '../store/settings';
import { useIntegrationsStore } from '../store/integrations';
import { CustomIntegrationForm } from './account/CustomIntegrationForm';
import { CustomIntegrationList } from './account/CustomIntegrationList';
import type { Integration } from '../types';

interface SettingsProps {
  onClose: () => void;
}

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'integrations', label: 'Integrations' },
];

export function Settings({ onClose }: SettingsProps) {
  const { settings, updateSettings } = useSettingsStore();
  const {
    integrations,
    fetchIntegrations,
    addCustomIntegration,
    testCustomIntegration,
    deleteCustomIntegration
  } = useIntegrationsStore();
  const [formData, setFormData] = useState(settings);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showIntegrationForm, setShowIntegrationForm] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSettings(formData);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const customIntegrations = integrations.filter(i => i.type === 'custom');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'general' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Theme Settings */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Theme</h3>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, theme: 'light' })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                      formData.theme === 'light'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, theme: 'dark' })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                      formData.theme === 'dark'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </button>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Notifications
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.notifications.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifications: {
                            ...formData.notifications,
                            email: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Email notifications
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.notifications.push}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifications: {
                            ...formData.notifications,
                            push: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Push notifications
                    </span>
                  </label>
                </div>
              </div>

              {/* Sound Settings */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Sound</h3>
                <div className="flex items-center gap-4">
                  <Volume2 className="h-5 w-5 text-gray-400" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.volume}
                    onChange={(e) =>
                      setFormData({ ...formData, volume: Number(e.target.value) })
                    }
                    className="w-full"
                  />
                  <span className="text-sm text-gray-600">{formData.volume}%</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Integrations</h3>
                <button
                  onClick={() => setShowIntegrationForm(true)}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                  Add Custom Integration
                </button>
              </div>

              <CustomIntegrationList
                integrations={customIntegrations}
                onDelete={deleteCustomIntegration}
                onTest={testCustomIntegration}
              />
            </div>
          )}
        </div>
      </div>

      {showIntegrationForm && (
        <CustomIntegrationForm
          onSubmit={addCustomIntegration}
          onClose={() => setShowIntegrationForm(false)}
        />
      )}
    </div>
  );
}