import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Container } from '../../components/common/Container';
import { SectionHeading } from '../../components/common/SectionHeading';
import { RetreatCard } from '../../components/retreat/RetreatCard';
import { RevealOnScroll } from '../../components/motion/RevealOnScroll';
import { getRetreatPackages, type RetreatPackageDto } from '../../api/booking/retreatBookingApi';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

export const RetreatListPage: React.FC = () => {
  const { t } = useTranslation();
  const [filterDuration, setFilterDuration] = useState<number | 'all'>('all');
  const [packages, setPackages] = useState<RetreatPackageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const dtos: RetreatPackageDto[] = await getRetreatPackages();
      setPackages(dtos);
    } catch (err: any) {
      console.error('Failed to load packages from backend:', err);
      setError(err?.message || 'Could not load retreat packages from SQL Server backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const filteredRetreats = packages.filter((pkg) => {
    if (filterDuration === 'all') return true;
    return (pkg.durationNights + 1) === filterDuration;
  });

  return (
    <div className="hsw-retreat-list-page" style={{ padding: 'var(--space-12) 0 var(--space-16)' }}>
      <Container size="standard">
        {/* Header with breadcrumb hint & editorial heading */}
        <RevealOnScroll>
          <SectionHeading
            badge={t('retreat.list.badge', 'Curated Journeys')}
            title={t('retreat.list.title', 'Holistic Wellness Retreats')}
            subtitle={t('retreat.list.subtitle', 'All-inclusive immersive stays integrating restorative therapies, organic nutrition, and meditative luxury.')}
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
              {t('retreat.list.filterAll', 'All Journeys')}
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
              {t('retreat.list.filterShort', '3 Days · Mini Retreat')}
            </button>

            <button
              type="button"
              onClick={() => setFilterDuration(4)}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                border: filterDuration === 4 ? '1px solid var(--accent-forest)' : '1px solid var(--border-subtle)',
                backgroundColor: filterDuration === 4 ? 'var(--accent-forest)' : '#ffffff',
                color: filterDuration === 4 ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
            >
              {t('retreat.list.filterFourDays', '4 Days · Restoration')}
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
              {t('retreat.list.filterMedium', '5 Days · Rebalance')}
            </button>
          </div>
        </RevealOnScroll>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
            <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-forest)', margin: '0 auto var(--space-4)' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              Loading retreat packages from SQL Server...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div
            style={{
              padding: 'var(--space-8)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(185, 28, 28, 0.05)',
              border: '1px solid rgba(185, 28, 28, 0.2)',
              textAlign: 'center',
              maxWidth: '560px',
              margin: '0 auto var(--space-12)',
            }}
          >
            <AlertCircle size={32} style={{ color: '#b91c1c', margin: '0 auto var(--space-3)' }} />
            <h3 style={{ fontSize: 'var(--text-base)', color: '#b91c1c', marginBottom: 'var(--space-2)' }}>
              Failed to connect to backend
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={fetchPackages}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--accent-forest)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Package Grid */}
        {!loading && !error && filteredRetreats.length > 0 && (
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
              <RevealOnScroll key={retreat.retreatPackageId} delayMs={idx * 100} className="hsw-retreat-grid-item">
                <RetreatCard retreat={retreat} />
              </RevealOnScroll>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredRetreats.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-12) 0', color: 'var(--text-secondary)' }}>
            <p>{t('retreat.list.noPackagesFound', 'No retreat packages found in SQL Server database matching the selected duration.')}</p>
          </div>
        )}
      </Container>
    </div>
  );
};
