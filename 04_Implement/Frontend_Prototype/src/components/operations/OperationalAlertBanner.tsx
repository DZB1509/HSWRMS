import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Info, AlertCircle, ArrowRight } from 'lucide-react';
import type { OperationalAlert } from '../../types/operations';

interface OperationalAlertBannerProps {
  alerts: OperationalAlert[];
}

export const OperationalAlertBanner: React.FC<OperationalAlertBannerProps> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
      {alerts.map((alert) => {
        let bg = '#FFF8E1';
        let borderColor = '#FFE082';
        let color = '#8C5400';
        let Icon = AlertTriangle;

        if (alert.severity === 'critical') {
          bg = '#FFEBEE';
          borderColor = '#FFCDD2';
          color = '#C62828';
          Icon = AlertCircle;
        } else if (alert.severity === 'info') {
          bg = '#E3F2FD';
          borderColor = '#BBDEFB';
          color = '#0D47A1';
          Icon = Info;
        }

        return (
          <div
            key={alert.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: bg,
              border: `1px solid ${borderColor}`,
              fontSize: 'var(--text-xs)',
              color: color,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Icon size={16} style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ marginRight: '6px' }}>{alert.title}:</strong>
                <span>{alert.description}</span>
              </div>
            </div>

            {alert.actionPath && (
              <Link
                to={alert.actionPath}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                  color: color,
                  textDecoration: 'underline',
                  marginLeft: 'var(--space-3)',
                  flexShrink: 0,
                }}
              >
                <span>Resolve</span>
                <ArrowRight size={12} />
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
};
