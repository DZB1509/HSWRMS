import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';
import { ChefHat, UtensilsCrossed, AlertCircle, Clock, ChevronRight, ArrowRight, RotateCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKdsPolling } from '../../features/m4-fnb/hooks/useKdsPolling';
import { fnbApi, type KdsDashboardKpiBackendDto } from '../../features/m4-fnb/api/fnbApi';

const CANONICAL_RESORT_DATE = '2026-09-24';

export const FnbDashboardPage: React.FC = () => {
  const { t } = useTranslation('operations');
  const { getActiveKitchenQueue, menuItems, refreshKitchenQueue } = useDining();
  const navigate = useNavigate();

  const [remoteKpis, setRemoteKpis] = useState<KdsDashboardKpiBackendDto | null>(null);

  // Short-polling: 10-15s interval (12s) + manual refresh
  const { isManualRefreshing, manualRefresh } = useKdsPolling({
    intervalMs: 12000,
    onPoll: async () => {
      try {
        const [kpis] = await Promise.all([
          fnbApi.getKdsDashboardKpis(CANONICAL_RESORT_DATE),
          refreshKitchenQueue ? refreshKitchenQueue(CANONICAL_RESORT_DATE) : Promise.resolve(),
        ]);
        if (kpis) {
          setRemoteKpis(kpis);
        }
      } catch (err) {
        console.warn('Live KPI fetch failed, falling back to local queue counts:', err);
      }
    },
  });

  // Canonical demo operational resort date active preparation queue
  const activeQueue = getActiveKitchenQueue(CANONICAL_RESORT_DATE);

  const mealsToPrepare = remoteKpis ? remoteKpis.retreatMealsToday : activeQueue.filter((item) => item.type === 'retreat_meal').length;
  const extraOrders = remoteKpis ? remoteKpis.extraOrdersToday : activeQueue.filter((item) => item.type === 'a_la_carte').length;
  const dietaryAlerts = remoteKpis ? remoteKpis.dietaryAlertsCount : activeQueue.filter((item) => item.dietaryNotes.length > 0).length;
  const pendingCount = remoteKpis ? remoteKpis.pendingCount : activeQueue.filter((item) => item.status === 'pending').length;
  const preparingCount = remoteKpis ? remoteKpis.preparingCount : activeQueue.filter((item) => item.status === 'preparing').length;

  const formatVilla = (villa?: string) => {
    if (!villa) return '—';
    return villa.toLowerCase().startsWith('villa') ? villa : `Villa ${villa}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: t('fnb.status.pending', 'Pending'), bg: 'var(--bg-soft)', color: 'var(--text-secondary)' };
      case 'preparing':
        return { label: t('fnb.status.preparing', 'Preparing'), bg: '#fef3e2', color: '#9a6114' };
      case 'ready':
        return { label: t('fnb.status.ready', 'Ready'), bg: '#eef6fc', color: '#1a689e' };
      case 'delivered':
        return { label: t('fnb.status.delivered', 'Delivered'), bg: 'var(--success-bg)', color: 'var(--success)' };
      default:
        return { label: status, bg: 'var(--bg-soft)', color: 'var(--text-secondary)' };
    }
  };

  return (
    <div className="hsw-page-container" id="screen-38-fnb-dashboard">
      <OperationalPageHeader
        title={t('fnb.dashboard.title', 'F&B Kitchen Dashboard')}
        subtitle={t('fnb.dashboard.subtitle', 'Culinary prep queue and fulfillment metrics for current resort date.')}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="hsw-btn hsw-btn-secondary"
              onClick={() => manualRefresh()}
              disabled={isManualRefreshing}
              id="btn-refresh-kds-dashboard"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Refresh KDS Dashboard (short polling 12s)"
            >
              <RotateCw size={14} className={isManualRefreshing ? 'hsw-spin' : ''} />
              <span>{isManualRefreshing ? t('common.refreshing', 'Refreshing...') : t('common.refresh', 'Refresh')}</span>
            </button>
            <button
              type="button"
              className="hsw-btn hsw-btn-primary"
              onClick={() => navigate('/fb/meal-prep')}
              id="btn-view-full-prep-list"
            >
              <span>{t('fnb.dashboard.viewPrepList', 'View Full Prep List')}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        }
      />

      {/* 4-KPI Compact Grid (Requirement 24 - responsive 4 across / 2x2 / 1) */}
      <div className="hsw-fb-kpi-grid">
        {/* KPI 1: Retreat Meals */}
        <div className="hsw-fb-kpi-card">
          <div className="hsw-fb-kpi-icon" style={{ backgroundColor: '#edf3ee', color: 'var(--accent-forest)' }}>
            <UtensilsCrossed size={22} />
          </div>
          <div>
            <div className="hsw-fb-kpi-val">{mealsToPrepare}</div>
            <div className="hsw-fb-kpi-label">{t('fnb.dashboard.retreatMeals', 'Retreat Meals (Today)')}</div>
          </div>
        </div>

        {/* KPI 2: Extra A-la-carte */}
        <div className="hsw-fb-kpi-card">
          <div className="hsw-fb-kpi-icon" style={{ backgroundColor: '#f2ede5', color: '#8c6b3e' }}>
            <ChefHat size={22} />
          </div>
          <div>
            <div className="hsw-fb-kpi-val">{extraOrders}</div>
            <div className="hsw-fb-kpi-label">{t('fnb.dashboard.extraOrders', 'Extra A-la-carte')}</div>
          </div>
        </div>

        {/* KPI 3: Dietary/Allergy Alerts */}
        <div className="hsw-fb-kpi-card">
          <div className="hsw-fb-kpi-icon" style={{ backgroundColor: '#fdf2f1', color: 'var(--danger)' }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div className="hsw-fb-kpi-val">{dietaryAlerts}</div>
            <div className="hsw-fb-kpi-label">{t('fnb.dashboard.dietaryAlerts', 'Dietary/Allergy Alerts')}</div>
          </div>
        </div>

        {/* KPI 4: Pending / Preparing */}
        <div className="hsw-fb-kpi-card">
          <div className="hsw-fb-kpi-icon" style={{ backgroundColor: '#eef4f8', color: 'var(--info)' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="hsw-fb-kpi-val">
              {pendingCount} <span style={{ color: 'var(--text-tertiary)', fontSize: '18px' }}>/ {preparingCount}</span>
            </div>
            <div className="hsw-fb-kpi-label">{t('fnb.dashboard.pendingPreparing', 'Pending / Preparing')}</div>
          </div>
        </div>
      </div>

      {/* Urgent Prep Queue Preview Section (Requirement 25) */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: 'var(--space-4)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600, margin: 0 }}>
              {t('fnb.dashboard.urgentQueue', 'Urgent Prep Queue (Preview)')}
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Showing next immediate orders requiring kitchen fulfillment
            </div>
          </div>
          <button
            type="button"
            className="hsw-btn hsw-btn-tertiary hsw-btn-sm"
            onClick={() => navigate('/fb/meal-prep')}
          >
            <span>{t('fnb.dashboard.viewAll', 'View All')}</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>{t('fnb.prep.time', 'Time / Period')}</th>
                <th>{t('fnb.prep.customer', 'Customer & Villa')}</th>
                <th>{t('fnb.prep.type', 'Order Type')}</th>
                <th>{t('fnb.prep.items', 'Items')}</th>
                <th>{t('fnb.prep.status', 'Status')}</th>
                <th style={{ textAlign: 'right' }}>{t('fnb.prep.action', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {activeQueue.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    {t('fnb.dashboard.noActiveOrders', 'No active kitchen prep orders pending. All orders fulfilled or delivered.')}
                  </td>
                </tr>
              ) : (
                activeQueue.slice(0, 5).map((item) => {

                const statusBadge = getStatusBadge(item.status);
                const itemsSummary = item.items
                  .map((i) => {
                    const menuItem = menuItems.find((m) => m.id === i.menuItemId);
                    return `${i.quantity}x ${menuItem ? menuItem.name.en : 'Item'}`;
                  })
                  .join(', ');

                return (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/fb/orders/${item.id}`)}
                    style={{ cursor: 'pointer' }}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(`/fb/orders/${item.id}`);
                    }}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--accent-forest)' }}>
                      {item.targetTime ||
                        t(
                          `dining.periods.${item.mealPeriod}`,
                          item.mealPeriod ? item.mealPeriod.toUpperCase() : 'ALL DAY'
                        )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.customerName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {formatVilla(item.villaNumber)}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: item.type === 'retreat_meal' ? '#edf3ee' : '#f2ede5',
                          color: item.type === 'retreat_meal' ? 'var(--accent-forest)' : '#8c6b3e',
                        }}
                      >
                        {item.type === 'retreat_meal'
                          ? t('fnb.prep.typeRetreat', 'Retreat Meal')
                          : t('fnb.prep.typeExtra', 'A-la-carte')}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {itemsSummary}
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: statusBadge.bg,
                          color: statusBadge.color,
                        }}
                      >
                        {statusBadge.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="hsw-btn hsw-btn-tertiary hsw-btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/fb/orders/${item.id}`);
                        }}
                      >
                        <span>{t('fnb.prep.details', 'Details')}</span>
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
