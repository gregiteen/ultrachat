import React, { useState, useEffect } from 'react';
import { integrationHealth, type HealthCheckResult } from '../../lib/integration-health';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '../base/Button';

interface HealthStats {
  total: number;
  healthy: number;
  degraded: number;
  error: number;
}

export const HealthDashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<Record<string, HealthCheckResult>>({});
  const [stats, setStats] = useState<HealthStats>({ total: 0, healthy: 0, degraded: 0, error: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const refreshHealth = () => {
    setLoading(true);
    const data = integrationHealth.getAllHealth();
    setHealthData(data);
    
    const newStats = Object.values(data).reduce((acc, health) => {
      acc.total++;
      if (health.status === 'healthy') acc.healthy++;
      else if (health.status === 'degraded') acc.degraded++;
      else if (health.status === 'error') acc.error++;
      return acc;
    }, { total: 0, healthy: 0, degraded: 0, error: 0 });
    
    setStats(newStats);
    setLoading(false);
  };

  const getStatusColor = (status: HealthCheckResult['status']) => {
    switch (status) {
      case 'healthy': return 'bg-green-50 text-green-700 border-green-200';
      case 'degraded': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'error': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.round((date.getTime() - Date.now()) / 1000 / 60),
      'minute'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Integration Health</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshHealth}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="text-sm text-gray-500">Total Integrations</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </div>
        <div className="border rounded-lg p-4 bg-green-50">
          <div className="text-sm text-green-600">Healthy</div>
          <div className="text-2xl font-bold text-green-700 mt-1">{stats.healthy}</div>
        </div>
        <div className="border rounded-lg p-4 bg-yellow-50">
          <div className="text-sm text-yellow-600">Degraded</div>
          <div className="text-2xl font-bold text-yellow-700 mt-1">{stats.degraded}</div>
        </div>
        <div className="border rounded-lg p-4 bg-red-50">
          <div className="text-sm text-red-600">Error</div>
          <div className="text-2xl font-bold text-red-700 mt-1">{stats.error}</div>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Integration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Checked
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issues
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Response Time
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(healthData).map(([id, health]) => (
              <tr key={id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {id.split('_')[0].charAt(0).toUpperCase() + id.split('_')[0].slice(1)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(health.status)}`}>
                    {health.status === 'healthy' && <CheckCircle className="w-4 h-4 mr-1" />}
                    {health.status === 'degraded' && <AlertTriangle className="w-4 h-4 mr-1" />}
                    {health.status === 'error' && <XCircle className="w-4 h-4 mr-1" />}
                    {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatTime(health.lastChecked)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {health.issues.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {health.issues.map((issue, index) => (
                          <li key={index} className="text-sm text-gray-600">{issue}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-green-600">No issues</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {health.details?.responseTime ? `${health.details.responseTime}ms` : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};