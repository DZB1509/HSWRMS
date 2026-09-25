import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OperationalSidebar } from '../../components/navigation/OperationalSidebar';
import { Breadcrumb } from '../../components/navigation/Breadcrumb';
import { useAuth } from '../../hooks/useAuth';
import { Calendar, Bell } from 'lucide-react';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';

export const OperationalLayout: React.FC = () => {
  const { role } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="hsw-operational-layout">
      <OperationalSidebar />
      <div className="hsw-operational-main">
        <header className="hsw-operational-topbar">
          <Breadcrumb />
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} style={{ color: 'var(--accent-olive)' }} />
              <span>
                {t('operations.common.resortDate', 'Resort Date')}: <strong>{t('operations.common.dateValue', 'Thursday, 24 Sep 2026')}</strong>
              </span>
            </div>
            <div style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--bg-soft)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {t('operations.common.role', 'Role')}: {role ? t(`navigation:roles.${role}`, role.replace('_', ' ')) : ''}
            </div>
            <LanguageSwitcher />
            <div style={{ position: 'relative', cursor: 'pointer' }} title={t('operations.common.operationalNotifications', 'Operational Notifications')}>
              <Bell size={16} />
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '6px',
                height: '6px',
                backgroundColor: 'var(--accent-sand)',
                borderRadius: '50%'
              }} />
            </div>
          </div>
        </header>

        <main className="hsw-operational-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
