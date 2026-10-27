import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDining } from '../../context/DiningContext';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';
import { OperationalPagination } from '../../components/operations/OperationalPagination';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, Sparkles, ChevronRight, RotateCcw, ChevronDown, ChevronUp, UtensilsCrossed, CheckCircle, Boxes } from 'lucide-react';
import { MENU_ITEM_RECIPES } from '../../data/mockDining';
import { AmanoiServiceLocationBadge } from '../../components/dining/ServiceLocationBadge';
import { parseDiningNotes, getLocalDateString } from '../../utils/diningServiceHelper';

import { cleanMojibake } from '../../utils/textEncodingHelper';



export const MealPrepListPage: React.FC = () => {
  const { t, i18n } = useTranslation(['operations', 'customer']);
  const {
    getDailyPrepList,
    updateFulfillmentStatus,
    menuItems,
    fetchKitchenOrders,
    syncStatus,
    ingredientInventory,
    refreshInventory,
    isInventoryStale,
    lastInventorySyncTime,
    inventorySyncStatus,
    refreshMenu,
  } = useDining();
  const navigate = useNavigate();

  const currentLang = (i18n.language || 'vi') as 'vi' | 'en';
  const localize = (obj: any): string => {
    if (!obj) return '';
    if (typeof obj === 'string') return cleanMojibake(obj);
    const val = obj[currentLang] || obj.vi || obj.en || Object.values(obj)[0] || '';
    return cleanMojibake(val);
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Physical inventory section state
  const [showPhysicalInventory, setShowPhysicalInventory] = useState(true);
  const [ingredientSearch, setIngredientSearch] = useState('');

  const [expandedRowRecipeId, setExpandedRowRecipeId] = useState<string | null>(null);

  const formatDietaryNote = (note: string) => {
    const normalized = note.toLowerCase().replace(/[\s-]+/g, '_');
    return t(`customer:dining.dietary.${normalized}`, t(`customer:dining.dietaryTags.${normalized}`, note));
  };

  const formatAllergyNote = (note: string) => {
    const normalized = note.toLowerCase().replace(/[\s-&]+/g, '_');
    return t(`customer:dining.allergies.${normalized}`, note);
  };

  // Always default to current operational resort date (local today)
  const [date, setDate] = useState(() => getLocalDateString());
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterDietaryOnly, setFilterDietaryOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Automatically sync with backend whenever the operational date changes
  React.useEffect(() => {
    if (fetchKitchenOrders) {
      fetchKitchenOrders(date);
    }
    if (refreshInventory) {
      refreshInventory(date);
    }
    if (refreshMenu) {
      refreshMenu(date);
    }
  }, [date, fetchKitchenOrders, refreshInventory, refreshMenu]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchKitchenOrders ? fetchKitchenOrders(date) : Promise.resolve([]),
        refreshMenu ? refreshMenu(date) : Promise.resolve(),
        refreshInventory ? refreshInventory(date) : Promise.resolve(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const rawList = getDailyPrepList(date);

  const filteredList = rawList.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesDietary = !filterDietaryOnly || item.dietaryNotes.length > 0;
    const parsedNotes = parseDiningNotes(item.customerNotes);
    const matchesLocation =
      filterLocation === 'all' ||
      (filterLocation === 'IN_VILLA' && parsedNotes.isVillaDelivery) ||
      (filterLocation === 'DINING_PAVILION' && !parsedNotes.isVillaDelivery);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.customerName.toLowerCase().includes(q) ||
      (item.villaNumber && item.villaNumber.toLowerCase().includes(q)) ||
      (item.customerNotes && item.customerNotes.toLowerCase().includes(q)) ||
      item.items.some((line) => {
        const dish = menuItems.find((m) => m.id === line.menuItemId || String(m.backendId) === String(line.menuItemId) || (m.backendId && String(m.backendId) === line.menuItemId.replace(/\D/g, '')));
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

    return matchesType && matchesStatus && matchesLocation && matchesDietary && matchesSearch;
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
    setDate(getLocalDateString());
    setFilterType('all');
    setFilterStatus('all');
    setFilterLocation('all');
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

  const renderInventoryBadge = (status?: string, msg?: string | null) => {
    if (!status || status === 'PENDING') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 600,
            backgroundColor: 'var(--bg-soft)',
            color: 'var(--text-tertiary)',
            border: '1px solid var(--border-subtle)',
          }}
          title={msg || 'Chờ xác nhận chuẩn bị để xuất kho'}
        >
          Kho: Chờ xuất
        </span>
      );
    }
    if (status === 'CONSUMED') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 600,
            backgroundColor: '#f6ffed',
            color: '#389e0d',
            border: '1px solid #b7eb8f',
          }}
          title={msg || 'Đã xuất kho nguyên liệu thành công'}
        >
          <CheckCircle size={10} /> Kho: Đã xuất
        </span>
      );
    }
    if (status === 'NOT_CONFIGURED') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 600,
            backgroundColor: '#fffbe6',
            color: '#d46b08',
            border: '1px solid #ffe58f',
          }}
          title={msg || 'Món ăn chưa có công thức định lượng trong kho'}
        >
          <AlertTriangle size={10} /> Kho: Chưa có công thức
        </span>
      );
    }
    if (status === 'INSUFFICIENT_STOCK') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 700,
            backgroundColor: '#fff1f0',
            color: '#cf1322',
            border: '1px solid #ffa39e',
          }}
          title={msg || 'Tồn kho khả dụng không đủ để xuất'}
        >
          <AlertTriangle size={10} /> Kho: Thiếu nguyên liệu
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: '4px',
          fontWeight: 600,
          backgroundColor: '#fff1f0',
          color: '#cf1322',
          border: '1px solid #ffa39e',
        }}
        title={msg || 'Lỗi xuất kho'}
      >
        <AlertTriangle size={10} /> Kho: Lỗi
      </span>
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
              <option value="cancelled">{t('fnb.status.cancelled', 'Cancelled')}</option>
            </select>
          </div>

          <div style={{ flex: '1 1 160px', minWidth: '150px' }}>
            <select
              className="hsw-select"
              style={{ width: '100%', height: '34px', fontSize: '12px' }}
              value={filterLocation}
              onChange={(e) => {
                setFilterLocation(e.target.value);
                setCurrentPage(1);
              }}
              id="filter-service-location"
            >
              <option value="all">📍 {currentLang === 'vi' ? 'Tất cả điểm phục vụ' : 'All Dining Venues'}</option>
              <option value="DINING_PAVILION">🍽️ {currentLang === 'vi' ? 'Nhà hàng Trung tâm' : 'Dining Pavilion'}</option>
              <option value="IN_VILLA">🏡 {currentLang === 'vi' ? 'Giao Biệt thự (In-Villa)' : 'In-Villa Delivery'}</option>
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

      {/* Physical Usable Ingredient Stock Monitoring Section */}
      <div
        className="hsw-physical-inventory-card"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-sm)',
        }}
        id="fnb-physical-inventory-section"
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
          onClick={() => setShowPhysicalInventory((prev) => !prev)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(26, 104, 158, 0.12)',
                color: '#1a689e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Boxes size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {t('fnb.prepList.physicalStockTitle', 'Tồn Kho Nguyên Liệu Khả Dụng Thực Tế (Usable Stock)')}
                </h3>
                {inventorySyncStatus === 'syncing' ? (
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                    ⏳ Đang đồng bộ kho...
                  </span>
                ) : isInventoryStale ? (
                  <span
                    style={{
                      fontSize: '11px',
                      backgroundColor: '#fff1f0',
                      color: '#cf1322',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      fontWeight: 600,
                      border: '1px solid #ffa39e',
                    }}
                  >
                    ⚠️ Tồn kho có thể chưa mới nhất
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '11px',
                      backgroundColor: 'rgba(46, 125, 50, 0.08)',
                      color: 'var(--accent-forest)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      fontWeight: 600,
                    }}
                  >
                    ✓ Tự động cập nhật sau mỗi lần trừ kho
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {t(
                  'fnb.prepList.physicalStockSubtitle',
                  'Số lượng nguyên liệu vật lý thực tế từ các lô kho hợp lệ (FEFO: FRESH, GOOD, NEAR_EXPIRY).'
                )}
                {lastInventorySyncTime && ` · Đồng bộ lúc: ${lastInventorySyncTime}`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="hsw-btn hsw-btn-secondary hsw-btn-sm"
              style={{ padding: '4px 10px', fontSize: '12px', gap: '4px' }}
              onClick={(e) => {
                e.stopPropagation();
                if (refreshInventory) refreshInventory(date);
                if (refreshMenu) refreshMenu(date);
              }}
              title="Làm mới tồn kho ngay lập tức"
            >
              <RotateCcw size={13} />
              <span>{t('common.refresh', 'Làm mới')}</span>
            </button>
            <button
              type="button"
              className="hsw-btn hsw-btn-tertiary hsw-btn-sm"
              style={{ padding: '4px 8px' }}
              aria-label="Toggle physical inventory panel"
            >
              {showPhysicalInventory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Expandable Inventory Table */}
        {showPhysicalInventory && (
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            {/* Search filter row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ position: 'relative', width: '280px' }}>
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
                  placeholder={t('fnb.prepList.searchIngredientPlaceholder', 'Tìm tên nguyên liệu...')}
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                  className="hsw-input"
                  style={{ width: '100%', paddingLeft: '30px', height: '32px', fontSize: '12px' }}
                />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Tổng cộng: <strong>{ingredientInventory?.length || 0}</strong> nguyên liệu trong hệ thống
              </div>
            </div>

            {/* Inventory table */}
            <div style={{ overflowX: 'auto', maxHeight: '320px', overflowY: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  fontSize: '12px',
                  borderCollapse: 'collapse',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-soft)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                    <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Tên Nguyên Liệu
                    </th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)', width: '120px' }}>
                      Đơn Vị Đo
                    </th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--accent-forest)', textAlign: 'right', width: '180px' }}>
                      Tồn Kho Khả Dụng (Usable)
                    </th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', width: '140px' }}>
                      Tình Trạng
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(ingredientInventory || [])
                    .filter((item) => {
                      if (!ingredientSearch.trim()) return true;
                      const q = ingredientSearch.toLowerCase().trim();
                      return item.ingredientName.toLowerCase().includes(q) || String(item.ingredientId).includes(q);
                    })
                    .map((item) => {
                      const isShortage = item.status === 'SHORTAGE' || item.shortfall > 0;
                      const isZero = Number(item.usableQuantity) <= 0;

                      return (
                        <tr
                          key={item.ingredientId}
                          style={{
                            borderBottom: '1px solid var(--border-subtle)',
                            backgroundColor: isZero ? 'rgba(211, 47, 47, 0.03)' : undefined,
                          }}
                        >
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {cleanMojibake(item.ingredientName)}
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '6px', fontWeight: 400 }}>
                              #{item.ingredientId}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {item.unitOfMeasure}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: isZero ? '#d32f2f' : 'var(--text-primary)', fontSize: '13px' }}>
                            {Number(item.usableQuantity).toLocaleString()} {item.unitOfMeasure}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            {isZero ? (
                              <span style={{ color: '#d32f2f', fontWeight: 600, fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: 'rgba(211, 47, 47, 0.08)' }}>
                                ● Hết hàng
                              </span>
                            ) : isShortage ? (
                              <span style={{ color: '#ed6c02', fontWeight: 600, fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: 'rgba(237, 108, 2, 0.08)' }}>
                                ▲ Thiếu hụt
                              </span>
                            ) : (
                              <span style={{ color: 'var(--accent-forest)', fontWeight: 600, fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: 'rgba(46, 125, 50, 0.08)' }}>
                                ✓ Khả dụng
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  {(!ingredientInventory || ingredientInventory.length === 0) && (
                    <tr>
                      <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        Chưa có dữ liệu tồn kho nguyên liệu từ máy chủ.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                    {item.type === 'a_la_carte' && (
                      <div style={{ marginTop: '3px' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontWeight: 600,
                            backgroundColor: item.folioPostingStatus === 'POSTED_TO_FOLIO' ? '#f6ffed' : '#fff7e6',
                            color: item.folioPostingStatus === 'POSTED_TO_FOLIO' ? '#389e0d' : '#d46b08',
                            border: `1px solid ${item.folioPostingStatus === 'POSTED_TO_FOLIO' ? '#b7eb8f' : '#ffd591'}`
                          }}
                        >
                          {item.folioPostingStatus === 'POSTED_TO_FOLIO' ? 'Folio: Đã tính' : 'Folio: Chờ soát'}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Customer & Villa & Amanoi Service Point */}
                  <td onClick={() => navigate(`/fb/orders/${item.id}`)} style={{ cursor: 'pointer' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cleanMojibake(item.customerName)}</div>
                    <div style={{ fontSize: '12px', color: 'var(--accent-olive)', marginBottom: '4px' }}>
                      {cleanMojibake(formatVilla(item.villaNumber))}
                    </div>
                    <AmanoiServiceLocationBadge
                      notes={item.customerNotes}
                      villaNumber={item.villaNumber}
                      compact={true}
                      lang={currentLang}
                    />
                    {item.locationVerificationStatus === 'UNVERIFIED_LOCATION' && (
                      <div style={{ marginTop: '3px' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontWeight: 600,
                            backgroundColor: '#fffbe6',
                            color: '#d46b08',
                            border: '1px solid #ffe58f',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                          title="Số Villa do khách tự nhập hoặc chưa xác nhận trạng thái M2"
                        >
                          <AlertTriangle size={9} /> Chưa xác minh Villa
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Items list */}
                  <td onClick={() => navigate(`/fb/orders/${item.id}`)} style={{ cursor: 'pointer' }}>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px' }}>
                      {item.items.map((lineItem, idx) => {
                        const menuItem = menuItems.find((m) => m.id === lineItem.menuItemId || String(m.backendId) === String(lineItem.menuItemId) || (m.backendId && String(m.backendId) === lineItem.menuItemId.replace(/\D/g, '')));
                        const recipes = MENU_ITEM_RECIPES[lineItem.menuItemId] || (menuItem ? MENU_ITEM_RECIPES[menuItem.id] : []) || [];
                        const isExpanded = expandedRowRecipeId === `${item.id}-${lineItem.menuItemId}`;

                        return (
                          <li key={idx} style={{ marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span><strong>{lineItem.quantity}x</strong> {menuItem ? localize(menuItem.name) : 'Culinary Item'}</span>
                                {lineItem.inventoryStatus && lineItem.inventoryStatus !== 'PENDING' && (
                                  renderInventoryBadge(lineItem.inventoryStatus, lineItem.inventoryMessage)
                                )}
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
                      <div style={{ marginTop: '6px' }}>
                        <AmanoiServiceLocationBadge
                          notes={item.customerNotes}
                          villaNumber={item.villaNumber}
                          showInstructions={true}
                          compact={false}
                          lang={currentLang}
                        />
                        {(() => {
                          const parsed = parseDiningNotes(item.customerNotes);
                          return parsed.cleanNotes ? (
                            <div
                              style={{
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                                backgroundColor: 'var(--bg-soft)',
                                padding: '3px 6px',
                                borderRadius: 'var(--radius-xs)',
                                marginTop: '4px',
                                display: 'inline-block',
                                fontStyle: 'italic',
                              }}
                            >
                              "{parsed.cleanNotes}"
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </td>


                  {/* Dietary vs Allergy Semantics (Requirement 32 & Revision 2.0.3 Blocker 1) */}
                  <td onClick={() => navigate(`/fb/orders/${item.id}`)} style={{ cursor: 'pointer' }}>
                    {item.dietaryNotes.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {item.dietaryVerificationStatus !== 'VERIFIED' && (
                          <span className="hsw-alert-allergy" style={{ backgroundColor: '#fff1f0', borderColor: '#ffa39e', color: '#cf1322', fontWeight: 700 }} title="CẢNH BÁO: Hồ sơ y tế chưa được M1 xác nhận!">
                            <AlertTriangle size={11} />
                            <span>Chưa xác minh</span>
                          </span>
                        )}
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
                    ) : item.dietaryVerificationStatus === 'VERIFIED' ? (
                      <span style={{ color: 'var(--accent-forest)', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 500 }}>
                        <CheckCircle size={12} />
                        <span>Đã xác minh</span>
                      </span>
                    ) : (
                      <span className="hsw-alert-allergy" style={{ backgroundColor: '#fff1f0', borderColor: '#ffa39e', color: '#cf1322', fontWeight: 700 }} title="CẢNH BÁO AN TOÀN LÂM SÀNG: Chưa có hồ sơ y tế M1">
                        <AlertTriangle size={11} />
                        <span>⚠️ Chưa xác minh</span>
                      </span>
                    )}
                  </td>

                  {/* Status Dropdown & Inventory Status */}
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
                            : item.status === 'cancelled'
                            ? '#fff1f0'
                            : 'var(--success-bg)',
                        color:
                          item.status === 'pending'
                            ? 'var(--text-secondary)'
                            : item.status === 'preparing'
                            ? '#9a6114'
                            : item.status === 'ready'
                            ? '#1a689e'
                            : item.status === 'cancelled'
                            ? '#cf1322'
                            : 'var(--success)',
                      }}
                      id={`status-select-${item.id}`}
                    >
                      <option value="pending" disabled={item.status !== 'pending'}>{t('fnb.status.pending', 'Pending')}</option>
                      <option value="preparing" disabled={item.status !== 'pending' && item.status !== 'preparing'}>{t('fnb.status.preparing', 'Preparing')}</option>
                      <option value="ready" disabled={item.status !== 'preparing' && item.status !== 'ready'}>{t('fnb.status.ready', 'Ready')}</option>
                      <option value="delivered" disabled={item.status !== 'ready' && item.status !== 'delivered'}>{t('fnb.status.delivered', 'Delivered')}</option>
                      <option value="cancelled" disabled={item.status === 'delivered' || item.status === 'cancelled'}>{t('fnb.status.cancelled', 'Cancelled')}</option>
                    </select>
                    <div style={{ marginTop: '5px' }}>
                      {renderInventoryBadge(item.inventoryStatus, item.inventoryMessage)}
                    </div>
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
