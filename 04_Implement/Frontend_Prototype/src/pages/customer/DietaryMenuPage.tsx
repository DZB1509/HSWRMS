import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import type { DietaryMenuItem, MealPeriod, LocalizedString } from '../../types/dining';
import { Search, Info, AlertCircle, Sparkles, CalendarCheck, Coffee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FoodImage } from '../../components/common/FoodImage';

export const DietaryMenuPage: React.FC = () => {
  const { t, i18n } = useTranslation('customer');
  const { menuItems, getDietaryProjection } = useDining();
  const navigate = useNavigate();

  const currentLang = (i18n.language || 'en') as keyof LocalizedString;
  const localize = (ls?: LocalizedString | null): string => {
    if (!ls) return '';
    if (typeof ls === 'string') return ls;
    return ls[currentLang] || ls.en || Object.values(ls)[0] || '';
  };

  const customerId = 'usr-cust-01';
  const dietaryInfo = getDietaryProjection(customerId);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activePeriod, setActivePeriod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { key: 'all', labelKey: 'dining.categories.all', defaultLabel: 'All Offerings' },
    { key: 'starter', labelKey: 'dining.categories.starter', defaultLabel: 'Starters' },
    { key: 'main', labelKey: 'dining.categories.main', defaultLabel: 'Main Courses' },
    { key: 'dessert', labelKey: 'dining.categories.dessert', defaultLabel: 'Desserts' },
    { key: 'beverage', labelKey: 'dining.categories.beverage', defaultLabel: 'Beverages' },
    { key: 'wellness_drink', labelKey: 'dining.categories.wellness_drink', defaultLabel: 'Wellness Elixirs' },
  ];

  const periods = ['all', 'breakfast', 'lunch', 'dinner', 'all_day'];

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesPeriod =
      activePeriod === 'all' ||
      item.mealPeriods.includes(activePeriod as MealPeriod) ||
      item.mealPeriods.includes('all_day');

    if (!searchQuery.trim()) {
      return matchesCategory && matchesPeriod;
    }

    const q = searchQuery.toLowerCase().trim();
    const nameMatch = Object.values(item.name).some((v) => v.toLowerCase().includes(q));
    const descMatch = Object.values(item.description).some((v) => v.toLowerCase().includes(q));
    const tagMatch = item.dietaryTags.some((t) => t.toLowerCase().includes(q));

    return matchesCategory && matchesPeriod && (nameMatch || descMatch || tagMatch);
  });

  const hasAllergyWarning = (item: DietaryMenuItem) => {
    return item.allergenTags.some((tag) => dietaryInfo.allergies.includes(tag.toLowerCase()));
  };

  return (
    <div className="hsw-dining-container" id="screen-34-dietary-menu">
      {/* Header */}
      <div className="hsw-dining-header">
        <h1 className="hsw-dining-title">{t('dining.menu.title', 'Nourishing Dietary Menu')}</h1>
        <p className="hsw-dining-subtitle">
          {t('dining.menu.subtitle', 'Explore our holistic culinary offerings, curated for your wellness journey.')}
        </p>
      </div>

      {/* Action Bar + Filter Toolbar */}
      <div className="hsw-dining-filter-bar">
        <div className="hsw-dining-filter-row">
          {/* Quick Action Navigation */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="hsw-btn hsw-btn-primary"
              onClick={() => navigate('/customer/dining/select')}
              id="btn-plan-retreat-meals"
            >
              <CalendarCheck size={16} />
              <span>{t('dining.menu.planMeals', 'Plan Retreat Meals')}</span>
            </button>
            <button
              type="button"
              className="hsw-btn hsw-btn-secondary"
              onClick={() => navigate('/customer/dining/extra')}
              id="btn-order-alacarte"
            >
              <Coffee size={16} />
              <span>{t('dining.menu.orderAlaCarte', 'Order A-la-carte')}</span>
            </button>
          </div>

          {/* Search & Meal Period Controls */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)',
                }}
              />
              <input
                type="text"
                className="hsw-input"
                style={{ paddingLeft: '34px', width: '100%', height: '40px' }}
                placeholder={t('dining.menu.searchPlaceholder', 'Search menu...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="dining-menu-search"
              />
            </div>

            <select
              className="hsw-select"
              style={{ height: '40px', minWidth: '150px' }}
              value={activePeriod}
              onChange={(e) => setActivePeriod(e.target.value)}
              id="dining-period-filter"
            >
              {periods.map((p) => (
                <option key={p} value={p}>
                  {p === 'all'
                    ? t('dining.periods.all', 'All Meal Periods')
                    : t(`dining.periods.${p}`, p.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()))}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills (Requirement 11) */}
        <div className="hsw-category-chips" role="tablist" aria-label="Menu categories">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={`hsw-category-chip ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.key)}
              role="tab"
              aria-selected={activeCategory === cat.key}
              id={`cat-filter-${cat.key}`}
            >
              <span>{t(cat.labelKey, cat.defaultLabel)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Culinary Cards Grid (3 cols desktop, 2 tablet, 1 mobile) */}
      <div className="hsw-culinary-grid">
        {filteredItems.map((item) => {
          const warning = hasAllergyWarning(item);
          const localizedName = localize(item.name);
          const localizedDesc = localize(item.description);

          return (
            <div key={item.id} className="hsw-culinary-card" id={`dish-card-${item.id}`}>
              {/* Food Image with Hover & Fallback */}
              <div style={{ position: 'relative' }}>
                <FoodImage src={item.image} alt={localizedName} aspectRatio="16 / 10" />

                {item.isExtra && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'var(--accent-sand)',
                      color: 'var(--text-primary)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    {t('dining.menu.extraCharge', 'A-LA-CARTE')}
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="hsw-culinary-card-body">
                <div className="hsw-culinary-card-header">
                  <h3 className="hsw-culinary-dish-name">{localizedName}</h3>
                  {item.isExtra && item.price && (
                    <div className="hsw-culinary-price">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                    </div>
                  )}
                </div>

                <p className="hsw-culinary-desc">{localizedDesc}</p>

                {/* Dietary Tags */}
                {item.dietaryTags.length > 0 && (
                  <div className="hsw-dietary-chips">
                    {item.dietaryTags.map((tag) => (
                      <span key={tag} className="hsw-dietary-chip">
                        <Sparkles size={11} style={{ color: 'var(--accent-olive)' }} />
                        {t(`dining.dietaryTags.${tag}`, tag.replace('_', ' '))}
                      </span>
                    ))}
                  </div>
                )}

                {/* Allergy warning box */}
                {warning && (
                  <div className="hsw-allergy-alert-box" role="alert">
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>{t('dining.menu.allergyWarning', 'Contains an allergen listed in your dietary profile.')}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State (Requirement 42) */}
      {filteredItems.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-10) var(--space-6)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            maxWidth: '560px',
            margin: 'var(--space-6) auto',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-soft)',
              color: 'var(--accent-olive)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-3)',
            }}
          >
            <Info size={24} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>
            {t('dining.menu.noItems', 'No Menu Items Found')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            {t('dining.menu.noItemsDesc', 'Try adjusting your filters or search query to explore other culinary options.')}
          </p>
          <button
            type="button"
            className="hsw-btn hsw-btn-secondary"
            onClick={() => {
              setActiveCategory('all');
              setActivePeriod('all');
              setSearchQuery('');
            }}
          >
            {t('dining.menu.clearFilters', 'Clear Filters')}
          </button>
        </div>
      )}
    </div>
  );
};
