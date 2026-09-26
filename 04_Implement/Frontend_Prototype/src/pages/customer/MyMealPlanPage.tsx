import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import { useCustomer } from '../../context/CustomerContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Coffee, ListOrdered, Info } from 'lucide-react';

export const MyMealPlanPage: React.FC = () => {
  const { t } = useTranslation('customer');
  const { menuItems, mealSelections, alaCarteOrders } = useDining();
  const { activeBooking } = useCustomer();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'meal_plan' | 'extra_orders'>('meal_plan');

  const customerId = 'usr-cust-01';

  if (!activeBooking) {
    return (
      <div className="hsw-page-container">
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <Info size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto var(--space-3)' }} />
          <h3>{t('dining.select.noBooking', 'No Active Retreat')}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{t('dining.select.noBookingDesc', 'You need an active retreat booking to view meal plans.')}</p>
          <button className="hsw-btn hsw-btn-primary" style={{ marginTop: 'var(--space-3)' }} onClick={() => navigate('/customer/bookings')}>
            {t('dining.select.viewBookings', 'Return to My Bookings')}
          </button>
        </div>
      </div>
    );
  }

  // Filter for active booking
  const mySelections = mealSelections.filter(s => s.bookingId === activeBooking.id && s.customerId === customerId);
  const myOrders = alaCarteOrders.filter(o => o.bookingId === activeBooking.id && o.customerId === customerId);

  // Group selections by date
  const groupedSelections = mySelections.reduce((acc, sel) => {
    if (!acc[sel.date]) acc[sel.date] = [];
    acc[sel.date].push(sel);
    return acc;
  }, {} as Record<string, typeof mySelections>);

  // Sort dates
  const sortedDates = Object.keys(groupedSelections).sort();

  return (
    <div className="hsw-page-container">
      <div className="hsw-page-header">
        <h1 className="hsw-page-title">{t('dining.orders.title', 'My Meal Plan & Orders')}</h1>
        <p className="hsw-page-subtitle">
          {t('dining.orders.subtitle', 'Review your retreat dining itinerary and a-la-carte requests.')}
        </p>
      </div>

      <div className="hsw-tabs" style={{ marginBottom: 'var(--space-6)' }}>
        <button 
          className={`hsw-tab ${activeTab === 'meal_plan' ? 'active' : ''}`}
          onClick={() => setActiveTab('meal_plan')}
        >
          <Calendar size={16} />
          {t('dining.orders.mealPlanTab', 'Retreat Meal Plan')}
        </button>
        <button 
          className={`hsw-tab ${activeTab === 'extra_orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('extra_orders')}
        >
          <Coffee size={16} />
          {t('dining.orders.extraOrdersTab', 'Extra A-la-carte Orders')}
        </button>
      </div>

      {activeTab === 'meal_plan' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
            <button className="hsw-btn hsw-btn-secondary" onClick={() => navigate('/customer/dining/select')}>
              {t('dining.orders.changeSelection', 'Change Meal Selection')}
            </button>
          </div>

          {sortedDates.length === 0 ? (
            <div className="hsw-card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <Calendar size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto var(--space-3)' }} />
              <h3>{t('dining.orders.noSelections', 'No Meals Selected')}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                {t('dining.orders.noSelectionsDesc', 'You have not planned any meals yet.')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {sortedDates.map(date => (
                <div key={date}>
                  <h2 style={{ fontSize: 'var(--text-lg)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: 'var(--space-4)' }}>
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h2>
                  <div className="hsw-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
                    {groupedSelections[date].map(sel => {
                      const item = menuItems.find(m => m.id === sel.menuItemIds[0]);
                      if (!item) return null;
                      
                      return (
                        <div key={sel.id} className="hsw-card" style={{ padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)' }}>
                          <img src={item.image} alt={item.name.en} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                              {t(`dining.periods.${sel.mealPeriod}`, sel.mealPeriod)}
                            </div>
                            <h3 style={{ fontSize: 'var(--text-md)', marginBottom: '4px' }}>{item.name.en}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                              <Clock size={12} /> 
                              <span>Status: <strong style={{ color: sel.status === 'ready' ? 'var(--success)' : 'inherit' }}>{sel.status}</strong></span>
                            </div>
                            {sel.notes && (
                              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '4px' }}>
                                <strong>Note:</strong> {sel.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'extra_orders' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
            <button className="hsw-btn hsw-btn-secondary" onClick={() => navigate('/customer/dining/extra')}>
              {t('dining.orders.orderMore', 'Order A-la-carte')}
            </button>
          </div>

          {myOrders.length === 0 ? (
            <div className="hsw-card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <ListOrdered size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto var(--space-3)' }} />
              <h3>{t('dining.orders.noOrders', 'No Extra Orders')}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                {t('dining.orders.noOrdersDesc', 'You have not placed any a-la-carte orders.')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {myOrders.map(order => (
                <div key={order.id} className="hsw-card" style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: 'var(--text-md)' }}>Order {order.id}</h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>{order.totalAmount.toLocaleString()} VND</div>
                      <div style={{ fontSize: '11px', color: 'var(--accent-forest)' }}>{t('dining.orders.folioStatus', 'Pending Folio')}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {order.lines.map(line => {
                      const item = menuItems.find(m => m.id === line.menuItemId);
                      return (
                        <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                          <span>{line.quantity}x {item?.name.en || 'Unknown Item'}</span>
                          <span>{(line.quantity * line.unitPrice).toLocaleString()} VND</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Location: {order.location}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: order.status === 'delivered' ? 'var(--success)' : 'var(--text-primary)' }}>
                      Status: {order.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
