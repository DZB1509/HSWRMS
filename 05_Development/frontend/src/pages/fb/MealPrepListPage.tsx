import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';
import { OperationalPagination } from '../../components/operations/OperationalPagination';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, Sparkles, ChevronRight, RotateCcw, Scale, ChevronDown, ChevronUp, UtensilsCrossed } from 'lucide-react';
import { MENU_ITEM_RECIPES } from '../../data/mockDining';

const CANONICAL_RESORT_DATE = '2026-09-24';

export const MealPrepListPage: React.FC = () => {
  const { t, i18n } = useTranslation(['operations', 'customer']);
  const { getDailyPrepList, updateFulfillmentStatus, menuItems, fetchKitchenOrders, syncStatus } = useDining();
  const navigate = useNavigate();

  const currentLang = (i18n.language || 'vi') as 'vi' | 'en';
  const localize = (obj: any): string => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[currentLang] || obj.vi || obj.en || Object.values(obj)[0] || '';
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Batch Scaling state (for 95-100 servings)
  const [showBatchScaling, setShowBatchScaling] = useState(true);
  const [batchTargetServings, setBatchTargetServings] = useState<number>(100);
  const [recipeSearch, setRecipeSearch] = useState<string>('');
  const [expandedDishId, setExpandedDishId] = useState<string | null>(null);
  const [expandedRowRecipeId, setExpandedRowRecipeId] = useState<string | null>(null);

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
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDietaryOnly, setFilterDietaryOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Automatically sync with backend whenever the operational date changes
  React.useEffect(() => {
    if (fetchKitchenOrders) {
      fetchKitchenOrders(date);
    }
  }, [date, fetchKitchenOrders]);

  const handleManualRefresh = async () => {
    if (fetchKitchenOrders) {
      setIsRefreshing(true);
      await fetchKitchenOrders(date);
      setIsRefreshing(false);
    }
  };

  const rawList = getDailyPrepList(date);

  const filteredList = rawList.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesDietary = !filterDietaryOnly || item.dietaryNotes.length > 0;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.customerName.toLowerCase().includes(q) ||
      (item.villaNumber && item.villaNumber.toLowerCase().includes(q)) ||
      (item.customerNotes && item.customerNotes.toLowerCase().includes(q)) ||
      item.items.some((line) => {
        const dish = menuItems.find((m) => m.id === line.menuItemId);
        if (!dish) return false;
        const matchesDishName =
          (dish.name.vi && dish.name.vi.toLowerCase().includes(q)) ||
          (dish.name.en && dish.name.en.toLowerCase().includes(q));
        const recipes = MENU_ITEM_RECIPES[line.menuItemId] || [];
        const matchesIngredient = recipes.some((r) =>
          (r.name.vi && r.name.vi.toLowerCase().includes(q)) ||
          (r.name.en && r.name.en.toLowerCase().includes(q))
        );
        return matchesDishName || matchesIngredient;
      });

    return matchesType && matchesStatus && matchesDietary && matchesSearch;
  });

  const totalItems = filteredList.length;
  const safeCurrentPage = Math.min(currentPage, Math.max(1, Math.ceil(totalItems / pageSize)));
  if (currentPage !== safeCurrentPage) {
    setCurrentPage(safeCurrentPage);
  }

  const paginatedList = filteredList.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const handleStatusChange = (
    id: string,
    type: 'retreat_meal' | 'a_la_carte',
    newStatus: 'pending' | 'preparing' | 'ready' | 'delivered'
  ) => {
    updateFulfillmentStatus(id, type, newStatus);
  };

  const handleClearFilters = () => {
    setDate(CANONICAL_RESORT_DATE);
    setFilterType('all');
    setFilterStatus('all');
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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 9px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: syncStatus === 'synced' ? 'rgba(46, 125, 50, 0.1)' : 'var(--bg-soft)',
                color: syncStatus === 'synced' ? 'var(--accent-forest)' : 'var(--text-tertiary)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: syncStatus === 'synced' ? 'var(--accent-forest)' : '#9ca3af',
                }}
              />
              {syncStatus === 'synced' ? 'Live API Connected' : syncStatus === 'syncing' ? 'Syncing...' : 'Prototype Standalone'}
            </span>
            <button
              type="button"
              className="hsw-btn hsw-btn-secondary hsw-btn-sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing || syncStatus === 'syncing'}
              title="Refresh live kitchen preparation queue from backend"
              id="btn-sync-kitchen-orders"
            >
              <RotateCcw size={13} className={isRefreshing || syncStatus === 'syncing' ? 'hsw-spin' : ''} />
              <span>Sync API</span>
            </button>
          </div>
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
              <option value="all">{t('fnb.prepList.allStatuses', 'All Statuses')}</option>
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
            <span>{t('fnb.prepList.resetFilters', 'Reset Filters')}</span>
          </button>
        </div>
      </div>

      {/* Batch Ingredient Demand & Volume Scaling Component (95-100 Servings) */}
      <div
        className="hsw-batch-scaling-card"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-sm)',
        }}
        id="fnb-batch-ingredient-scaling"
      >
        {/* Header & Toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onClick={() => setShowBatchScaling((prev) => !prev)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(46, 125, 50, 0.12)',
                color: 'var(--accent-forest)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Scale size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t('fnb.prepList.batchScalingTitle', 'Bảng Tổng Hợp & Quy Đổi Nguyên Liệu Theo Mẻ (Batch Scaling)')}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {t(
                  'fnb.prepList.batchScalingSubtitle',
                  'Định lượng nguyên liệu chính xác (g, ml, quả, lát) phục vụ quy mô khoảng 95 - 100 suất ăn.'
                )}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--accent-forest)',
                backgroundColor: 'rgba(46, 125, 50, 0.08)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
              }}
            >
              {batchTargetServings} {t('fnb.prepList.servingsCount', 'suất')}
            </span>
            <button
              type="button"
              className="hsw-btn hsw-btn-tertiary hsw-btn-sm"
              style={{ padding: '4px 8px' }}
              aria-label="Toggle batch scaling panel"
            >
              {showBatchScaling ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Expandable Scaling Workspace */}
        {showBatchScaling && (
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            {/* Controls Row: Target Volume Preset Buttons & Recipe Search */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '14px',
              }}
            >
              {/* Volume Steppers / Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {t('fnb.prepList.servingsVolume', 'Quy Mô Mẻ Nấu')}:
                </span>
                <button
                  type="button"
                  className={`hsw-btn hsw-btn-sm ${batchTargetServings === 95 ? 'hsw-btn-primary' : 'hsw-btn-secondary'}`}
                  style={{ height: '30px', padding: '0 12px', fontSize: '12px', fontWeight: 600 }}
                  onClick={() => setBatchTargetServings(95)}
                  id="btn-scale-95"
                >
                  95 {t('fnb.prepList.servingsCount', 'suất')}
                </button>
                <button
                  type="button"
                  className={`hsw-btn hsw-btn-sm ${batchTargetServings === 100 ? 'hsw-btn-primary' : 'hsw-btn-secondary'}`}
                  style={{ height: '30px', padding: '0 12px', fontSize: '12px', fontWeight: 600 }}
                  onClick={() => setBatchTargetServings(100)}
                  id="btn-scale-100"
                >
                  100 {t('fnb.prepList.servingsCount', 'suất')}
                </button>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={batchTargetServings}
                    onChange={(e) => setBatchTargetServings(Math.max(1, parseInt(e.target.value) || 1))}
                    className="hsw-input"
                    style={{ width: '65px', height: '30px', fontSize: '12px', textAlign: 'center', padding: '2px 4px' }}
                    id="input-custom-batch-servings"
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{t('fnb.prepList.servingsCount', 'suất')}</span>
                </div>
              </div>

              {/* Recipe Search Input */}
              <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 240px', maxWidth: '380px' }}>
                <Search
                  size={13}
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
                  style={{ width: '100%', height: '32px', fontSize: '12px', paddingLeft: '30px' }}
                  placeholder={t('fnb.prepList.searchRecipePlaceholder', 'Tìm nhanh theo tên món hoặc nguyên liệu...')}
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  id="input-recipe-ingredient-search"
                />
              </div>
            </div>

            {/* List of Dishes and Scaled Ingredients */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {menuItems
                .filter((item) => {
                  const q = recipeSearch.toLowerCase().trim();
                  if (!q) return true;
                  const matchesDish =
                    (item.name.vi && item.name.vi.toLowerCase().includes(q)) ||
                    (item.name.en && item.name.en.toLowerCase().includes(q));
                  const recipes = MENU_ITEM_RECIPES[item.id] || [];
                  const matchesIng = recipes.some(
                    (r) =>
                      (r.name.vi && r.name.vi.toLowerCase().includes(q)) ||
                      (r.name.en && r.name.en.toLowerCase().includes(q))
                  );
                  return matchesDish || matchesIng;
                })
                .map((dish) => {
                  const recipes = MENU_ITEM_RECIPES[dish.id] || [];
                  const isExpanded = expandedDishId === dish.id || recipeSearch.trim().length > 0;
                  const isAvailable = dish.available !== false;

                  return (
                    <div
                      key={dish.id}
                      style={{
                        backgroundColor: 'var(--bg-soft)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px 14px',
                      }}
                      id={`recipe-card-${dish.id}`}
                    >
                      {/* Dish Summary Bar */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                        onClick={() => setExpandedDishId(expandedDishId === dish.id ? null : dish.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: isAvailable ? 'var(--accent-forest)' : '#d32f2f',
                            }}
                          />
                          <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                            {localize(dish.name)}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-tertiary)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            · {dish.category} · {dish.mealPeriods.join(', ')}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {recipes.length} {t('fnb.prepList.totalIngredientsNeeded', 'nguyên liệu')}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 7px',
                              borderRadius: 'var(--radius-pill)',
                              backgroundColor: isAvailable ? 'rgba(46, 125, 50, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                              color: isAvailable ? 'var(--accent-forest)' : '#d32f2f',
                            }}
                          >
                            {isAvailable ? t('fnb.prepList.inStock', 'Đủ nguyên liệu') : t('fnb.prepList.outOfStock', 'Hết hàng')}
                          </span>
                          <button
                            type="button"
                            className="hsw-btn hsw-btn-tertiary hsw-btn-sm"
                            style={{ padding: '2px 6px', height: '24px' }}
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Scaled Ingredients Table */}
                      {isExpanded && (
                        <div style={{ marginTop: '10px', overflowX: 'auto' }}>
                          <table
                            style={{
                              width: '100%',
                              fontSize: '12px',
                              borderCollapse: 'collapse',
                              backgroundColor: 'var(--bg-surface)',
                              borderRadius: 'var(--radius-xs)',
                              overflow: 'hidden',
                            }}
                          >
                            <thead>
                              <tr style={{ backgroundColor: 'var(--bg-soft)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                                <th style={{ padding: '6px 10px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                  {t('fnb.prepList.ingredientName', 'Tên Nguyên Liệu')}
                                </th>
                                <th style={{ padding: '6px 10px', fontWeight: 600, color: 'var(--text-secondary)', width: '90px' }}>
                                  {t('fnb.prepList.unit', 'Đơn vị')}
                                </th>
                                <th style={{ padding: '6px 10px', fontWeight: 600, color: 'var(--text-secondary)', width: '130px' }}>
                                  {t('fnb.prepList.perServing', 'Định lượng / 1 Suất')}
                                </th>
                                <th style={{ padding: '6px 10px', fontWeight: 600, color: 'var(--accent-forest)', width: '160px' }}>
                                  {t('fnb.prepList.scaledTotal', `Tổng Cho ${batchTargetServings} Suất`, { count: batchTargetServings })}
                                </th>
                                <th style={{ padding: '6px 10px', fontWeight: 600, color: 'var(--text-secondary)', width: '140px' }}>
                                  {t('fnb.prepList.stockStatus', 'Tình Trạng Kho')}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {recipes.map((ing) => {
                                const scaledQty = ing.quantityPerServing * batchTargetServings;
                                const isUnitMetric = ing.unit === 'g' || ing.unit === 'ml';
                                const formattedScaled = isUnitMetric && scaledQty >= 1000
                                  ? `${(scaledQty / 1000).toFixed(2)} ${ing.unit === 'g' ? 'kg' : 'L'} (${scaledQty.toLocaleString()} ${ing.unit})`
                                  : `${scaledQty.toLocaleString()} ${ing.unit}`;
                                const isShortage = ing.stockAvailable < scaledQty;

                                return (
                                  <tr
                                    key={ing.ingredientId}
                                    style={{
                                      borderBottom: '1px solid var(--border-subtle)',
                                      backgroundColor: ing.stockAvailable === 0 ? 'rgba(211, 47, 47, 0.04)' : undefined,
                                    }}
                                  >
                                    <td style={{ padding: '6px 10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                      {localize(ing.name)}
                                    </td>
                                    <td style={{ padding: '6px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                      {ing.unit}
                                    </td>
                                    <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>
                                      {ing.quantityPerServing} {ing.unit}
                                    </td>
                                    <td style={{ padding: '6px 10px', fontWeight: 700, color: 'var(--accent-forest)' }}>
                                      {formattedScaled}
                                    </td>
                                    <td style={{ padding: '6px 10px' }}>
                                      {ing.stockAvailable === 0 ? (
                                        <span style={{ color: '#d32f2f', fontWeight: 600, fontSize: '11px' }}>
                                          ● {t('fnb.prepList.outOfStock', 'Hết hàng (0)')}
                                        </span>
                                      ) : isShortage ? (
                                        <span style={{ color: '#ed6c02', fontWeight: 600, fontSize: '11px' }}>
                                          ▲ {t('fnb.prepList.lowStock', 'Thiếu hụt')} ({ing.stockAvailable.toLocaleString()} {ing.unit})
                                        </span>
                                      ) : (
                                        <span style={{ color: 'var(--accent-forest)', fontWeight: 600, fontSize: '11px' }}>
                                          ✓ {t('fnb.prepList.inStock', 'Đủ kho')} ({ing.stockAvailable.toLocaleString()} {ing.unit})
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
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
                        const recipes = MENU_ITEM_RECIPES[lineItem.menuItemId] || [];
                        const isExpanded = expandedRowRecipeId === `${item.id}-${lineItem.menuItemId}`;

                        return (
                          <li key={idx} style={{ marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                              <span>
                                <strong>{lineItem.quantity}x</strong> {menuItem ? localize(menuItem.name) : 'Culinary Item'}
                              </span>
                              {recipes.length > 0 && (
                                <button
                                  type="button"
                                  className="hsw-btn hsw-btn-tertiary hsw-btn-sm"
                                  style={{ height: '18px', padding: '0 5px', fontSize: '10px', gap: '2px' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedRowRecipeId(isExpanded ? null : `${item.id}-${lineItem.menuItemId}`);
                                  }}
                                  title="Xem định lượng nguyên liệu món này"
                                >
                                  <UtensilsCrossed size={10} />
                                  <span>{isExpanded ? t('fnb.prepList.hideRecipe', 'Thu gọn') : t('fnb.prepList.viewRecipe', 'Công thức')}</span>
                                </button>
                              )}
                            </div>

                            {/* Inline Ingredient Quantity Breakdown for this Order */}
                            {isExpanded && recipes.length > 0 && (
                              <div
                                style={{
                                  marginTop: '4px',
                                  padding: '6px 8px',
                                  backgroundColor: 'var(--bg-soft)',
                                  borderRadius: 'var(--radius-xs)',
                                  border: '1px solid var(--border-subtle)',
                                  fontSize: '11px',
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div style={{ fontWeight: 600, color: 'var(--accent-forest)', marginBottom: '3px' }}>
                                  Định lượng {lineItem.quantity} suất (và quy đổi 100 suất):
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '12px', lineHeight: 1.35 }}>
                                  {recipes.map((r) => (
                                    <li key={r.ingredientId}>
                                      {localize(r.name)}: <strong>{r.quantityPerServing * lineItem.quantity} {r.unit}</strong>{' '}
                                      <span style={{ color: 'var(--text-tertiary)' }}>(100 suất: {(r.quantityPerServing * 100).toLocaleString()} {r.unit})</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
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
                    >
                      <option value="pending">{t('fnb.status.pending', 'Pending')}</option>
                      <option value="preparing">{t('fnb.status.preparing', 'Preparing')}</option>
                      <option value="ready">{t('fnb.status.ready', 'Ready')}</option>
                      <option value="delivered">{t('fnb.status.delivered', 'Delivered')}</option>
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
