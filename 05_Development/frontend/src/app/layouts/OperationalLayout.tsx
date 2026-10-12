import React, { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OperationalSidebar } from '../../components/navigation/OperationalSidebar';
import { Breadcrumb } from '../../components/navigation/Breadcrumb';
import { useAuth } from '../../hooks/useAuth';
import { Calendar, Bell, Menu, X } from 'lucide-react';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { CursorEffectToggle } from '../../components/common/CursorEffectToggle';

export const OperationalLayout: React.FC = () => {
  const { role } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [sidebarOpen]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="hsw-operational-layout">
      {/* Mobile backdrop overlay */}
      <div
        className={`hsw-sidebar-backdrop ${sidebarOpen ? 'is-visible' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar — mobile gets is-mobile-open class */}
      <OperationalSidebar mobileOpen={sidebarOpen} onCloseMobile={closeSidebar} />

      <div className="hsw-operational-main">
        <header className="hsw-operational-topbar">
          {/* Mobile hamburger */}
          <button
            type="button"
            className="hsw-ops-mobile-toggle"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? t('operations.common.closeMenu', 'Close menu') : t('operations.common.openMenu', 'Open menu')}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <Breadcrumb />

          <div className="hsw-topbar-extras" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
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
            <ThemeToggle />
            <CursorEffectToggle />
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
