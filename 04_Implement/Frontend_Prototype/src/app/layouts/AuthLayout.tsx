import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, ArrowLeft } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="hsw-auth-layout">
      {/* Subtle serene ambient glow */}
      <div className="hsw-auth-ambient-glow" aria-hidden="true" />

      <div style={{ marginBottom: 'var(--space-6)', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Link to="/" className="hsw-brand-logo" style={{ justifyContent: 'center' }}>
          <Sparkles size={24} style={{ color: 'var(--accent-sand)' }} />
          <div>
            HEAVENSTAY
            <span>WELLNESS RESORT</span>
          </div>
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
