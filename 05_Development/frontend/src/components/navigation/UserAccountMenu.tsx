import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../app/providers/AuthProvider';
import { useCustomer } from '../../context/CustomerContext';
import { checkBackendHealth, type HealthCheckResponse } from '../../api/health/healthApi';
import {
  ChevronDown,
  LayoutDashboard,
  Settings,
  LogOut,
  HeartPulse,
  Receipt,
  CalendarCheck,
  Home,
  ChefHat,
  Sparkles,
  Activity,
  UserPlus,
  Settings2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export interface UserAccountMenuProps {
  variant?: 'customer' | 'operational' | 'public';
  className?: string;
}

export const UserAccountMenu: React.FC<UserAccountMenuProps> = ({
  variant: _variant = 'customer',
  className = '',
}) => {
  const { t } = useTranslation(['common', 'navigation', 'operations', 'customer']);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, role, isAuthenticated, logout } = useAuth();
  const { profile, activeBooking } = useCustomer();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Health state for discreet API indicator
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await checkBackendHealth();
      setHealth(res);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const timer = setInterval(fetchHealth, 30000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Click outside and Escape key handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isAuthenticated && !currentUser) {
    return (
      <Link to="/login" className="hsw-btn-login" style={{ textDecoration: 'none' }}>
        <button
          type="button"
          style={{
            padding: '6px 16px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--accent-forest)',
            backgroundColor: 'var(--accent-forest)',
            color: '#ffffff',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {t('common:actions.signIn', 'Sign In')}
        </button>
      </Link>
    );
  }

  // Determine user display name & initials
  const displayName = profile?.fullName || currentUser?.name || t('common:labels.customer', 'Guest');
  const displayEmail = profile?.email || currentUser?.email || '';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || (role === 'customer' ? 'KH' : 'NV');

  // Role subtitle
  const getRoleSubtitle = (): string => {
    if (role === 'customer') {
      if (activeBooking) {
        return activeBooking.villaNumber ? `Villa #${activeBooking.villaNumber} · Reserved` : t('customer:nav.reservedStay', 'Stay Reserved');
      }
      return t('customer:nav.sanctuaryMember', 'Sanctuary Member');
    }
    if (role === 'receptionist') return t('navigation:roles.receptionist', 'Front Desk · Receptionist');
    if (role === 'therapist') return t('navigation:roles.therapist', 'Therapist · Spa & Wellness');
    if (role === 'fb_staff') return t('navigation:roles.fb_staff', 'Culinary & F&B Staff');
    if (role === 'manager') return t('navigation:roles.manager', 'Operations Manager');
    if (role === 'admin') return t('navigation:roles.admin', 'System Administrator');
    return t('common:labels.staff', 'Staff');
  };

  const handleSignOut = () => {
    logout();
    setIsOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <div
      className={`hsw-user-account-menu ${isOpen ? 'is-open' : ''} ${className}`}
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
    >
      {/* Account Trigger Button */}
      <button
        type="button"
        className="hsw-account-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Account menu for ${displayName}`}
        id="user-account-menu-trigger"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: '1px solid var(--border-subtle, #e5e2dc)',
          borderRadius: 'var(--radius-pill, 9999px)',
          padding: '4px 10px 4px 5px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backgroundColor: isOpen ? 'var(--bg-soft, #f4f1eb)' : 'transparent',
        }}
      >
        {/* Avatar Circle */}
        <div
          className="hsw-account-avatar-circle"
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: role === 'customer' ? 'var(--accent-forest, #2d3e2c)' : 'var(--accent-olive, #556b2f)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            flexShrink: 0,
          }}
        >
          {initials}
        </div>

        {/* Text information */}
        <div style={{ textAlign: 'left', lineHeight: 1.25, paddingRight: '2px' }} className="hsw-account-text-wrap">
          <div
            style={{
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--text-primary, #2b2b2b)',
              whiteSpace: 'nowrap',
              maxWidth: '140px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              fontSize: '10.5px',
              color: 'var(--accent-olive, #556b2f)',
              whiteSpace: 'nowrap',
            }}
          >
            {getRoleSubtitle()}
          </div>
        </div>

        {/* Chevron Icon */}
        <ChevronDown
          size={13}
          style={{
            color: 'var(--text-secondary, #706e6b)',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="hsw-account-dropdown"
          role="menu"
          aria-label="User account actions"
          id="user-account-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            minWidth: '240px',
            backgroundColor: 'var(--surface-elevated, #ffffff)',
            border: '1px solid var(--border-subtle, #e5e2dc)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
            padding: '8px',
            zIndex: 1200,
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            animation: 'hsw-dropdown-enter 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* User Profile Card */}
          <div
            style={{
              padding: '8px 10px 10px',
              borderBottom: '1px solid var(--border-subtle, #e5e2dc)',
              marginBottom: '4px',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {displayName}
            </div>
            {displayEmail && (
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayEmail}
              </div>
            )}
            <div
              style={{
                marginTop: '6px',
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--accent-sand-soft, #f7f4ee)',
                color: 'var(--accent-forest, #2d3e2c)',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {getRoleSubtitle()}
            </div>
          </div>

          {/* Role-Specific Links */}
          {role === 'customer' ? (
            <>
              <Link
                to="/customer/dashboard"
                className="hsw-account-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                style={itemStyle}
              >
                <LayoutDashboard size={14} style={{ color: 'var(--accent-olive)' }} />
                <span>{t('navigation:nav.dashboard', 'Dashboard')}</span>
              </Link>
              <Link
                to="/customer/health-profile"
                className="hsw-account-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                style={itemStyle}
              >
                <HeartPulse size={14} style={{ color: 'var(--accent-olive)' }} />
                <span>{t('customer:nav.healthProfile', 'Wellness Profile')}</span>
              </Link>
              <Link
                to="/customer/folio"
                className="hsw-account-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                style={itemStyle}
              >
                <Receipt size={14} style={{ color: 'var(--accent-olive)' }} />
                <span>{t('customer:nav.folio', 'Stay Folio')}</span>
              </Link>
              <Link
                to="/customer/account"
                className="hsw-account-dropdown-item"
                role="menuitem"
                id="menuitem-account-settings"
                onClick={() => setIsOpen(false)}
                style={itemStyle}
              >
                <Settings size={14} style={{ color: 'var(--accent-olive)' }} />
                <span>{t('customer:nav.account', 'Account Settings')}</span>
              </Link>
            </>
          ) : role === 'receptionist' ? (
            <>
              <Link
                to="/receptionist/dashboard"
                className="hsw-account-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                style={itemStyle}
              >
                <LayoutDashboard size={14} style={{ color: 'var(--accent-olive)' }} />
                <span>{t('operations:sidebar.frontDeskDashboard', 'Front Desk Dashboard')}</span>
              </Link>
              <Link
                to="/receptionist/arrivals"
                className="hsw-account-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                style={itemStyle}
              >
                <CalendarCheck size={14} style={{ color: 'var(--accent-olive)' }} />
                <span>{t('operations:sidebar.dailyArrivals', 'Daily Arrivals')}</span>
              </Link>
              <Link
                to="/receptionist/villas"
                className="hsw-account-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                style={itemStyle}
              >
                <Home size={14} style={{ color: 'var(--accent-olive)' }} />
                <span>{t('operations:sidebar.villaManagement', 'Villa Management')}</span>
              </Link>
            </>
          ) : role === 'therapist' ? (
            <>
              <Link
                to="/therapist/dashboard"
                className="hsw-account-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                style={itemStyle}
              >
                <LayoutDashboard size={14} style={{ color: 'var(--accent-olive)' }} />
                <span>{t('operations:sidebar.therapistDashboard', 'Therapist Dashboard')}</span>
              </Link>
              <Link
                to="/therapist/schedule"
                className="hsw-account-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                style={itemStyle}
              >
                <CalendarCheck size={14} style={{ color: 'var(--accent-olive)' }} />
                <span>{t('operations:sidebar.dailyWorkSchedule', 'Daily Work Schedule')}</span>
              </Link>
            </>
          ) : role === 'fb_staff' ? (
            <>
              <Link
                to="/fb/dashboard"
                className="hsw-account-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                style={itemStyle}
              >
                <LayoutDashboard size={14} style={{ color: 'var(--accent-olive)' }} />
                <span>{t('operations:sidebar.fbDashboard', 'F&B Dashboard')}</span>
              </Link>
              <Link
                to="/fb/meal-prep"
                className="hsw-account-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                style={itemStyle}
              >
                <ChefHat size={14} style={{ color: 'var(--accent-olive)' }} />
                <span>{t('operations:sidebar.dailyMealPrepQueue', 'Meal Prep Queue')}</span>
              </Link>
            </>
          ) : role === 'manager' ? (
            <>
              <Link
                to="/manager/dashboard"
                className="hsw-account-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                style={itemStyle}
              >
                <LayoutDashboard size={14} style={{ color: 'var(--accent-olive)' }} />
                <span>{t('operations:sidebar.managerDashboard', 'Manager Cockpit')}</span>
              </Link>
              <Link
                to="/manager/spa"
                className="hsw-account-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                style={itemStyle}
              >
                <Sparkles size={14} style={{ color: 'var(--accent-olive)' }} />
                <span>{t('operations:sidebar.managerSpaView', 'Spa Management')}</span>
              </Link>
              <Link
                to="/manager/system-overview"
                className="hsw-account-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                style={itemStyle}
              >
                <Activity size={14} style={{ color: 'var(--accent-olive)' }} />
                <span>{t('operations:sidebar.systemOverviewDashboard', 'System Overview')}</span>
              </Link>
            </>
          ) : role === 'admin' ? (
            <>
              <Link
                to="/admin/dashboard"
                className="hsw-account-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                style={itemStyle}
              >
                <LayoutDashboard size={14} style={{ color: 'var(--accent-olive)' }} />
                <span>{t('operations:sidebar.adminDashboard', 'Admin Dashboard')}</span>
              </Link>
              <Link
                to="/admin/staff"
                className="hsw-account-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                style={itemStyle}
              >
                <UserPlus size={14} style={{ color: 'var(--accent-olive)' }} />
                <span>{t('operations:sidebar.staffAccounts', 'Staff Accounts')}</span>
              </Link>
              <Link
                to="/admin/business-params"
                className="hsw-account-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                style={itemStyle}
              >
                <Settings2 size={14} style={{ color: 'var(--accent-olive)' }} />
                <span>{t('operations:sidebar.businessParameters', 'Business Parameters')}</span>
              </Link>
              <Link
                to="/admin/system-overview"
                className="hsw-account-dropdown-item"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                style={itemStyle}
              >
                <Activity size={14} style={{ color: 'var(--accent-olive)' }} />
                <span>{t('operations:sidebar.systemOverviewDashboard', 'System Overview')}</span>
              </Link>
            </>
          ) : null}

          {/* Discreet API / Backend Status row (Live Connection Tracking) */}
          {(() => {
            const isUp = health?.status === 'UP';
            const statusColor = healthLoading ? '#b45309' : isUp ? '#2e7d32' : '#c62828';
            const statusBg = healthLoading ? 'rgba(245, 158, 11, 0.08)' : isUp ? 'rgba(46, 125, 50, 0.08)' : 'rgba(198, 40, 40, 0.08)';
            return (
              <div
                style={{
                  marginTop: '4px',
                  padding: '6px 10px',
                  borderTop: '1px solid var(--border-subtle, #e5e2dc)',
                  borderBottom: '1px solid var(--border-subtle, #e5e2dc)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  backgroundColor: statusBg,
                  borderRadius: 'var(--radius-xs, 4px)',
                  transition: 'background-color 0.2s ease',
                }}
                id="account-menu-api-status-row"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {healthLoading ? (
                    <RefreshCw size={11} className="spin" style={{ color: statusColor }} />
                  ) : isUp ? (
                    <CheckCircle2 size={11} style={{ color: statusColor }} />
                  ) : (
                    <AlertCircle size={11} style={{ color: statusColor }} />
                  )}
                  <span style={{ fontWeight: 600, color: statusColor }}>
                    {healthLoading
                      ? t('common:status.connecting', 'Connecting...')
                      : isUp
                        ? t('common:status.connected', 'API Connected')
                        : t('common:status.disconnected', 'API Offline')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchHealth();
                  }}
                  title={t('common:actions.refresh', 'Refresh status')}
                  aria-label="Refresh API connection status"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: statusColor,
                    padding: '2px',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <RefreshCw size={10} className={healthLoading ? 'spin' : ''} />
                </button>
              </div>
            );
          })()}

          {/* Sign Out Button */}
          <button
            type="button"
            className="hsw-account-dropdown-item hsw-account-signout"
            role="menuitem"
            id="user-account-signout-btn"
            onClick={handleSignOut}
            style={{
              ...itemStyle,
              marginTop: '2px',
              color: 'var(--danger, #a24b43)',
              fontWeight: 600,
            }}
          >
            <LogOut size={14} />
            <span>{t('common:actions.signOut', 'Sign Out')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '7px 10px',
  borderRadius: 'var(--radius-xs, 4px)',
  fontSize: '12px',
  color: 'var(--text-primary, #2b2b2b)',
  textDecoration: 'none',
  background: 'none',
  border: 'none',
  width: '100%',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
  transition: 'background-color 0.15s ease',
};