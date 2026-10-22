import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import { useCustomer } from '../../context/CustomerContext';
import { isItemDietaryCompatible } from '../../utils/dietaryFilter';
import type { MealPeriod, LocalizedString } from '../../types/dining';
import { AlertCircle, CheckCircle2, Info, Calendar, Clock, Sun, Moon, Coffee, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FoodImage } from '../../components/common/FoodImage';
import { DietaryBadgeList } from '../../components/dining/DietaryBadgeList';
import { AmanoiDiningLocationPicker } from '../../components/dining/AmanoiDiningLocationPicker';
import {
  parseDiningNotes,
  buildAmanoiDiningNotes,
  type DiningServiceLocation,
} from '../../utils/diningServiceHelper';

export const DailyMealSelectionPage: React.FC = () => {
  const { t, i18n } = useTranslation('customer');
  const { menuItems, getDietaryProjection, saveMealSelection, getMealSelection } = useDining();
  const { activeBooking, wellnessProfile } = useCustomer();
  const navigate = useNavigate();

  const currentLang = (i18n.language || 'en') as keyof LocalizedString;
  const localize = (ls?: LocalizedString | null): string => {
    if (!ls) return '';
    if (typeof ls === 'string') return ls;
    return ls[currentLang] || ls.en || Object.values(ls)[0] || '';
  };

  const customerId = 'usr-cust-01';
  const dietaryInfo = getDietaryProjection(customerId);

  const dietaryRestrictions = wellnessProfile?.dietaryProfile?.dietaryRestrictions?.length
    ? wellnessProfile.dietaryProfile.dietaryRestrictions
    : dietaryInfo.dietaryRestrictions;
  const allergies = wellnessProfile?.dietaryProfile?.allergies?.length
    ? wellnessProfile.dietaryProfile.allergies
    : dietaryInfo.allergies;

  const [activeDate, setActiveDate] = useState<string>('');
  const [activePeriod, setActivePeriod] = useState<MealPeriod>('breakfast');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [portionCount, setPortionCount] = useState<number>(1);
  const [diningLocation, setDiningLocation] = useState<DiningServiceLocation>('DINING_PAVILION');
  const [selectedWellnessTags, setSelectedWellnessTags] = useState<string[]>([]);
  const [customNotes, setCustomNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);


  const todayStr = React.useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Calculate dates based on the guest's booked retreat package, strictly excluding past dates
  const dates = React.useMemo(() => {
    if (!activeBooking) return [];
    const start = new Date(activeBooking.startDate);
    const end = new Date(activeBooking.endDate);
    const result: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      // Exclude past dates (only current date or future dates are displayed)
      if (dateStr >= todayStr) {
        result.push(dateStr);
      }
    }
    // Fallback: If all retreat booking dates were in the past, provide active dates starting from today
    if (result.length === 0) {
      const base = new Date();
      for (let i = 0; i < 4; i++) {
        const next = new Date(base);
        next.setDate(base.getDate() + i);
        result.push(next.toISOString().split('T')[0]);
      }
    }
    return result;
  }, [activeBooking, todayStr]);

  // Automatically default to the first available date (current date or nearest future date)
  useEffect(() => {
    if (dates.length > 0 && (!activeDate || !dates.includes(activeDate) || activeDate < todayStr)) {
      setActiveDate(dates[0]);
    }
  }, [dates, activeDate, todayStr]);

  useEffect(() => {
    if (activeDate && activeBooking) {
      const existing = getMealSelection(activeBooking.id, activeDate, activePeriod);
      if (existing) {
        setSelectedItemId(existing.menuItemIds[0] || null);
        setPortionCount(existing.quantity || (existing.items && existing.items[0]?.quantity) || 1);
        const parsed = parseDiningNotes(existing.notes);
        setDiningLocation(parsed.location);
        setSelectedWellnessTags(parsed.wellnessTags);
        setCustomNotes(parsed.cleanNotes);
      } else {
        setSelectedItemId(null);
        setPortionCount(1);
        setDiningLocation('DINING_PAVILION');
        setSelectedWellnessTags([]);
        setCustomNotes('');
      }
      setSaveSuccess(false);
    }
  }, [activeDate, activePeriod, activeBooking, getMealSelection]);

  const availableItems = menuItems.filter(
    (item) =>
      !item.isExtra &&
      (item.mealPeriods.includes(activePeriod) || item.mealPeriods.includes('all_day')) &&
      isItemDietaryCompatible(item, dietaryRestrictions, allergies)
  );

  const hasAllergyWarning = (item: any) => {
    return item.allergenTags.some((tag: string) => allergies.includes(tag.toLowerCase()));
  };

  const handleToggleTag = (tag: string) => {
    setSelectedWellnessTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    if (!activeBooking || !selectedItemId) return;
    const finalNotes = buildAmanoiDiningNotes(
      diningLocation,
      selectedWellnessTags,
      customNotes,
      activeBooking.villaNumber
    );

    saveMealSelection({
      bookingId: activeBooking.id,
      customerId,
      date: activeDate,
      mealPeriod: activePeriod,
      menuItemIds: [selectedItemId],
      quantity: portionCount,
      items: [{ menuItemId: selectedItemId, quantity: portionCount, notes: finalNotes }],
      notes: finalNotes,
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
          {/* Booked Retreat Package Sync Banner */}
          {activeBooking && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--bg-soft)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--space-3)',
                borderLeft: '3px solid var(--accent-forest)',
              }}
              id="synced-retreat-package-card"
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--accent-olive)',
                  marginBottom: '2px',
                }}
              >
                {t('dining.select.retreatPackage', 'Retreat Package')}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {localize(activeBooking.retreatName)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                {activeBooking.villaNumber} · {dates[0] || activeBooking.startDate} → {dates[dates.length - 1] || activeBooking.endDate}
              </div>
            </div>
          )}

          {/* Date Selector */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h3 className="hsw-rail-section-title">
              <Calendar size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
              {t('dining.select.selectDate', 'Retreat Days')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {dates.map((d, index) => {
                const dateObj = new Date(d);
                const isSelected = activeDate === d;
                const isToday = d === todayStr;
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
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      position: 'relative',
                    }}
                    id={`btn-date-${d}`}
                    title={formattedDate}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>Day {index + 1}</span>
                      {isToday && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-pill)',
                            backgroundColor: 'rgba(46, 90, 54, 0.12)',
                            color: 'var(--accent-forest, #2e5a36)',
                          }}
                        >
                          {t('labels.today', 'Hôm nay')}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', opacity: 0.85 }}>{formattedDate}</span>
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

          {/* Dietary Safeguard Notice */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(46, 125, 50, 0.08)',
              border: '1px solid rgba(46, 125, 50, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              marginBottom: 'var(--space-4)',
              fontSize: '12px',
              color: 'var(--text-primary)',
            }}
          >
            <ShieldCheck size={18} style={{ color: '#2e7d32', flexShrink: 0 }} />
            <div>
              <span style={{ fontWeight: 600 }}>
                {t('dining.select.safeguardTitle', 'Tự động lọc theo hồ sơ dưỡng sinh')}:
              </span>{' '}
              <span style={{ color: 'var(--accent-forest, #2e7d32)' }}>
                {dietaryRestrictions.join(', ') || 'Ăn chay'}
              </span>
              {allergies.length > 0 && (
                <span style={{ color: 'var(--text-danger, #d32f2f)', marginLeft: '6px' }}>
                  (Dị ứng: {allergies.join(', ')})
                </span>
              )}
              . {t('dining.select.safeguardDesc', 'Chỉ những món phù hợp với chế độ ăn chay và không gây dị ứng mới được hiển thị.')}
            </div>
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
                  const isAvailable = item.available !== false && (item.availableServings === undefined || item.availableServings > 0);

                  return (
                    <div
                      key={item.id}
                      className={`hsw-culinary-card hsw-selectable-meal-card ${isSelected ? 'is-selected' : ''} ${!isAvailable ? 'is-unavailable' : ''}`}
                      style={{
                        opacity: isAvailable ? 1 : 0.62,
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                        position: 'relative',
                      }}
                      onClick={() => {
                        if (!isAvailable) return;
                        if (selectedItemId !== item.id) {
                          setSelectedItemId(item.id);
                          setPortionCount(1);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (!isAvailable) return;
                          if (selectedItemId !== item.id) {
                            setSelectedItemId(item.id);
                            setPortionCount(1);
                          }
                        }
                      }}
                      tabIndex={isAvailable ? 0 : -1}
                      role="radio"
                      aria-checked={isSelected}
                      aria-disabled={!isAvailable}
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
                        {/* Header: Name & Availability Indicator Pill */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                          <h3 className="hsw-culinary-dish-name" style={{ margin: 0, flex: 1, fontSize: '15px' }}>
                            {localizedName}
                          </h3>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                              backgroundColor: isAvailable ? 'rgba(46, 125, 50, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                              color: isAvailable ? 'var(--accent-forest)' : '#d32f2f',
                              border: `1px solid ${isAvailable ? 'rgba(46, 125, 50, 0.25)' : 'rgba(211, 47, 47, 0.25)'}`,
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                            id={`availability-badge-${item.id}`}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: isAvailable ? 'var(--accent-forest)' : '#d32f2f',
                              }}
                            />
                            {isAvailable ? t('dining.select.available', 'Sẵn sàng') : t('dining.select.unavailable', 'Tạm hết')}
                          </span>
                        </div>

                        {/* Dish Description */}
                        <p className="hsw-culinary-desc">{localizedDesc}</p>

                        {/* Price Display directly below dish description */}
                        <div
                          className="hsw-culinary-dish-price"
                          style={{
                            margin: '8px 0',
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: '6px',
                          }}
                          id={`price-tag-${item.id}`}
                        >
                          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-forest)' }}>
                            {item.price && item.price > 0
                              ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)
                              : '85.000 ₫'}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                            ({t('dining.select.includedInPackage', 'Đã bao gồm trong gói')})
                          </span>
                        </div>

                        {/* Dietary Badges */}
                        <DietaryBadgeList item={item} />

                        {warning && (
                          <div className="hsw-allergy-alert-box" role="alert" style={{ marginTop: '8px' }}>
                            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                            <span>{t('dining.menu.allergyWarning', 'Contains an allergen listed in your dietary profile.')}</span>
                          </div>
                        )}

                        {/* Quantity / Portion Selector on card when selected */}
                        {isSelected && isAvailable && (
                          <div
                            className="hsw-portion-selector-box"
                            style={{
                              marginTop: 'var(--space-3)',
                              padding: '8px 12px',
                              backgroundColor: 'var(--bg-soft)',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                            onClick={(e) => e.stopPropagation()}
                            id={`portion-selector-${item.id}`}
                          >
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                              {t('dining.select.portionCount', 'Khẩu phần / Số lượng')}:
                            </span>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                className="hsw-btn hsw-btn-secondary hsw-btn-sm"
                                style={{ padding: '0 8px', height: '26px', minWidth: '26px', fontWeight: 700 }}
                                onClick={() => setPortionCount((prev) => Math.max(1, prev - 1))}
                                id={`btn-portion-dec-${item.id}`}
                                title="Giảm số lượng"
                              >
                                -
                              </button>
                              <span style={{ fontWeight: 700, fontSize: '13px', minWidth: '60px', textAlign: 'center', color: 'var(--text-primary)' }}>
                                {portionCount} {t('dining.select.portion', 'suất')}
                              </span>
                              <button
                                type="button"
                                className="hsw-btn hsw-btn-secondary hsw-btn-sm"
                                style={{ padding: '0 8px', height: '26px', minWidth: '26px', fontWeight: 700 }}
                                onClick={() => setPortionCount((prev) => Math.min(10, prev + 1))}
                                id={`btn-portion-inc-${item.id}`}
                                title="Tăng số lượng"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Amanoi Luxury Wellness Dining Venue & Requests Section */}
              <AmanoiDiningLocationPicker
                location={diningLocation}
                onLocationChange={setDiningLocation}
                selectedTags={selectedWellnessTags}
                onToggleTag={handleToggleTag}
                customNotes={customNotes}
                onCustomNotesChange={setCustomNotes}
                villaNumber={activeBooking.villaNumber}
                lang={currentLang === 'vi' ? 'vi' : 'en'}
              />

              <div className="hsw-meal-save-card">
                {selectedItem && (
                  <div style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-forest)', fontWeight: 700 }}>
                      {t('dining.select.selectedBadge', 'Selected')}: {portionCount}x {localize(selectedItem.name)}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                      {diningLocation === 'IN_VILLA'
                        ? '🏡 Phục vụ riêng tại Biệt thự'
                        : '🍽️ Phục vụ tại Nhà hàng Trung tâm'}
                    </span>
                  </div>
                )}


                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="hsw-btn hsw-btn-primary"
                    disabled={!selectedItemId || activeDate < todayStr}
                    onClick={handleSave}
                    id="btn-save-meal-selection"
                  >
                    <CheckCircle2 size={16} />
                    <span>{t('dining.select.saveSelection', 'Save Meal Selection')}</span>
                  </button>

                  {activeDate < todayStr && (
                    <span style={{ color: '#d32f2f', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      {t('dining.select.pastDateNotice', 'Past date — meal selection cannot be modified')}
                    </span>
                  )}

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
