import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCustomer } from '../../context/CustomerContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { Sparkles, Calendar, HeartPulse, Utensils, Receipt, Settings, UserCheck } from 'lucide-react';

export const CustomerNavbar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { profile, activeBooking } = useCustomer();

  const navLinks = [
    { label: t('customer.nav.dashboard', 'Dashboard'), path: '/customer/dashboard', icon: Sparkles },
    { label: t('customer.nav.bookings', 'My Bookings'), path: '/customer/bookings', icon: Calendar },
    { label: t('customer.nav.spa', 'Spa & Therapy'), path: '/customer/spa', icon: HeartPulse },
    { label: t('customer.nav.dining', 'Nourishing Dining'), path: '/customer/dining/menu', icon: Utensils },
    { label: t('customer.nav.healthProfile', 'Wellness Profile'), path: '/customer/health-profile', icon: UserCheck },
    { label: t('customer.nav.folio', 'Stay Folio'), path: '/customer/folio', icon: Receipt },
    { label: t('customer.nav.account', 'Account Settings'), path: '/customer/account', icon: Settings },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="hsw-customer-navbar">
      <div className="hsw-customer-navbar-inner">
        <Link to="/customer/dashboard" className="hsw-brand-logo">
          <Sparkles size={20} style={{ color: 'var(--accent-sand)' }} />
          <div>
            HEAVENSTAY
            <span>{t('customer.nav.portalTitle', 'CUSTOMER PORTAL')}</span>
          </div>
        </Link>

        <nav className="hsw-customer-nav-links" aria-label="Customer portal navigation">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`hsw-customer-nav-link ${isActive ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
              >
                <Icon size={15} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <LanguageSwitcher />

          <Link to="/customer/account" style={{ textDecoration: 'none' }}>
            <div className="hsw-customer-user-badge">
              <div className="hsw-avatar-circle">
                {getInitials(profile.fullName)}
              </div>
              <div style={{ textAlign: 'left' }} className="hsw-customer-user-text">
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {profile.fullName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--accent-olive)' }}>
                  {activeBooking ? `${activeBooking.villaNumber || 'Villa #102'} · Reserved` : 'Sanctuary Member'}
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};
