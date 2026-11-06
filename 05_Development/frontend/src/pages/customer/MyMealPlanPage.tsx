import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import { useCustomer } from '../../context/CustomerContext';
import type { LocalizedString } from '../../types/dining';
import { useNavigate } from 'react-router-dom';
import { Calendar, Coffee, Info, Receipt, ListOrdered, Clock, XCircle, AlertTriangle } from 'lucide-react';

import { FoodImage } from '../../components/common/FoodImage';
import { DietaryBadgeList } from '../../components/dining/DietaryBadgeList';
import { OperationalPagination } from '../../components/operations/OperationalPagination';
import { AmanoiServiceLocationBadge } from '../../components/dining/ServiceLocationBadge';
import { parseDiningNotes } from '../../utils/diningServiceHelper';


export const MyMealPlanPage: React.FC = () => {
  const { t, i18n } = useTranslation('customer');
  const { menuItems, mealSelections, alaCarteOrders, cancelCustomerOrder } = useDining();
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const handleConfirmCancel = async (orderId: string) => {
    if (!cancelCustomerOrder) return;
    setCancellingOrderId(orderId);
    setCancelError(null);
    try {
      await cancelCustomerOrder(orderId, 'Customer cancelled from portal');
      setConfirmCancelId(null);
    } catch (err: any) {
      setCancelError(err?.message || 'Không thể hủy đơn. Vui lòng thử lại hoặc liên hệ Lễ tân.');
    } finally {
      setCancellingOrderId(null);
    }
  };
  const { activeBooking, profile } = useCustomer();
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

  const customerId = profile?.id || 'usr-cust-01';

  const handleTabChange = (tab: 'meal_plan' | 'extra_orders') => {
    setActiveTab(tab);
    setExtraOrdersPage(1);
  };

  // Filter for active booking (or match customerId)
  const mySelections = mealSelections.filter(
    (s) => (activeBooking && s.bookingId === activeBooking.id) || (customerId && s.customerId === customerId)
  );

  const myOrders = alaCarteOrders.filter(
    (o) => (activeBooking && o.bookingId === activeBooking.id) || (customerId && o.customerId === customerId)
  );

  // Timer effect: updates every second only while there are pending orders
  useEffect(() => {
    const hasPendingDaily = mySelections.some((s) => s.status === 'pending');
    const hasPendingExtra = myOrders.some((o) => o.status === 'pending');
    if (!hasPendingDaily && !hasPendingExtra) return;

    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [mySelections, myOrders]);

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

  const getCancellationCountdown = (createdAt?: string | null): { isEligible: boolean; remainingSeconds: number; hasValidTimestamp: boolean } => {
    if (!createdAt) {
      return { isEligible: false, remainingSeconds: 0, hasValidTimestamp: false };
    }
    const createdTime = new Date(createdAt).getTime();
    if (Number.isNaN(createdTime) || createdTime <= 0) {
      return { isEligible: false, remainingSeconds: 0, hasValidTimestamp: false };
    }
    const elapsedSeconds = (nowMs - createdTime) / 1000;
    const remainingSeconds = Math.max(0, Math.ceil(30 - elapsedSeconds));
    return {
      isEligible: elapsedSeconds >= 0 && elapsedSeconds < 30,
      remainingSeconds,
      hasValidTimestamp: true,
    };
  };

  // Active selections represent current valid meal itinerary for each day.
  // Prioritizes active orders for each meal period so superseded/cancelled meals don't duplicate,
  // but displays the cancelled order if it has not been replaced so the guest sees cancellation confirmation.
  const activeSelections = Object.values(
    mySelections.reduce((acc, sel) => {
      const key = `${sel.date}_${sel.mealPeriod}`;
      const existing = acc[key];
      if (!existing) {
        acc[key] = sel;
      } else {
        if (existing.status === 'cancelled' && sel.status !== 'cancelled') {
          acc[key] = sel;
        } else if (existing.status !== 'cancelled' && sel.status === 'cancelled') {
          // Keep existing active selection
        } else {
          // Both active or both cancelled, take the later selection
          acc[key] = sel;
        }
      }
      return acc;
    }, {} as Record<string, (typeof mySelections)[0]>)
  );

  const findItem = (id: string | number) => {
    const sId = String(id).trim();
    const numId = Number(sId.replace(/\D/g, ''));
    return menuItems.find(
      (m) =>
        m.id === sId ||
        String(m.backendId) === sId ||
        (Number.isFinite(numId) && (m.backendId === numId || Number(m.id.replace(/\D/g, '')) === numId))
    );
  };

  // Group active selections by date
  const groupedSelections = activeSelections.reduce((acc, sel) => {
    if (!acc[sel.date]) acc[sel.date] = [];
    acc[sel.date].push(sel);
    return acc;
  }, {} as Record<string, typeof activeSelections>);

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
                        const lines = (sel.items && sel.items.length > 0)
                          ? sel.items.map((it) => ({
                              id: it.menuItemId,
                              quantity: it.quantity || 1,
                              menu: findItem(it.menuItemId),
                            }))
                          : sel.menuItemIds.map((id) => ({
                              id,
                              quantity: 1,
                              menu: findItem(id),
                            }));

                        const primaryItem = lines[0]?.menu;
                        const statusObj = formatStatus(sel.status);

                        return (
                          <div
                            key={sel.id}
                            className="hsw-culinary-card"
                            style={{ flexDirection: 'row', alignItems: 'stretch' }}
                          >
                            <div style={{ width: '120px', flexShrink: 0 }}>
                              <FoodImage
                                src={primaryItem?.image || ''}
                                alt={primaryItem ? localize(primaryItem.name) : 'Món ăn'}
                                aspectRatio="1 / 1"
                              />
                            </div>

                            <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '6px',
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

                              {/* Multi-dish listing */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                                {lines.map((line, idx) => {
                                  const dishName = line.menu ? localize(line.menu.name) : `Món ăn dưỡng sinh (#${line.id})`;
                                  return (
                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                      <h3
                                        className="hsw-culinary-dish-name"
                                        style={{ fontSize: 'var(--text-sm)', fontWeight: 600, margin: 0 }}
                                      >
                                        {line.quantity > 1 ? `${line.quantity}x ` : '1x '}
                                        {dishName}
                                      </h3>
                                      {line.menu && <DietaryBadgeList item={line.menu} maxBadges={2} />}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Amanoi Service Location & Requests Badge */}
                              <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
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

                              {/* Customer Cancellation Option for Pending Main Meals (30-second countdown) */}
                              {sel.status === 'pending' && (() => {
                                const cd = getCancellationCountdown(sel.createdAt);
                                if (cd.hasValidTimestamp && !cd.isEligible) {
                                  return (
                                    <div
                                      style={{
                                        fontSize: '11px',
                                        color: 'var(--text-tertiary)',
                                        fontStyle: 'italic',
                                        backgroundColor: 'var(--bg-soft)',
                                        padding: '6px 10px',
                                        borderRadius: 'var(--radius-xs)',
                                        marginTop: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                      }}
                                    >
                                      <Clock size={13} style={{ color: '#ea580c', flexShrink: 0 }} />
                                      <span>
                                        {currentLang === 'vi'
                                          ? 'Đã hết thời hạn tự hủy đơn (30 giây). Bếp đã tiếp nhận quy trình chuẩn bị.'
                                          : 'The 30-second cancellation window has expired. Kitchen is preparing your order.'}
                                      </span>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '6px 10px',
                                      backgroundColor: 'rgba(239, 68, 68, 0.04)',
                                      border: '1px dashed rgba(239, 68, 68, 0.3)',
                                      borderRadius: 'var(--radius-xs)',
                                      marginTop: '8px',
                                      flexWrap: 'wrap',
                                      gap: '6px',
                                    }}
                                  >
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                      {currentLang === 'vi'
                                        ? (cd.hasValidTimestamp
                                            ? `Quý khách có thể tự hủy đơn trong vòng ${cd.remainingSeconds} giây nữa.`
                                            : 'Đơn đang ở trạng thái Chờ tiếp nhận. Quý khách có thể tự hủy đơn nếu muốn đổi món.')
                                        : (cd.hasValidTimestamp
                                            ? `You can cancel within the next ${cd.remainingSeconds} seconds.`
                                            : 'Order is pending. You can cancel if you wish to change your meal.')}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmCancelId(sel.id)}
                                      disabled={cancellingOrderId === sel.id}
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#dc2626',
                                        backgroundColor: '#fee2e2',
                                        border: '1px solid #fca5a5',
                                        borderRadius: '4px',
                                        padding: '4px 10px',
                                        cursor: cancellingOrderId === sel.id ? 'not-allowed' : 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        flexShrink: 0,
                                      }}
                                      id={`btn-cancel-main-order-${sel.id}`}
                                    >
                                      <XCircle size={13} />
                                      <span>
                                        {cd.hasValidTimestamp
                                          ? (currentLang === 'vi' ? `Hủy đơn (${cd.remainingSeconds}s)` : `Cancel Order (${cd.remainingSeconds}s)`)
                                          : (currentLang === 'vi' ? 'Hủy đơn' : 'Cancel Order')}
                                      </span>
                                    </button>
                                  </div>
                                );
                              })()}

                              {sel.status === 'preparing' && (
                                <div
                                  style={{
                                    fontSize: '11px',
                                    color: 'var(--text-tertiary)',
                                    marginTop: '6px',
                                    fontStyle: 'italic',
                                  }}
                                >
                                  {currentLang === 'vi'
                                    ? 'ℹ️ Bếp đang tiến hành chế biến. Nếu cần thay đổi gấp, vui lòng liên hệ Lễ tân hoặc Butler qua hotline.'
                                    : 'ℹ️ Kitchen has started preparing. Please contact front desk/butler if urgent changes are needed.'}
                                </div>
                              )}

                              {sel.status === 'cancelled' && (
                                <div
                                  style={{
                                    fontSize: '11px',
                                    color: '#b91c1c',
                                    marginTop: '6px',
                                    backgroundColor: '#fef2f2',
                                    padding: '5px 8px',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Info size={12} />
                                  <span>
                                    {currentLang === 'vi'
                                      ? 'Đơn đã hủy. Quý khách có thể bấm "Điều chỉnh thực đơn" ở trên để chọn lại món.'
                                      : 'Order cancelled. You can click "Modify Meal Selection" above to choose another meal.'}
                                  </span>
                                </div>
                              )}
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
                const orderDining = parseDiningNotes(order.location || (order.lines[0]?.notes), order.createdAt);
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
                        {(order.status === 'pending' || order.status === 'preparing') && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: orderDining.isVillaDelivery ? 'rgba(217, 119, 6, 0.1)' : 'rgba(46, 90, 54, 0.1)',
                            color: orderDining.isVillaDelivery ? '#b45309' : '#2e5a36',
                          }}>
                            <Clock size={12} />
                            <span>
                              {orderDining.isVillaDelivery
                                ? (currentLang === 'vi'
                                  ? `Dự kiến giao Villa: ~${orderDining.estimatedTime || '35-45 phút'} (SLA: ${orderDining.etaWindow || '30-45 phút'})`
                                  : `In-Villa Delivery ETA: ~${orderDining.estimatedTime || '35-45 min'} (SLA: ${orderDining.etaWindow || '30-45 min'})`)
                                : (currentLang === 'vi'
                                  ? `Dự kiến phục vụ bàn: ~${orderDining.estimatedTime || '15-25 phút'} (SLA: ${orderDining.etaWindow || '15-25 phút'})`
                                  : `Table Service ETA: ~${orderDining.estimatedTime || '15-25 min'} (SLA: ${orderDining.etaWindow || '15-25 min'})`)}
                            </span>
                          </div>
                        )}
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

                    {/* Customer Cancellation Options (30-second countdown) */}
                    {order.status === 'pending' && (() => {
                      const cd = getCancellationCountdown(order.createdAt);
                      if (cd.hasValidTimestamp && !cd.isEligible) {
                        return (
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-tertiary)',
                              fontStyle: 'italic',
                              backgroundColor: 'var(--bg-soft)',
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-xs)',
                              marginTop: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <Clock size={13} style={{ color: '#ea580c', flexShrink: 0 }} />
                            <span>
                              {currentLang === 'vi'
                                ? 'Đã hết thời hạn tự hủy đơn (30 giây). Bếp đã tiếp nhận quy trình chuẩn bị.'
                                : 'The 30-second cancellation window has expired. Kitchen is preparing your order.'}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: 'rgba(239, 68, 68, 0.04)',
                          border: '1px dashed rgba(239, 68, 68, 0.3)',
                          borderRadius: 'var(--radius-xs)',
                          marginTop: '8px',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {currentLang === 'vi'
                              ? (cd.hasValidTimestamp
                                  ? `Quý khách có thể tự hủy đơn trong vòng ${cd.remainingSeconds} giây nữa.`
                                  : 'Đơn đang ở trạng thái Chờ bếp tiếp nhận. Quý khách có thể tự hủy đơn nếu đặt nhầm.')
                              : (cd.hasValidTimestamp
                                  ? `You can cancel within the next ${cd.remainingSeconds} seconds.`
                                  : 'Order is pending. You can cancel if placed by mistake.')}
                          </div>
                          <button
                            type="button"
                            onClick={() => setConfirmCancelId(order.id)}
                            disabled={cancellingOrderId === order.id}
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#dc2626',
                              backgroundColor: '#fee2e2',
                              border: '1px solid #fca5a5',
                              borderRadius: '4px',
                              padding: '4px 10px',
                              cursor: cancellingOrderId === order.id ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            id={`btn-cancel-order-${order.id}`}
                          >
                            <XCircle size={13} />
                            <span>
                              {cd.hasValidTimestamp
                                ? (currentLang === 'vi' ? `Hủy đơn (${cd.remainingSeconds}s)` : `Cancel Order (${cd.remainingSeconds}s)`)
                                : (currentLang === 'vi' ? 'Hủy đơn' : 'Cancel Order')}
                            </span>
                          </button>
                        </div>
                      );
                    })()}

                    {order.status === 'preparing' && (
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--text-tertiary)',
                        marginTop: '6px',
                        fontStyle: 'italic',
                      }}>
                        {currentLang === 'vi'
                          ? 'ℹ️ Bếp đang tiến hành chế biến. Nếu cần thay đổi gấp, vui lòng liên hệ Lễ tân hoặc Butler qua hotline.'
                          : 'ℹ️ Kitchen has started preparing. Please contact front desk/butler if urgent changes are needed.'}
                      </div>
                    )}

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
    
      {/* Cancellation Confirmation Modal */}
      {confirmCancelId && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', marginBottom: '12px' }}>
              <AlertTriangle size={22} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                {currentLang === 'vi' ? 'Xác nhận hủy đơn gọi món' : 'Confirm Order Cancellation'}
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              {currentLang === 'vi'
                ? `Quý khách có chắc chắn muốn hủy đơn hàng #${confirmCancelId}? Bếp chưa tiến hành chế biến nên món ăn chưa trừ kho và không tính vào hóa đơn.`
                : `Are you sure you want to cancel order #${confirmCancelId}? The kitchen has not started preparation yet.`}
            </p>
            {cancelError && (
              <div style={{ color: '#dc2626', fontSize: '12px', marginBottom: '12px' }}>
                {cancelError}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                disabled={cancellingOrderId !== null}
                onClick={() => { setConfirmCancelId(null); setCancelError(null); }}
                className="hsw-btn"
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                {currentLang === 'vi' ? 'Quay lại' : 'Keep Order'}
              </button>
              <button
                type="button"
                disabled={cancellingOrderId !== null}
                onClick={() => handleConfirmCancel(confirmCancelId)}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: '#dc2626',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: cancellingOrderId !== null ? 'not-allowed' : 'pointer',
                }}
                id="btn-confirm-cancel"
              >
                {cancellingOrderId !== null ? (currentLang === 'vi' ? 'Đang hủy...' : 'Cancelling...') : (currentLang === 'vi' ? 'Đồng ý hủy' : 'Yes, Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
