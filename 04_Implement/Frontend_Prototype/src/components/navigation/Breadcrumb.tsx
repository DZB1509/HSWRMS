import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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

  // If items not provided, construct from path segments
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    return pathnames.map((segment, index) => {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`;
      const formatted = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      return {
        label: formatted,
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
