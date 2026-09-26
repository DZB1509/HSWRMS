import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import { useCustomer } from '../../context/CustomerContext';
import type { MealPeriod } from '../../types/dining';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DailyMealSelectionPage: React.FC = () => {
  const { t } = useTranslation('customer');
  const { menuItems, getDietaryProjection, saveMealSelection, getMealSelection } = useDining();
  const { activeBooking } = useCustomer();
  const navigate = useNavigate();

  // If no active booking, we shouldn't allow selection
  const [activeDate, setActiveDate] = useState<string>('');
  const [activePeriod, setActivePeriod] = useState<MealPeriod>('breakfast');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const customerId = 'usr-cust-01';
  const dietaryInfo = getDietaryProjection(customerId);
  
  // Calculate dates based on booking
  const dates = React.useMemo(() => {
    if (!activeBooking) return [];
    const start = new Date(activeBooking.startDate);
    const end = new Date(activeBooking.endDate);
    const result = [];
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

  const availableItems = menuItems.filter(item => 
    !item.isExtra && 
    (item.mealPeriods.includes(activePeriod) || item.mealPeriods.includes('all_day'))
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
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (!activeBooking) {
    return (
      <div className="hsw-page-container">
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <Info size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto var(--space-3)' }} />
          <h3>{t('dining.select.noBooking', 'No Active Retreat')}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{t('dining.select.noBookingDesc', 'You need an active retreat booking to select daily meals.')}</p>
          <button className="hsw-btn hsw-btn-primary" style={{ marginTop: 'var(--space-3)' }} onClick={() => navigate('/customer/bookings')}>
            {t('dining.select.viewBookings', 'Return to My Bookings')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hsw-page-container">
      <div className="hsw-page-header">
        <h1 className="hsw-page-title">{t('dining.select.title', 'Daily Meal Selection')}</h1>
        <p className="hsw-page-subtitle">
          {t('dining.select.subtitle', 'Plan your included retreat meals. Chef selections adapt to your wellness profile.')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* Left Sidebar: Date & Period Selection */}
        <div className="hsw-card" style={{ padding: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-3)' }}>{t('dining.select.selectDate', 'Select Date')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--space-4)' }}>
            {dates.map(date => (
              <button 
                key={date}
                className={`hsw-btn ${activeDate === date ? 'hsw-btn-primary' : 'hsw-btn-secondary'}`}
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => setActiveDate(date)}
              >
                {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </button>
            ))}
          </div>

          <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-3)' }}>{t('dining.select.selectPeriod', 'Meal Period')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['breakfast', 'lunch', 'dinner'].map(period => (
              <button 
                key={period}
                className={`hsw-btn ${activePeriod === period ? 'hsw-btn-primary' : 'hsw-btn-secondary'}`}
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => setActivePeriod(period as MealPeriod)}
              >
                {t(`dining.periods.${period}`, period.charAt(0).toUpperCase() + period.slice(1))}
              </button>
            ))}
          </div>
        </div>

        {/* Right Area: Options */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)' }}>
              {new Date(activeDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} 
              {' - '} 
              {t(`dining.periods.${activePeriod}`, activePeriod.charAt(0).toUpperCase() + activePeriod.slice(1))}
            </h2>
            <button className="hsw-btn hsw-btn-secondary" onClick={() => navigate('/customer/dining/orders')}>
              {t('dining.select.viewPlan', 'View My Plan')}
            </button>
          </div>

          {availableItems.length === 0 ? (
            <div className="hsw-card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <Info size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto var(--space-3)' }} />
              <h3>{t('dining.select.noOptions', 'No Options Available')}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                {t('dining.select.noOptionsDesc', 'There are no included meal options for this period. Please check A-la-carte for extra options.')}
              </p>
            </div>
          ) : (
            <>
              <div className="hsw-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                {availableItems.map(item => {
                  const isSelected = selectedItemId === item.id;
                  const warning = hasAllergyWarning(item);
                  
                  return (
                    <div 
                      key={item.id} 
                      className="hsw-card hsw-img-hover-scale"
                      style={{ 
                        padding: 0, 
                        cursor: 'pointer', 
                        border: isSelected ? '2px solid var(--accent-sand)' : '1px solid var(--border-subtle)',
                        overflow: 'hidden'
                      }}
                      onClick={() => setSelectedItemId(item.id)}
                    >
                      <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                        <img 
                          src={item.image} 
                          alt={item.name.en} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {isSelected && (
                          <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--accent-sand)', color: '#000', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                      </div>
                      <div style={{ padding: 'var(--space-3)' }}>
                        <h3 style={{ fontSize: 'var(--text-md)', marginBottom: '4px' }}>{item.name.en}</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.description.en}
                        </p>
                        
                        {warning && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '6px', background: 'var(--danger-light)', borderRadius: '4px', color: 'var(--danger)', fontSize: '11px' }}>
                            <AlertCircle size={12} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span>{t('dining.menu.allergyWarning', 'Contains allergen.')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hsw-card" style={{ padding: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-3)' }}>{t('dining.select.specialRequests', 'Preparation Notes (Optional)')}</h3>
                <textarea 
                  className="hsw-input"
                  style={{ width: '100%', minHeight: '80px', marginBottom: 'var(--space-4)', resize: 'vertical' }}
                  placeholder={t('dining.select.requestsPlaceholder', 'e.g., dressing on the side')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <button 
                    className="hsw-btn hsw-btn-primary" 
                    disabled={!selectedItemId}
                    onClick={handleSave}
                  >
                    {t('dining.select.saveSelection', 'Save Meal Selection')}
                  </button>
                  {saveSuccess && (
                    <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)' }}>
                      <CheckCircle2 size={16} />
                      {t('dining.select.saveSuccess', 'Selection saved successfully.')}
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
