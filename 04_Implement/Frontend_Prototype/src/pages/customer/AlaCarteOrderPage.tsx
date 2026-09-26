import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import { useCustomer } from '../../context/CustomerContext';
import type { DietaryMenuItem } from '../../types/dining';
import { AlertCircle, Minus, Plus, ShoppingBag, Info, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CartItem {
  menuItem: DietaryMenuItem;
  quantity: number;
  notes: string;
}

export const AlaCarteOrderPage: React.FC = () => {
  const { t } = useTranslation('customer');
  const { menuItems, getDietaryProjection, createAlaCarteOrder } = useDining();
  const { activeBooking } = useCustomer();
  const navigate = useNavigate();

  const customerId = 'usr-cust-01';
  const dietaryInfo = getDietaryProjection(customerId);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const extraItems = menuItems.filter(item => item.isExtra);

  const hasAllergyWarning = (item: DietaryMenuItem) => {
    return item.allergenTags.some(tag => dietaryInfo.allergies.includes(tag.toLowerCase()));
  };

  const updateQuantity = (item: DietaryMenuItem, delta: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id);
      if (existing) {
        const newQuantity = existing.quantity + delta;
        if (newQuantity <= 0) {
          return prev.filter(c => c.menuItem.id !== item.id);
        }
        return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: newQuantity } : c);
      } else if (delta > 0) {
        return [...prev, { menuItem: item, quantity: delta, notes: '' }];
      }
      return prev;
    });
  };

  const updateNotes = (itemId: string, notes: string) => {
    setCart(prev => prev.map(c => c.menuItem.id === itemId ? { ...c, notes } : c));
  };

  const getQuantity = (itemId: string) => {
    return cart.find(c => c.menuItem.id === itemId)?.quantity || 0;
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.menuItem.price || 0) * item.quantity, 0);

  const handleSubmit = () => {
    if (!activeBooking || cart.length === 0) return;
    
    createAlaCarteOrder({
      bookingId: activeBooking.id,
      customerId,
      lines: cart.map(c => ({
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
      <div className="hsw-page-container">
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <Info size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto var(--space-3)' }} />
          <h3>{t('dining.select.noBooking', 'No Active Retreat')}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{t('dining.select.noBookingDesc', 'You need an active retreat booking to place orders.')}</p>
          <button className="hsw-btn hsw-btn-primary" style={{ marginTop: 'var(--space-3)' }} onClick={() => navigate('/customer/bookings')}>
            {t('dining.select.viewBookings', 'Return to My Bookings')}
          </button>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="hsw-page-container">
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <CheckCircle2 size={48} style={{ color: 'var(--success)', margin: '0 auto var(--space-4)' }} />
          <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-3)' }}>{t('dining.extra.orderRecorded', 'Order Recorded')}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            {t('dining.extra.pendingFolio', 'Your extra A-la-carte order has been sent to the culinary team. The total will be pending folio posting upon checkout.')}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <button className="hsw-btn hsw-btn-primary" onClick={() => navigate('/customer/dining/orders')}>
              {t('dining.extra.viewOrders', 'View My Orders')}
            </button>
            <button className="hsw-btn hsw-btn-secondary" onClick={() => setOrderSuccess(false)}>
              {t('dining.extra.orderMore', 'Order More')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hsw-page-container">
      <div className="hsw-page-header">
        <h1 className="hsw-page-title">{t('dining.extra.title', 'A-la-carte Orders')}</h1>
        <p className="hsw-page-subtitle">
          {t('dining.extra.subtitle', 'Order additional culinary delights outside your included retreat plan.')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* Left Area: Catalogue */}
        <div>
          <div className="hsw-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {extraItems.map(item => {
              const qty = getQuantity(item.id);
              const warning = hasAllergyWarning(item);
              
              return (
                <div key={item.id} className="hsw-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: 0 }}>
                  <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                    <img 
                      src={item.image} 
                      alt={item.name.en} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: 0 }}>{item.name.en}</h3>
                      <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--accent-forest)' }}>
                        {item.price?.toLocaleString()} VND
                      </div>
                    </div>
                    
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: 'var(--space-3)', flex: 1 }}>
                      {item.description.en}
                    </p>

                    {warning && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px', background: 'var(--danger-light)', borderRadius: '4px', color: 'var(--danger)', fontSize: '12px', marginBottom: '12px' }}>
                        <AlertCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>{t('dining.menu.allergyWarning', 'Contains allergen.')}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      {qty === 0 ? (
                        <button className="hsw-btn hsw-btn-secondary" style={{ width: '100%' }} onClick={() => updateQuantity(item, 1)}>
                          {t('dining.extra.add', 'Add to Order')}
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
                          <button className="hsw-btn" style={{ padding: '4px', minHeight: 'auto', background: 'var(--bg-primary)' }} onClick={() => updateQuantity(item, -1)}>
                            <Minus size={16} />
                          </button>
                          <span style={{ fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                          <button className="hsw-btn" style={{ padding: '4px', minHeight: 'auto', background: 'var(--bg-primary)' }} onClick={() => updateQuantity(item, 1)}>
                            <Plus size={16} />
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

        {/* Right Sidebar: Order Summary */}
        <div className="hsw-card" style={{ padding: 'var(--space-4)', position: 'sticky', top: '24px' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} />
            {t('dining.extra.summary', 'Order Summary')}
          </h3>

          {cart.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-4) 0' }}>
              {t('dining.extra.emptyCart', 'Your order is empty.')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {cart.map(c => (
                <div key={c.menuItem.id} style={{ paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 500 }}>{c.quantity}x {c.menuItem.name.en}</span>
                    <span style={{ fontWeight: 600 }}>{((c.menuItem.price || 0) * c.quantity).toLocaleString()} VND</span>
                  </div>
                  <input 
                    type="text" 
                    className="hsw-input" 
                    style={{ width: '100%', padding: '4px 8px', fontSize: '12px', minHeight: '32px' }}
                    placeholder={t('dining.extra.notePlaceholder', 'Notes...')}
                    value={c.notes}
                    onChange={(e) => updateNotes(c.menuItem.id, e.target.value)}
                  />
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-2)', fontSize: 'var(--text-lg)', fontWeight: 600 }}>
                <span>{t('dining.extra.total', 'Total')}</span>
                <span>{totalAmount.toLocaleString()} VND</span>
              </div>
              
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '4px' }}>
                {t('dining.extra.folioDisclaimer', 'Will be posted to your folio at checkout.')}
              </div>

              <button 
                className="hsw-btn hsw-btn-primary" 
                style={{ width: '100%', marginTop: 'var(--space-3)' }}
                onClick={handleSubmit}
              >
                {t('dining.extra.submit', 'Submit Order')}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
