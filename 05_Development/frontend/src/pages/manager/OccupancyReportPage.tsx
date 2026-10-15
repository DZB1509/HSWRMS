import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Home,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Bed,
  Users,
  Waves,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wrench,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { useOperations } from '../../context/OperationsContext';
import { OperationalPagination } from '../../components/operations/OperationalPagination';

interface DbVilla {
  villaId: number;
  villaNumber: string;
  floor?: string;
  villaStatus: string;
  zoneName?: string;
  bedroomInfo?: string;
  maxOccupancy?: number;
  areaSqm?: number;
  nightlyRate?: number;
  bedType?: string;
  maxAdults?: number;
  maxChildren?: number;
  hasPrivatePool?: boolean;
  poolInfo?: string;
  viewAndOperationalNotes?: string;
  image?: string;
  amenities?: string;
  villaCategory?: {
    villaCategoryId: number;
    categoryName: string;
    bedroomCount: number;
    basePrice: number;
    highlights?: string;
  };
}

export const OccupancyReportPage: React.FC = () => {
  const { t } = useTranslation();
  const { refreshDbVillas } = useOperations();

  const [dbVillas, setDbVillas] = useState<DbVilla[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [syncError, setSyncError] = useState<string | null>(null);

  // Filters & Pagination
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Notification / Toast
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Fetch villas from REST API
  const fetchVillas = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setSyncError(null);

    try {
      const response = await fetch('http://localhost:8080/api/v1/villas');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const result = await response.json();
      const list: DbVilla[] = Array.isArray(result) ? result : result.data || [];
      setDbVillas(list);
      setLastSynced(new Date());

      // Also trigger operations context synchronization
      if (refreshDbVillas) {
        refreshDbVillas();
      }
    } catch (err: any) {
      console.error('Lỗi nạp dữ liệu biệt thự:', err);
      setSyncError(err.message || 'Không thể kết nối đến máy chủ CSDL.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshDbVillas]);

  useEffect(() => {
    fetchVillas();
  }, [fetchVillas]);

  // Update villa status via PATCH API
  const handleUpdateStatus = async (villaNumber: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/villas/${villaNumber}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Cập nhật trạng thái thất bại (${response.status})`);
      }

      setActionMessage({
        text: `Đã cập nhật Villa ${villaNumber} sang trạng thái "${getStatusLabel(newStatus)}"!`,
        type: 'success',
      });
      setTimeout(() => setActionMessage(null), 4000);

      // Refresh list
      fetchVillas(true);
    } catch (err: any) {
      setActionMessage({
        text: err.message || 'Lỗi khi cập nhật trạng thái.',
        type: 'error',
      });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Status mapping
  const normalizeStatus = (status: string): string => {
    switch (status?.toUpperCase()) {
      case 'OCCUPIED':
        return 'occupied';
      case 'AVAILABLE':
        return 'ready';
      case 'NEEDS_CLEANING':
      case 'CLEANING':
        return 'cleaning';
      case 'MAINTENANCE':
        return 'maintenance';
      case 'RESERVED':
        return 'reserved';
      default:
        return 'ready';
    }
  };

  const getStatusLabel = (status: string) => {
    const s = normalizeStatus(status);
    switch (s) {
      case 'occupied':
        return t('manager.occupancy.occupied', 'Đang Có Khách');
      case 'reserved':
        return t('manager.occupancy.reserved', 'Đã Đặt Trước');
      case 'ready':
        return t('manager.occupancy.available', 'Sẵn Sàng Đón Khách');
      case 'cleaning':
        return t('manager.occupancy.cleaning', 'Đang Dọn Dẹp / Khử Khuẩn');
      case 'maintenance':
        return t('manager.occupancy.maintenance', 'Đang Bảo Trì Kỹ Thuật');
      default:
        return status;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    const s = normalizeStatus(status);
    switch (s) {
      case 'occupied':
        return { backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' };
      case 'ready':
        return { backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' };
      case 'cleaning':
        return { backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' };
      case 'maintenance':
        return { backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db' };
      case 'reserved':
        return { backgroundColor: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' };
    }
  };

  // Operational metrics calculated strictly from live database data
  const totalVillas = dbVillas.length;
  const occupiedCount = dbVillas.filter((v) => normalizeStatus(v.villaStatus) === 'occupied').length;
  const readyCount = dbVillas.filter((v) => normalizeStatus(v.villaStatus) === 'ready').length;
  const cleaningCount = dbVillas.filter((v) => normalizeStatus(v.villaStatus) === 'cleaning').length;
  const maintenanceCount = dbVillas.filter((v) => normalizeStatus(v.villaStatus) === 'maintenance').length;
  const reservedCount = dbVillas.filter((v) => normalizeStatus(v.villaStatus) === 'reserved').length;
  const occupancyRate = totalVillas > 0 ? (occupiedCount / totalVillas) * 100 : 0;

  // Chart data
  const pieData = [
    { name: t('manager.occupancy.occupied', 'Đang Có Khách'), value: occupiedCount, color: '#3b82f6' },
    { name: t('manager.occupancy.available', 'Sẵn Sàng Đón Khách'), value: readyCount, color: '#10b981' },
    { name: t('manager.occupancy.cleaning', 'Đang Dọn Dẹp / Khử Khuẩn'), value: cleaningCount, color: '#f59e0b' },
    { name: t('manager.occupancy.maintenance', 'Đang Bảo Trì'), value: maintenanceCount, color: '#6b7280' },
    { name: t('manager.occupancy.reserved', 'Đã Đặt Trước'), value: reservedCount, color: '#8b5cf6' },
  ].filter((d) => d.value > 0);

  // Unique Zones for filter
  const uniqueZones = useMemo(() => {
    const set = new Set<string>();
    dbVillas.forEach((v) => {
      if (v.zoneName) set.add(v.zoneName);
    });
    return Array.from(set);
  }, [dbVillas]);

  // Zone Breakdown metrics
  const zoneBreakdown = useMemo(() => {
    const map: Record<string, { total: number; occupied: number }> = {};
    dbVillas.forEach((v) => {
      const z = v.zoneName || 'Khác';
      if (!map[z]) map[z] = { total: 0, occupied: 0 };
      map[z].total += 1;
      if (normalizeStatus(v.villaStatus) === 'occupied') {
        map[z].occupied += 1;
      }
    });
    return Object.entries(map).map(([zone, stat]) => ({
      zone,
      total: stat.total,
      occupied: stat.occupied,
      rate: stat.total > 0 ? (stat.occupied / stat.total) * 100 : 0,
    }));
  }, [dbVillas]);

  // Filtered Villas
  const filteredVillas = useMemo(() => {
    return dbVillas.filter((v) => {
      const s = normalizeStatus(v.villaStatus);
      if (filterStatus !== 'all' && s !== filterStatus) return false;
      if (filterZone !== 'all' && v.zoneName !== filterZone) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const num = (v.villaNumber || '').toLowerCase();
        const cat = (v.villaCategory?.categoryName || '').toLowerCase();
        const zone = (v.zoneName || '').toLowerCase();
        if (!num.includes(query) && !cat.includes(query) && !zone.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [dbVillas, filterStatus, filterZone, searchQuery]);

  const totalItems = filteredVillas.length;
  const paginatedVillas = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVillas.slice(start, start + pageSize);
  }, [filteredVillas, currentPage, pageSize]);

  return (
    <div className="hsw-manager-page" style={{ padding: 'var(--space-6)', maxWidth: 1400, margin: '0 auto' }}>
      {/* Toast Alert */}
      {actionMessage && (
        <div
          style={{
            marginBottom: 'var(--space-4)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: actionMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: actionMessage.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${actionMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="hsw-manager-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={24} style={{ color: 'var(--actor-manager, #2563eb)' }} />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                {t('manager.occupancy.title', 'Báo Cáo Công Suất & Trạng Thái Biệt Thự')}
              </h1>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Đồng bộ quỹ <strong>{totalVillas} biệt thự</strong> trực tiếp từ cơ sở dữ liệu nghỉ dưỡng (HSWRMS Live Database)
              </p>
            </div>
          </div>

          {/* Top Actions: DB Sync Badge & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: syncError ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${syncError ? '#fecaca' : '#bbf7d0'}`,
                color: syncError ? '#991b1b' : '#15803d',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: syncError ? '#ef4444' : '#22c55e',
                  display: 'inline-block',
                }}
              />
              <span>
                {syncError
                  ? 'Lỗi kết nối CSDL'
                  : `CSDL Đã Đồng Bộ: ${totalVillas} Biệt Thự (${lastSynced.toLocaleTimeString('vi-VN')})`}
              </span>
            </div>

            <button
              onClick={() => fetchVillas(true)}
              disabled={refreshing || loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle, #e5e7eb)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: refreshing ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease',
              }}
              title="Tải lại dữ liệu mới nhất từ CSDL"
            >
              <RefreshCw
                size={14}
                style={{
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                }}
              />
              <span>{refreshing ? 'Đang Tải...' : 'Làm Mới CSDL'}</span>
            </button>

            <div className="hsw-manager-privacy-notice" style={{ margin: 0 }}>
              <ShieldCheck size={14} />
              <span>{t('manager.occupancy.privacyNotice', 'Thẩm Quyền Quản Lý · Phân Bổ Vận Hành · Ẩn Dữ Liệu Nhạy Cảm')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        className="hsw-manager-kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        {/* Total Villas */}
        <div
          className="hsw-manager-kpi-card"
          style={{
            borderLeft: '4px solid #059669',
            backgroundColor: '#ffffff',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('manager.occupancy.totalVillas', 'Tổng Quỹ Biệt Thự')}
            </span>
            <Home size={18} style={{ color: '#059669' }} />
          </div>
          <div style={{ fontSize: 'var(--text-3xl, 28px)', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {loading ? '...' : totalVillas}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Toàn bộ biệt thự đã kích hoạt trong CSDL
          </div>
        </div>

        {/* Occupied */}
        <div
          className="hsw-manager-kpi-card"
          style={{
            borderLeft: '4px solid #2563eb',
            backgroundColor: '#ffffff',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('manager.occupancy.occupiedCount', 'Hiện Đang Có Khách')}
            </span>
            <Users size={18} style={{ color: '#2563eb' }} />
          </div>
          <div style={{ fontSize: 'var(--text-3xl, 28px)', fontWeight: 800, color: '#1d4ed8', marginTop: '6px' }}>
            {loading ? '...' : occupiedCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {totalVillas > 0 ? ((occupiedCount / totalVillas) * 100).toFixed(1) : 0}% tổng công suất phòng
          </div>
        </div>

        {/* Available / Ready */}
        <div
          className="hsw-manager-kpi-card"
          style={{
            borderLeft: '4px solid #10b981',
            backgroundColor: '#ffffff',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('manager.occupancy.readyCount', 'Sẵn Sàng Đón Khách')}
            </span>
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: 'var(--text-3xl, 28px)', fontWeight: 800, color: '#047857', marginTop: '6px' }}>
            {loading ? '...' : readyCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Đã khử khuẩn & kiểm tra chất lượng đạt chuẩn
          </div>
        </div>

        {/* Occupancy Rate */}
        <div
          className="hsw-manager-kpi-card"
          style={{
            borderLeft: '4px solid #d97706',
            backgroundColor: '#ffffff',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('manager.occupancy.rate', 'Tỷ Lệ Lấp Đầy')}
            </span>
            <Sparkles size={18} style={{ color: '#d97706' }} />
          </div>
          <div style={{ fontSize: 'var(--text-3xl, 28px)', fontWeight: 800, color: '#b45309', marginTop: '6px' }}>
            {loading ? '...' : `${occupancyRate.toFixed(1)}%`}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {cleaningCount} đang dọn · {maintenanceCount} bảo trì · {reservedCount} đặt trước
          </div>
        </div>
      </div>

      {/* Analytics & Zone Breakdown Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
        }}
      >
        {/* Pie Chart Card */}
        <div
          className="hsw-manager-chart-card"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-5)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div className="hsw-manager-chart-title" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>
              {t('manager.occupancy.chartTitle', 'Tỷ Lệ Trạng Thái Vận Hành Biệt Thự')}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{totalVillas} Biệt Thự</span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={55}
                  paddingAngle={4}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value} Biệt Thự`, 'Số Lượng']} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Zone Distribution Breakdown */}
        <div
          className="hsw-manager-chart-card"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-5)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div className="hsw-manager-chart-title" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={18} style={{ color: 'var(--actor-manager, #2563eb)' }} />
              <span>Phân Bố Công Suất Theo Phân Khu (Resort Zones)</span>
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{zoneBreakdown.length} Phân Khu</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            {zoneBreakdown.map((item) => (
              <div
                key={item.zone}
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-subtle, #f8fafc)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle, #f1f5f9)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.zone}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: item.occupied > 0 ? '#1d4ed8' : '#64748b' }}>
                    {item.occupied} / {item.total} Villa Có Khách ({item.rate.toFixed(0)}%)
                  </span>
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    width: '100%',
                    height: 6,
                    backgroundColor: '#e2e8f0',
                    borderRadius: 9999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${item.rate}%`,
                      height: '100%',
                      backgroundColor: item.rate > 0 ? '#3b82f6' : '#cbd5e1',
                      borderRadius: 9999,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Villa Inventory Section */}
      <div
        className="hsw-folio-section"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        }}
      >
        {/* Section Header & Filters */}
        <div
          className="hsw-folio-section-header"
          style={{
            padding: 'var(--space-4) var(--space-6)',
            borderBottom: '1px solid var(--border-subtle, #e5e7eb)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Home size={18} style={{ color: 'var(--actor-manager, #2563eb)' }} />
            <span style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>
              {t('manager.occupancy.tableTitle', 'Danh Sách Chi Tiết Quỹ Phòng Biệt Thự')}
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                fontWeight: 600,
              }}
            >
              {filteredVillas.length} / {totalVillas} Villa
            </span>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Box */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm mã villa, hạng phòng..."
                style={{
                  fontSize: '12px',
                  padding: '6px 10px 6px 30px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle, #d1d5db)',
                  width: 190,
                  outline: 'none',
                }}
              />
            </div>

            {/* Zone Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={13} style={{ color: 'var(--text-secondary)' }} />
              <select
                value={filterZone}
                onChange={(e) => {
                  setFilterZone(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  fontSize: '12px',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle, #d1d5db)',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                }}
              >
                <option value="all">Tất Cả Phân Khu ({totalVillas})</option>
                {uniqueZones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  fontSize: '12px',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle, #d1d5db)',
                  backgroundColor: '#ffffff',
                  fontWeight: 600,
                  outline: 'none',
                }}
              >
                <option value="all">Tất Cả Trạng Thái ({totalVillas})</option>
                <option value="occupied">Đang Có Khách ({occupiedCount})</option>
                <option value="ready">Sẵn Sàng / Trống ({readyCount})</option>
                <option value="cleaning">Đang Dọn Dẹp ({cleaningCount})</option>
                <option value="maintenance">Đang Bảo Trì ({maintenanceCount})</option>
                <option value="reserved">Đã Đặt Trước ({reservedCount})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="hsw-folio-table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="hsw-folio-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-subtle, #f8fafc)', borderBottom: '1px solid var(--border-subtle, #e5e7eb)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Mã Biệt Thự</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Hạng Villa & Phân Khu</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Thông Số / Quy Mô</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Trạng Thái Vận Hành</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Phân Bổ Vận Hành / Lưu Trú</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Thao Tác Quản Lý</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px auto', display: 'block' }} />
                    <span>Đang nạp dữ liệu quỹ biệt thự từ máy chủ CSDL...</span>
                  </td>
                </tr>
              ) : paginatedVillas.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {t('manager.occupancy.noVillasForFilter', 'Không tìm thấy biệt thự nào phù hợp với bộ lọc đã chọn.')}
                  </td>
                </tr>
              ) : (
                paginatedVillas.map((villa) => {
                  const s = normalizeStatus(villa.villaStatus);
                  const isOccupied = s === 'occupied';
                  const isCleaning = s === 'cleaning';
                  const isMaintenance = s === 'maintenance';
                  const isReady = s === 'ready';

                  return (
                    <tr
                      key={villa.villaId || villa.villaNumber}
                      style={{
                        borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Villa Code & Floor */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {villa.image && (
                            <img
                              src={villa.image}
                              alt={villa.villaNumber}
                              style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                              Villa {villa.villaNumber}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {villa.floor || 'Tầng 1'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Zone */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {villa.villaCategory?.categoryName || 'Biệt Thự Sang Trọng'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {villa.zoneName || 'Resort Zone'}
                        </div>
                      </td>

                      {/* Specs */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Bed size={12} /> {villa.bedType || villa.bedroomInfo || '1 King Bed'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Users size={12} /> Tối đa {villa.maxOccupancy || (villa.maxAdults || 2) + (villa.maxChildren || 0)} Khách ({villa.maxAdults || 2}L + {villa.maxChildren || 0}TE)
                          </span>
                          {villa.areaSqm && (
                            <span>Diện tích: {villa.areaSqm} m²</span>
                          )}
                          {villa.hasPrivatePool && (
                            <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Waves size={12} /> {villa.poolInfo || 'Có hồ bơi riêng'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            ...getStatusBadgeStyle(villa.villaStatus),
                          }}
                        >
                          {isReady && <CheckCircle2 size={12} />}
                          {isOccupied && <Users size={12} />}
                          {isCleaning && <Clock size={12} />}
                          {isMaintenance && <Wrench size={12} />}
                          <span>{getStatusLabel(villa.villaStatus)}</span>
                        </span>
                      </td>

                      {/* Booking / Customer Safe Operational Details */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        {isOccupied ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  backgroundColor: '#eff6ff',
                                  color: '#1d4ed8',
                                  padding: '2px 6px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid #bfdbfe',
                                }}
                              >
                                BK-{villa.villaNumber.replace(/^V/, '')}-2026
                              </span>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                Customer #{villa.villaNumber.replace(/^V/, '')}
                              </span>
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Đang lưu trú · Kỳ nghỉ dưỡng trọn gói
                            </span>
                          </div>
                        ) : isCleaning ? (
                          <div style={{ fontSize: '12px', color: '#b45309' }}>
                            <span>Buồng phòng đang khử khuẩn & chuẩn bị đón khách mới</span>
                          </div>
                        ) : isMaintenance ? (
                          <div style={{ fontSize: '12px', color: '#4b5563' }}>
                            <span>Đang bảo trì định kỳ thiết bị kỹ thuật</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Trống · Đạt chuẩn tiếp nhận khách mới
                          </span>
                        )}
                      </td>

                      {/* Management Quick Actions */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          {isCleaning && (
                            <button
                              onClick={() => handleUpdateStatus(villa.villaNumber, 'AVAILABLE')}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                              }}
                              title="Xác nhận buồng phòng hoàn tất và chuyển sang Sẵn Sàng"
                            >
                              Hoàn Tất Dọn
                            </button>
                          )}
                          {isReady && (
                            <button
                              onClick={() => handleUpdateStatus(villa.villaNumber, 'NEEDS_CLEANING')}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: '#fffbeb',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                              }}
                              title="Yêu cầu dọn dẹp lại"
                            >
                              Yêu Cầu Dọn
                            </button>
                          )}
                          {!isMaintenance && (
                            <button
                              onClick={() => handleUpdateStatus(villa.villaNumber, 'MAINTENANCE')}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 500,
                                backgroundColor: '#f3f4f6',
                                color: '#4b5563',
                                border: '1px solid #d1d5db',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                              }}
                              title="Báo bảo trì kỹ thuật"
                            >
                              Bảo Trì
                            </button>
                          )}
                          {isMaintenance && (
                            <button
                              onClick={() => handleUpdateStatus(villa.villaNumber, 'AVAILABLE')}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                              }}
                              title="Bảo trì hoàn tất, chuyển về sẵn sàng"
                            >
                              Hoàn Tất BT
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > pageSize && (
          <div
            style={{
              padding: 'var(--space-4) var(--space-6)',
              borderTop: '1px solid var(--border-subtle, #e5e7eb)',
            }}
          >
            <OperationalPagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OccupancyReportPage;
