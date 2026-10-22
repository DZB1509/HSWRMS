import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';
import {
  ChefHat,
  UtensilsCrossed,
  AlertCircle,
  Clock,
  ChevronRight,
  ArrowRight,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fnbApi } from '../../features/m4-fnb/api/fnbApi';
import type {
  IngredientDemandResponse,
  MenuAvailabilityResponse,
  FnbDashboardResponse,
} from '../../features/m4-fnb/types/fnbDto';

import { cleanMojibake } from '../../utils/textEncodingHelper';

const CANONICAL_RESORT_DATE = '2026-09-24';

export const FnbDashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation('operations');
  const { getDailyPrepList, menuItems, fetchKitchenOrders } = useDining();
  const navigate = useNavigate();

  const currentLang = (i18n.language?.startsWith('vi') ? 'vi' : 'en') as 'vi' | 'en';

  const [resortDate, setResortDate] = useState(CANONICAL_RESORT_DATE);
  const [demandFilter, setDemandFilter] = useState<'all' | 'shortage' | 'covered'>('all');
  const [ingredientDemand, setIngredientDemand] = useState<IngredientDemandResponse[]>([]);
  const [menuAvailability, setMenuAvailability] = useState<MenuAvailabilityResponse[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<FnbDashboardResponse | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load real backend dashboard if connected, do not simulate fake inventory
  const loadDashboardData = useCallback(async (date: string) => {
    setIsRefreshing(true);
    try {
      const response = await fnbApi.getDashboard(date);
      if (response) {
        setDashboardMetrics(response);
        setApiOnline(true);
        setIngredientDemand(response.ingredientDemand || []);
        setMenuAvailability(response.menuAvailability || []);
      }
      if (fetchKitchenOrders) {
        await fetchKitchenOrders(date);
      }
    } catch {
      // Backend not running or in offline prototype mode
      setApiOnline(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchKitchenOrders]);

  useEffect(() => {
    loadDashboardData(resortDate);
  }, [resortDate, loadDashboardData]);

  // Prep queue from dining context for the selected date
  const todaysList = getDailyPrepList(resortDate);

  const mealsToPrepare = dashboardMetrics?.retreatMealOrders ?? todaysList.filter((item) => item.type === 'retreat_meal').length;
  const extraOrders = dashboardMetrics?.alaCarteOrders ?? todaysList.filter((item) => item.type === 'a_la_carte').length;
  const dietaryAlerts = todaysList.filter((item) => item.dietaryNotes.length > 0).length;
  const pendingCount = dashboardMetrics?.pendingOrders ?? todaysList.filter((item) => item.status === 'pending').length;
  const preparingCount = dashboardMetrics?.preparingOrders ?? todaysList.filter((item) => item.status === 'preparing').length;

  // Shortage calculations
  const shortages = ingredientDemand.filter((item) => item.status === 'SHORTAGE' || item.shortfall > 0);
  const shortageCount = shortages.length;

  const filteredDemand = ingredientDemand.filter((item) => {
    if (demandFilter === 'shortage') return item.status === 'SHORTAGE' || item.shortfall > 0;
    if (demandFilter === 'covered') return item.status === 'COVERED' && item.shortfall === 0;
    return true;
  });

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
        subtitle={t('fnb.dashboard.subtitle', 'Culinary prep queue, inventory demand, and raw material shortage monitoring.')}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <Calendar size={15} style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="date"
                value={resortDate}
                onChange={(e) => setResortDate(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
                id="fnb-dashboard-date-picker"
              />
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 9px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: apiOnline ? 'rgba(46, 125, 50, 0.1)' : 'var(--bg-soft)',
                color: apiOnline ? 'var(--accent-forest)' : 'var(--text-tertiary)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: apiOnline ? 'var(--accent-forest)' : '#9ca3af',
                }}
              />
              {apiOnline ? 'Live API Connected' : 'Prototype Standalone'}
            </span>
            <button
              type="button"
              className="hsw-btn hsw-btn-secondary hsw-btn-sm"
              onClick={() => loadDashboardData(resortDate)}
              disabled={isRefreshing}
              title="Refresh F&B metrics"
            >
              <RefreshCw size={14} className={isRefreshing ? 'hsw-spin' : ''} />
              <span>{isRefreshing ? 'Refreshing...' : 'Sync'}</span>
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

      {/* 1. CRITICAL RAW MATERIAL SHORTAGE WARNING BANNER */}
      {shortageCount > 0 ? (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.08) 100%)',
            border: '1px solid #ef4444',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
          }}
          id="fnb-raw-material-shortage-alert-banner"
        >
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#991b1b' }}>
                {t('fnb.dashboard.shortageBannerTitle', 'RAW MATERIAL SHORTAGE DETECTED')}
              </h3>
              <span
                style={{
                  backgroundColor: '#b91c1c',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  textTransform: 'uppercase',
                }}
              >
                {shortageCount} {shortageCount === 1 ? 'Ingredient Deficit' : 'Ingredients Deficit'}
              </span>
            </div>
            <p style={{ margin: '4px 0 8px 0', fontSize: '13px', color: '#7f1d1d', lineHeight: 1.5 }}>
              {t(
                'fnb.dashboard.shortageBannerDesc',
                'Current usable kitchen stock is insufficient to fulfill active meal orders for today. Certain menu dishes may become unavailable unless replenishment batches are received.'
              )}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {shortages.map((s) => (
                <span
                  key={s.ingredientId}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #fca5a5',
                    color: '#991b1b',
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <AlertTriangle size={13} />
                  <span>{s.ingredientName}:</span>
                  <strong>
                    -{s.shortfall} {s.unitOfMeasure}
                  </strong>
                </span>
              ))}
            </div>
          </div>
          <a
            href="#section-fnb-ingredient-demand"
            className="hsw-btn hsw-btn-secondary hsw-btn-sm"
            style={{
              borderColor: '#ef4444',
              color: '#b91c1c',
              fontWeight: 600,
              flexShrink: 0,
              alignSelf: 'center',
            }}
          >
            View Demand Table
          </a>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--surface-success, #edf7ee)',
            border: '1px solid var(--border-success, #bbf7d0)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            marginBottom: 'var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
          id="fnb-raw-material-optimal-banner"
        >
          <CheckCircle2 size={20} style={{ color: 'var(--accent-forest)' }} />
          <div style={{ fontSize: '13px', color: 'var(--accent-forest)', fontWeight: 500 }}>
            <strong>All Raw Materials Covered:</strong> Usable stock in the kitchen meets all active meal order requirements for {resortDate}.
          </div>
        </div>
      )}

      {/* 2. 4-KPI Compact Grid */}
      <div className="hsw-fb-kpi-grid">
        <div className="hsw-fb-kpi-card">
          <div className="hsw-fb-kpi-icon" style={{ backgroundColor: '#edf3ee', color: 'var(--accent-forest)' }}>
            <UtensilsCrossed size={22} />
          </div>
          <div>
            <div className="hsw-fb-kpi-val">{mealsToPrepare}</div>
            <div className="hsw-fb-kpi-label">{t('fnb.dashboard.retreatMeals', 'Retreat Meals (Today)')}</div>
          </div>
        </div>

        <div className="hsw-fb-kpi-card">
          <div className="hsw-fb-kpi-icon" style={{ backgroundColor: '#f2ede5', color: '#8c6b3e' }}>
            <ChefHat size={22} />
          </div>
          <div>
            <div className="hsw-fb-kpi-val">{extraOrders}</div>
            <div className="hsw-fb-kpi-label">{t('fnb.dashboard.extraOrders', 'Extra A-la-carte')}</div>
          </div>
        </div>

        <div className="hsw-fb-kpi-card">
          <div className="hsw-fb-kpi-icon" style={{ backgroundColor: '#fdf2f1', color: 'var(--danger)' }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div className="hsw-fb-kpi-val">{dietaryAlerts}</div>
            <div className="hsw-fb-kpi-label">{t('fnb.dashboard.dietaryAlerts', 'Dietary/Allergy Alerts')}</div>
          </div>
        </div>

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

      {/* 3. RAW MATERIAL DEMAND & SHORTAGE MONITORING TABLE (SCREEN 38 REQUIREMENT) */}
      <div
        id="section-fnb-ingredient-demand"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-4)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Boxes size={18} style={{ color: 'var(--accent-forest)' }} />
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                {t('fnb.dashboard.rawMaterialTitle', 'Raw Material Demand & Stock Shortage Monitoring')}
              </h2>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Calculated real-time demand against usable batches for date {resortDate} (FEFO Usable Conditions: FRESH, GOOD, NEAR_EXPIRY)
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-soft)', padding: '3px', borderRadius: 'var(--radius-pill)' }}>
            <button
              type="button"
              className={`hsw-segmented-tab ${demandFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDemandFilter('all')}
              style={{ padding: '4px 12px', fontSize: '12px' }}
            >
              All ({ingredientDemand.length})
            </button>
            <button
              type="button"
              className={`hsw-segmented-tab ${demandFilter === 'shortage' ? 'active' : ''}`}
              onClick={() => setDemandFilter('shortage')}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                color: shortageCount > 0 ? '#b91c1c' : undefined,
                fontWeight: shortageCount > 0 ? 600 : undefined,
              }}
            >
              Shortage ({shortageCount})
            </button>
            <button
              type="button"
              className={`hsw-segmented-tab ${demandFilter === 'covered' ? 'active' : ''}`}
              onClick={() => setDemandFilter('covered')}
              style={{ padding: '4px 12px', fontSize: '12px' }}
            >
              Covered ({ingredientDemand.length - shortageCount})
            </button>
          </div>
        </div>

        {ingredientDemand.length === 0 ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <Boxes size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5, display: 'block' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {apiOnline
                ? 'Chưa ghi nhận nhu cầu nguyên liệu cho ngày này'
                : 'Chưa có dữ liệu kho nguyên liệu'}
            </div>
            <div style={{ fontSize: '12px', maxWidth: '500px', margin: '0 auto' }}>
              {apiOnline
                ? 'Hệ thống tính toán nhu cầu nguyên liệu tự động dựa trên thực đơn các đơn ăn cần chuẩn bị và danh mục kho khả dụng (FEFO).'
                : 'Vui lòng kiểm tra kết nối Backend hoặc cấu hình định mức nguyên liệu trong cơ sở dữ liệu.'}
            </div>
          </div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Raw Material / Ingredient</th>
                  <th>Unit</th>
                  <th style={{ textAlign: 'right' }}>Required for Today</th>
                  <th style={{ textAlign: 'right' }}>Usable Stock</th>
                  <th style={{ textAlign: 'right' }}>Deficit / Shortfall</th>
                  <th style={{ textAlign: 'center' }}>Stock Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDemand.map((item) => {
                  const isShortage = item.status === 'SHORTAGE' || item.shortfall > 0;
                  return (
                    <tr
                      key={item.ingredientId}
                      style={{
                        backgroundColor: isShortage ? 'rgba(239, 68, 68, 0.03)' : undefined,
                      }}
                    >
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cleanMojibake(item.ingredientName)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>ID: #{item.ingredientId}</div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--bg-soft)',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-xs)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {item.unitOfMeasure}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {item.requiredQuantity.toLocaleString()} {item.unitOfMeasure}
                      </td>
                      <td style={{ textAlign: 'right', color: isShortage ? '#b91c1c' : 'var(--accent-forest)' }}>
                        {item.usableQuantity.toLocaleString()} {item.unitOfMeasure}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {isShortage ? (
                          <span style={{ color: '#b91c1c' }}>
                            -{item.shortfall.toLocaleString()} {item.unitOfMeasure}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)' }}>0 {item.unitOfMeasure}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isShortage ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 9px',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fca5a5',
                            }}
                          >
                            <AlertTriangle size={12} />
                            SHORTAGE
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 9px',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: '#edf3ee',
                              color: 'var(--accent-forest)',
                              border: '1px solid #cce0d0',
                            }}
                          >
                            <CheckCircle2 size={12} />
                            COVERED
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredDemand.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-tertiary)' }}>
                      No raw materials match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. MENU ITEM AVAILABILITY & SERVING CAPACITY */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, margin: 0 }}>
              {t('fnb.dashboard.menuCapacityTitle', 'Menu Capacity & Serving Availability')}
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Servings calculable from current usable stock before ingredient exhaustion
            </div>
          </div>
          <button
            type="button"
            className="hsw-btn hsw-btn-tertiary hsw-btn-sm"
            onClick={() => navigate('/customer/dining/menu')}
          >
            <span>View Catalog</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {menuAvailability.length === 0 ? (
          <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-tertiary)', background: 'var(--bg-soft)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {apiOnline
                ? 'Chưa có thực đơn nào được cấu hình công thức nguyên liệu trong hệ thống'
                : 'Chưa có dữ liệu công thức món ăn'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-3)' }}>
            {menuAvailability.map((menu) => (
              <div
                key={menu.menuItemId}
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-3)',
                  background: menu.available ? 'var(--bg-soft)' : '#fff8f7',
                  borderLeft: menu.available ? '3px solid var(--accent-forest)' : '3px solid #ef4444',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{cleanMojibake(menu.itemName)}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: menu.available ? '#edf3ee' : '#fee2e2',
                      color: menu.available ? 'var(--accent-forest)' : '#b91c1c',
                    }}
                  >
                    {menu.available ? `${menu.servingsAvailable} Servings` : 'UNAVAILABLE'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  {menu.reason}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Urgent Prep Queue Preview Section */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
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
              {todaysList.slice(0, 5).map((item) => {
                const statusBadge = getStatusBadge(item.status);
                const itemsSummary = item.items
                  .map((i) => {
                    const menuItem = menuItems.find((m) => m.id === i.menuItemId);
                    const nameStr = menuItem ? (menuItem.name[currentLang] || menuItem.name.en) : 'Item';
                    return `${i.quantity}x ${cleanMojibake(nameStr)}`;
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
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cleanMojibake(item.customerName)}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {cleanMojibake(formatVilla(item.villaNumber))}
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
              })}
              {todaysList.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-tertiary)' }}>
                    {t('fnb.dashboard.noQueue', 'No items in the prep queue for today.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
