import React from 'react';
import { Outlet } from 'react-router-dom';
import { OperationalSidebar } from '../../components/navigation/OperationalSidebar';
import { Breadcrumb } from '../../components/navigation/Breadcrumb';
import { useAuth } from '../../hooks/useAuth';
import { Calendar, Bell } from 'lucide-react';

export const OperationalLayout: React.FC = () => {
  const { role } = useAuth();

  return (
    <div className="hsw-operational-layout">
      <OperationalSidebar />
      <div className="hsw-operational-main">
        <header className="hsw-operational-topbar">
          <Breadcrumb />
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} style={{ color: 'var(--accent-olive)' }} />
              <span>Resort Date: <strong>Thursday, 24 Sep 2026</strong></span>
            </div>
            <div style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--bg-soft)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Role: {role?.replace('_', ' ')}
            </div>
            <div style={{ position: 'relative', cursor: 'pointer' }} title="Operational Notifications">
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
