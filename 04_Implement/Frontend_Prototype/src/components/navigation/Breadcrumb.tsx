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
  const { t } = useTranslation(['common', 'dining', 'operations']);

  const getSegmentLabel = (segment: string): string => {
    const s = segment.toLowerCase();
    if (s === 'fb') return 'F&B';
    if (s === 'customer') return t('common:nav.customer', 'Customer');
    if (s === 'dining') return t('common:nav.dining', 'Dining');
    if (s === 'menu') return t('dining:menu.title', 'Menu');
    if (s === 'meal-prep') return t('operations:fnb.prepList.title', 'Meal Prep Queue');
    if (s === 'daily-selection') return t('dining:selection.title', 'Daily Meal Selection');
    if (s === 'a-la-carte') return t('dining:alacarte.title', 'A-la-carte Order');
    if (s === 'meal-plan') return t('dining:plan.title', 'My Meal Plan');
    if (s === 'orders') return t('dining:plan.extraOrders', 'Orders');
    if (s === 'dashboard') return t('operations:fnb.dashboard.title', 'Dashboard');

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
        label: getSegmentLabel(segment),
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
