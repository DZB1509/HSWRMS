import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import type { Role } from '../../../types/auth';
import type { CapabilityKey } from '../../../types/governance';
import { useGovernance } from '../../../hooks/useGovernance';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/common/Button';

export interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  requiredCapability?: CapabilityKey;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  requiredCapability
}) => {
  const { role, isAuthenticated, currentUser } = useAuth();
  const { hasCapability } = useGovernance();
  const location = useLocation();

  // Not logged in at all
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Capability check if specified
  const isCapabilityDenied = requiredCapability && !hasCapability(role, requiredCapability);

  // Role check if specified
  const isRoleDenied = allowedRoles && allowedRoles.length > 0 && role && !allowedRoles.includes(role);

  // Unauthorized for role or capability
  if (isRoleDenied || isCapabilityDenied) {
    return (
      <div style={{
        maxWidth: '560px',
        margin: 'var(--space-12) auto',
        padding: 'var(--space-8)',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-card)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          margin: '0 auto var(--space-4)',
          borderRadius: '50%',
          backgroundColor: 'var(--danger-bg)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ShieldAlert size={24} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>
          Access Restricted (RBAC)
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
          Your current session persona is <strong>{currentUser?.name}</strong> with role <code>{role}</code>.
          This route strictly requires authorization clearance for: {allowedRoles && allowedRoles.length > 0 ? <code>{allowedRoles.join(' / ')}</code> : ''}{requiredCapability ? <span> with capability: <code>{requiredCapability}</code></span> : ''}.
        </p>
        <div style={{
          padding: 'var(--space-3)',
          backgroundColor: 'var(--bg-soft)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-6)'
        }}>
          💡 <em>Tip for Reviewers:</em> Use the floating <strong>Demo Role Switcher</strong> at the bottom right to switch your persona to one of the authorized roles above.
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)' }}>
          <Button variant="secondary" onClick={() => window.history.back()}>
            Go Back
          </Button>
          <Button variant="primary" onClick={() => window.location.href = `/${role}/dashboard`} icon={<ArrowRight size={14} />}>
            Go to My Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
