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
    if (s === 'customer') return t('common:roles.customer', 'Khách Hàng');
    if (s === 'receptionist') return t('common:roles.receptionist', 'Lễ Tân');
    if (s === 'therapist') return t('common:roles.therapist', 'Kỹ Thuật Viên');
    if (s === 'manager') return t('operations:sidebar.manager', 'Quản Lý');
    if (s === 'admin') return t('operations:sidebar.admin', 'Quản Trị Viên');

    // Route-aware dashboard labels
    if (s === 'dashboard') {
      if (root === 'customer') return t('customer:nav.dashboard', 'Tổng Quan');
      if (root === 'fb') return t('operations:sidebar.fbDashboard', 'Bảng Điều Hành Ẩm Thực');
      if (root === 'receptionist') return t('operations:sidebar.frontDeskDashboard', 'Bảng Điều Hành Lễ Tân');
      if (root === 'therapist') return t('operations:sidebar.therapistDashboard', 'Bảng Điều Hành Trị Liệu');
      if (root === 'manager') return t('operations:sidebar.managerDashboard', 'Bảng Điều Hành Quản Lý');
      if (root === 'admin') return t('operations:sidebar.adminDashboard', 'Bảng Quản Trị Hệ Thống');
      return t('navigation:nav.dashboard', 'Bảng Điều Khiển');
    }

    // Customer sub-routes
    if (s === 'dining') return t('customer:nav.dining', 'Ẩm Thực');
    if (s === 'spa') return t('customer:nav.spa', 'Spa & Trị Liệu');
    if (s === 'bookings') return t('customer:nav.bookings', 'Lịch Đặt Của Tôi');
    if (s === 'health') return t('customer:nav.healthProfile', 'Hồ Sơ Sức Khỏe');
    if (s === 'folio') return t('customer:nav.folio', 'Hóa Đơn Tạm Tính');
    if (s === 'account') return t('customer:nav.account', 'Cài Đặt Tài Khoản');

    // Dining sub-routes
    if (s === 'menu') return t('dining:menu.title', 'Thực Đơn');
    if (s === 'meal-prep') return t('operations:sidebar.dailyMealPrepQueue', 'Hàng Đợi Chuẩn Bị Món Ăn');
    if (s === 'daily-selection') return t('dining:selection.title', 'Chọn Thực Đơn Hàng Ngày');
    if (s === 'a-la-carte') return t('dining:alacarte.title', 'Gọi Món A-la-carte');
    if (s === 'meal-plan') return t('dining:plan.title', 'Kế Hoạch Dinh Dưỡng');
    if (s === 'orders') return t('dining:plan.extraOrders', 'Đơn Món Ăn');
    if (s === 'allergies') return t('operations:sidebar.mealOrderAllergies', 'Món Ăn & Dị Ứng');

    // Front Desk / Operational sub-routes
    if (s === 'arrivals') return t('operations:sidebar.dailyArrivals', 'Khách Đến Hàng Ngày');
    if (s === 'villas') return t('operations:sidebar.villaManagement', 'Quản Lý Biệt Thự');
    if (s === 'services') return t('operations:sidebar.customerServicesFolio', 'Dịch Vụ Khách & Hóa Đơn');
    if (s === 'extra-spa') return t('operations:sidebar.manualExtraSpa', 'Đặt Thêm Spa Thủ Công');
    if (s === 'checkout') return t('operations:sidebar.finalPaymentCheckout', 'Thanh Toán Cuối & Check-out');

    // Therapist sub-routes
    if (s === 'schedule') return t('operations:sidebar.dailyWorkSchedule', 'Lịch Làm Việc Hàng Ngày');
    if (s === 'sessions' || s === 'notes') return t('operations:sidebar.sessionDetailsNotes', 'Chi Tiết Buổi Trị Liệu & Ghi Chú');

    // Manager / Admin sub-routes
    if (s === 'revenue') return t('operations:sidebar.revenueAnalytics', 'Phân Tích Doanh Thu');
    if (s === 'occupancy') return t('operations:sidebar.occupancyReports', 'Báo Cáo Công Suất Phòng');
    if (s === 'therapist-utilization' || s === 'utilization') return t('operations:sidebar.therapistUtilization', 'Hiệu Suất Kỹ Thuật Viên');
    if (s === 'compliance') return t('operations:sidebar.governanceCompliance', 'Quản Trị & Tuân Thủ');
    if (s === 'police-export') return t('operations:sidebar.systemOverviewPoliceExport', 'Tổng Quan Hệ Thống & Khai Báo Công An');
    if (s === 'staff' || s === 'accounts') return t('operations:sidebar.staffAccounts', 'Tài Khoản Nhân Viên');
    if (s === 'master-data') return t('operations:sidebar.masterDataManagement', 'Quản Lý Dữ Liệu Gốc');
    if (s === 'security') return t('operations:sidebar.securityGovernance', 'Bảo Mật & Quản Trị Quy Định');
    if (s === 'parameters' || s === 'business-params') return t('operations:sidebar.businessParameters', 'Tham Số Nghiệp Vụ');
    if (s === 'flags' || s === 'feature-flags') return t('operations:sidebar.featureFlags', 'Cờ Tính Năng');
    if (s === 'permissions') return t('operations:sidebar.permissionMatrix', 'Ma Trận Phân Quyền (RBAC)');
    if (s === 'delegation') return t('operations:sidebar.managerDelegation', 'Ủy Quyền Cho Quản Lý');
    if (s === 'audit-log') return t('operations:sidebar.sensitiveDataAuditLog', 'Nhật Ký Kiểm Toán Dữ Liệu Nhạy Cảm');
    if (s === 'system' || s === 'system-overview') {
      return t('operations:sidebar.systemOverviewDashboard', 'Tổng Quan Hệ Thống & Khai Báo Công An');
    }

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
