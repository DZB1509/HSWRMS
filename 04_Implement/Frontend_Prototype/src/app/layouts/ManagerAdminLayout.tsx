import React from 'react';
import { Outlet } from 'react-router-dom';
import { OperationalSidebar } from '../../components/navigation/OperationalSidebar';
import { Breadcrumb } from '../../components/navigation/Breadcrumb';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert, Download, Filter } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const ManagerAdminLayout: React.FC = () => {
  const { role } = useAuth();

  return (
    <div className="hsw-operational-layout">
      <OperationalSidebar />
      <div className="hsw-operational-main">
        <header className="hsw-operational-topbar">
          <Breadcrumb />
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
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
              letterSpacing: '0.06em'
            }}>
              <ShieldAlert size={13} />
              <span>{role === 'admin' ? 'Administrator Clearance' : 'Manager Limited Scope'}</span>
            </div>
            <Button variant="secondary" size="sm" icon={<Filter size={13} />}>
              Filter Scope
            </Button>
            <Button variant="tertiary" size="sm" icon={<Download size={13} />}>
              Export
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
