import type { ScreenMetadata } from '../../types/screen';
import { useAuth } from '../../hooks/useAuth';
import { StatusChip } from './StatusChip';
import { ShieldCheck, Compass } from 'lucide-react';

export interface PlaceholderScreenProps {
  screen: ScreenMetadata;
}

export const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({ screen }) => {
  const { role, isAuthenticated, currentUser } = useAuth();

  return (
    <div className="hsw-placeholder-screen">
      <div className="placeholder-badge-row">
        <span className="placeholder-screen-number">Screen #{screen.number}</span>
        <StatusChip status={screen.module} />
        <span
          style={{
            padding: '2px 8px',
            backgroundColor: 'var(--bg-soft)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-pill)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            color: 'var(--text-secondary)'
          }}
        >
          Primary Actor: {screen.primaryActor}
        </span>
        <span
          style={{
            padding: '2px 8px',
            backgroundColor: 'var(--accent-sand-soft)',
            borderRadius: 'var(--radius-pill)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--accent-forest)'
          }}
        >
          Phase 1 Shell Active
        </span>
      </div>

      <div>
        <h1 className="placeholder-title">{screen.name}</h1>
        <p className="placeholder-desc" style={{ marginTop: 'var(--space-2)' }}>
          {screen.description}
        </p>
      </div>

      <div className="placeholder-info-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--accent-forest)' }}>
          <Compass size={16} />
          <span>Screen Architecture & Navigation Context</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Route Path:</strong> <code>{screen.routePath}</code>
          </div>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Shared Layout:</strong> <code>{screen.layout}</code>
          </div>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Required Role:</strong> <code>{screen.requiredRole || 'Public / Any'}</code>
          </div>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Current Session:</strong>{' '}
            <code>{isAuthenticated ? `${currentUser?.name} (${role})` : 'Public / Visitor'}</code>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-4)',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        maxWidth: '680px'
      }}>
        <ShieldCheck size={20} style={{ color: 'var(--success)' }} />
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Phase 1 Validation:</strong> Route wiring, role-based layout nesting, navigation shell, and theme tokens are operational. Business data views and interactive forms for this screen will be implemented in its designated milestone.
        </div>
      </div>
    </div>
  );
};
