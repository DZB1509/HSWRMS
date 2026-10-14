import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Heart, MapPin, Phone, Mail } from 'lucide-react';
import { HeavenStayLogo } from '../common/HeavenStayLogo';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="hsw-footer">
      <div className="hsw-footer-inner">
        <div>
          <div className="hsw-brand-logo" style={{ marginBottom: 'var(--space-3)' }}>
            <HeavenStayLogo variant="public" />
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', maxWidth: '320px', lineHeight: 1.6 }}>
            {t('footer.tagline')}
          </p>
        </div>

        <div>
          <h4 style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
            {t('footer.quickLinks')}
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            <li><Link to="/retreats">{t('nav.retreats')}</Link></li>
            <li><Link to="/#villas">{t('nav.villas')}</Link></li>
            <li><Link to="/#spa">{t('nav.spa')}</Link></li>
            <li><Link to="/#dining">{t('nav.dining')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
            {t('footer.contact')}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <MapPin size={15} style={{ color: 'var(--accent-olive)', flexShrink: 0, marginTop: '2px' }} />
              <span>{t('footer.address')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={15} style={{ color: 'var(--accent-olive)', flexShrink: 0 }} />
              <span>{t('footer.phone')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={15} style={{ color: 'var(--accent-olive)', flexShrink: 0 }} />
              <span>{t('footer.email')}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
            {t('footer.wellness')}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} style={{ color: 'var(--accent-olive)' }} />
              <span>{t('footer.dataProtection')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Heart size={16} style={{ color: 'var(--accent-olive)' }} />
              <span>{t('footer.wellnessCare')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hsw-footer-bottom">
        <div>
          © 2026 HeavenStay Wellness Resort (HSWRMS). {t('footer.rights')}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <span>{t('footer.privacy')}</span>
          <span>{t('footer.terms')}</span>
        </div>
      </div>
    </footer>
  );
};
