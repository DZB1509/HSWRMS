import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { checkBackendHealth, type HealthCheckResponse } from '../../api/health/healthApi';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export interface DevHealthIndicatorProps {
  className?: string;
  inline?: boolean;
}

export const DevHealthIndicator: React.FC<DevHealthIndicatorProps> = ({
  className = '',
  inline = false,
}) => {
  const { t } = useTranslation('common');
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await checkBackendHealth();
      setHealth(res);
    } catch (err) {
      setError((err as Error).message || 'Backend unreachable');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  // When rendered at root without inline prop, keep it visually unobtrusive in the document flow without any fixed floating pill
  if (!inline) {
    return (
      <div
        className={`hsw-backend-status-hidden ${className}`}
        aria-live="polite"
        style={{ display: 'none' }}
      >
        <span>Backend Status: {health?.status || (loading ? 'Checking' : 'Offline')}</span>
      </div>
    );
  }

  // Inline presentation for Footer or System Bar
  const isUp = health?.status === 'UP';
  const statusLabel = loading
    ? t('status.connecting', 'Connecting...')
    : isUp
    ? t('status.connected', 'API Connected')
    : t('status.disconnected', 'API Offline');

  return (
    <div
      className={`hsw-discreet-api-status ${className}`}
      title={isUp ? `Backend API is healthy (status: ${health?.status})` : error || 'Backend API unreachable'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        color: isUp ? 'var(--text-secondary, #706e6b)' : '#c62828',
      }}
    >
      {loading ? (
        <RefreshCw size={11} className="spin" style={{ color: 'var(--accent-sand)' }} />
      ) : isUp ? (
        <CheckCircle2 size={11} style={{ color: '#2e7d32' }} />
      ) : (
        <AlertCircle size={11} style={{ color: '#c62828' }} />
      )}
      <span>{statusLabel}</span>
    </div>
  );
};
