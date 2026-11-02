import { HeavenStayLogo } from '../../components/common/HeavenStayLogo';
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="hsw-auth-layout">
      {/* Subtle serene ambient glow */}
      <div className="hsw-auth-ambient-glow" aria-hidden="true" />

      <div style={{ marginBottom: 'var(--space-6)', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Link to="/" className="hsw-brand-logo" style={{ justifyContent: 'center', textDecoration: 'none' }}>
          <HeavenStayLogo variant="public" size="md" />
        </Link>
      </div>

      <div className="hsw-auth-card">
        <Outlet />
      </div>

      <div style={{ marginTop: 'var(--space-6)', position: 'relative', zIndex: 1 }}>
        <Link
          to="/"
          className="hsw-auth-return-link"
        >
          <ArrowLeft size={14} />
          <span>{t('auth.returnToSanctuary')}</span>
        </Link>
      </div>
    </div>
  );
};
