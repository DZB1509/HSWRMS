import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../common/Button';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { Sparkles, Menu, X, ArrowRight, LayoutDashboard, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../app/providers/AuthProvider';
import { useCustomer } from '../../context/CustomerContext';

interface PublicNavbarProps {
  isHeroMode?: boolean;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ isHeroMode = false }) => {
  const { t } = useTranslation(['common', 'navigation', 'operations']);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, role, isAuthenticated, logout } = useAuth();
  const { profile, activeBooking } = useCustomer();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const isCustomer = isAuthenticated && role === 'customer';

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = () => {
    logout();
    setProfileDropdownOpen(false);
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // check initial state
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileDropdownOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (profileDropdownOpen) setProfileDropdownOpen(false);
        if (mobileMenuOpen) setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [profileDropdownOpen, mobileMenuOpen]);

  // Mobile body scroll lock
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: t('navigation:nav.retreats', 'Retreats'), path: '/retreats' },
    { label: t('navigation:nav.villas', 'Villas & Spaces'), path: '/retreats' },
    { label: t('navigation:nav.spa', 'Spa & Wellness'), path: '/retreats' },
    { label: t('navigation:nav.dining', 'Nourishing Dining'), path: '/retreats' },
  ];

  const heroActive = isHeroMode && !isScrolled;

  const classNames = [
    'hsw-public-navbar',
    isHeroMode ? 'is-hero-mode' : '',
    isScrolled ? 'is-scrolled' : '',
  ].filter(Boolean).join(' ');

  return (
    <header className={classNames}>
      <div className="hsw-public-navbar-inner">
        <Link to="/" className="hsw-brand-logo" aria-label="HeavenStay Home">
          <Sparkles size={20} className="hsw-brand-icon" style={{ color: heroActive ? '#ffffff' : 'var(--accent-sand)', flexShrink: 0 }} />
          <div className="hsw-brand-text">
            <span className="hsw-brand-name">HEAVENSTAY</span>
            <span className="hsw-brand-tagline" style={heroActive ? { color: 'rgba(255,255,255,0.7)' } : undefined}>WELLNESS RESORT</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hsw-public-nav-links" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`hsw-public-nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Action Controls & Language Switcher */}
        <div className="hsw-navbar-actions">
          <LanguageSwitcher variant={heroActive ? 'light' : 'dark'} />

          {isCustomer ? (
            <div
              className={`hsw-nav-dropdown-wrapper ${profileDropdownOpen ? 'is-open' : ''} hide-on-mobile`}
              ref={profileMenuRef}
              style={{ position: 'relative' }}
            >
              <button
                type="button"
                className="hsw-customer-user-badge hsw-profile-btn"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
                aria-label="Customer profile menu"
                style={{
                  background: heroActive ? 'rgba(255, 255, 255, 0.16)' : 'var(--bg-soft)',
                  borderColor: heroActive ? 'rgba(255, 255, 255, 0.35)' : 'var(--border-subtle)',
                  color: heroActive ? '#ffffff' : 'var(--text-primary)',
                  backdropFilter: heroActive ? 'blur(8px)' : undefined,
                }}
              >
                <div
                  className="hsw-avatar-circle"
                  style={heroActive ? { backgroundColor: 'var(--accent-sand)', color: '#2B2B2B' } : undefined}
                >
                  {getInitials(profile.fullName || currentUser?.name || 'EV')}
                </div>
                <div className="hsw-customer-user-text" style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: heroActive ? '#ffffff' : 'var(--text-primary)' }}>
                    {profile.fullName || currentUser?.name || 'Eleanor Vance'}
                  </div>
                  <div style={{ fontSize: '11px', color: heroActive ? 'rgba(255, 255, 255, 0.8)' : 'var(--accent-olive)' }}>
                    {activeBooking ? `${activeBooking.villaNumber || 'Villa #102'} · Reserved` : 'Sanctuary Member'}
                  </div>
                </div>
                <ChevronDown
                  size={14}
                  style={{
                    color: heroActive ? 'rgba(255, 255, 255, 0.8)' : 'var(--text-secondary)',
                    transition: 'transform 0.2s ease',
                    transform: profileDropdownOpen ? 'rotate(180deg)' : 'none',
                  }}
                />
              </button>

              <div
                className="hsw-nav-dropdown"
                role="menu"
                aria-label="Customer account menu"
                style={{
                  right: 0,
                  left: 'auto',
                  minWidth: '220px',
                  display: profileDropdownOpen ? 'flex' : undefined,
                  opacity: profileDropdownOpen ? 1 : undefined,
                  visibility: profileDropdownOpen ? 'visible' : undefined,
                  transform: profileDropdownOpen ? 'translateY(0)' : undefined,
                }}
              >
                <Link
                  to="/customer/dashboard"
                  className="hsw-nav-dropdown-item"
                  role="menuitem"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <LayoutDashboard size={15} />
                  <span>{t('navigation:nav.dashboard', 'Dashboard')}</span>
                </Link>
                <Link
                  to="/customer/account"
                  className="hsw-nav-dropdown-item"
                  role="menuitem"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <Settings size={15} />
                  <span>{t('navigation:nav.accountSettings', 'Account Settings')}</span>
                </Link>
                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />
                <button
                  type="button"
                  className="hsw-nav-dropdown-item"
                  role="menuitem"
                  onClick={handleSignOut}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    color: 'var(--danger, #a24b43)',
                  }}
                >
                  <LogOut size={15} />
                  <span>{t('common:actions.signOut', 'Sign Out')}</span>
                </button>
              </div>
            </div>
          ) : isAuthenticated && role ? (
            /* Role safety: staff logged in on public landing */
            <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link to={`/${role === 'fb_staff' ? 'fb' : role}/dashboard`}>
                <Button variant="secondary" size="sm">
                  {t('operations:sidebar.operationalSuite', 'Staff Portal')}
                </Button>
              </Link>
              <Button
                variant="tertiary"
                size="sm"
                onClick={handleSignOut}
                aria-label={t('common:actions.signOut', 'Sign Out')}
              >
                <LogOut size={16} />
              </Button>
            </div>
          ) : (
            /* Visitor / unauthenticated */
            <Link to="/login" className="hide-on-mobile">
              <Button
                variant="tertiary"
                size="sm"
                style={heroActive ? { color: 'rgba(255,255,255,0.9)' } : undefined}
              >
                {t('common:actions.signIn', 'Sign In')}
              </Button>
            </Link>
          )}

          <Link to="/retreats" className="hide-on-mobile">
            <Button
              variant="primary"
              size="sm"
              style={heroActive ? { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', color: '#ffffff' } : undefined}
            >
              {t('common:actions.bookRetreat', 'Book Retreat')}
            </Button>
          </Link>

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            className="hsw-mobile-nav-toggle show-on-mobile"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="hsw-mobile-drawer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          id="hsw-mobile-drawer"
          className="hsw-mobile-drawer"
          role="dialog"
          aria-label="Mobile Navigation Menu"
        >
          <div>
            <div className="hsw-mobile-drawer-header">
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--accent-olive)', fontWeight: 600 }}>
                HeavenStay Sanctuary
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                Hòa Lạc, Hà Nội
              </span>
            </div>

            {isCustomer && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-soft)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="hsw-avatar-circle">
                  {getInitials(profile.fullName || currentUser?.name || 'EV')}
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {profile.fullName || currentUser?.name || 'Eleanor Vance'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--accent-olive)' }}>
                    {activeBooking ? `${activeBooking.villaNumber || 'Villa #102'} · Reserved` : 'Sanctuary Member'}
                  </div>
                </div>
              </div>
            )}

            <nav className="hsw-mobile-nav-links">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  className="hsw-mobile-nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{link.label}</span>
                  <ArrowRight size={16} style={{ color: 'var(--accent-olive)', opacity: 0.7 }} />
                </Link>
              ))}
            </nav>
          </div>

          <div className="hsw-mobile-nav-actions">
            <Link to="/retreats" style={{ width: '100%' }} onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant="primary"
                size="lg"
                style={{
                  width: '100%',
                  backgroundColor: 'var(--accent-forest)',
                  color: '#ffffff',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(79, 90, 80, 0.25)',
                }}
              >
                {t('common:actions.bookRetreat', 'Book Retreat')}
              </Button>
            </Link>

            {isCustomer ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '6px' }}>
                <Link to="/customer/dashboard" style={{ width: '100%' }} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" size="md" style={{ width: '100%' }}>
                    <LayoutDashboard size={16} style={{ marginRight: '6px' }} />
                    {t('navigation:nav.dashboard', 'Dashboard')}
                  </Button>
                </Link>
                <Link to="/customer/account" style={{ width: '100%' }} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="tertiary" size="md" style={{ width: '100%' }}>
                    <Settings size={16} style={{ marginRight: '6px' }} />
                    {t('navigation:nav.accountSettings', 'Account Settings')}
                  </Button>
                </Link>
                <Button
                  variant="tertiary"
                  size="md"
                  style={{ width: '100%', color: 'var(--danger, #a24b43)' }}
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut size={16} style={{ marginRight: '6px' }} />
                  {t('common:actions.signOut', 'Sign Out')}
                </Button>
              </div>
            ) : isAuthenticated && role ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '6px' }}>
                <Link to={`/${role === 'fb_staff' ? 'fb' : role}/dashboard`} style={{ width: '100%' }} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" size="md" style={{ width: '100%' }}>
                    {t('operations:sidebar.operationalSuite', 'Staff Portal')}
                  </Button>
                </Link>
                <Button
                  variant="tertiary"
                  size="md"
                  style={{ width: '100%', color: 'var(--danger, #a24b43)' }}
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut size={16} style={{ marginRight: '6px' }} />
                  {t('common:actions.signOut', 'Sign Out')}
                </Button>
              </div>
            ) : (
              <Link to="/login" style={{ width: '100%' }} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" size="md" style={{ width: '100%' }}>
                  {t('common:actions.signIn', 'Sign In')}
                </Button>
              </Link>
            )}

            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '4px' }}>
              +84 (0) 987 464 904 · sanctuary@heavenstay.com
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
