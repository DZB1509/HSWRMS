import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCustomer } from '../../context/CustomerContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { Sparkles, Calendar, HeartPulse, Utensils, Receipt, Settings, UserCheck, CalendarCheck, Coffee, ListOrdered } from 'lucide-react';

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

            if (link.path === '/customer/spa') {
              return (
                <div key={link.path} className="hsw-nav-dropdown-wrapper">
                  <Link
                    to={link.path}
                    className={`hsw-customer-nav-link ${isActive ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                    id="nav-link-customer-spa"
                  >
                    <Icon size={15} />
                    <span>{link.label}</span>
                  </Link>
                  <div className="hsw-nav-dropdown">
                    <Link to="/customer/spa" className={`hsw-nav-dropdown-item ${location.pathname === '/customer/spa' ? 'active' : ''}`}>
                      <Sparkles size={14} />
                      <span>{t('spa.navCatalogue', 'Treatment Catalogue')}</span>
                    </Link>
                    <Link to="/customer/spa/sessions" className={`hsw-nav-dropdown-item ${location.pathname === '/customer/spa/sessions' ? 'active' : ''}`} id="nav-dropdown-my-sessions">
                      <CalendarCheck size={14} />
                      <span>{t('spa.mySessions', 'My Spa Sessions')}</span>
                    </Link>
                  </div>
                </div>
              );
            }

            if (link.path === '/customer/dining/menu') {
              return (
                <div key={link.path} className="hsw-nav-dropdown-wrapper">
                  <Link
                    to={link.path}
                    className={`hsw-customer-nav-link ${isActive ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                  >
                    <Icon size={15} />
                    <span>{link.label}</span>
                  </Link>
                  <div className="hsw-nav-dropdown">
                    <Link to="/customer/dining/menu" className={`hsw-nav-dropdown-item ${location.pathname === '/customer/dining/menu' ? 'active' : ''}`}>
                      <Utensils size={14} />
                      <span>{t('dining.navMenu', 'Dietary Menu')}</span>
                    </Link>
                    <Link to="/customer/dining/select" className={`hsw-nav-dropdown-item ${location.pathname === '/customer/dining/select' ? 'active' : ''}`}>
                      <CalendarCheck size={14} />
                      <span>{t('dining.navSelect', 'Daily Meal Selection')}</span>
                    </Link>
                    <Link to="/customer/dining/extra" className={`hsw-nav-dropdown-item ${location.pathname === '/customer/dining/extra' ? 'active' : ''}`}>
                      <Coffee size={14} />
                      <span>{t('dining.navExtra', 'A-la-carte')}</span>
                    </Link>
                    <Link to="/customer/dining/orders" className={`hsw-nav-dropdown-item ${location.pathname === '/customer/dining/orders' ? 'active' : ''}`}>
                      <ListOrdered size={14} />
                      <span>{t('dining.navOrders', 'My Meal Plan / Orders')}</span>
                    </Link>
                  </div>
                </div>
              );
            }

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
