import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import type { RetreatPackage } from '../../data/mockRetreats';
import { formatVND } from '../../i18n';

export interface RetreatCardProps {
  retreat: RetreatPackage;
  basePath?: string; // '/retreats' or '/customer/retreats'
}

export const RetreatCard: React.FC<RetreatCardProps> = ({
  retreat,
  basePath = '/retreats',
}) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'vi' | 'en' | 'zh-CN' | 'ja' | 'fr';

  const name = retreat.names[lang] || retreat.names.en || retreat.names.vi;
  const tagline = retreat.taglines[lang] || retreat.taglines.en || retreat.taglines.vi;
  const summary = retreat.summaries[lang] || retreat.summaries.en || retreat.summaries.vi;
  const villa = retreat.villaName[lang] || retreat.villaName.en || retreat.villaName.vi;

  return (
    <Link to={`${basePath}/${retreat.slug}`} className="hsw-retreat-card" data-cursor="view">
      <span className="hsw-retreat-rim" aria-hidden="true" />
      <div className="hsw-retreat-card-media">
        <img
          src={retreat.heroImage}
          alt={name}
          className="hsw-retreat-card-img"
          loading="lazy"
        />
        <div className="hsw-retreat-badge">
          {retreat.days} {t('labels.days')} · {retreat.nights} {t('labels.nights')}
        </div>
      </div>

      <div className="hsw-retreat-card-body">
        <div className="hsw-retreat-card-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} style={{ color: 'var(--accent-olive)' }} />
            <span>{tagline.split('·')[0].trim()}</span>
          </div>
          <span>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={13} style={{ color: 'var(--accent-olive)' }} />
            <span>{villa}</span>
          </div>
        </div>

        <div>
          <h3 className="hsw-retreat-card-title" style={{ marginBottom: retreat.names.en && retreat.names.en !== name ? '2px' : undefined }}>{name}</h3>
          {retreat.names.en && retreat.names.en !== name && (
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-olive)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              {retreat.names.en}
            </div>
          )}
        </div>

        <p className="hsw-retreat-card-desc">{summary}</p>

        <div className="hsw-retreat-card-footer">
          <div>
            <div className="hsw-retreat-card-price-label">{t('labels.startingFrom')}</div>
            <div className="hsw-retreat-card-price">{formatVND(retreat.startingPrice, i18n.language)}</div>
          </div>

          <div className="hsw-retreat-card-action">
            <span>{t('actions.viewDetails')}</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
};
