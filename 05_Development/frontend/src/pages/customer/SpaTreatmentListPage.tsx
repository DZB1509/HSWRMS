/**
 * Screen #25 — Spa Treatment List
 * Customer-facing catalogue of available spa/therapy treatments.
 * Shows treatments included in retreat + extras available for purchase.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSpa } from '../../context/SpaContext';
import {
  Sparkles,
  Clock,
  Star,
  Leaf,
  ChevronRight,
  Search,
  Filter,
  Heart,
  Shield,
  CalendarCheck,
} from 'lucide-react';
import type { TreatmentCategory, LocalizedString, SpaTreatment } from '../../types/spa';

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

import { useSpaTreatments } from '../../features/m3-spa/hooks/useSpaFeature';

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

  // Map backend treatments to UI model, or fallback to mock if backend empty
  const activeTreatments: SpaTreatment[] = useMemo(() => {
    if (backendTreatments && backendTreatments.length > 0) {
      return backendTreatments.map((bt) => {
        const existing = fallbackTreatments.find((ft) => ft.id === String(bt.treatmentId) || ft.name.en.toLowerCase() === bt.treatmentName.toLowerCase());
        return {
          id: String(bt.treatmentId),
          name: existing ? existing.name : { en: bt.treatmentName, vi: bt.treatmentName, 'zh-CN': bt.treatmentName, ja: bt.treatmentName, fr: bt.treatmentName },
          category: (bt.category ? bt.category.toLowerCase() : (existing?.category || 'massage')) as TreatmentCategory,
          description: existing ? existing.description : { en: bt.description || '', vi: bt.description || '', 'zh-CN': bt.description || '', ja: bt.description || '', fr: bt.description || '' },
          durationMinutes: bt.durationMinutes,
          price: bt.basePrice,
          isIncludedInRetreat: bt.isIncluded,
          imageUrl: existing ? existing.imageUrl : 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
          benefits: existing ? existing.benefits : [],
          contraindications: existing ? existing.contraindications : [],
        };
      });
    }
    return fallbackTreatments;
  }, [backendTreatments, fallbackTreatments]);

  const filtered = activeTreatments.filter((tr) => {
    if (activeCategory !== 'all' && tr.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        tr.name.en.toLowerCase().includes(q) ||
        tr.name.vi.toLowerCase().includes(q) ||
        tr.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const includedTreatments = filtered.filter((t) => t.isIncludedInRetreat);
  const extraTreatments = filtered.filter((t) => !t.isIncludedInRetreat);

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
            placeholder={t('spa.searchPlaceholder', 'Search treatments...')}
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
            </button>
          ))}
        </div>
      </div>

      {/* Included Treatments Section */}
      {includedTreatments.length > 0 && (
        <section className="spa-section">
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
                  <img src={treatment.imageUrl} alt={localize(treatment.name)} loading="lazy" />
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
                    <span className="spa-card-category-badge">{treatment.category}</span>
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
        <section className="spa-section">
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
                  <img src={treatment.imageUrl} alt={localize(treatment.name)} loading="lazy" />
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
                    <span className="spa-card-category-badge">{treatment.category}</span>
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

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="spa-empty-state">
          <Filter size={48} />
          <h3>{t('spa.noResults', 'No treatments found')}</h3>
          <p>{t('spa.noResultsDesc', 'Try adjusting your search or filter criteria.')}</p>
        </div>
      )}
    </div>
  );
};
