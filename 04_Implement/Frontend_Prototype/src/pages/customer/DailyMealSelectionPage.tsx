import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import { useCustomer } from '../../context/CustomerContext';
import type { MealPeriod, LocalizedString } from '../../types/dining';
import { AlertCircle, CheckCircle2, Info, Calendar, Clock, Sun, Moon, Coffee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FoodImage } from '../../components/common/FoodImage';
import { DietaryBadgeList } from '../../components/dining/DietaryBadgeList';

export const DailyMealSelectionPage: React.FC = () => {
  const { t, i18n } = useTranslation('customer');
  const { menuItems, getDietaryProjection, saveMealSelection, getMealSelection } = useDining();
  const { activeBooking } = useCustomer();
  const navigate = useNavigate();

  const currentLang = (i18n.language || 'en') as keyof LocalizedString;
  const localize = (ls?: LocalizedString | null): string => {
    if (!ls) return '';
    if (typeof ls === 'string') return ls;
    return ls[currentLang] || ls.en || Object.values(ls)[0] || '';
  };

  const customerId = 'usr-cust-01';
  const dietaryInfo = getDietaryProjection(customerId);

  const [activeDate, setActiveDate] = useState<string>('');
  const [activePeriod, setActivePeriod] = useState<MealPeriod>('breakfast');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Calculate dates based on booking
  const dates = React.useMemo(() => {
    if (!activeBooking) return [];
    const start = new Date(activeBooking.startDate);
    const end = new Date(activeBooking.endDate);
    const result: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      result.push(d.toISOString().split('T')[0]);
    }
    return result;
  }, [activeBooking]);

  useEffect(() => {
    if (dates.length > 0 && !activeDate) {
      setActiveDate(dates[0]);
    }
  }, [dates, activeDate]);

  useEffect(() => {
    if (activeDate && activeBooking) {
      const existing = getMealSelection(activeBooking.id, activeDate, activePeriod);
      if (existing) {
        setSelectedItemId(existing.menuItemIds[0] || null);
        setNotes(existing.notes || '');
      } else {
        setSelectedItemId(null);
        setNotes('');
      }
      setSaveSuccess(false);
    }
  }, [activeDate, activePeriod, activeBooking, getMealSelection]);

  const availableItems = menuItems.filter(
    (item) => !item.isExtra && (item.mealPeriods.includes(activePeriod) || item.mealPeriods.includes('all_day'))
  );

  const hasAllergyWarning = (item: any) => {
    return item.allergenTags.some((tag: string) => dietaryInfo.allergies.includes(tag.toLowerCase()));
  };

  const handleSave = () => {
    if (!activeBooking || !selectedItemId) return;
    saveMealSelection({
      bookingId: activeBooking.id,
      customerId,
      date: activeDate,
      mealPeriod: activePeriod,
      menuItemIds: [selectedItemId],
      notes,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const selectedItem = menuItems.find((m) => m.id === selectedItemId);

  if (!activeBooking) {
    return (
      <div className="hsw-dining-container">
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-12) var(--space-6)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            maxWidth: '540px',
            margin: 'var(--space-8) auto',
          }}
        >
          <Info size={36} style={{ color: 'var(--text-tertiary)', margin: '0 auto var(--space-3)' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>
            {t('dining.select.noBooking', 'No Active Retreat')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            {t('dining.select.noBookingDesc', 'You need an active retreat booking to select daily meals.')}
          </p>
          <button
            type="button"
            className="hsw-btn hsw-btn-primary"
            onClick={() => navigate('/customer/bookings')}
          >
            {t('dining.select.viewBookings', 'Return to My Bookings')}
          </button>
        </div>
      </div>
    );
  }

  const periodIcons: Record<string, React.ReactNode> = {
    breakfast: <Coffee size={16} />,
    lunch: <Sun size={16} />,
    dinner: <Moon size={16} />,
  };

  return (
    <div className="hsw-dining-container" id="screen-35-daily-meal-selection">
      {/* Page Header */}
      <div className="hsw-dining-header">
        <h1 className="hsw-dining-title">{t('dining.select.title', 'Daily Meal Selection')}</h1>
        <p className="hsw-dining-subtitle">
          {t('dining.select.subtitle', 'Plan your included retreat meals. Chef selections adapt to your wellness profile.')}
        </p>
      </div>

      {/* Main 2-Column Planning Layout (Requirement 13) */}
      <div className="hsw-meal-select-layout">
        {/* Left Sticky Planning Rail */}
        <aside className="hsw-planning-rail" aria-label="Meal planning controls">
          {/* Date Selector */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h3 className="hsw-rail-section-title">
              <Calendar size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
              {t('dining.select.selectDate', 'Retreat Days')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {dates.map((d, index) => {
                const dateObj = new Date(d);
                const isSelected = activeDate === d;
                const formattedDate = dateObj.toLocaleDateString(i18n.language || 'en', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });
                return (
                  <button
                    key={d}
                    type="button"
                    className={`hsw-date-pill-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => setActiveDate(d)}
                    id={`btn-date-${d}`}
                  >
                    <span>Day {index + 1}</span>
                    <span style={{ fontSize: '12px', opacity: 0.85 }}>{formattedDate}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meal Period Selector */}
          <div>
            <h3 className="hsw-rail-section-title">
              <Clock size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
              {t('dining.select.selectPeriod', 'Meal Period')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {(['breakfast', 'lunch', 'dinner'] as MealPeriod[]).map((period) => (
                <button
                  key={period}
                  type="button"
                  className={`hsw-period-pill-btn ${activePeriod === period ? 'active' : ''}`}
                  onClick={() => setActivePeriod(period)}
                  id={`btn-period-${period}`}
                >
                  {periodIcons[period]}
                  <span>{t(`dining.periods.${period}`, period.charAt(0).toUpperCase() + period.slice(1))}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Workspace: Meal Cards & Notes */}
        <div>
          {/* Active Period Workspace Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-4)',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: 'var(--space-3)',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--accent-olive)',
                }}
              >
                {t(`dining.periods.${activePeriod}`, activePeriod.toUpperCase())}
              </span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', margin: '2px 0 0 0' }}>
                {activeDate
                  ? new Date(activeDate).toLocaleDateString(i18n.language || 'en', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })
                  : ''}
              </h2>
            </div>
            <button
              type="button"
              className="hsw-btn hsw-btn-secondary"
              onClick={() => navigate('/customer/dining/orders')}
            >
              {t('dining.select.viewPlan', 'View My Plan')}
            </button>
          </div>

          {availableItems.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--space-8)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Info size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto var(--space-3)' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>
                {t('dining.select.noOptions', 'No Options Available')}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                {t(
                  'dining.select.noOptionsDesc',
                  'There are no included meal options for this period. Please check A-la-carte for extra options.'
                )}
              </p>
            </div>
          ) : (
            <>
              {/* Meal Options Grid (Requirement 14) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 'var(--space-4)',
                  marginBottom: 'var(--space-6)',
                }}
              >
                {availableItems.map((item) => {
                  const isSelected = selectedItemId === item.id;
                  const warning = hasAllergyWarning(item);
                  const localizedName = localize(item.name);
                  const localizedDesc = localize(item.description);

                  return (
                    <div
                      key={item.id}
                      className={`hsw-culinary-card hsw-selectable-meal-card ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedItemId(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedItemId(item.id);
                        }
                      }}
                      tabIndex={0}
                      role="radio"
                      aria-checked={isSelected}
                      id={`select-card-${item.id}`}
                    >
                      <div style={{ position: 'relative' }}>
                        <FoodImage src={item.image} alt={localizedName} aspectRatio="16 / 10" />
                        {isSelected && (
                          <div className="hsw-selected-badge" title="Selected">
                            <CheckCircle2 size={18} />
                          </div>
                        )}
                      </div>

                      <div className="hsw-culinary-card-body">
                        <h3 className="hsw-culinary-dish-name" style={{ marginBottom: '6px' }}>
                          {localizedName}
                        </h3>
                        <p className="hsw-culinary-desc">{localizedDesc}</p>

                        {/* Dietary Badges (Prioritized, ingredient-aware, beverage-reduced) */}
                        <DietaryBadgeList item={item} />

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

              {/* Notes & Save Section (Requirement 15) */}
              <div className="hsw-meal-save-card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-3)',
                    flexWrap: 'wrap',
                    gap: 'var(--space-2)',
                  }}
                >
                  <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, margin: 0 }}>
                    {t('dining.select.specialRequests', 'Culinary Preparation Notes (Optional)')}
                  </h3>
                  {selectedItem && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-forest)', fontWeight: 600 }}>
                      {t('dining.select.selectedBadge', 'Selected')}: {localize(selectedItem.name)}
                    </span>
                  )}
                </div>

                <textarea
                  className="hsw-input"
                  style={{ width: '100%', minHeight: '80px', marginBottom: 'var(--space-4)', resize: 'vertical' }}
                  placeholder={t('dining.select.requestsPlaceholder', 'e.g., dressing on the side, hot water with lemon')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  id="meal-selection-notes"
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="hsw-btn hsw-btn-primary"
                    disabled={!selectedItemId}
                    onClick={handleSave}
                    id="btn-save-meal-selection"
                  >
                    <CheckCircle2 size={16} />
                    <span>{t('dining.select.saveSelection', 'Save Meal Selection')}</span>
                  </button>

                  {saveSuccess && (
                    <span
                      style={{
                        color: 'var(--success)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                      }}
                      role="status"
                    >
                      <CheckCircle2 size={16} />
                      {t('dining.select.saveSuccess', 'Meal selection saved successfully for this period.')}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
