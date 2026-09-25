import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, ArrowLeft } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="hsw-auth-layout">
      <div style={{ marginBottom: 'var(--space-6)', textAlign: 'center' }}>
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

      <div style={{ marginTop: 'var(--space-6)' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={14} />
          <span>{t('auth.returnToSanctuary')}</span>
        </Link>
      </div>
    </div>
  );
};
