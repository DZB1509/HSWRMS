import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  RotateCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Home,
  User,
  HeartPulse,
  ShieldCheck,
  Calendar,
  X,
  Phone,
  Mail,
  AlertTriangle,
  Ban,
  ArrowRight,
} from 'lucide-react';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';
import { Button } from '../../components/common/Button';
import { formatVND } from '../../i18n';
import {
  getReceptionistBookings,
  getReceptionistBookingDetail,
  cancelReceptionistBooking,
  type ReceptionistBookingResponseDto,
  type ReceptionistBookingDetailResponseDto,
} from '../../api/booking/retreatBookingApi';

export const ReceptionistBookingsPage: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<ReceptionistBookingResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Selected booking for Detail Modal
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<ReceptionistBookingDetailResponseDto | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReceptionistBookings({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        checkInFrom: dateFrom || undefined,
        checkInTo: dateTo || undefined,
        query: searchQuery.trim() || undefined,
      });
      setBookings(data || []);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách đặt phòng từ SQL Server.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFrom, dateTo, searchQuery]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Open detail modal and fetch full info (CustomerProfile + ResidenceRecord + HealthProfile)
  const handleOpenDetail = async (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setDetailLoading(true);
    try {
      const detail = await getReceptionistBookingDetail(bookingId);
      setDetailData(detail);
    } catch (err: any) {
      alert('Lỗi tải chi tiết đặt phòng: ' + (err?.message || 'Lỗi kết nối'));
      setSelectedBookingId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedBookingId(null);
    setDetailData(null);
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm(`Xác nhận hủy đặt phòng #${bookingId}? Thao tác này sẽ giải phóng biệt thự và chuyển trạng thái thành CANCELLED.`)) {
      return;
    }
    setCancelling(true);
    try {
      await cancelReceptionistBooking(bookingId);
      alert(`Đã hủy thành công đặt phòng #${bookingId}.`);
      handleCloseDetail();
      fetchBookings();
    } catch (err: any) {
      alert('Không thể hủy đặt phòng: ' + (err?.message || 'Lỗi server'));
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return {
          bg: '#E8F5E9',
          color: '#2E7D32',
          border: '#A5D6A7',
          label: 'ĐÃ XÁC NHẬN (CỌC)',
          icon: <CheckCircle2 size={13} />,
        };
      case 'CHECKED_IN':
        return {
          bg: '#E3F2FD',
          color: '#1565C0',
          border: '#90CAF9',
          label: 'ĐANG LƯU TRÚ',
          icon: <Home size={13} />,
        };
      case 'COMPLETED':
        return {
          bg: '#F5F5F5',
          color: '#616161',
          border: '#E0E0E0',
          label: 'HOÀN THÀNH',
          icon: <ShieldCheck size={13} />,
        };
      case 'CANCELLED':
        return {
          bg: '#FFEBEE',
          color: '#C62828',
          border: '#EF9A9A',
          label: 'ĐÃ HỦY',
          icon: <Ban size={13} />,
        };
      case 'PENDING':
      default:
        return {
          bg: '#FFF8E1',
          color: '#F57F17',
          border: '#FFE082',
          label: 'CHỜ THANH TOÁN',
          icon: <Clock size={13} />,
        };
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: 'var(--space-12)' }}>
      {/* Header */}
      <OperationalPageHeader
        title="Lịch Sử Đặt Phòng & Tra Cứu Khách"
        subtitle="Toàn bộ danh sách hồ sơ đặt phòng lưu trú từ SQL Server, quản lý trạng thái, khai báo cư trú và hồ sơ sức khỏe."
        badge="Front Desk Bookings"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchBookings}
            icon={<RotateCw size={14} className={loading ? 'animate-spin' : ''} />}
          >
            Làm Mới Dữ Liệu
          </Button>
        }
      />

      {/* Filter Bar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>
          {[
            { key: 'ALL', label: 'TẤT CẢ' },
            { key: 'CONFIRMED', label: 'ĐÃ XÁC NHẬN (CỌC)' },
            { key: 'CHECKED_IN', label: 'ĐANG LƯU TRÚ' },
            { key: 'PENDING', label: 'CHỜ ĐẶT CỌC' },
            { key: 'COMPLETED', label: 'HOÀN THÀNH' },
            { key: 'CANCELLED', label: 'ĐÃ HỦY' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                border: statusFilter === tab.key ? '1px solid var(--accent-forest)' : '1px solid transparent',
                backgroundColor: statusFilter === tab.key ? 'rgba(44, 76, 56, 0.08)' : 'transparent',
                color: statusFilter === tab.key ? 'var(--accent-forest)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Dates Row */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '220px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
              }}
            />
            <input
              type="text"
              placeholder="Tìm theo mã booking, tên khách, email, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: 'var(--text-sm)',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              Từ ngày:
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: 'var(--text-xs)',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              Đến ngày:
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: 'var(--text-xs)',
              }}
            />
          </div>

          {(searchQuery || dateFrom || dateTo || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDateFrom('');
                setDateTo('');
                setStatusFilter('ALL');
              }}
              style={{
                border: 'none',
                background: 'none',
                color: 'var(--danger, #c62828)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              Xóa bộ lọc
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            Tổng số: <strong>{bookings.length}</strong> bản ghi
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-16) 0', backgroundColor: '#fff', borderRadius: 'var(--radius-md)' }}>
          <RotateCw className="animate-spin" size={32} style={{ color: 'var(--accent-forest)', margin: '0 auto var(--space-3)' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Đang truy vấn lịch sử đặt phòng từ SQL Server...
          </p>
        </div>
      ) : error ? (
        <div style={{ padding: 'var(--space-8)', backgroundColor: '#FFEBEE', borderRadius: 'var(--radius-md)', color: '#C62828', textAlign: 'center' }}>
          <AlertCircle size={32} style={{ margin: '0 auto var(--space-2)' }} />
          <p style={{ fontWeight: 600 }}>{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchBookings} style={{ marginTop: 'var(--space-3)' }}>
            Thử Lại
          </Button>
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-16) var(--space-4)', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <Clock size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto var(--space-3)' }} />
          <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
            Không tìm thấy đặt phòng nào
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-soft)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Mã Đặt Chỗ</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Khách Hàng</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Gói Nghỉ Dưỡng</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Hạng & Villa Gán</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Lưu Trú</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tổng Tiền & Cọc</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Trạng Thái</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Hồ Sơ Sức Khỏe</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const badge = getStatusBadge(b.bookingStatus);
                  return (
                    <tr
                      key={b.retreatBookingId}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(44, 76, 56, 0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Booking Code */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--accent-forest)' }}>
                          {b.bookingReference}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          ID: #{b.retreatBookingId}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {b.customerFullName || 'Khách Vãng Lai'}
                        </div>
                        {b.customerPhone && (
                          <div style={{ color: 'var(--text-secondary)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Phone size={11} /> {b.customerPhone}
                          </div>
                        )}
                        {b.customerEmail && (
                          <div style={{ color: 'var(--text-tertiary)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={11} /> {b.customerEmail}
                          </div>
                        )}
                      </td>

                      {/* Retreat Package */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {b.packageName}
                        </div>
                        <div style={{ color: 'var(--accent-olive)', fontSize: '11px' }}>
                          {b.durationNights + 1}N{b.durationNights}Đ · {b.guestCount} Khách
                        </div>
                      </td>

                      {/* Villa & Assignment */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {b.requestedCategoryName}
                        </div>
                        {b.assignedVillaNumber ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#E8F5E9',
                              color: '#2E7D32',
                              fontWeight: 700,
                              fontSize: '11px',
                              marginTop: '2px',
                            }}
                          >
                            <Home size={11} /> Villa {b.assignedVillaNumber}
                          </div>
                        ) : (
                          <div style={{ color: 'var(--text-tertiary)', fontSize: '11px', fontStyle: 'italic', marginTop: '2px' }}>
                            Chưa gán villa
                          </div>
                        )}
                      </td>

                      {/* Stay Dates */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {b.checkInDate}
                        </div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>
                          đến {b.checkOutDate}
                        </div>
                      </td>

                      {/* Financial */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formatVND(b.totalEstimatedAmount, i18n.language)}
                        </div>
                        <div style={{ color: '#B26A00', fontSize: '11px', fontWeight: 600 }}>
                          Cọc: {formatVND(b.depositAmount, i18n.language)} ({b.paymentStatus || 'PENDING'})
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-pill)',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            fontWeight: 700,
                            fontSize: '10px',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>

                      {/* Health Profile Status */}
                      <td style={{ padding: '12px 14px' }}>
                        {b.hasHealthProfile ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                              backgroundColor: 'rgba(46, 125, 50, 0.08)',
                              color: '#2E7D32',
                              fontWeight: 600,
                              fontSize: '11px',
                            }}
                          >
                            <HeartPulse size={12} /> Đã có hồ sơ
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                              backgroundColor: 'rgba(230, 81, 0, 0.08)',
                              color: '#E65100',
                              fontWeight: 600,
                              fontSize: '11px',
                            }}
                          >
                            <AlertCircle size={12} /> Chưa khai báo
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenDetail(b.retreatBookingId)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-subtle)',
                              backgroundColor: '#ffffff',
                              color: 'var(--accent-forest)',
                              fontWeight: 600,
                              fontSize: '11px',
                              cursor: 'pointer',
                            }}
                          >
                            <Eye size={13} /> Chi Tiết
                          </button>

                          {b.bookingStatus === 'CONFIRMED' && (
                            <button
                              onClick={() => navigate(`/receptionist/check-in/${b.bookingReference}`)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 10px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--accent-forest)',
                                backgroundColor: 'var(--accent-forest)',
                                color: '#ffffff',
                                fontWeight: 600,
                                fontSize: '11px',
                                cursor: 'pointer',
                              }}
                            >
                              Check-in <ArrowRight size={11} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL / DRAWER */}
      {selectedBookingId !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
            backdropFilter: 'blur(3px)',
          }}
          onClick={handleCloseDetail}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              maxWidth: '920px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-xl)',
              padding: 'var(--space-6)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Chi Tiết Đặt Phòng {detailData?.bookingReference || `HSW-BK-${selectedBookingId}`}
                  </span>
                  {detailData && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: getStatusBadge(detailData.bookingStatus).bg,
                        color: getStatusBadge(detailData.bookingStatus).color,
                        fontWeight: 700,
                        fontSize: '11px',
                      }}
                    >
                      {getStatusBadge(detailData.bookingStatus).label}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Thời gian tạo: {detailData?.createdAt ? new Date(detailData.createdAt).toLocaleString('vi-VN') : '—'}
                </div>
              </div>

              <button
                onClick={handleCloseDetail}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {detailLoading || !detailData ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-12) 0' }}>
                <RotateCw className="animate-spin" size={28} style={{ color: 'var(--accent-forest)', margin: '0 auto var(--space-2)' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                  Đang tải toàn bộ dữ liệu khách hàng, cư trú và sức khỏe...
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {/* 1. Booking & Stay Details */}
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)', backgroundColor: 'var(--bg-soft)' }}>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--accent-forest)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={16} /> 1. Thông Tin Gói Nghỉ Dưỡng & Biệt Thự
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Gói nghỉ dưỡng:</span>{' '}
                      <strong>{detailData.packageName}</strong> ({detailData.packageCode})
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Hạng biệt thự:</span>{' '}
                      <strong>{detailData.requestedCategoryName}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Villa vật lý:</span>{' '}
                      <strong>{detailData.assignedVillaNumber ? `Villa ${detailData.assignedVillaNumber}` : 'Chưa gán'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Lịch trình:</span>{' '}
                      <strong>{detailData.checkInDate}</strong> đến <strong>{detailData.checkOutDate}</strong> ({detailData.durationNights} đêm)
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Số lượng khách:</span>{' '}
                      <strong>{detailData.guestCount} khách</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Tổng tiền dự kiến:</span>{' '}
                      <strong style={{ color: 'var(--accent-forest)' }}>{formatVND(detailData.totalEstimatedAmount, i18n.language)}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Tiền cọc:</span>{' '}
                      <strong style={{ color: '#B26A00' }}>{formatVND(detailData.depositAmount, i18n.language)} ({detailData.paymentStatus || 'PENDING'})</strong>
                    </div>
                  </div>
                  {detailData.specialRequest && (
                    <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)', fontSize: 'var(--text-xs)' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Ghi chú / Yêu cầu đặc biệt:</span>{' '}
                      <span style={{ fontStyle: 'italic', color: 'var(--text-primary)' }}>{detailData.specialRequest}</span>
                    </div>
                  )}
                </div>

                {/* 2. Customer Profile Info (dbo.User & dbo.CustomerProfile) */}
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)', backgroundColor: '#ffffff' }}>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--accent-forest)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={16} /> 2. Thông Tin Hồ Sơ Khách Hàng (dbo.[User] & dbo.CustomerProfile)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Họ và tên:</span>{' '}
                      <strong>{detailData.customerProfile?.fullName || detailData.customerFullName || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Email:</span>{' '}
                      <strong>{detailData.customerProfile?.email || detailData.customerEmail || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Số điện thoại:</span>{' '}
                      <strong>{detailData.customerProfile?.phone || detailData.customerPhone || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Liên hệ khẩn cấp:</span>{' '}
                      <strong>{detailData.customerProfile?.emergencyContact || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Ngày sinh:</span>{' '}
                      <strong>{detailData.customerProfile?.dateOfBirth || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Địa chỉ thường trú:</span>{' '}
                      <strong>{detailData.customerProfile?.residentialAddress || '—'}</strong>
                    </div>
                  </div>
                </div>

                {/* 3. Residence Declaration (dbo.ResidenceRecord) */}
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)', backgroundColor: '#ffffff' }}>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--accent-forest)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} /> 3. Khai Báo Cư Trú (Luật Cư Trú 2020 - dbo.ResidenceRecord)
                  </h4>
                  {detailData.residenceRecord ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Loại giấy tờ:</span>{' '}
                        <strong>{detailData.residenceRecord.identificationType}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Số định danh / Hộ chiếu:</span>{' '}
                        <strong>{detailData.residenceRecord.identificationNumber}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Quốc tịch:</span>{' '}
                        <strong>{detailData.residenceRecord.nationality || 'Việt Nam'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Địa chỉ thường trú khai báo:</span>{' '}
                        <strong>{detailData.residenceRecord.permanentAddress || '—'}</strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 'var(--text-xs)', color: '#B26A00', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={14} /> Chưa có tờ khai cư trú. Lễ tân sẽ thu thập thông tin này khi thực hiện thủ tục Check-in.
                    </div>
                  )}
                </div>

                {/* 4. Health Profile (dbo.HealthProfile) */}
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)', backgroundColor: 'rgba(44, 76, 56, 0.03)' }}>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--accent-forest)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HeartPulse size={16} /> 4. Hồ Sơ Sức Khỏe & Dinh Dưỡng (dbo.HealthProfile)
                  </h4>
                  {detailData.healthProfile ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Tình trạng bệnh lý hiện tại:</span>
                        <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>
                          {detailData.healthProfile.currentHealthCondition || 'Bình thường, không có bệnh nền'}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Dị ứng thực phẩm / Thuốc:</span>
                        <div style={{ color: '#C62828', fontWeight: 600, marginTop: '2px' }}>
                          {detailData.healthProfile.allergies || 'Không có ghi nhận dị ứng'}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Yêu cầu chế độ ăn uống:</span>
                        <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>
                          {detailData.healthProfile.dietaryRequirements || 'Chế độ ăn tiêu chuẩn'}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Ghi chú an toàn trị liệu Spa:</span>
                        <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>
                          {detailData.healthProfile.treatmentSafetyNotes || 'Đủ điều kiện tham gia các liệu trình'}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Tiền sử chấn thương / Phẫu thuật:</span>
                        <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>
                          {detailData.healthProfile.injurySurgeryHistory || 'Không có'}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Ghi chú vận động / Xương khớp:</span>
                        <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>
                          {detailData.healthProfile.mobilityJointNotes || 'Vận động tốt'}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Thuốc đang dùng:</span>
                        <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>
                          {detailData.healthProfile.currentMedications || 'Không'}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Mức độ mệt mỏi / Căng thẳng:</span>
                        <div style={{ color: 'var(--text-primary)', marginTop: '2px', textTransform: 'capitalize' }}>
                          {detailData.healthProfile.stressFatigueLevel || 'moderate'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      Khách hàng chưa điền bản khai sức khỏe trực tuyến. Vui lòng xác nhận sức khỏe với khách khi làm thủ tục Check-in.
                    </div>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                  {detailData.bookingStatus === 'CONFIRMED' && (
                    <Button
                      variant="primary"
                      onClick={() => {
                        handleCloseDetail();
                        navigate(`/receptionist/check-in/${detailData.bookingReference}`);
                      }}
                      icon={<ArrowRight size={14} />}
                    >
                      Tiến Hành Check-In
                    </Button>
                  )}

                  {(detailData.bookingStatus === 'PENDING' || detailData.bookingStatus === 'CONFIRMED') && (
                    <Button
                      variant="tertiary"
                      onClick={() => handleCancelBooking(detailData.retreatBookingId)}
                      disabled={cancelling}
                      style={{ color: '#C62828', borderColor: '#EF9A9A' }}
                      icon={<Ban size={14} />}
                    >
                      {cancelling ? 'Đang hủy...' : 'Hủy Đặt Chỗ'}
                    </Button>
                  )}

                  <Button variant="secondary" onClick={handleCloseDetail}>
                    Đóng
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
