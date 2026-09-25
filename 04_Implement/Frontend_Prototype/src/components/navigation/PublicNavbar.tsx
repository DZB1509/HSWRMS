import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../common/Button';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { Sparkles, Menu, X, ArrowRight } from 'lucide-react';

interface PublicNavbarProps {
  isHeroMode?: boolean;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ isHeroMode = false }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // check initial state
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change & handle escape key
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: t('nav.retreats'), path: '/retreats' },
    { label: t('nav.villas'), path: '/retreats' },
    { label: t('nav.spa'), path: '/retreats' },
    { label: t('nav.dining'), path: '/retreats' },
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
        <Link to="/" className="hsw-brand-logo" aria-label="HeavenStay Wellness Resort Homepage">
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

          <Link to="/login" className="hide-on-mobile">
            <Button
              variant="tertiary"
              size="sm"
              style={heroActive ? { color: 'rgba(255,255,255,0.9)' } : undefined}
            >
              {t('actions.signIn')}
            </Button>
          </Link>

          <Link to="/retreats" className="hide-on-mobile">
            <Button
              variant="primary"
              size="sm"
              style={heroActive ? { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', color: '#ffffff' } : undefined}
            >
              {t('actions.bookRetreat')}
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
                {t('actions.bookRetreat')}
              </Button>
            </Link>
            <Link to="/login" style={{ width: '100%' }} onClick={() => setMobileMenuOpen(false)}>
              <Button variant="secondary" size="md" style={{ width: '100%' }}>
                {t('actions.signIn')}
              </Button>
            </Link>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '4px' }}>
              +84 (0) 987 464 904 · sanctuary@heavenstay.com
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
