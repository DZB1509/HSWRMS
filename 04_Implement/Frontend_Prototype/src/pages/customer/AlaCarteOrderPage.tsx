import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import { useCustomer } from '../../context/CustomerContext';
import type { DietaryMenuItem, LocalizedString } from '../../types/dining';
import { AlertCircle, Minus, Plus, ShoppingBag, Info, CheckCircle2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FoodImage } from '../../components/common/FoodImage';

interface CartItem {
  menuItem: DietaryMenuItem;
  quantity: number;
  notes: string;
}

export const AlaCarteOrderPage: React.FC = () => {
  const { t, i18n } = useTranslation('customer');
  const { menuItems, getDietaryProjection, createAlaCarteOrder } = useDining();
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

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const extraItems = menuItems.filter((item) => item.isExtra);

  const hasAllergyWarning = (item: DietaryMenuItem) => {
    return item.allergenTags.some((tag) => dietaryInfo.allergies.includes(tag.toLowerCase()));
  };

  const updateQuantity = (item: DietaryMenuItem, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        const newQuantity = existing.quantity + delta;
        if (newQuantity <= 0) {
          return prev.filter((c) => c.menuItem.id !== item.id);
        }
        return prev.map((c) => (c.menuItem.id === item.id ? { ...c, quantity: newQuantity } : c));
      } else if (delta > 0) {
        return [...prev, { menuItem: item, quantity: delta, notes: '' }];
      }
      return prev;
    });
  };

  const updateNotes = (itemId: string, notes: string) => {
    setCart((prev) => prev.map((c) => (c.menuItem.id === itemId ? { ...c, notes } : c)));
  };

  const getQuantity = (itemId: string) => {
    return cart.find((c) => c.menuItem.id === itemId)?.quantity || 0;
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.menuItem.price || 0) * item.quantity, 0);

  const handleSubmit = () => {
    if (!activeBooking || cart.length === 0) return;

    createAlaCarteOrder({
      bookingId: activeBooking.id,
      customerId,
      lines: cart.map((c) => ({
        id: `L-${Date.now()}-${c.menuItem.id}`,
        menuItemId: c.menuItem.id,
        quantity: c.quantity,
        unitPrice: c.menuItem.price || 0,
        notes: c.notes,
      })),
      totalAmount,
    });

    setOrderSuccess(true);
    setCart([]);
  };

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
            {t('dining.select.noBookingDesc', 'You need an active retreat booking to place orders.')}
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

  if (orderSuccess) {
    return (
      <div className="hsw-dining-container">
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-10) var(--space-6)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            maxWidth: '560px',
            margin: 'var(--space-8) auto',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-4)',
            }}
          >
            <CheckCircle2 size={32} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-2)' }}>
            {t('dining.extra.orderRecorded', 'Order Recorded')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6, marginBottom: 'var(--space-6)' }}>
            {t(
              'dining.extra.pendingFolio',
              'Your extra A-la-carte order has been sent to our culinary team. The total amount is pending folio posting and will be settled upon stay checkout.'
            )}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="hsw-btn hsw-btn-primary"
              onClick={() => navigate('/customer/dining/orders')}
            >
              {t('dining.extra.viewOrders', 'View My Orders')}
            </button>
            <button
              type="button"
              className="hsw-btn hsw-btn-secondary"
              onClick={() => setOrderSuccess(false)}
            >
              {t('dining.extra.orderMore', 'Order More')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hsw-dining-container" id="screen-36-alacarte-order">
      {/* Page Header */}
      <div className="hsw-dining-header">
        <h1 className="hsw-dining-title">{t('dining.extra.title', 'A-la-carte Culinary Requests')}</h1>
        <p className="hsw-dining-subtitle">
          {t('dining.extra.subtitle', 'Order additional artisanal dishes and elixirs outside your included retreat plan.')}
        </p>
      </div>

      {/* 2-Column Catalogue + Sticky Summary Layout (Requirement 16) */}
      <div className="hsw-alacarte-layout">
        {/* Left Area: Catalogue Grid */}
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {extraItems.map((item) => {
              const qty = getQuantity(item.id);
              const warning = hasAllergyWarning(item);
              const localizedName = localize(item.name);
              const localizedDesc = localize(item.description);

              return (
                <div key={item.id} className="hsw-culinary-card" id={`alacarte-card-${item.id}`}>
                  <FoodImage src={item.image} alt={localizedName} aspectRatio="16 / 10" />

                  <div className="hsw-culinary-card-body">
                    <div className="hsw-culinary-card-header">
                      <h3 className="hsw-culinary-dish-name">{localizedName}</h3>
                      <div className="hsw-culinary-price">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price || 0)}
                      </div>
                    </div>

                    <p className="hsw-culinary-desc">{localizedDesc}</p>

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

                    {warning && (
                      <div className="hsw-allergy-alert-box" role="alert">
                        <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                        <span>{t('dining.menu.allergyWarning', 'Contains an allergen listed in your dietary profile.')}</span>
                      </div>
                    )}

                    {/* Quantity Stepper (Requirement 17) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 'var(--space-3)' }}>
                      {qty === 0 ? (
                        <button
                          type="button"
                          className="hsw-btn hsw-btn-secondary"
                          style={{ width: '100%' }}
                          onClick={() => updateQuantity(item, 1)}
                          id={`btn-add-${item.id}`}
                        >
                          <Plus size={15} />
                          <span>{t('dining.extra.add', 'Add to Order')}</span>
                        </button>
                      ) : (
                        <div className="hsw-stepper" style={{ width: '100%', justifyContent: 'space-between' }}>
                          <button
                            type="button"
                            className="hsw-stepper-btn"
                            onClick={() => updateQuantity(item, -1)}
                            aria-label="Decrease quantity"
                            id={`btn-minus-${item.id}`}
                          >
                            <Minus size={15} />
                          </button>
                          <span className="hsw-stepper-val" aria-live="polite">
                            {qty}
                          </span>
                          <button
                            type="button"
                            className="hsw-stepper-btn"
                            onClick={() => updateQuantity(item, 1)}
                            aria-label="Increase quantity"
                            id={`btn-plus-${item.id}`}
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sticky Order Summary (Requirement 18) */}
        <aside className="hsw-sticky-summary" aria-label="Order summary">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              margin: '0 0 var(--space-4) 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: 'var(--space-3)',
            }}
          >
            <ShoppingBag size={18} style={{ color: 'var(--accent-forest)' }} />
            <span>{t('dining.extra.summary', 'Order Summary')}</span>
          </h2>

          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6) 0', color: 'var(--text-tertiary)' }}>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
                {t('dining.extra.emptyCart', 'Your order selection is empty.')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {cart.map((c) => (
                <div
                  key={c.menuItem.id}
                  style={{
                    paddingBottom: 'var(--space-3)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                      {c.quantity}x {localize(c.menuItem.name)}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--accent-forest)' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        (c.menuItem.price || 0) * c.quantity
                      )}
                    </span>
                  </div>

                  <input
                    type="text"
                    className="hsw-input"
                    style={{ width: '100%', padding: '4px 8px', fontSize: '12px', minHeight: '32px' }}
                    placeholder={t('dining.extra.notePlaceholder', 'Specific preparation note...')}
                    value={c.notes}
                    onChange={(e) => updateNotes(c.menuItem.id, e.target.value)}
                  />
                </div>
              ))}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginTop: 'var(--space-2)',
                  paddingTop: 'var(--space-2)',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  {t('dining.extra.total', 'Total Amount')}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--text-xl)',
                    fontWeight: 700,
                    color: 'var(--accent-forest)',
                  }}
                >
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                </span>
              </div>

              {/* Prototype Safe Disclaimers */}
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  backgroundColor: 'var(--bg-soft)',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-xs)',
                  lineHeight: 1.4,
                  marginTop: 'var(--space-2)',
                }}
              >
                {t(
                  'dining.extra.folioDisclaimer',
                  'Pending Folio Posting — will be included in your stay checkout folio.'
                )}
              </div>

              <button
                type="button"
                className="hsw-btn hsw-btn-primary"
                style={{ width: '100%', marginTop: 'var(--space-3)' }}
                onClick={handleSubmit}
                id="btn-submit-alacarte-order"
              >
                {t('dining.extra.submit', 'Confirm & Send Order')}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
