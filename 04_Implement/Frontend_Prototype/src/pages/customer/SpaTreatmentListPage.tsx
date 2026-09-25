/**
 * Screen #25 — Spa Treatment List
 * Customer-facing catalogue of available spa/therapy treatments.
 * Shows treatments included in retreat + extras available for purchase.
 */

import React, { useState } from 'react';
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
} from 'lucide-react';
import type { TreatmentCategory, LocalizedString } from '../../types/spa';

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

const useLocalized = (ls: LocalizedString): string => {
  const { i18n } = useTranslation();
  const lang = i18n.language as keyof LocalizedString;
  return ls[lang] || ls.en;
};

export const SpaTreatmentListPage: React.FC = () => {
  const { t } = useTranslation('customer');
  const { treatments } = useSpa();
  const navigate = useNavigate();
  const localize = (ls: LocalizedString) => useLocalized(ls);

  const [activeCategory, setActiveCategory] = useState<TreatmentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = treatments.filter((tr) => {
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
        </div>
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
                <div className="spa-card-image">
                  <img src={treatment.imageUrl} alt={localize(treatment.name)} loading="lazy" />
                  <div className="spa-card-badge-overlay">
                    <span className="spa-card-included-tag">
                      <Leaf size={12} />
                      {t('spa.included', 'Included')}
                    </span>
                  </div>
                </div>
                <div className="spa-card-body">
                  <h3>{localize(treatment.name)}</h3>
                  <p className="spa-card-desc">{localize(treatment.description)}</p>
                  <div className="spa-card-meta">
                    <span className="spa-card-duration">
                      <Clock size={14} />
                      {treatment.durationMinutes} {t('spa.minutes', 'min')}
                    </span>
                    <span className="spa-card-category">{treatment.category}</span>
                  </div>
                  <button className="spa-card-cta" id={`spa-book-${treatment.id}`}>
                    {t('spa.bookSession', 'Book Session')}
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
                <div className="spa-card-image">
                  <img src={treatment.imageUrl} alt={localize(treatment.name)} loading="lazy" />
                  <div className="spa-card-badge-overlay">
                    <span className="spa-card-price-tag">
                      {formatPrice(treatment.price)}
                    </span>
                  </div>
                </div>
                <div className="spa-card-body">
                  <h3>{localize(treatment.name)}</h3>
                  <p className="spa-card-desc">{localize(treatment.description)}</p>
                  <div className="spa-card-meta">
                    <span className="spa-card-duration">
                      <Clock size={14} />
                      {treatment.durationMinutes} {t('spa.minutes', 'min')}
                    </span>
                    <span className="spa-card-category">{treatment.category}</span>
                  </div>
                  <button className="spa-card-cta spa-card-cta--extra" id={`spa-book-${treatment.id}`}>
                    {t('spa.bookSession', 'Book Session')}
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
