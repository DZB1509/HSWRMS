import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '../../types/auth';
import {
  Sparkles,
  LayoutDashboard,
  CalendarCheck,
  UserCheck,
  Home,
  HeartHandshake,
  ChefHat,
  BarChart3,
  TrendingUp,
  Users2,
  Settings2,
  ToggleLeft,
  Shield,
  UserPlus,
  Database,
  History,
  Activity,
  LogOut,
  Receipt
} from 'lucide-react';

interface SidebarItem {
  labelKey: string;
  defaultLabel: string;
  path: string;
  icon: React.ComponentType<{ size?: number }>;
}

interface SidebarSection {
  headingKey?: string;
  defaultHeading?: string;
  items: SidebarItem[];
}

const ROLE_NAV: Record<Role, SidebarSection[]> = {
  customer: [], // Customer uses CustomerNavbar
  receptionist: [
    {
      headingKey: 'operations.sidebar.frontDeskOperations',
      defaultHeading: 'Front Desk Operations',
      items: [
        { labelKey: 'operations.sidebar.frontDeskDashboard', defaultLabel: 'Front Desk Dashboard', path: '/receptionist/dashboard', icon: LayoutDashboard },
        { labelKey: 'operations.sidebar.dailyArrivals', defaultLabel: 'Daily Arrivals', path: '/receptionist/arrivals', icon: CalendarCheck },
        { labelKey: 'operations.sidebar.villaManagement', defaultLabel: 'Villa Management', path: '/receptionist/villas', icon: Home }
      ]
    },
    {
      headingKey: 'operations.sidebar.customerServicesFolio',
      defaultHeading: 'Customer Services & Folio',
      items: [
        { labelKey: 'operations.sidebar.manualExtraSpa', defaultLabel: 'Manual Extra Spa', path: '/receptionist/spa/extra-booking', icon: HeartHandshake },
        { labelKey: 'operations.sidebar.customerFolioInvoice', defaultLabel: 'Customer Folio & Invoice', path: '/receptionist/folio/bk-1001', icon: Receipt },
        { labelKey: 'operations.sidebar.finalPaymentCheckout', defaultLabel: 'Final Payment & Checkout', path: '/receptionist/checkout/bk-1001/payment', icon: UserCheck }
      ]
    }
  ],
  therapist: [
    {
      headingKey: 'operations.sidebar.therapistSchedule',
      defaultHeading: 'Therapist Schedule',
      items: [
        { labelKey: 'operations.sidebar.therapistDashboard', defaultLabel: 'Therapist Dashboard', path: '/therapist/dashboard', icon: LayoutDashboard },
        { labelKey: 'operations.sidebar.dailyWorkSchedule', defaultLabel: 'Daily Work Schedule', path: '/therapist/schedule', icon: CalendarCheck },
        { labelKey: 'operations.sidebar.sessionDetailsNotes', defaultLabel: 'Session Details & Notes', path: '/therapist/sessions/SES-301', icon: HeartHandshake }
      ]
    }
  ],
  fb_staff: [
    {
      headingKey: 'operations.sidebar.kitchenOperations',
      defaultHeading: 'Kitchen Operations',
      items: [
        { labelKey: 'operations.sidebar.fbDashboard', defaultLabel: 'F&B Dashboard', path: '/fb/dashboard', icon: LayoutDashboard },
        { labelKey: 'operations.sidebar.dailyMealPrepQueue', defaultLabel: 'Daily Meal Prep Queue', path: '/fb/meal-prep', icon: ChefHat }
      ]
    }
  ],
  manager: [
    {
      headingKey: 'operations.sidebar.managementCockpit',
      defaultHeading: 'Management Cockpit',
      items: [
        { labelKey: 'operations.sidebar.managerDashboard', defaultLabel: 'Manager Dashboard', path: '/manager/dashboard', icon: LayoutDashboard },
        { labelKey: 'operations.sidebar.revenueAnalytics', defaultLabel: 'Revenue Analytics', path: '/manager/revenue', icon: BarChart3 },
        { labelKey: 'operations.sidebar.occupancyReports', defaultLabel: 'Occupancy Reports', path: '/manager/occupancy', icon: TrendingUp },
        { labelKey: 'operations.sidebar.therapistUtilization', defaultLabel: 'Therapist Utilization', path: '/manager/therapist-utilization', icon: Users2 }
      ]
    },
    {
      headingKey: 'operations.sidebar.governanceCompliance',
      defaultHeading: 'Governance & Compliance',
      items: [
        { labelKey: 'operations.sidebar.systemOverviewPoliceExport', defaultLabel: 'System Overview & Police Export', path: '/manager/system-overview', icon: Activity }
      ]
    }
  ],
  admin: [
    {
      headingKey: 'operations.sidebar.administration',
      defaultHeading: 'Administration',
      items: [
        { labelKey: 'operations.sidebar.adminDashboard', defaultLabel: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { labelKey: 'operations.sidebar.staffAccounts', defaultLabel: 'Staff Accounts', path: '/admin/staff', icon: UserPlus },
        { labelKey: 'operations.sidebar.masterDataManagement', defaultLabel: 'Master Data Management', path: '/admin/master-data', icon: Database }
      ]
    },
    {
      headingKey: 'operations.sidebar.securityGovernance',
      defaultHeading: 'Security & Governance',
      items: [
        { labelKey: 'operations.sidebar.businessParameters', defaultLabel: 'Business Parameters', path: '/admin/business-params', icon: Settings2 },
        { labelKey: 'operations.sidebar.featureFlags', defaultLabel: 'Feature Flags', path: '/admin/feature-flags', icon: ToggleLeft },
        { labelKey: 'operations.sidebar.permissionMatrix', defaultLabel: 'Permission Matrix', path: '/admin/permissions', icon: Shield },
        { labelKey: 'operations.sidebar.managerDelegation', defaultLabel: 'Manager Delegation', path: '/admin/delegation', icon: Users2 },
        { labelKey: 'operations.sidebar.sensitiveDataAuditLog', defaultLabel: 'Sensitive Data Audit Log', path: '/admin/audit-log', icon: History },
        { labelKey: 'operations.sidebar.systemOverviewDashboard', defaultLabel: 'System Overview Dashboard', path: '/admin/system-overview', icon: Activity }
      ]
    }
  ]
};

export const OperationalSidebar: React.FC<{
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}> = ({ mobileOpen = false, onCloseMobile: _onCloseMobile }) => {
  const { currentUser, role, logout } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (!role || role === 'customer') return null;

  const sections = ROLE_NAV[role] || [];

  return (
    <aside
      className={`hsw-sidebar ${mobileOpen ? 'is-mobile-open' : ''}`}
      aria-label="Staff navigation sidebar"
    >
      <div className="hsw-sidebar-header">
        <Link to={`/${role}/dashboard`} className="hsw-brand-logo">
          <Sparkles size={20} style={{ color: 'var(--accent-sand)', flexShrink: 0 }} />
          <div>
            HEAVENSTAY
            <span>{t('operations.sidebar.operationalSuite', 'OPERATIONAL SUITE')}</span>
          </div>
        </Link>
      </div>

      <div className="hsw-sidebar-user">
        <div className="hsw-avatar-circle" style={{ backgroundColor: 'var(--accent-olive)' }}>
          {currentUser?.avatar || 'ST'}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentUser?.name}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-forest)', textTransform: 'capitalize' }}>
            {t(`navigation:roles.${role}`, role.replace('_', ' '))} · {currentUser?.department || t('operations.sidebar.operationsDept', 'Operations')}
          </div>
        </div>
      </div>

      <nav className="hsw-sidebar-nav">
        {sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: 'var(--space-3)' }}>
            {section.headingKey && (
              <div className="hsw-sidebar-nav-heading">
                {t(section.headingKey, section.defaultHeading || '')}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`hsw-sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{t(item.labelKey, item.defaultLabel)}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={logout}
          className="hsw-sidebar-link"
          style={{ width: '100%', color: 'var(--danger)', justifyContent: 'flex-start' }}
        >
          <LogOut size={16} />
          <span>{t('operations.sidebar.signOut', 'Sign Out')}</span>
        </button>
      </div>
    </aside>
  );
};
