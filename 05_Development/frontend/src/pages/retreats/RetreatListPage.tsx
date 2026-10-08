import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container } from '../../components/common/Container';
import { SectionHeading } from '../../components/common/SectionHeading';
import { RetreatCard } from '../../components/retreat/RetreatCard';
import { RevealOnScroll } from '../../components/motion/RevealOnScroll';
import { MOCK_RETREAT_PACKAGES } from '../../data/mockRetreats';

export const RetreatListPage: React.FC = () => {
  const { t } = useTranslation();
  const [filterDuration, setFilterDuration] = useState<number | 'all'>('all');

  const filteredRetreats = MOCK_RETREAT_PACKAGES.filter((pkg) => {
    if (filterDuration === 'all') return true;
    return pkg.days === filterDuration;
  });

  return (
    <div className="hsw-retreat-list-page" style={{ padding: 'var(--space-12) 0 var(--space-16)' }}>
      <Container size="standard">
        {/* Header with breadcrumb hint & editorial heading */}
        <RevealOnScroll>
          <SectionHeading
            badge={t('retreat.list.badge')}
            title={t('retreat.list.title')}
            subtitle={t('retreat.list.subtitle')}
            alignment="center"
          />

          {/* Filter Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-3)',
              flexWrap: 'wrap',
              marginBottom: 'var(--space-12)',
            }}
          >
            <button
              type="button"
              onClick={() => setFilterDuration('all')}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                border: filterDuration === 'all' ? '1px solid var(--accent-forest)' : '1px solid var(--border-subtle)',
                backgroundColor: filterDuration === 'all' ? 'var(--accent-forest)' : '#ffffff',
                color: filterDuration === 'all' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
            >
              {t('retreat.list.filterAll')}
            </button>

            <button
              type="button"
              onClick={() => setFilterDuration(3)}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                border: filterDuration === 3 ? '1px solid var(--accent-forest)' : '1px solid var(--border-subtle)',
                backgroundColor: filterDuration === 3 ? 'var(--accent-forest)' : '#ffffff',
                color: filterDuration === 3 ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
            >
              {t('retreat.list.filterShort')}
            </button>

            <button
              type="button"
              onClick={() => setFilterDuration(5)}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                border: filterDuration === 5 ? '1px solid var(--accent-forest)' : '1px solid var(--border-subtle)',
                backgroundColor: filterDuration === 5 ? 'var(--accent-forest)' : '#ffffff',
                color: filterDuration === 5 ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
            >
              {t('retreat.list.filterMedium')}
            </button>

            <button
              type="button"
              onClick={() => setFilterDuration(7)}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                border: filterDuration === 7 ? '1px solid var(--accent-forest)' : '1px solid var(--border-subtle)',
                backgroundColor: filterDuration === 7 ? 'var(--accent-forest)' : '#ffffff',
                color: filterDuration === 7 ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
            >
              {t('retreat.list.filterLong')}
            </button>
          </div>
        </RevealOnScroll>

        {/* Package Grid */}
        <div
          className="hsw-retreat-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: 'var(--space-8)',
            alignItems: 'stretch',
          }}
        >
          {filteredRetreats.map((retreat, idx) => (
            <RevealOnScroll key={retreat.id} delayMs={idx * 100} className="hsw-retreat-grid-item">
              <RetreatCard retreat={retreat} />
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </div>
  );
};
