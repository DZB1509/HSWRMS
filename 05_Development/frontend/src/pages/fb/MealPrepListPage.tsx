import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';
import { OperationalPagination } from '../../components/operations/OperationalPagination';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, Sparkles, ChevronRight, RotateCcw, RotateCw } from 'lucide-react';
import { useKdsPolling } from '../../features/m4-fnb/hooks/useKdsPolling';
import { useAuth } from '../../hooks/useAuth';

const CANONICAL_RESORT_DATE = '2026-09-24';

export const MealPrepListPage: React.FC = () => {
  const { t } = useTranslation(['operations', 'customer']);
  const { getDailyPrepList, updateFulfillmentStatus, menuItems, refreshKitchenQueue, cancelOrder } = useDining();
  const navigate = useNavigate();
  const { hasPermission, role } = useAuth();

  // Screen 39 authorization: S39:U required for updating orders, backend strictly enforces
  const canUpdate = hasPermission('S39:U') || role === 'fb_staff' || role === 'manager' || role === 'admin';

  const formatDietaryNote = (note: string) => {
    const normalized = note.toLowerCase().replace(/[\s-]+/g, '_');
    return t(`customer:dining.dietary.${normalized}`, t(`customer:dining.dietaryTags.${normalized}`, note));
  };

  const formatAllergyNote = (note: string) => {
    const normalized = note.toLowerCase().replace(/[\s-&]+/g, '_');
    return t(`customer:dining.allergies.${normalized}`, note);
  };

  // Canonical operational resort date default (Requirement 28)
  const [date, setDate] = useState(CANONICAL_RESORT_DATE);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterDietaryOnly, setFilterDietaryOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // KDS short-polling: 10-15s interval (12s default) + manual refresh
  const { isManualRefreshing, manualRefresh } = useKdsPolling({
    intervalMs: 12000,
    onPoll: async () => {
      if (refreshKitchenQueue) {
        await refreshKitchenQueue(date);
      }
    },
  });

  const rawList = getDailyPrepList(date);

  const filteredList = rawList.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus =
      filterStatus === 'active'
        ? item.status === 'pending' || item.status === 'preparing' || item.status === 'ready'
        : filterStatus === 'all' || item.status === filterStatus;
    const matchesDietary = !filterDietaryOnly || item.dietaryNotes.length > 0;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.customerName.toLowerCase().includes(q) ||
      (item.villaNumber && item.villaNumber.toLowerCase().includes(q));

    return matchesType && matchesStatus && matchesDietary && matchesSearch;
  });

  const totalItems = filteredList.length;
  const safeCurrentPage = Math.min(currentPage, Math.max(1, Math.ceil(totalItems / pageSize)));
  if (currentPage !== safeCurrentPage) {
    setCurrentPage(safeCurrentPage);
  }

  const paginatedList = filteredList.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const handleStatusChange = async (
    id: string,
    type: 'retreat_meal' | 'a_la_carte',
    newStatus: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  ) => {
    if (!canUpdate) {
      alert(t('common.forbidden', 'You do not have permission S39:U to update orders.'));
      return;
    }

    if (newStatus === 'cancelled') {
      const reason = window.prompt(t('fnb.cancellation.reasonPrompt', 'Cancellation reason is mandatory for staff. Please enter reason:'));
      if (!reason || !reason.trim()) {
        alert(t('fnb.cancellation.reasonRequired', 'Cancellation reason is required. Order was not cancelled.'));
        return;
      }
      try {
        if (cancelOrder) {
          await cancelOrder(id, reason.trim());
        }
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to cancel order');
      }
      return;
    }

    updateFulfillmentStatus(id, type, newStatus);
  };

  const handleClearFilters = () => {
    setDate(CANONICAL_RESORT_DATE);
    setFilterType('all');
    setFilterStatus('active');
    setFilterDietaryOnly(false);
    setSearchQuery('');
    setCurrentPage(1);
  };


  const formatVilla = (villa?: string) => {
    if (!villa) return '—';
    return villa.toLowerCase().startsWith('villa') ? villa : `Villa ${villa}`;
  };

  const isAllergy = (note: string) => {
    const n = note.toLowerCase();
    return (
      n.includes('peanut') ||
      n.includes('shellfish') ||
      n.includes('nut') ||
      n.includes('egg') ||
      n.includes('fish') ||
      n.includes('allergy') ||
      n.includes('shrimp') ||
      n.includes('crab') ||
      n.includes('dairy')
    );
  };

  return (
    <div className="hsw-page-container" id="screen-39-meal-prep-list">
      <OperationalPageHeader
        title={t('fnb.prepList.title', 'Daily Meal Prep Queue')}
        subtitle={t('fnb.prepList.subtitle', 'Manage kitchen fulfillment schedule and dietary adaptations for resort customers.')}
        actions={
          <button
            type="button"
            className="hsw-btn hsw-btn-secondary"
            onClick={() => manualRefresh()}
            disabled={isManualRefreshing}
            id="btn-refresh-kds-queue"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Refresh KDS Prep Queue (short polling 12s)"
          >
            <RotateCw size={14} className={isManualRefreshing ? 'hsw-spin' : ''} />
            <span>{isManualRefreshing ? t('common.refreshing', 'Refreshing...') : t('common.refresh', 'Refresh')}</span>
          </button>
        }
      />

      {/* Compact Filter Toolbar (Requirement 27 - eliminates giant empty vertical space) */}
      <div className="hsw-prep-filter-toolbar">
        {/* Row 1: Target Date & Customer/Villa Search */}
        <div className="hsw-prep-filter-row">
          <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
              {t('fnb.prepList.date', 'Target Date')}
            </label>
            <input
              type="date"
              className="hsw-input"
              style={{ width: '100%', height: '36px', fontSize: '13px' }}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setCurrentPage(1);
              }}
              id="filter-target-date"
            />
          </div>

          <div style={{ flex: '2 1 300px', minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
              {t('fnb.prepList.search', 'Search Customer / Villa')}
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)',
                }}
              />
              <input
                type="text"
                className="hsw-input"
                style={{ width: '100%', paddingLeft: '32px', height: '36px', fontSize: '13px' }}
                placeholder={t('fnb.prepList.searchPlaceholder', 'e.g., Eleanor Vance, 102')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                id="filter-prep-search"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Order Type + Fulfillment Status + Dietary Attention + Reset */}
        <div className="hsw-prep-filter-row" style={{ alignItems: 'center' }}>
          <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
            <select
              className="hsw-select"
              style={{ width: '100%', height: '34px', fontSize: '12px' }}
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              id="filter-order-type"
            >
              <option value="all">{t('fnb.prepList.allTypes', 'All Types')}</option>
              <option value="retreat_meal">{t('fnb.prepList.typeRetreat', 'Retreat Meals')}</option>
              <option value="a_la_carte">{t('fnb.prepList.typeExtra', 'A-la-carte')}</option>
            </select>
          </div>

          <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
            <select
              className="hsw-select"
              style={{ width: '100%', height: '34px', fontSize: '12px' }}
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              id="filter-fulfillment-status"
            >
              <option value="active">{t('fnb.prepList.statusActive', 'Active Queue (Pending, Preparing, Ready)')}</option>
              <option value="all">{t('fnb.prepList.allStatuses', 'All Statuses (History)')}</option>
              <option value="pending">{t('fnb.status.pending', 'Pending')}</option>
              <option value="preparing">{t('fnb.status.preparing', 'Preparing')}</option>
              <option value="ready">{t('fnb.status.ready', 'Ready')}</option>
              <option value="delivered">{t('fnb.status.delivered', 'Delivered')}</option>
            </select>

          </div>

          {/* Dietary Attention toggle */}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={filterDietaryOnly}
              onChange={(e) => {
                setFilterDietaryOnly(e.target.checked);
                setCurrentPage(1);
              }}
              id="filter-dietary-attention-checkbox"
            />
            <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Dietary Attention Only</span>
          </label>

          {/* Reset Filters button */}
          <button
            type="button"
            className="hsw-btn hsw-btn-tertiary hsw-btn-sm"
            style={{ marginLeft: 'auto', gap: '4px' }}
            onClick={handleClearFilters}
          >
            <RotateCcw size={12} />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Main Prep Queue Table (Requirements 31 & 32) */}
      <div className="ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th style={{ width: '130px' }}>{t('fnb.prepList.colTime', 'Time / Period')}</th>
              <th style={{ width: '180px' }}>{t('fnb.prepList.colCustomer', 'Customer & Villa')}</th>
              <th>{t('fnb.prepList.colItems', 'Items')}</th>
              <th style={{ width: '220px' }}>{t('fnb.prepList.colAlerts', 'Dietary & Allergies')}</th>
              <th style={{ width: '130px' }}>{t('fnb.prepList.colStatus', 'Status')}</th>
              <th style={{ width: '90px', textAlign: 'right' }}>{t('fnb.prepList.colAction', 'Action')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedList.map((item) => {
              return (
                <tr
                  key={item.id}
                  style={{ opacity: item.status === 'delivered' ? 0.65 : 1 }}
                  id={`prep-row-${item.id}`}
                >
                  {/* Time / Period */}
                  <td onClick={() => navigate(`/fb/orders/${item.id}`)} style={{ cursor: 'pointer' }}>
                    <div style={{ fontWeight: 600, color: 'var(--accent-forest)' }}>
                      {item.targetTime ||
                        t(
                          `dining.periods.${item.mealPeriod}`,
                          item.mealPeriod ? item.mealPeriod.toUpperCase() : 'ALL DAY'
                        )}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 600 }}>
                      {item.type === 'retreat_meal' ? 'RETREAT' : 'EXTRA A-LA-CARTE'}
                    </div>
                  </td>

                  {/* Customer & Villa (Fixed "Villa Villa" duplication) */}
                  <td onClick={() => navigate(`/fb/orders/${item.id}`)} style={{ cursor: 'pointer' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.customerName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--accent-olive)' }}>
                      {formatVilla(item.villaNumber)}
                    </div>
                  </td>

                  {/* Items list */}
                  <td onClick={() => navigate(`/fb/orders/${item.id}`)} style={{ cursor: 'pointer' }}>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px' }}>
                      {item.items.map((lineItem, idx) => {
                        const menuItem = menuItems.find((m) => m.id === lineItem.menuItemId);
                        return (
                          <li key={idx}>
                            <strong>{lineItem.quantity}x</strong> {menuItem?.name.en || 'Culinary Item'}
                          </li>
                        );
                      })}
                    </ul>
                    {item.customerNotes && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                          backgroundColor: 'var(--bg-soft)',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-xs)',
                          marginTop: '4px',
                          display: 'inline-block',
                          fontStyle: 'italic',
                        }}
                      >
                        "{item.customerNotes}"
                      </div>
                    )}
                  </td>

                  {/* Dietary vs Allergy Semantics (Requirement 32) */}
                  <td onClick={() => navigate(`/fb/orders/${item.id}`)} style={{ cursor: 'pointer' }}>
                    {item.dietaryNotes.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {item.dietaryNotes.map((note, idx) => {
                          const allergy = isAllergy(note);
                          return allergy ? (
                            <span key={idx} className="hsw-alert-allergy" title="Customer Allergy Alert">
                              <AlertTriangle size={11} />
                              <span>{formatAllergyNote(note)}</span>
                            </span>
                          ) : (
                            <span key={idx} className="hsw-alert-dietary" title="Dietary Preference">
                              <Sparkles size={11} />
                              <span>{formatDietaryNote(note)}</span>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                        {t('fnb.prepList.noAlerts', 'Standard')}
                      </span>
                    )}
                  </td>

                  {/* Status Dropdown */}
                  <td>
                    <select
                      className="hsw-ops-status-select"
                      value={item.status}
                      onChange={(e) =>
                        handleStatusChange(item.id, item.type, e.target.value as any)
                      }
                      style={{
                        backgroundColor:
                          item.status === 'pending'
                            ? 'var(--bg-soft)'
                            : item.status === 'preparing'
                            ? '#fef3e2'
                            : item.status === 'ready'
                            ? '#eef6fc'
                            : 'var(--success-bg)',
                        color:
                          item.status === 'pending'
                            ? 'var(--text-secondary)'
                            : item.status === 'preparing'
                            ? '#9a6114'
                            : item.status === 'ready'
                            ? '#1a689e'
                            : 'var(--success)',
                      }}
                      id={`status-select-${item.id}`}
                      disabled={!canUpdate || item.status === 'delivered' || item.status === 'cancelled'}
                    >
                      <option value="pending">{t('fnb.status.pending', 'Pending')}</option>
                      <option value="preparing">{t('fnb.status.preparing', 'Preparing')}</option>
                      <option value="ready">{t('fnb.status.ready', 'Ready')}</option>
                      <option value="delivered">{t('fnb.status.delivered', 'Delivered')}</option>
                      <option value="cancelled">{t('fnb.status.cancelled', 'Cancelled')}</option>
                    </select>
                  </td>

                  {/* Action CTA (Requirement 33) */}
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="hsw-btn hsw-btn-secondary hsw-btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/fb/orders/${item.id}`);
                      }}
                      id={`btn-prep-details-${item.id}`}
                      title="View order details and allergies"
                    >
                      <span>{t('fnb.prep.details', 'Details')}</span>
                      <ChevronRight size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {paginatedList.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
                    {t('fnb.prepList.noMatchingOrders', 'No kitchen prep items match the selected date and filters.')}
                  </p>
                  <button
                    type="button"
                    className="hsw-btn hsw-btn-secondary hsw-btn-sm"
                    style={{ marginTop: 'var(--space-3)' }}
                    onClick={handleClearFilters}
                  >
                    Reset Date & Filters
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Operational Pagination (Requirement 30) */}
      <div style={{ marginTop: 'var(--space-4)' }}>
        <OperationalPagination
          currentPage={safeCurrentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          pageSizeOptions={[10, 25, 50]}
          onPageSizeChange={(newSize) => setPageSize(newSize)}
        />
      </div>
    </div>
  );
};
