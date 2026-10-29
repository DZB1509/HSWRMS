import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import { useCustomer } from '../../context/CustomerContext';
import type { LocalizedString } from '../../types/dining';
import { useNavigate } from 'react-router-dom';
import { Calendar, Coffee, Info, Receipt, ListOrdered } from 'lucide-react';

import { FoodImage } from '../../components/common/FoodImage';
import { DietaryBadgeList } from '../../components/dining/DietaryBadgeList';
import { OperationalPagination } from '../../components/operations/OperationalPagination';
import { AmanoiServiceLocationBadge } from '../../components/dining/ServiceLocationBadge';
import { parseDiningNotes } from '../../utils/diningServiceHelper';


export const MyMealPlanPage: React.FC = () => {
  const { t, i18n } = useTranslation('customer');
  const { menuItems, mealSelections, alaCarteOrders } = useDining();
  const { activeBooking } = useCustomer();
  const navigate = useNavigate();

  const currentLang = (i18n.language || 'en') as keyof LocalizedString;
  const localize = (ls?: LocalizedString | null): string => {
    if (!ls) return '';
    if (typeof ls === 'string') return ls;
    return ls[currentLang] || ls.en || Object.values(ls)[0] || '';
  };

  const [activeTab, setActiveTab] = useState<'meal_plan' | 'extra_orders'>('meal_plan');
  const [extraOrdersPage, setExtraOrdersPage] = useState(1);
  const extraOrdersPageSize = 6;

  const customerId = 'usr-cust-01';

  const handleTabChange = (tab: 'meal_plan' | 'extra_orders') => {
    setActiveTab(tab);
    setExtraOrdersPage(1);
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
            {t('dining.select.noBookingDesc', 'You need an active retreat booking to view meal plans.')}
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

  // Filter for active booking (or match customerId)
  const mySelections = mealSelections.filter(
    (s) => (s.bookingId === activeBooking.id || s.customerId === customerId)
  );

  const myOrders = alaCarteOrders.filter(
    (o) => (o.bookingId === activeBooking.id || o.customerId === customerId)
  );

  // Group selections by date
  const groupedSelections = mySelections.reduce((acc, sel) => {
    if (!acc[sel.date]) acc[sel.date] = [];
    acc[sel.date].push(sel);
    return acc;
  }, {} as Record<string, typeof mySelections>);

  const sortedDates = Object.keys(groupedSelections).sort();

  // Paginated Extra Orders (Requirement 21)
  const totalExtraOrders = myOrders.length;
  const paginatedExtraOrders = myOrders.slice(
    (extraOrdersPage - 1) * extraOrdersPageSize,
    extraOrdersPage * extraOrdersPageSize
  );

  const formatStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: t('dining.status.pending', 'Pending'), bg: 'var(--bg-soft)', color: 'var(--text-secondary)' };
      case 'preparing':
        return { label: t('dining.status.preparing', 'Preparing'), bg: '#fef3e2', color: '#9a6114' };
      case 'ready':
        return { label: t('dining.status.ready', 'Ready for Delivery'), bg: '#eef6fc', color: '#1a689e' };
      case 'delivered':
        return { label: t('dining.status.delivered', 'Delivered'), bg: 'var(--success-bg)', color: 'var(--success)' };
      case 'cancelled':
        return { label: t('dining.status.cancelled', 'Cancelled'), bg: 'var(--danger-bg)', color: 'var(--danger)' };
      default:
        return { label: status.toUpperCase(), bg: 'var(--bg-soft)', color: 'var(--text-secondary)' };
    }
  };

  return (

    <div className="hsw-dining-container" id="screen-37-my-meal-plan">
      {/* Header */}
      <div className="hsw-dining-header">
        <h1 className="hsw-dining-title">{t('dining.orders.title', 'My Meal Plan & Orders')}</h1>
        <p className="hsw-dining-subtitle">
          {t('dining.orders.subtitle', 'Review your retreat dining itinerary and extra a-la-carte requests.')}
        </p>
      </div>

      {/* Segmented Tab Bar (Requirement 19 - cleanly separated controls) */}
      <div className="hsw-segmented-tabs" role="tablist" aria-label="Dining Itinerary Tabs">
        <button
          type="button"
          className={`hsw-segmented-tab ${activeTab === 'meal_plan' ? 'active' : ''}`}
          onClick={() => handleTabChange('meal_plan')}
          role="tab"
          aria-selected={activeTab === 'meal_plan'}
          id="tab-retreat-meal-plan"
        >
          <Calendar size={15} />
          <span>{t('dining.orders.mealPlanTab', 'Retreat Meal Plan')}</span>
        </button>
        <button
          type="button"
          className={`hsw-segmented-tab ${activeTab === 'extra_orders' ? 'active' : ''}`}
          onClick={() => handleTabChange('extra_orders')}
          role="tab"
          aria-selected={activeTab === 'extra_orders'}
          id="tab-extra-orders"
        >
          <Coffee size={15} />
          <span>{t('dining.orders.extraOrdersTab', 'Extra A-la-carte Orders')}</span>
          {myOrders.length > 0 && (
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: activeTab === 'extra_orders' ? 'var(--accent-forest)' : 'var(--border-strong)',
                color: '#ffffff',
                fontWeight: 600,
              }}
            >
              {myOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Retreat Meal Plan (Grouped by Day, Requirement 20) */}
      {activeTab === 'meal_plan' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
            <button
              type="button"
              className="hsw-btn hsw-btn-secondary"
              onClick={() => navigate('/customer/dining/select')}
              id="btn-modify-meal-plan"
            >
              {t('dining.orders.changeSelection', 'Modify Meal Selection')}
            </button>
          </div>

          {sortedDates.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--space-10) var(--space-6)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                maxWidth: '560px',
                margin: 'var(--space-4) auto',
              }}
            >
              <Calendar size={36} style={{ color: 'var(--text-tertiary)', margin: '0 auto var(--space-3)' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>
                {t('dining.orders.noSelections', 'No Meals Selected')}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                {t('dining.orders.noSelectionsDesc', 'You have not selected meals for your retreat days yet.')}
              </p>
              <button
                type="button"
                className="hsw-btn hsw-btn-primary"
                onClick={() => navigate('/customer/dining/select')}
              >
                {t('dining.menu.planMeals', 'Plan Retreat Meals Now')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {sortedDates.map((date) => {
                const dateObj = new Date(date);
                const formattedDate = dateObj.toLocaleDateString(i18n.language || 'en', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                });

                return (
                  <div
                    key={date}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 'var(--space-4)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderBottom: '1px solid var(--border-subtle)',
                        paddingBottom: 'var(--space-2)',
                        marginBottom: 'var(--space-4)',
                      }}
                    >
                      <Calendar size={16} style={{ color: 'var(--accent-forest)' }} />
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', margin: 0 }}>
                        {formattedDate}
                      </h2>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: 'var(--space-4)',
                      }}
                    >
                      {groupedSelections[date].map((sel) => {
                        const item = menuItems.find((m) => m.id === sel.menuItemIds[0]);
                        if (!item) return null;
                        const statusObj = formatStatus(sel.status);
                        const localizedName = localize(item.name);

                        return (
                          <div
                            key={sel.id}
                            className="hsw-culinary-card"
                            style={{ flexDirection: 'row', alignItems: 'stretch' }}
                          >
                            <div style={{ width: '120px', flexShrink: 0 }}>
                              <FoodImage src={item.image} alt={localizedName} aspectRatio="1 / 1" />
                            </div>

                            <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '4px',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    color: 'var(--accent-olive)',
                                  }}
                                >
                                  {t(`dining.periods.${sel.mealPeriod}`, sel.mealPeriod)}
                                </span>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-pill)',
                                    backgroundColor: statusObj.bg,
                                    color: statusObj.color,
                                  }}
                                >
                                  {statusObj.label}
                                </span>
                              </div>

                              <h3 className="hsw-culinary-dish-name" style={{ fontSize: 'var(--text-md)', marginBottom: '4px' }}>
                                {localizedName}
                              </h3>
                              <DietaryBadgeList item={item} maxBadges={2} />

                              {/* Amanoi Service Location & Requests Badge */}
                              <div style={{ marginTop: '6px' }}>
                                <AmanoiServiceLocationBadge
                                  notes={sel.notes}
                                  villaNumber={activeBooking?.villaNumber}
                                  compact={false}
                                  lang={currentLang === 'vi' ? 'vi' : 'en'}
                                />
                              </div>

                              {(() => {
                                const parsed = parseDiningNotes(sel.notes);
                                return parsed.cleanNotes ? (
                                  <p
                                    style={{
                                      fontSize: '11px',
                                      fontStyle: 'italic',
                                      color: 'var(--text-secondary)',
                                      margin: '4px 0 0 0',
                                      backgroundColor: 'var(--bg-soft)',
                                      padding: '3px 6px',
                                      borderRadius: 'var(--radius-xs)',
                                    }}
                                  >
                                    "{parsed.cleanNotes}"
                                  </p>
                                ) : null;
                              })()}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Extra A-la-carte Orders (Paginated, Requirement 21 & 22) */}
      {activeTab === 'extra_orders' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
            <button
              type="button"
              className="hsw-btn hsw-btn-secondary"
              onClick={() => navigate('/customer/dining/extra')}
              id="btn-order-more-alacarte"
            >
              <Coffee size={15} />
              <span>{t('dining.orders.orderMore', 'Order A-la-carte')}</span>
            </button>
          </div>

          {myOrders.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--space-10) var(--space-6)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                maxWidth: '560px',
                margin: 'var(--space-4) auto',
              }}
            >
              <ListOrdered size={36} style={{ color: 'var(--text-tertiary)', margin: '0 auto var(--space-3)' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>
                {t('dining.orders.noOrders', 'No Extra Orders Placed')}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                {t('dining.orders.noOrdersDesc', 'You have not placed any extra culinary or beverage requests.')}
              </p>
              <button
                type="button"
                className="hsw-btn hsw-btn-primary"
                onClick={() => navigate('/customer/dining/extra')}
              >
                {t('dining.orders.orderMore', 'Browse A-la-carte Catalogue')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {paginatedExtraOrders.map((order) => {
                const statusObj = formatStatus(order.status);
                const orderDate = new Date(order.createdAt).toLocaleDateString(i18n.language || 'en', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const orderTime = order.targetTime || new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={order.id} className="hsw-order-card" id={`order-card-${order.id}`}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        borderBottom: '1px solid var(--border-subtle)',
                        paddingBottom: 'var(--space-3)',
                        marginBottom: 'var(--space-3)',
                        flexWrap: 'wrap',
                        gap: 'var(--space-2)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                            {order.id}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                              backgroundColor: statusObj.bg,
                              color: statusObj.color,
                            }}
                          >
                            {statusObj.label}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          {orderDate} · {orderTime}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--accent-forest)' }}>
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--accent-olive)', fontWeight: 600 }}>
                          {t('dining.orders.folioStatus', 'Pending Stay Folio')}
                        </div>
                      </div>
                    </div>

                    {/* Order Line Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--space-3)' }}>
                      {order.lines.map((line) => {
                        const item = menuItems.find((m) => m.id === line.menuItemId);
                        return (
                          <div
                            key={line.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 'var(--text-sm)',
                              alignItems: 'center',
                            }}
                          >
                            <span>
                              <strong>{line.quantity}x</strong> {item ? localize(item.name) : 'Culinary Item'}
                              {line.notes && (
                                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                                  ({line.notes})
                                </span>
                              )}
                            </span>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                                line.quantity * line.unitPrice
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Delivery Location Footer */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'var(--bg-soft)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '12px',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <AmanoiServiceLocationBadge
                        notes={order.location}
                        villaNumber={activeBooking?.villaNumber}
                        compact={true}
                        lang={currentLang === 'vi' ? 'vi' : 'en'}
                      />
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)' }}>
                        <Receipt size={13} />
                        <span>Will be settled at reception checkout</span>
                      </span>
                    </div>

                  </div>
                );
              })}

              {/* Extra Orders Pagination (Requirement 21) */}
              {totalExtraOrders > extraOrdersPageSize && (
                <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'center' }}>
                  <OperationalPagination
                    currentPage={extraOrdersPage}
                    totalItems={totalExtraOrders}
                    pageSize={extraOrdersPageSize}
                    onPageChange={(page) => setExtraOrdersPage(page)}
                    compact
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
