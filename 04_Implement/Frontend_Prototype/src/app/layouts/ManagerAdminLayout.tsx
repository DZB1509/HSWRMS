import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OperationalSidebar } from '../../components/navigation/OperationalSidebar';
import { Breadcrumb } from '../../components/navigation/Breadcrumb';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert, Download, Filter, Menu, X } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const ManagerAdminLayout: React.FC = () => {
  const { role } = useAuth();
  const { t } = useTranslation(['operations', 'common']);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="hsw-operational-layout">
      {/* Mobile drawer backdrop */}
      <div
        className={`hsw-sidebar-backdrop ${sidebarOpen ? 'is-visible' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <OperationalSidebar mobileOpen={sidebarOpen} onCloseMobile={closeSidebar} />

      <div className="hsw-operational-main">
        <header className="hsw-operational-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
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
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {/* 1. Manager Scope Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              backgroundColor: role === 'admin' ? 'var(--actor-admin)' : 'var(--actor-manager)',
              color: role === 'admin' ? 'var(--actor-admin-text)' : 'var(--actor-manager-text)',
              borderRadius: 'var(--radius-pill)',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap'
            }}>
              <ShieldAlert size={13} />
              <span>
                {role === 'admin'
                  ? t('topbar.adminClearance', 'Administrator Clearance')
                  : t('topbar.managerScope', 'Manager Limited Scope')}
              </span>
            </div>

            {/* 2. Language Selector (Shared for Manager & future Admin) */}
            <LanguageSwitcher />

            {/* 3. Filter Scope */}
            <Button variant="secondary" size="sm" icon={<Filter size={13} />}>
              {t('topbar.filterScope', 'Filter Scope')}
            </Button>

            {/* 4. Export */}
            <Button variant="tertiary" size="sm" icon={<Download size={13} />}>
              {t('topbar.export', 'Export')}
            </Button>
          </div>
        </header>

        <main className="hsw-operational-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
