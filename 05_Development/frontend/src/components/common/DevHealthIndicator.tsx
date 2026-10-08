import React, { useEffect, useState } from 'react';
import { checkBackendHealth, type HealthCheckResponse } from '../../api/health/healthApi';
import { Activity, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const DevHealthIndicator: React.FC = () => {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

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
    // Only check once on mount in development
    fetchHealth();
  }, []);

  return (
    <aside
      className="hsw-dev-health-indicator"
      aria-label="Development Backend Connectivity Status"
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        zIndex: 9999,
        fontFamily: 'var(--font-interface, sans-serif)',
        fontSize: '12px',
      }}
    >
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          title="Toggle Backend Connectivity Status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            backgroundColor: health?.status === 'UP' ? '#2e5a36' : '#5a3636',
            color: '#ffffff',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {loading ? (
            <RefreshCw size={12} className="spin" />
          ) : health?.status === 'UP' ? (
            <CheckCircle2 size={12} />
          ) : (
            <AlertCircle size={12} />
          )}
          <span>API: {health?.status || (loading ? 'Checking...' : 'Offline')}</span>
        </button>
      ) : (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--surface, #ffffff)',
            color: 'var(--text-primary, #2b2b2b)',
            border: '1px solid var(--border-subtle, #e5e2dc)',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            width: '260px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} /> Backend Status
            </strong>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary, #706e6b)' }}
            >
              ✕
            </button>
          </div>
          <div style={{ marginBottom: '8px', fontSize: '11px', color: 'var(--text-secondary, #706e6b)' }}>
            Endpoint: <code>/api/v1/health</code>
          </div>
          <div style={{ marginBottom: '10px' }}>
            {loading ? (
              <span style={{ color: 'var(--text-secondary)' }}>Connecting...</span>
            ) : health ? (
              <span style={{ color: '#2e5a36', fontWeight: 600 }}>● {health.status} (Healthy)</span>
            ) : (
              <span style={{ color: '#a24b43', fontWeight: 600 }}>● Offline ({error})</span>
            )}
          </div>
          <button
            type="button"
            onClick={fetchHealth}
            disabled={loading}
            style={{
              width: '100%',
              padding: '4px 8px',
              fontSize: '11px',
              background: 'var(--bg-soft, #f5f3ef)',
              border: '1px solid var(--border-subtle, #e5e2dc)',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Testing...' : 'Re-check Connection'}
          </button>
        </div>
      )}
    </aside>
  );
};
