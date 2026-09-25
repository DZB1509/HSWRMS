import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '../../types/auth';
import {
  Sparkles,
  LayoutDashboard,
  CalendarCheck,
  UserCheck,
  Home,
  HeartHandshake,
  UtensilsCrossed,
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
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number }>;
}

interface SidebarSection {
  heading?: string;
  items: SidebarItem[];
}

const ROLE_NAV: Record<Role, SidebarSection[]> = {
  customer: [], // Customer uses CustomerNavbar
  receptionist: [
    {
      heading: 'Front Desk Operations',
      items: [
        { label: 'Front Desk Dashboard', path: '/receptionist/dashboard', icon: LayoutDashboard },
        { label: 'Daily Arrivals', path: '/receptionist/arrivals', icon: CalendarCheck },
        { label: 'Villa Management', path: '/receptionist/villas', icon: Home }
      ]
    },
    {
      heading: 'Customer Services & Folio',
      items: [
        { label: 'Manual Extra Spa', path: '/receptionist/spa/extra-booking', icon: HeartHandshake },
        { label: 'Customer Folio & Invoice', path: '/receptionist/folio/bk-1001', icon: Receipt },
        { label: 'Final Payment & Checkout', path: '/receptionist/checkout/bk-1001/payment', icon: UserCheck }
      ]
    }
  ],
  therapist: [
    {
      heading: 'Therapist Schedule',
      items: [
        { label: 'Therapist Dashboard', path: '/therapist/dashboard', icon: LayoutDashboard },
        { label: 'Daily Work Schedule', path: '/therapist/schedule', icon: CalendarCheck },
        { label: 'Session Details & Notes', path: '/therapist/sessions/ses-301', icon: HeartHandshake }
      ]
    }
  ],
  fb_staff: [
    {
      heading: 'Kitchen Operations',
      items: [
        { label: 'F&B Dashboard', path: '/fb/dashboard', icon: LayoutDashboard },
        { label: 'Daily Meal Prep Queue', path: '/fb/meal-prep', icon: ChefHat },
        { label: 'Meal Order & Allergies', path: '/fb/orders/ord-401', icon: UtensilsCrossed }
      ]
    }
  ],
  manager: [
    {
      heading: 'Management Cockpit',
      items: [
        { label: 'Manager Dashboard', path: '/manager/dashboard', icon: LayoutDashboard },
        { label: 'Revenue Analytics', path: '/manager/revenue', icon: BarChart3 },
        { label: 'Occupancy Reports', path: '/manager/occupancy', icon: TrendingUp },
        { label: 'Therapist Utilization', path: '/manager/therapist-utilization', icon: Users2 }
      ]
    },
    {
      heading: 'Governance & Compliance',
      items: [
        { label: 'System Overview & Police Export', path: '/manager/system-overview', icon: Activity }
      ]
    }
  ],
  admin: [
    {
      heading: 'Administration',
      items: [
        { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Staff Accounts', path: '/admin/staff', icon: UserPlus },
        { label: 'Master Data Management', path: '/admin/master-data', icon: Database }
      ]
    },
    {
      heading: 'Security & Governance',
      items: [
        { label: 'Business Parameters', path: '/admin/business-params', icon: Settings2 },
        { label: 'Feature Flags', path: '/admin/feature-flags', icon: ToggleLeft },
        { label: 'Permission Matrix', path: '/admin/permissions', icon: Shield },
        { label: 'Manager Delegation', path: '/admin/delegation', icon: Users2 },
        { label: 'Sensitive Data Audit Log', path: '/admin/audit-log', icon: History },
        { label: 'System Overview Dashboard', path: '/admin/system-overview', icon: Activity }
      ]
    }
  ]
};

export const OperationalSidebar: React.FC = () => {
  const { currentUser, role, logout } = useAuth();
  const location = useLocation();

  if (!role || role === 'customer') return null;

  const sections = ROLE_NAV[role] || [];

  return (
    <aside className="hsw-sidebar" aria-label="Staff navigation sidebar">
      <div className="hsw-sidebar-header">
        <Link to={`/${role}/dashboard`} className="hsw-brand-logo">
          <Sparkles size={20} style={{ color: 'var(--accent-sand)' }} />
          <div>
            HEAVENSTAY
            <span>OPERATIONAL SUITE</span>
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
            {role.replace('_', ' ')} · {currentUser?.department || 'Operations'}
          </div>
        </div>
      </div>

      <nav className="hsw-sidebar-nav">
        {sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: 'var(--space-3)' }}>
            {section.heading && (
              <div className="hsw-sidebar-nav-heading">{section.heading}</div>
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
                  <span>{item.label}</span>
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
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
