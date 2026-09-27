import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const location = useLocation();
  const { t } = useTranslation(['common', 'dining', 'operations', 'customer', 'navigation']);

  const getSegmentLabel = (segment: string, _index: number, pathnames: string[]): string => {
    const s = segment.toLowerCase();
    const root = pathnames[0]?.toLowerCase();

    // Top-level role / module namespaces
    if (s === 'fb') return 'F&B';
    if (s === 'customer') return t('common:roles.customer', 'Customer');
    if (s === 'receptionist') return t('common:roles.receptionist', 'Receptionist');
    if (s === 'therapist') return t('common:roles.therapist', 'Therapist');
    if (s === 'manager') return t('operations:sidebar.manager', 'Manager');
    if (s === 'admin') return t('operations:sidebar.admin', 'Admin');

    // Route-aware dashboard labels
    if (s === 'dashboard') {
      if (root === 'customer') return t('customer:nav.dashboard', 'Tổng Quan');
      if (root === 'fb') return t('operations:sidebar.fbDashboard', 'Bảng Điều Hành Ẩm Thực');
      if (root === 'receptionist') return t('operations:sidebar.frontDeskDashboard', 'Bảng Điều Hành Lễ Tân');
      if (root === 'therapist') return t('operations:sidebar.therapistDashboard', 'Bảng Điều Hành Trị Liệu');
      if (root === 'manager') return t('operations:sidebar.managerDashboard', 'Bảng Điều Hành Quản Lý');
      if (root === 'admin') return t('operations:sidebar.adminDashboard', 'Bảng Quản Trị Hệ Thống');
      return t('navigation:nav.dashboard', 'Dashboard');
    }

    // Customer sub-routes
    if (s === 'dining') return t('customer:nav.dining', 'Dining');
    if (s === 'spa') return t('customer:nav.spa', 'Spa & Wellness');
    if (s === 'bookings') return t('customer:nav.bookings', 'My Bookings');
    if (s === 'health') return t('customer:nav.healthProfile', 'Health Profile');
    if (s === 'folio') return t('customer:nav.folio', 'Stay Folio');
    if (s === 'account') return t('customer:nav.account', 'Account Settings');

    // Dining sub-routes
    if (s === 'menu') return t('dining:menu.title', 'Menu');
    if (s === 'meal-prep') return t('operations:sidebar.dailyMealPrepQueue', 'Daily Meal Prep Queue');
    if (s === 'daily-selection') return t('dining:selection.title', 'Daily Meal Selection');
    if (s === 'a-la-carte') return t('dining:alacarte.title', 'A-la-carte Order');
    if (s === 'meal-plan') return t('dining:plan.title', 'My Meal Plan');
    if (s === 'orders') return t('dining:plan.extraOrders', 'Orders');
    if (s === 'allergies') return t('operations:sidebar.mealOrderAllergies', 'Meal Order & Allergies');

    // Front Desk / Operational sub-routes
    if (s === 'arrivals') return t('operations:sidebar.dailyArrivals', 'Daily Arrivals');
    if (s === 'villas') return t('operations:sidebar.villaManagement', 'Villa Management');
    if (s === 'services') return t('operations:sidebar.customerServicesFolio', 'Customer Services & Folio');
    if (s === 'extra-spa') return t('operations:sidebar.manualExtraSpa', 'Manual Extra Spa');
    if (s === 'checkout') return t('operations:sidebar.finalPaymentCheckout', 'Final Payment & Checkout');

    // Therapist sub-routes
    if (s === 'schedule') return t('operations:sidebar.dailyWorkSchedule', 'Daily Work Schedule');
    if (s === 'sessions' || s === 'notes') return t('operations:sidebar.sessionDetailsNotes', 'Session Details & Notes');

    // Manager / Admin sub-routes
    if (s === 'revenue') return t('operations:sidebar.revenueAnalytics', 'Revenue Analytics');
    if (s === 'occupancy') return t('operations:sidebar.occupancyReports', 'Occupancy Reports');
    if (s === 'therapist-utilization' || s === 'utilization') return t('operations:sidebar.therapistUtilization', 'Therapist Utilization');
    if (s === 'compliance') return t('operations:sidebar.governanceCompliance', 'Governance & Compliance');
    if (s === 'police-export') return t('operations:sidebar.systemOverviewPoliceExport', 'System Overview & Police Export');
    if (s === 'accounts') return t('operations:sidebar.staffAccounts', 'Staff Accounts');
    if (s === 'master-data') return t('operations:sidebar.masterDataManagement', 'Master Data Management');
    if (s === 'security') return t('operations:sidebar.securityGovernance', 'Security & Governance');
    if (s === 'parameters') return t('operations:sidebar.businessParameters', 'Business Parameters');
    if (s === 'flags') return t('operations:sidebar.featureFlags', 'Feature Flags');
    if (s === 'permissions') return t('operations:sidebar.permissionMatrix', 'Permission Matrix');
    if (s === 'delegation') return t('operations:sidebar.managerDelegation', 'Manager Delegation');
    if (s === 'audit-log') return t('operations:sidebar.sensitiveDataAuditLog', 'Sensitive Data Audit Log');
    if (s === 'system') return t('operations:sidebar.systemOverviewDashboard', 'System Overview Dashboard');

    return segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // If items not provided, construct from path segments
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    return pathnames.map((segment, index) => {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`;
      return {
        label: getSegmentLabel(segment, index, pathnames),
        path: index === pathnames.length - 1 ? undefined : path
      };
    });
  })();

  if (breadcrumbItems.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', padding: 'var(--space-2) 0' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-tertiary)' }}>
        <Home size={13} />
      </Link>
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={12} style={{ color: 'var(--border-strong)' }} />
          {item.path ? (
            <Link to={item.path} style={{ color: 'var(--text-secondary)' }}>
              {item.label}
            </Link>
          ) : (
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
