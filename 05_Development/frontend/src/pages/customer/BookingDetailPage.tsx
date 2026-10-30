import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Utensils,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  AlertCircle,
  X,
  Edit3,
  AlertTriangle,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { CustomerPageHeader } from '../../components/customer/CustomerPageHeader';
import { PaymentSummary } from '../../components/customer/PaymentSummary';
import {
  getCustomerBookingDetail,
  cancelCustomerBooking,
  updateCustomerBooking,
  getVillaCategories,
  type BookingSummaryResponse,
  type VillaCategoryDto,
} from '../../api/booking/retreatBookingApi';

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modify Modal State
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [categories, setCategories] = useState<VillaCategoryDto[]>([]);
  const [modStartDate, setModStartDate] = useState('');
  const [modEndDate, setModEndDate] = useState('');
  const [modCategoryId, setModCategoryId] = useState<number>(1);
  const [modGuestCount, setModGuestCount] = useState<number>(1);
  const [modSpecialRequest, setModSpecialRequest] = useState('');
  const [modSubmitting, setModSubmitting] = useState(false);
  const [modError, setModError] = useState<string | null>(null);

  // Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const bId = parseInt(id, 10);
      const res = await getCustomerBookingDetail(bId);
      setBooking(res);
      // Pre-fill modify state
      setModStartDate(res.checkInDate);
      setModEndDate(res.checkOutDate);
      setModCategoryId(res.requestedVillaCategoryId);
      setModGuestCount(res.guestCount || 1);
      setModSpecialRequest(res.specialRequest || '');
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to load booking details from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // Load categories for modify modal
    getVillaCategories().then(setCategories).catch(() => {});
  }, [id]);

  const handleCancelBooking = async () => {
    if (!booking) return;
    setCancelSubmitting(true);
    setCancelError(null);
    try {
      await cancelCustomerBooking(booking.retreatBookingId, cancelReason);
      setIsCancelModalOpen(false);
      await fetchDetail();
      alert('Reservation has been cancelled successfully.');
    } catch (err: any) {
      setCancelError(err?.message || 'Unable to cancel booking.');
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleModifyBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setModSubmitting(true);
    setModError(null);
    try {
      await updateCustomerBooking(booking.retreatBookingId, {
        checkInDate: modStartDate,
        checkOutDate: modEndDate,
        requestedVillaCategoryId: modCategoryId,
        guestCount: modGuestCount,
        specialRequest: modSpecialRequest,
      });
      setIsModifyModalOpen(false);
      await fetchDetail();
      alert('Reservation updated successfully in SQL Server.');
    } catch (err: any) {
      setModError(err?.message || 'Failed to update reservation.');
    } finally {
      setModSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-16) 0', textAlign: 'center' }}>
        <Container size="standard">
          <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-forest)', margin: '0 auto var(--space-4)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading reservation details from SQL Server...</p>
        </Container>
      </div>
    );
  }

  if (loadError || !booking) {
    return (
      <div style={{ padding: 'var(--space-16) 0', textAlign: 'center' }}>
        <Container size="standard">
          <AlertCircle size={40} style={{ color: '#b91c1c', margin: '0 auto var(--space-4)' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-4)' }}>
            Booking Not Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>{loadError || 'Reservation record does not exist.'}</p>
          <Button variant="primary" onClick={() => navigate('/customer/bookings')}>
            {t('customer.bookingDetail.backToList', 'Back to My Bookings')}
          </Button>
        </Container>
      </div>
    );
  }

  const pkgTitle = booking.packageName;
  const villaTitle = booking.requestedCategoryName;
  const canModifyOrCancel = booking.bookingStatus === 'PENDING' || booking.bookingStatus === 'CONFIRMED';

  const getBookingStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'Chờ đặt cọc';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'CHECKED_IN':
        return 'Đã nhận phòng';
      case 'COMPLETED':
        return 'Đã hoàn tất';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getPaymentStatusText = (status?: string, bookingStatus?: string) => {
    const effectiveStatus = status || (bookingStatus === 'CONFIRMED' || bookingStatus === 'CHECKED_IN' ? 'SUCCESSFUL' : 'PENDING');
    switch (effectiveStatus.toUpperCase()) {
      case 'SUCCESSFUL':
        return 'Đã thanh toán cọc';
      case 'FAILED':
        return 'Thanh toán thất bại';
      case 'PENDING':
      default:
        return 'Chờ thanh toán';
    }
  };

  return (
    <div className="hsw-booking-detail-page" style={{ padding: 'var(--space-6) 0 var(--space-16)' }}>
      <Container size="standard">
        {/* Back Link */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Link
            to="/customer/bookings"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--accent-forest)',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} />
            <span>{t('customer.bookingDetail.backToList', 'Quay Lại Danh Sách Kỳ Nghỉ')}</span>
          </Link>
        </div>

        {/* Header with Status & Action Buttons */}
        <CustomerPageHeader
          badge={`${t('customer.depositResult.bookingRef', 'Mã đặt chỗ')}: ${booking.bookingReference || `#${booking.retreatBookingId}`}`}
          title={pkgTitle}
          subtitle={`${booking.checkInDate} → ${booking.checkOutDate} · ${booking.guestCount || 1} Khách`}
          action={
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor:
                    booking.bookingStatus === 'CONFIRMED'
                      ? 'rgba(44, 76, 56, 0.1)'
                      : booking.bookingStatus === 'CHECKED_IN'
                      ? 'rgba(37, 99, 235, 0.1)'
                      : booking.bookingStatus === 'CANCELLED'
                      ? 'rgba(185, 28, 28, 0.1)'
                      : 'rgba(217, 119, 6, 0.1)',
                  color:
                    booking.bookingStatus === 'CONFIRMED'
                      ? 'var(--accent-forest)'
                      : booking.bookingStatus === 'CHECKED_IN'
                      ? '#2563eb'
                      : booking.bookingStatus === 'CANCELLED'
                      ? '#b91c1c'
                      : '#d97706',
                }}
              >
                {getBookingStatusText(booking.bookingStatus)}
              </span>

              {canModifyOrCancel && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsModifyModalOpen(true)}
                    icon={<Edit3 size={13} />}
                  >
                    Thay Đổi Kỳ Nghỉ
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsCancelModalOpen(true)}
                    style={{ borderColor: 'rgba(185, 28, 28, 0.3)', color: '#b91c1c' }}
                    icon={<X size={13} />}
                  >
                    Hủy Đặt Chỗ
                  </Button>
                </>
              )}
            </div>
          }
        />

        {/* Main Grid: Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: 'var(--space-8)',
            alignItems: 'flex-start',
          }}
        >
          {/* Left Column: Sanctuary Villa & Schedule Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            {/* 1. Sanctuary Villa Card */}
            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div
                style={{
                  padding: 'var(--space-6)',
                  backgroundColor: 'var(--accent-forest)',
                  color: '#ffffff',
                }}
              >
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85 }}>
                  HẠNG BIỆT THỰ ĐÃ ĐẶT
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 500, margin: '4px 0 0' }}>
                  {villaTitle} {booking.assignedVillaNumber ? `(${booking.assignedVillaNumber})` : ''}
                </h3>
              </div>

              <div style={{ padding: 'var(--space-6)' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: 'var(--space-4)',
                    marginBottom: 'var(--space-4)',
                    paddingBottom: 'var(--space-4)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ngày Nhận Phòng</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{booking.checkInDate}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ngày Trả Phòng</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{booking.checkOutDate}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Số Lượng Khách</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{booking.guestCount || 1} Khách</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Biệt Thự Thực Tế</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent-forest)' }}>
                      {booking.assignedVillaNumber || 'Phân bổ khi nhận phòng'}
                    </div>
                  </div>
                </div>

                {booking.specialRequest && (
                  <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    <strong>Yêu cầu đặc biệt được ghi nhận:</strong> {booking.specialRequest}
                  </div>
                )}
              </div>
            </div>

            {/* Cross-Module Integration Actions */}
            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-5)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: 'var(--accent-forest)', marginBottom: 'var(--space-3)' }}>
                LỊCH TRÌNH NGHỈ DƯỠNG & TRỊ LIỆU TÍCH HỢP
              </div>

              {/* Spa Link */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) 0',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <Sparkles size={16} style={{ color: 'var(--accent-forest)', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('customer.bookingDetail.crossSpaTitle', 'Spa & Liệu Pháp Toàn Diện')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                    {t('customer.bookingDetail.crossSpaDesc', 'Khám phá retreat-included treatments hoặc đặt thêm các phiên phục hồi.')}
                  </div>
                  <Link
                    to="/customer/spa"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--accent-forest)',
                      textDecoration: 'none',
                    }}
                  >
                    <span>Xem Lịch Trị Liệu Spa →</span>
                  </Link>
                </div>
              </div>

              {/* Dining Link */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) 0',
                }}
              >
                <Utensils size={16} style={{ color: 'var(--accent-forest)', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('customer.bookingDetail.crossDiningTitle', 'Ẩm Thực Dưỡng Sinh Cá Nhân')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                    {t('customer.bookingDetail.crossDiningDesc', 'Xem thực đơn dinh dưỡng từ bếp trưởng phù hợp với hồ sơ ăn uống của quý khách.')}
                  </div>
                  <Link
                    to="/customer/dining/menu"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--accent-forest)',
                      textDecoration: 'none',
                    }}
                  >
                    <span>Xem Thực Đơn Dưỡng Sinh →</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Financial Breakdown & Verification */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', position: 'sticky', top: '90px' }}>
            <PaymentSummary
              totalPrice={booking.totalEstimatedAmount}
              depositAmount={booking.depositAmount}
              highlightDeposit={false}
              depositPaid={booking.bookingStatus === 'CONFIRMED' || booking.paymentStatus === 'SUCCESSFUL'}
            />

            {booking.bookingStatus === 'PENDING' && booking.paymentStatus !== 'SUCCESSFUL' && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(`/customer/booking/summary?bookingId=${booking.retreatBookingId}`)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Thanh Toán 30% Tiền Cọc Qua VNPay
              </Button>
            )}

            {/* Transaction Verification Info */}
            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-5)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
                <ShieldCheck size={18} style={{ color: 'var(--accent-forest)' }} />
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Xác Thực Giao Dịch Tài Chính
                </h4>
              </div>

              <div style={{ fontSize: '11px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                <div>
                  <strong>Mã giao dịch:</strong>{' '}
                  <span style={{ fontFamily: 'monospace' }}>
                    {booking.transactionReference || 'VNPay Deposit Channel'}
                  </span>
                </div>
                <div>
                  <strong>Trạng thái thanh toán:</strong>{' '}
                  <span style={{ fontWeight: 600, color: (booking.bookingStatus === 'CONFIRMED' || booking.paymentStatus === 'SUCCESSFUL') ? 'var(--accent-forest)' : '#d97706' }}>
                    {getPaymentStatusText(booking.paymentStatus, booking.bookingStatus)}
                  </span>
                </div>
                <div>
                  <strong>Thời gian đặt chỗ:</strong>{' '}
                  <span>{new Date(booking.createdAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>

              <div
                style={{
                  marginTop: 'var(--space-4)',
                  paddingTop: 'var(--space-3)',
                  borderTop: '1px dashed var(--border-subtle)',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                }}
              >
                70% chi phí còn lại sẽ được thanh toán tại quầy lễ tân khi quý khách nhận phòng.
              </div>
            </div>
          </div>
        </div>

        {/* Modify Modal */}
        {isModifyModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 19, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-4)',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-md)',
                maxWidth: '500px',
                width: '100%',
                padding: 'var(--space-6)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: 0 }}>
                  Modify Reservation ({booking.bookingReference || `#${booking.retreatBookingId}`})
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModifyModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {modError && (
                <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(185, 28, 28, 0.08)', color: '#b91c1c', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-4)' }}>
                  {modError}
                </div>
              )}

              <form onSubmit={handleModifyBooking}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Check-in Date</label>
                    <input
                      type="date"
                      value={modStartDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setModStartDate(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Check-out Date</label>
                    <input
                      type="date"
                      value={modEndDate}
                      min={modStartDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setModEndDate(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Villa Category</label>
                  <select
                    value={modCategoryId}
                    onChange={(e) => setModCategoryId(parseInt(e.target.value, 10))}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                  >
                    {categories.map((c) => (
                      <option key={c.villaCategoryId} value={c.villaCategoryId}>
                        {c.categoryName} (Max {c.maxOccupancy} Guests)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Guest Count</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={modGuestCount}
                    onChange={(e) => setModGuestCount(parseInt(e.target.value, 10) || 1)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 'var(--space-5)' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Special Request</label>
                  <textarea
                    rows={2}
                    value={modSpecialRequest}
                    onChange={(e) => setModSpecialRequest(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                  <Button variant="secondary" size="sm" type="button" onClick={() => setIsModifyModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" disabled={modSubmitting}>
                    {modSubmitting ? 'Saving Changes...' : 'Save & Update'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {isCancelModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 19, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-4)',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-md)',
                maxWidth: '460px',
                width: '100%',
                padding: 'var(--space-6)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
                <AlertTriangle size={20} style={{ color: '#b91c1c' }} />
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: 0, color: '#b91c1c' }}>
                  Cancel Reservation
                </h3>
              </div>

              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
                Per Resort Cancellation Policy (FR-M2-07), cancellations made at least 48 hours prior to check-in qualify for a 100% refund of the deposit. Less than 48 hours incurs a forfeit.
              </p>

              {cancelError && (
                <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(185, 28, 28, 0.08)', color: '#b91c1c', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-4)' }}>
                  {cancelError}
                </div>
              )}

              <div style={{ marginBottom: 'var(--space-5)' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Reason for Cancellation</label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please state your reason for cancelling..."
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button variant="secondary" size="sm" onClick={() => setIsCancelModalOpen(false)}>
                  Keep Reservation
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCancelBooking}
                  disabled={cancelSubmitting}
                  style={{ backgroundColor: '#b91c1c', color: '#ffffff' }}
                >
                  {cancelSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

