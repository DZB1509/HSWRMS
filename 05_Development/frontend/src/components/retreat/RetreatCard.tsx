import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import type { RetreatPackageDto } from '../../api/booking/retreatBookingApi';
import { formatVND } from '../../i18n';

export interface RetreatCardProps {
  retreat: RetreatPackageDto;
  basePath?: string; // '/retreats' or '/customer/retreats'
}

export const RetreatCard: React.FC<RetreatCardProps> = ({
  retreat,
  basePath = '/retreats',
}) => {
  const { t, i18n } = useTranslation();

  const name = retreat.packageName;
  const days = retreat.durationNights + 1;
  const nights = retreat.durationNights;
  const durationLabel = `${days} ${t('labels.days', 'Days')} · ${nights} ${t('labels.nights', 'Nights')}`;
  const villa = retreat.eligibleVillaCategories && retreat.eligibleVillaCategories.length > 0
    ? retreat.eligibleVillaCategories.map((v) => v.categoryName).join(', ')
    : '—';
  const summary = retreat.wellnessGoal || retreat.targetGuest || retreat.includedTreatments || '—';
  const slug = retreat.packageCode.toLowerCase();

  return (
    <Link to={`${basePath}/${slug}`} className="hsw-retreat-card" data-cursor="view">
      <span className="hsw-retreat-rim" aria-hidden="true" />
      <div className="hsw-retreat-card-media">
        <img
          src="/images/hero-resort-cliff.jpg"
          alt={name}
          className="hsw-retreat-card-img"
          loading="lazy"
        />
        <div className="hsw-retreat-badge">
          {days} {t('labels.days', 'Days')} · {nights} {t('labels.nights', 'Nights')}
        </div>
      </div>

      <div className="hsw-retreat-card-body">
        <div className="hsw-retreat-card-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} style={{ color: 'var(--accent-olive)' }} />
            <span>{durationLabel}</span>
          </div>
          <span>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={13} style={{ color: 'var(--accent-olive)' }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
              {villa}
            </span>
          </div>
        </div>

        <div>
          <h3 className="hsw-retreat-card-title">{name}</h3>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-olive)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
            {retreat.packageCode}
          </div>
        </div>

        <p className="hsw-retreat-card-desc">{summary}</p>

        <div className="hsw-retreat-card-footer">
          <div>
            <div className="hsw-retreat-card-price-label">{t('labels.startingFrom', 'Starting from')}</div>
            <div className="hsw-retreat-card-price">{formatVND(retreat.basePrice, i18n.language)}</div>
          </div>

          <div className="hsw-retreat-card-action">
            <span>{t('actions.viewDetails', 'View Journey')}</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
};
