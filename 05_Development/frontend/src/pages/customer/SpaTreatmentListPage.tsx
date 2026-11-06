/**
 * Screen #25 — Spa Treatment List
 * Customer-facing catalogue of available spa/therapy treatments.
 * Shows treatments included in retreat + extras available for purchase.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSpa } from '../../context/SpaContext';
import {
  Sparkles,
  Clock,
  Star,
  Leaf,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Heart,
  Shield,
  CalendarCheck,
  RotateCcw,
} from 'lucide-react';
import type { TreatmentCategory, LocalizedString, SpaTreatment } from '../../types/spa';
import { useSpaTreatments } from '../../features/m3-spa/hooks/useSpaFeature';
import { SPA_TREATMENTS_INVENTORY } from '../../data/mockSpaInventory';
import {
  resolveSpaTreatmentLocalized,
  resolveSpaTreatmentDescriptionLocalized,
  resolveSpaTreatmentCategory,
} from '../../i18n/dynamicContent';

const CATEGORY_FILTERS: { key: TreatmentCategory | 'all'; labelKey: string; defaultLabel: string; icon: React.ReactNode }[] = [
  { key: 'all', labelKey: 'spa.categories.all', defaultLabel: 'All Treatments', icon: <Sparkles size={16} /> },
  { key: 'massage', labelKey: 'spa.categories.massage', defaultLabel: 'Massage', icon: <Heart size={16} /> },
  { key: 'facial', labelKey: 'spa.categories.facial', defaultLabel: 'Facial', icon: <Star size={16} /> },
  { key: 'hydrotherapy', labelKey: 'spa.categories.hydrotherapy', defaultLabel: 'Hydrotherapy', icon: <Leaf size={16} /> },
  { key: 'yoga', labelKey: 'spa.categories.yoga', defaultLabel: 'Yoga', icon: <Shield size={16} /> },
  { key: 'meditation', labelKey: 'spa.categories.meditation', defaultLabel: 'Meditation', icon: <Sparkles size={16} /> },
  { key: 'body_wrap', labelKey: 'spa.categories.bodyWrap', defaultLabel: 'Body Wrap', icon: <Leaf size={16} /> },
  { key: 'aromatherapy', labelKey: 'spa.categories.aromatherapy', defaultLabel: 'Aromatherapy', icon: <Heart size={16} /> },
];

/**
 * Maps a treatment's raw category or attributes to one or more customer filter category keys:
 * 'massage' | 'facial' | 'hydrotherapy' | 'yoga' | 'meditation' | 'body_wrap' | 'aromatherapy'
 */
export function matchesTreatmentCategoryFilter(treatment: SpaTreatment, filterKey: TreatmentCategory | 'all'): boolean {
  if (filterKey === 'all') return true;

  const rawCat = (treatment.category || '').toLowerCase();
  const nameEn = (treatment.name?.en || '').toLowerCase();
  const nameVi = (treatment.name?.vi || '').toLowerCase();

  // 1. Exact match with filterKey
  if (rawCat === filterKey) return true;

  switch (filterKey) {
    case 'massage':
      return (
        rawCat.includes('massage') ||
        rawCat.includes('traditional') ||
        rawCat.includes('detox therapy') ||
        rawCat.includes('maternal') ||
        rawCat.includes('holistic detox') ||
        rawCat.includes('herbal therapy') ||
        nameEn.includes('massage') ||
        nameEn.includes('acupressure') ||
        nameEn.includes('compress') ||
        nameVi.includes('massage') ||
        nameVi.includes('bấm huyệt')
      );

    case 'facial':
      return (
        rawCat.includes('facial') ||
        nameEn.includes('facial') ||
        nameEn.includes('guasha') ||
        nameEn.includes('collagen') ||
        nameEn.includes('hydration') ||
        nameVi.includes('mặt') ||
        nameVi.includes('guasha') ||
        nameVi.includes('collagen')
      );

    case 'hydrotherapy':
      return (
        rawCat.includes('hydro') ||
        nameEn.includes('vichy') ||
        (nameEn.includes('bath') && !nameEn.includes('sound')) ||
        nameVi.includes('thủy trị liệu') ||
        nameVi.includes('ngâm bồn') ||
        nameVi.includes('tắm thảo dược')
      );

    case 'yoga':
      return (
        rawCat.includes('yoga') ||
        rawCat.includes('movement') ||
        nameEn.includes('yoga') ||
        nameEn.includes('pranayama') ||
        nameVi.includes('yoga')
      );

    case 'meditation':
      return (
        rawCat.includes('mindfulness') ||
        rawCat.includes('energy healing') ||
        rawCat.includes('meditation') ||
        nameEn.includes('meditation') ||
        nameEn.includes('sound bath') ||
        nameEn.includes('pranayama') ||
        nameVi.includes('thiền') ||
        nameVi.includes('chuông xoay')
      );

    case 'body_wrap':
      return (
        rawCat.includes('wrap') ||
        rawCat.includes('scrub') ||
        nameEn.includes('wrap') ||
        nameEn.includes('scrub') ||
        nameEn.includes('polish') ||
        nameVi.includes('quấn') ||
        nameVi.includes('ủ khoáng') ||
        nameVi.includes('tẩy tế bào chết')
      );

    case 'aromatherapy':
      return (
        rawCat.includes('aroma') ||
        rawCat.includes('herbal') ||
        rawCat.includes('ayurveda') ||
        nameEn.includes('aromatherapy') ||
        nameEn.includes('shirodhara') ||
        nameEn.includes('compress') ||
        nameEn.includes('red dao') ||
        nameVi.includes('thảo dược') ||
        nameVi.includes('oải hương') ||
        nameVi.includes('dao đỏ') ||
        nameVi.includes('nhỏ dầu')
      );

    default:
      return false;
  }
}

export const SpaTreatmentListPage: React.FC = () => {
  const { t, i18n } = useTranslation('customer');
  const { treatments: fallbackTreatments } = useSpa();
  const { treatments: backendTreatments } = useSpaTreatments();
  const navigate = useNavigate();

  const currentLang = (i18n.language || 'en') as keyof LocalizedString;
  const localize = (ls?: LocalizedString | null): string => {
    if (!ls) return '';
    if (typeof ls === 'string') return ls;
    return ls[currentLang] || ls.en || Object.values(ls)[0] || '';
  };

  const [activeCategory, setActiveCategory] = useState<TreatmentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Map backend treatments to UI model, with authentic 5-language localization
  const activeTreatments: SpaTreatment[] = useMemo(() => {
    if (backendTreatments && backendTreatments.length > 0) {
      return backendTreatments.map((bt, idx) => {
        const trtId = bt.treatmentId || (idx + 1);
        const trtCode = (bt as any).treatmentCode || (bt as any).code;
        const rawName = bt.treatmentName || '';
        const rawDesc = bt.description || '';

        const localizedName = resolveSpaTreatmentLocalized(trtId || trtCode || rawName, rawName);
        const localizedDesc = resolveSpaTreatmentDescriptionLocalized(trtId || trtCode || rawName, rawDesc);

        const existing = fallbackTreatments.find((ft) => ft.id === String(trtId) || ft.id === trtCode);
        const inv = SPA_TREATMENTS_INVENTORY.find(i => 
          (i.treatmentCode && trtCode && i.treatmentCode === trtCode) ||
          i.treatmentName.toLowerCase() === rawName.toLowerCase()
        ) || SPA_TREATMENTS_INVENTORY[(trtId || 1) - 1] || SPA_TREATMENTS_INVENTORY[idx];
        const fallbackImg = inv?.image || '/assets/spa/fallback.jpg';
        const imageUrl = (existing?.imageUrl && existing.imageUrl.trim().length > 0) ? existing.imageUrl : fallbackImg;
        return {
          id: String(trtId),
          name: localizedName,
          category: (bt.category ? bt.category : (existing?.category || 'Body Massage')) as TreatmentCategory,
          description: localizedDesc,
          durationMinutes: bt.durationMinutes,
          price: bt.basePrice,
          isIncludedInRetreat: bt.isIncluded,
          imageUrl,
          benefits: (existing?.benefits && existing.benefits.length > 0) ? existing.benefits : (inv?.pricingRule ? [{ vi: inv.pricingRule, en: inv.pricingRule, 'zh-CN': inv.pricingRule, ja: inv.pricingRule, fr: inv.pricingRule }] : []),
          contraindications: (existing?.contraindications && existing.contraindications.length > 0) ? existing.contraindications : (inv?.contraindications ? [inv.contraindications] : []),
        };
      });
    }
    return fallbackTreatments.map((ft, idx) => {
      const trtId = idx + 1;
      const localizedName = resolveSpaTreatmentLocalized(ft.id || trtId, ft.name.vi);
      const localizedDesc = resolveSpaTreatmentDescriptionLocalized(ft.id || trtId, typeof ft.description === 'string' ? ft.description : ft.description?.vi);
      return {
        ...ft,
        name: localizedName,
        description: localizedDesc,
      };
    });
  }, [backendTreatments, fallbackTreatments]);

  // Compute category badge counts based on active treatments
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: activeTreatments.length };
    CATEGORY_FILTERS.forEach((cf) => {
      if (cf.key !== 'all') {
        counts[cf.key] = activeTreatments.filter((t) => matchesTreatmentCategoryFilter(t, cf.key)).length;
      }
    });
    return counts;
  }, [activeTreatments]);

  // Filter treatments by category taxonomy and search query (null-safe and multi-language resilient)
  const filtered = useMemo(() => {
    return activeTreatments.filter((tr) => {
      if (!matchesTreatmentCategoryFilter(tr, activeCategory)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const qCompact = q.replace(/\s+/g, '');
        const safeLower = (v: unknown): string => (typeof v === 'string' ? v.toLowerCase() : '');
        const nameMatches =
          safeLower(tr.name?.en).includes(q) ||
          safeLower(tr.name?.vi).includes(q) ||
          safeLower(tr.name?.['zh-CN']).includes(q) ||
          safeLower(tr.name?.ja).includes(q) ||
          safeLower(tr.name?.fr).includes(q) ||
          (qCompact.length >= 3 && (
            safeLower(tr.name?.en).replace(/\s+/g, '').includes(qCompact) ||
            safeLower(tr.name?.vi).replace(/\s+/g, '').includes(qCompact)
          ));
        const catMatches = safeLower(tr.category).includes(q) || (qCompact.length >= 3 && safeLower(tr.category).replace(/\s+/g, '').includes(qCompact));
        const descMatches =
          typeof tr.description === 'string'
            ? safeLower(tr.description).includes(q) || (qCompact.length >= 3 && safeLower(tr.description).replace(/\s+/g, '').includes(qCompact))
            : Boolean(
                safeLower(tr.description?.en).includes(q) ||
                safeLower(tr.description?.vi).includes(q) ||
                safeLower(tr.description?.['zh-CN']).includes(q) ||
                safeLower(tr.description?.ja).includes(q) ||
                safeLower(tr.description?.fr).includes(q) ||
                (qCompact.length >= 3 && (
                  safeLower(tr.description?.en).replace(/\s+/g, '').includes(qCompact) ||
                  safeLower(tr.description?.vi).replace(/\s+/g, '').includes(qCompact)
                ))
              );
        return nameMatches || catMatches || descMatches;
      }
      return true;
    });
  }, [activeTreatments, activeCategory, searchQuery]);

  // Responsive Pagination: 9 per page on desktop (>=1024px), 6 on tablet/mobile (<1024px)
  const [pageSize, setPageSize] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return 6;
    return 9;
  });

  useEffect(() => {
    const handleResize = () => {
      setPageSize(window.innerWidth < 1024 ? 6 : 9);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [currentPage, setCurrentPage] = useState(1);

  // Auto-reset to page 1 on filter or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);

  const totalMatching = filtered.length;
  const totalPages = Math.ceil(totalMatching / pageSize) || 1;

  // Sliced items for current active page
  const paginatedTreatments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const includedTreatments = paginatedTreatments.filter((t) => t.isIncludedInRetreat);
  const extraTreatments = paginatedTreatments.filter((t) => !t.isIncludedInRetreat);

  const startIndex = totalMatching > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize, totalMatching);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="spa-treatment-list-page" id="screen-25-spa-treatment-list">
      {/* Hero Header */}
      <div className="spa-hero-header">
        <div className="spa-hero-overlay" />
        <div className="spa-hero-content">
          <div className="spa-hero-badge">
            <Sparkles size={16} />
            <span>{t('spa.badge', 'Wellness & Therapy')}</span>
          </div>
          <h1>{t('spa.title', 'Spa & Therapy Treatments')}</h1>
          <p className="spa-hero-subtitle">
            {t('spa.subtitle', 'Discover our curated collection of healing treatments designed for your complete wellness journey')}
          </p>

          <div className="spa-hero-actions">
            <button
              type="button"
              className="spa-hero-my-sessions-btn"
              onClick={() => navigate('/customer/spa/sessions')}
              id="btn-nav-my-sessions-hero"
            >
              <CalendarCheck size={16} />
              <span>{t('spa.viewMySessions', 'View My Sessions')}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Section Navigation Tabs: Treatment Catalogue | My Spa Sessions */}
      <div className="spa-section-nav" role="tablist" aria-label="Spa Navigation">
        <button
          type="button"
          className="spa-section-nav-tab spa-section-nav-tab--active"
          onClick={() => navigate('/customer/spa')}
          role="tab"
          aria-selected="true"
        >
          <Sparkles size={16} />
          <span>{t('spa.navCatalogue', 'Treatment Catalogue')}</span>
        </button>
        <button
          type="button"
          className="spa-section-nav-tab"
          onClick={() => navigate('/customer/spa/sessions')}
          id="btn-nav-my-sessions-tab"
          role="tab"
          aria-selected="false"
        >
          <CalendarCheck size={16} />
          <span>{t('spa.mySessions', 'My Spa Sessions')}</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="spa-filters-bar">
        <div className="spa-search-input">
          <Search size={18} />
          <input
            type="text"
            placeholder={t('spa.searchPlaceholder', 'Search treatments by name, technique, or category...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="spa-treatment-search"
          />
        </div>

        <div className="spa-category-chips">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.key}
              className={`spa-chip ${activeCategory === cat.key ? 'spa-chip--active' : ''}`}
              onClick={() => setActiveCategory(cat.key)}
              id={`spa-filter-${cat.key}`}
            >
              {cat.icon}
              <span>{t(cat.labelKey, cat.defaultLabel)}</span>
              <span className="spa-chip-count">{categoryCounts[cat.key] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Included Treatments Section */}
      {includedTreatments.length > 0 && (
        <section className="spa-section" id="section-included-treatments">
          <div className="spa-section-header">
            <div className="spa-section-badge spa-section-badge--included">
              <Leaf size={16} />
              <span>{t('spa.includedInRetreat', 'Included in Your Retreat')}</span>
            </div>
            <p className="spa-section-desc">
              {t('spa.includedDesc', 'These treatments are part of your wellness retreat package at no additional charge.')}
            </p>
          </div>
          <div className="spa-treatment-grid">
            {includedTreatments.map((treatment) => (
              <div
                key={treatment.id}
                className="spa-treatment-card spa-treatment-card--included"
                onClick={() => navigate(`/customer/spa/book?treatment=${treatment.id}`)}
                id={`spa-treatment-${treatment.id}`}
              >
                {/* 1. Image */}
                <div className="spa-card-image">
                  <img
                    src={treatment.imageUrl}
                    alt={localize(treatment.name)}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('fallback.jpg')) {
                        target.src = '/assets/spa/fallback.jpg';
                      }
                    }}
                  />
                  <div className="spa-card-badge-overlay">
                    <span className="spa-card-included-tag">
                      <Leaf size={13} />
                      {t('spa.included', 'Included')}
                    </span>
                  </div>
                </div>

                <div className="spa-card-body">
                  {/* 2. Treatment Name */}
                  <h3 className="spa-card-title">{localize(treatment.name)}</h3>

                  {/* 3. Category */}
                  <div className="spa-card-category-row">
                    <span className="spa-card-category-badge">
                      {resolveSpaTreatmentCategory(treatment.id, i18n.language, treatment.category)}
                    </span>
                  </div>

                  {/* 4. Short Description */}
                  <p className="spa-card-desc">{localize(treatment.description)}</p>

                  {/* 5. Duration + Price / Included Status */}
                  <div className="spa-card-meta-row">
                    <span className="spa-card-duration">
                      <Clock size={14} />
                      <span>{treatment.durationMinutes} {t('spa.minutes', 'min')}</span>
                    </span>
                    <span className="spa-card-status-pill spa-card-status-pill--included">
                      <Leaf size={12} />
                      <span>{t('spa.includedInPackage', 'Package Inclusive')}</span>
                    </span>
                  </div>

                  {/* 6. Clear High-Emphasis CTA */}
                  <button
                    type="button"
                    className="spa-card-cta spa-card-cta--primary"
                    id={`spa-book-${treatment.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/customer/spa/book?treatment=${treatment.id}`);
                    }}
                  >
                    <span>{t('spa.bookSession', 'Book Session')}</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Extra Treatments Section */}
      {extraTreatments.length > 0 && (
        <section className="spa-section" id="section-extra-treatments">
          <div className="spa-section-header">
            <div className="spa-section-badge spa-section-badge--extra">
              <Star size={16} />
              <span>{t('spa.premiumAddOns', 'Premium Add-On Treatments')}</span>
            </div>
            <p className="spa-section-desc">
              {t('spa.extraDesc', 'Enhance your retreat with our premium therapeutic treatments. Charges will be posted to your folio.')}
            </p>
          </div>
          <div className="spa-treatment-grid">
            {extraTreatments.map((treatment) => (
              <div
                key={treatment.id}
                className="spa-treatment-card spa-treatment-card--extra"
                onClick={() => navigate(`/customer/spa/book?treatment=${treatment.id}`)}
                id={`spa-treatment-${treatment.id}`}
              >
                {/* 1. Image */}
                <div className="spa-card-image">
                  <img
                    src={treatment.imageUrl}
                    alt={localize(treatment.name)}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('fallback.jpg')) {
                        target.src = '/assets/spa/fallback.jpg';
                      }
                    }}
                  />
                  <div className="spa-card-badge-overlay">
                    <span className="spa-card-price-tag">
                      {formatPrice(treatment.price)}
                    </span>
                  </div>
                </div>

                <div className="spa-card-body">
                  {/* 2. Treatment Name */}
                  <h3 className="spa-card-title">{localize(treatment.name)}</h3>

                  {/* 3. Category */}
                  <div className="spa-card-category-row">
                    <span className="spa-card-category-badge">
                      {resolveSpaTreatmentCategory(treatment.id, i18n.language, treatment.category)}
                    </span>
                  </div>

                  {/* 4. Short Description */}
                  <p className="spa-card-desc">{localize(treatment.description)}</p>

                  {/* 5. Duration + Price / Included Status */}
                  <div className="spa-card-meta-row">
                    <span className="spa-card-duration">
                      <Clock size={14} />
                      <span>{treatment.durationMinutes} {t('spa.minutes', 'min')}</span>
                    </span>
                    <span className="spa-card-price-highlight">
                      {formatPrice(treatment.price)}
                    </span>
                  </div>

                  {/* 6. Clear High-Emphasis CTA */}
                  <button
                    type="button"
                    className="spa-card-cta spa-card-cta--extra"
                    id={`spa-book-${treatment.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/customer/spa/book?treatment=${treatment.id}`);
                    }}
                  >
                    <span>{t('spa.bookSession', 'Book Session')}</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pagination Bar (Shown only when matching items exceed page size) */}
      {totalPages > 1 && (
        <div className="spa-pagination" id="spa-catalog-pagination">
          <div className="spa-pagination-info">
            <span>
              {t('spa.showingRange', 'Showing {{start}}–{{end}} of {{total}} treatments', {
                start: startIndex,
                end: endIndex,
                total: totalMatching,
              })}
            </span>
          </div>

          <div className="spa-pagination-controls">
            <button
              type="button"
              className="spa-pagination-btn spa-pagination-btn--prev"
              id="btn-pagination-prev"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Previous Page"
            >
              <ChevronLeft size={16} />
              <span>{t('spa.prev', 'Previous')}</span>
            </button>

            <div className="spa-pagination-pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`spa-pagination-page-btn ${currentPage === page ? 'spa-pagination-page-btn--active' : ''}`}
                  id={`btn-pagination-page-${page}`}
                  onClick={() => setCurrentPage(page)}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="spa-pagination-btn spa-pagination-btn--next"
              id="btn-pagination-next"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next Page"
            >
              <span>{t('spa.next', 'Next')}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="spa-empty-state" id="spa-empty-state">
          <Filter size={48} />
          <h3>{t('spa.noResults', 'No treatments found')}</h3>
          <p>{t('spa.noResultsDesc', 'Try adjusting your search query or category filter.')}</p>
          <button
            type="button"
            className="spa-btn-reset-filters"
            id="btn-reset-filters"
            onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
            }}
          >
            <RotateCcw size={16} />
            <span>{t('spa.resetFilters', 'Reset Filters')}</span>
          </button>
        </div>
      )}
    </div>
  );
};
