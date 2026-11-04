import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import type { DietaryMenuItem, MealPeriod, LocalizedString } from '../../types/dining';
import { Search, Info, AlertCircle, CalendarCheck, Coffee, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { useCustomer } from '../../context/CustomerContext';
import { FoodImage } from '../../components/common/FoodImage';
import { DietaryBadgeList } from '../../components/dining/DietaryBadgeList';

const DietaryMenuPageForIdentity: React.FC = () => {
  const { t, i18n } = useTranslation('customer');
  const { menuItems, getDietaryProjection } = useDining();
  const { profile } = useCustomer();
  const navigate = useNavigate();

  const currentLang = (i18n.language || 'en') as keyof LocalizedString;
  const localize = (ls?: LocalizedString | null): string => {
    if (!ls) return '';
    if (typeof ls === 'string') return ls;
    return ls[currentLang] || ls.en || Object.values(ls)[0] || '';
  };

  const customerId = profile?.id ?? '';
  const dietaryInfo = getDietaryProjection(customerId);

  const [offeringFilter, setOfferingFilter] = useState<'all' | 'package' | 'extra'>('all');
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
    const matchesOffering =
      offeringFilter === 'all' ||
      (offeringFilter === 'extra' ? item.isExtra : !item.isExtra);

    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesPeriod =
      activePeriod === 'all' ||
      item.mealPeriods.includes(activePeriod as MealPeriod) ||
      item.mealPeriods.includes('all_day');

    if (!searchQuery.trim()) {
      return matchesOffering && matchesCategory && matchesPeriod;
    }

    const q = searchQuery.toLowerCase().trim();
    const nameMatch = Object.values(item.name).some((v) => v.toLowerCase().includes(q));
    const descMatch = Object.values(item.description).some((v) => v.toLowerCase().includes(q));
    const tagMatch = item.dietaryTags.some((t) => t.toLowerCase().includes(q));

    return matchesOffering && matchesCategory && matchesPeriod && (nameMatch || descMatch || tagMatch);
  });

  const hasAllergyWarning = (item: DietaryMenuItem) => {
    return item.allergenTags.some((tag) => dietaryInfo.allergies.includes(tag.toLowerCase()));
  };

  const packageCount = menuItems.filter((i) => !i.isExtra).length;
  const extraCount = menuItems.filter((i) => i.isExtra).length;

  return (
    <div className="hsw-dining-container" id="screen-34-dietary-menu">
      {/* Header */}
      <div className="hsw-dining-header">
        <h1 className="hsw-dining-title">{t('dining.menu.title', 'Nourishing Dietary Menu')}</h1>
        <p className="hsw-dining-subtitle">
          {t('dining.menu.subtitle', 'Khám phá ẩm thực dưỡng sinh tinh hoa: các món trọn gói theo kỳ nghỉ và thực đơn gọi thêm A-la-carte đặc thù.')}
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
              <span>{t('dining.menu.planMeals', 'Lên Thực Đơn Theo Gói (0đ)')}</span>
            </button>
            <button
              type="button"
              className="hsw-btn hsw-btn-secondary"
              onClick={() => navigate('/customer/dining/extra')}
              id="btn-order-alacarte"
            >
              <Coffee size={16} />
              <span>{t('dining.menu.orderAlaCarte', 'Gọi Món A-la-carte')}</span>
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
                placeholder={t('dining.menu.searchPlaceholder', 'Tìm kiếm món ăn, vị thuốc...')}
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
                    ? t('dining.periods.all', 'Tất cả các bữa')
                    : t(`dining.periods.${p}`, p.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()))}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Offering Type Tabs: Tất cả vs Món trong gói vs Món A-la-carte */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`hsw-btn hsw-btn-sm ${offeringFilter === 'all' ? 'hsw-btn-primary' : 'hsw-btn-secondary'}`}
            onClick={() => setOfferingFilter('all')}
            style={offeringFilter === 'all' ? { backgroundColor: 'var(--brand-primary, #2d4a3e)', color: '#fff' } : {}}
          >
            <span>Tất Cả Thực Đơn ({menuItems.length})</span>
          </button>
          <button
            type="button"
            className={`hsw-btn hsw-btn-sm ${offeringFilter === 'package' ? 'hsw-btn-primary' : 'hsw-btn-secondary'}`}
            onClick={() => setOfferingFilter('package')}
            style={offeringFilter === 'package' ? { backgroundColor: '#137333', borderColor: '#137333', color: '#fff' } : {}}
          >
            <Sparkles size={14} style={{ marginRight: '4px' }} />
            <span>Món Trong Gói Nghỉ Dưỡng ({packageCount})</span>
          </button>
          <button
            type="button"
            className={`hsw-btn hsw-btn-sm ${offeringFilter === 'extra' ? 'hsw-btn-primary' : 'hsw-btn-secondary'}`}
            onClick={() => setOfferingFilter('extra')}
            style={offeringFilter === 'extra' ? { backgroundColor: 'var(--accent-sand, #c7a77b)', borderColor: 'var(--accent-sand, #c7a77b)', color: '#fff' } : {}}
          >
            <Coffee size={14} style={{ marginRight: '4px' }} />
            <span>Món Gọi Thêm A-la-carte ({extraCount})</span>
          </button>
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

                {item.isExtra ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'var(--accent-sand, #bfa15f)',
                      color: '#ffffff',
                      padding: '4px 9px',
                      borderRadius: 'var(--radius-xs, 4px)',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    A-LA-CARTE
                  </div>
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: '#e6f4ea',
                      color: '#137333',
                      padding: '4px 9px',
                      borderRadius: 'var(--radius-xs, 4px)',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    TRỌN GÓI (0đ)
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="hsw-culinary-card-body">
                <div className="hsw-culinary-card-header">
                  <h3 className="hsw-culinary-dish-name">{localizedName}</h3>
                  {item.isExtra && item.price && item.price > 0 ? (
                    <div className="hsw-culinary-price">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                    </div>
                  ) : (
                    <div className="hsw-culinary-price" style={{ color: '#137333', fontSize: '12px', fontWeight: 600 }}>
                      ✓ Đã bao gồm trong gói
                    </div>
                  )}
                </div>

                <p className="hsw-culinary-desc">{localizedDesc}</p>

                {/* Dietary Badges (Prioritized, ingredient-aware, beverage-reduced) */}
                <DietaryBadgeList item={item} />

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
              setOfferingFilter('all');
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

export const DietaryMenuPage: React.FC = () => {
  const { currentUser } = useAuth();
  return <DietaryMenuPageForIdentity key={currentUser?.id ?? 'anonymous'} />;
};
