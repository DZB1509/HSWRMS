import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import type { DietaryMenuItem, MealPeriod } from '../../types/dining';
import { Search, Info, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DietaryMenuPage: React.FC = () => {
  const { t } = useTranslation('customer');
  const { menuItems, getDietaryProjection } = useDining();
  const navigate = useNavigate();

  // Mock checking the current customer ID
  // In a real app we would get the actual customer ID from auth/context.
  const customerId = 'usr-cust-01'; 
  const dietaryInfo = getDietaryProjection(customerId);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activePeriod, setActivePeriod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['all', 'starter', 'main', 'dessert', 'beverage', 'wellness_drink'];
  const periods = ['all', 'breakfast', 'lunch', 'dinner', 'all_day'];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesPeriod = activePeriod === 'all' || item.mealPeriods.includes(activePeriod as MealPeriod) || item.mealPeriods.includes('all_day');
    const matchesSearch = item.name.en.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.en.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesPeriod && matchesSearch;
  });

  const hasAllergyWarning = (item: DietaryMenuItem) => {
    return item.allergenTags.some(tag => dietaryInfo.allergies.includes(tag.toLowerCase()));
  };

  return (
    <div className="hsw-page-container">
      <div className="hsw-page-header">
        <h1 className="hsw-page-title">{t('dining.menu.title', 'Nourishing Dietary Menu')}</h1>
        <p className="hsw-page-subtitle">
          {t('dining.menu.subtitle', 'Explore our holistic culinary offerings, curated for your wellness journey.')}
        </p>
      </div>

      <div className="hsw-actions-row">
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button 
            className="hsw-btn hsw-btn-primary"
            onClick={() => navigate('/customer/dining/select')}
          >
            {t('dining.menu.planMeals', 'Plan Retreat Meals')}
          </button>
          <button 
            className="hsw-btn hsw-btn-secondary"
            onClick={() => navigate('/customer/dining/extra')}
          >
            {t('dining.menu.orderAlaCarte', 'Order A-la-carte')}
          </button>
        </div>

        <div className="hsw-filter-group" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text" 
              className="hsw-input" 
              style={{ paddingLeft: '36px', minWidth: '250px' }}
              placeholder={t('dining.menu.searchPlaceholder', 'Search menu...')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select 
            className="hsw-select"
            value={activePeriod}
            onChange={(e) => setActivePeriod(e.target.value)}
          >
            {periods.map(p => (
              <option key={p} value={p}>{t(`dining.periods.${p}`, p.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()))}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="hsw-tabs" style={{ marginBottom: 'var(--space-4)' }}>
        {categories.map(cat => (
          <button 
            key={cat}
            className={`hsw-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {t(`dining.categories.${cat}`, cat.replace('_', ' ').toUpperCase())}
          </button>
        ))}
      </div>

      <div className="hsw-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
        {filteredItems.map(item => {
          const warning = hasAllergyWarning(item);
          return (
            <div key={item.id} className="hsw-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: 0 }}>
              <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                <img 
                  src={item.image} 
                  alt={item.name.en} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                  className="hsw-img-hover-scale"
                />
                {item.isExtra && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--accent-sand)', color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                    {t('dining.menu.extraCharge', 'A-LA-CARTE')}
                  </div>
                )}
              </div>
              
              <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: 0 }}>{item.name.en}</h3>
                  {item.isExtra && item.price && (
                    <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--accent-forest)' }}>
                      {item.price.toLocaleString()} VND
                    </div>
                  )}
                </div>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)', flex: 1 }}>
                  {item.description.en}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                  {item.dietaryTags.map(tag => (
                    <span key={tag} style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {tag.replace('_', ' ')}
                    </span>
                  ))}
                </div>

                {warning && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px', background: 'var(--danger-light)', borderRadius: '4px', color: 'var(--danger)', fontSize: 'var(--text-xs)' }}>
                    <AlertCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{t('dining.menu.allergyWarning', 'Contains an allergen listed in your dietary profile.')}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <Info size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto var(--space-3)' }} />
          <h3>{t('dining.menu.noItems', 'No Menu Items Found')}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{t('dining.menu.noItemsDesc', 'Try adjusting your filters or search query.')}</p>
          <button className="hsw-btn hsw-btn-secondary" style={{ marginTop: 'var(--space-3)' }} onClick={() => { setActiveCategory('all'); setActivePeriod('all'); setSearchQuery(''); }}>
            {t('dining.menu.clearFilters', 'Clear Filters')}
          </button>
        </div>
      )}
    </div>
  );
};
