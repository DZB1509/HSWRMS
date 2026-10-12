import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCustomer } from '../../context/CustomerContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ThemeToggle } from '../common/ThemeToggle';
import { CursorEffectToggle } from '../common/CursorEffectToggle';
import { HeavenStayLogo } from '../common/HeavenStayLogo';
import {
  Sparkles,
  Calendar,
  HeartPulse,
  Utensils,
  Receipt,
  Settings,
  UserCheck,
  CalendarCheck,
  Coffee,
  ListOrdered,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';

export const CustomerNavbar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { profile, activeBooking } = useCustomer();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown on location change
  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isSpaActive = location.pathname.startsWith('/customer/spa');
  const isDiningActive = location.pathname.startsWith('/customer/dining');
  const isProfileActive = location.pathname === '/customer/health-profile';
  const isFolioActive = location.pathname === '/customer/folio';
  const isAccountActive = location.pathname === '/customer/account';
  const isMoreActive = isProfileActive || isFolioActive || isAccountActive;

  return (
    <header className="hsw-customer-navbar" ref={navRef}>
      <div className="hsw-customer-navbar-inner">
        {/* Zone 1: Brand Area (Protected, flex-shrink: 0) */}
        <div className="hsw-customer-brand-zone">
          <Link to="/" className="hsw-brand-logo" aria-label="HeavenStay Cổng Khách Hàng">
            <HeavenStayLogo variant="customer" />
          </Link>
        </div>

        {/* Zone 2: Main Navigation (Flexible space, min-width: 0) */}
        <nav className="hsw-customer-nav-links hsw-customer-nav-zone" aria-label="Customer portal navigation">
          {/* Dashboard */}
          <Link
            to="/customer/dashboard"
            className={`hsw-customer-nav-link ${location.pathname === '/customer/dashboard' ? 'active' : ''}`}
          >
            <Sparkles size={15} />
            <span>{t('customer.nav.dashboard', 'Dashboard')}</span>
          </Link>

          {/* My Bookings */}
          <Link
            to="/customer/bookings"
            className={`hsw-customer-nav-link ${location.pathname.startsWith('/customer/bookings') ? 'active' : ''}`}
          >
            <Calendar size={15} />
            <span>{t('customer.nav.bookings', 'My Bookings')}</span>
          </Link>

          {/* Spa & Therapy Dropdown */}
          <div className={`hsw-nav-dropdown-wrapper ${openDropdown === 'spa' ? 'is-open' : ''}`}>
            <button
              type="button"
              className={`hsw-customer-nav-link hsw-dropdown-btn ${isSpaActive ? 'active' : ''}`}
              onClick={(e) => toggleDropdown('spa', e)}
              aria-expanded={openDropdown === 'spa'}
              aria-haspopup="true"
              id="nav-link-customer-spa"
            >
              <HeartPulse size={15} />
              <span>{t('customer.nav.spa', 'Spa & Therapy')}</span>
              <ChevronDown size={12} className="hsw-dropdown-chevron" />
            </button>
            <div className="hsw-nav-dropdown" role="menu">
              <Link
                to="/customer/spa"
                className={`hsw-nav-dropdown-item ${location.pathname === '/customer/spa' ? 'active' : ''}`}
                role="menuitem"
                onClick={() => setOpenDropdown(null)}
              >
                <Sparkles size={14} />
                <span>{t('spa.navCatalogue', 'Treatment Catalogue')}</span>
              </Link>
              <Link
                to="/customer/spa/sessions"
                className={`hsw-nav-dropdown-item ${location.pathname === '/customer/spa/sessions' ? 'active' : ''}`}
                id="nav-dropdown-my-sessions"
                role="menuitem"
                onClick={() => setOpenDropdown(null)}
              >
                <CalendarCheck size={14} />
                <span>{t('spa.mySessions', 'My Spa Sessions')}</span>
              </Link>
            </div>
          </div>

          {/* Nourishing Dining Dropdown */}
          <div className={`hsw-nav-dropdown-wrapper ${openDropdown === 'dining' ? 'is-open' : ''}`}>
            <button
              type="button"
              className={`hsw-customer-nav-link hsw-dropdown-btn ${isDiningActive ? 'active' : ''}`}
              onClick={(e) => toggleDropdown('dining', e)}
              aria-expanded={openDropdown === 'dining'}
              aria-haspopup="true"
              id="nav-link-customer-dining"
            >
              <Utensils size={15} />
              <span>{t('customer.nav.dining', 'Nourishing Dining')}</span>
              <ChevronDown size={12} className="hsw-dropdown-chevron" />
            </button>
            <div className="hsw-nav-dropdown" role="menu">
              <Link
                to="/customer/dining/menu"
                className={`hsw-nav-dropdown-item ${location.pathname === '/customer/dining/menu' ? 'active' : ''}`}
                role="menuitem"
                onClick={() => setOpenDropdown(null)}
              >
                <Utensils size={14} />
                <span>{t('dining.navMenu', 'Dietary Menu')}</span>
              </Link>
              <Link
                to="/customer/dining/select"
                className={`hsw-nav-dropdown-item ${location.pathname === '/customer/dining/select' ? 'active' : ''}`}
                role="menuitem"
                onClick={() => setOpenDropdown(null)}
              >
                <CalendarCheck size={14} />
                <span>{t('dining.navSelect', 'Daily Meal Selection')}</span>
              </Link>
              <Link
                to="/customer/dining/extra"
                className={`hsw-nav-dropdown-item ${location.pathname === '/customer/dining/extra' ? 'active' : ''}`}
                role="menuitem"
                onClick={() => setOpenDropdown(null)}
              >
                <Coffee size={14} />
                <span>{t('dining.navExtra', 'A-la-carte')}</span>
              </Link>
              <Link
                to="/customer/dining/orders"
                className={`hsw-nav-dropdown-item ${location.pathname === '/customer/dining/orders' ? 'active' : ''}`}
                role="menuitem"
                onClick={() => setOpenDropdown(null)}
              >
                <ListOrdered size={14} />
                <span>{t('dining.navOrders', 'My Meal Plan / Orders')}</span>
              </Link>
            </div>
          </div>

          {/* Wellness Profile (Wide desktop only) */}
          <Link
            to="/customer/health-profile"
            className={`hsw-customer-nav-link hsw-nav-desktop-wide-only ${isProfileActive ? 'active' : ''}`}
          >
            <UserCheck size={15} />
            <span>{t('customer.nav.healthProfile', 'Wellness Profile')}</span>
          </Link>

          {/* Stay Folio (Wide desktop only) */}
          <Link
            to="/customer/folio"
            className={`hsw-customer-nav-link hsw-nav-desktop-wide-only ${isFolioActive ? 'active' : ''}`}
          >
            <Receipt size={15} />
            <span>{t('customer.nav.folio', 'Stay Folio')}</span>
          </Link>

          {/* More / Overflow dropdown */}
          <div className={`hsw-nav-dropdown-wrapper hsw-nav-more-wrapper ${openDropdown === 'more' ? 'is-open' : ''}`}>
            <button
              type="button"
              className={`hsw-customer-nav-link hsw-dropdown-btn ${isMoreActive ? 'active' : ''}`}
              onClick={(e) => toggleDropdown('more', e)}
              aria-expanded={openDropdown === 'more'}
              aria-haspopup="true"
              id="nav-link-customer-more"
            >
              <MoreHorizontal size={15} />
              <span>{t('customer.nav.more', 'More')}</span>
              <ChevronDown size={12} className="hsw-dropdown-chevron" />
            </button>
            <div className="hsw-nav-dropdown" role="menu">
              <Link
                to="/customer/health-profile"
                className={`hsw-nav-dropdown-item ${isProfileActive ? 'active' : ''}`}
                role="menuitem"
                onClick={() => setOpenDropdown(null)}
              >
                <UserCheck size={14} />
                <span>{t('customer.nav.healthProfile', 'Wellness Profile')}</span>
              </Link>
              <Link
                to="/customer/folio"
                className={`hsw-nav-dropdown-item ${isFolioActive ? 'active' : ''}`}
                role="menuitem"
                onClick={() => setOpenDropdown(null)}
              >
                <Receipt size={14} />
                <span>{t('customer.nav.folio', 'Stay Folio')}</span>
              </Link>
              <Link
                to="/customer/account"
                className={`hsw-nav-dropdown-item ${isAccountActive ? 'active' : ''}`}
                role="menuitem"
                onClick={() => setOpenDropdown(null)}
              >
                <Settings size={14} />
                <span>{t('customer.nav.account', 'Account Settings')}</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Right Controls: Global Preferences (Language | Theme | Cursor FX) & Profile */}
        <div className="hsw-customer-actions">
          {/* Zone 3: Global Preferences */}
          <div className="hsw-customer-lang-zone" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LanguageSwitcher />
            <ThemeToggle />
            <CursorEffectToggle />
          </div>

          {/* Zone 4: Customer Profile */}
          <div className="hsw-customer-profile-zone">
            <Link to="/customer/account" style={{ textDecoration: 'none' }} aria-label="Customer account and settings">
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
      </div>
    </header>
  );
};
