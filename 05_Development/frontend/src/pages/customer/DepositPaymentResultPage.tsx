import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  LayoutDashboard,
  FileText,
  Loader2,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import {
  getCustomerBookingDetail,
  verifyVNPayReturn,
  type BookingSummaryResponse,
} from '../../api/booking/retreatBookingApi';
import { formatVND } from '../../i18n';

type SupportedLanguage = 'vi' | 'en' | 'zh-CN' | 'ja' | 'fr';

export const DepositPaymentResultPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLanguage;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const refParam = searchParams.get('ref') || '';
  const bookingIdParam = searchParams.get('bookingId');
  const statusParam = searchParams.get('status') || '';

  const [booking, setBooking] = useState<BookingSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifiedSuccess, setVerifiedSuccess] = useState<boolean>(statusParam === 'success');
  const [transactionRef, setTransactionRef] = useState<string>(refParam);

  useEffect(() => {
    let isCancelled = false;

    const verifyAndLoad = async () => {
      setLoading(true);
      try {
        // If VNPay query string is present (e.g., vnp_SecureHash), call server verification
        if (searchParams.has('vnp_SecureHash')) {
          try {
            const verifyRes = await verifyVNPayReturn(window.location.search);
            if (verifyRes.success) {
              setVerifiedSuccess(true);
              if (verifyRes.data?.vnp_TxnRef) setTransactionRef(verifyRes.data.vnp_TxnRef);
            } else {
              setVerifiedSuccess(false);
            }
          } catch {
            setVerifiedSuccess(false);
          }
        }

        // Load booking details from SQL Server
        const bId = bookingIdParam ? parseInt(bookingIdParam, 10) : null;
        if (bId) {
          const detail = await getCustomerBookingDetail(bId);
          if (!isCancelled) {
            setBooking(detail);
            if (detail.bookingStatus === 'CONFIRMED' || detail.bookingStatus === 'CHECKED_IN') {
              setVerifiedSuccess(true);
            }
            if (detail.transactionReference) {
              setTransactionRef(detail.transactionReference);
            }
          }
        }
      } catch (err) {
        // If loading by ID fails, fallback gracefully
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    verifyAndLoad();
    return () => {
      isCancelled = true;
    };
  }, [bookingIdParam, searchParams]);

  const isSuccess = verifiedSuccess || booking?.bookingStatus === 'CONFIRMED';
  const bookingRefDisplay = booking?.bookingReference || (booking ? `HSW-BK-${booking.retreatBookingId}` : (bookingIdParam ? `HSW-BK-${bookingIdParam}` : '—'));
  const vnpayTxnRefDisplay = transactionRef || booking?.transactionReference || '—';

  const formattedDate = new Date().toLocaleDateString(
    lang === 'vi' ? 'vi-VN' : lang === 'fr' ? 'fr-FR' : lang === 'ja' ? 'ja-JP' : lang === 'zh-CN' ? 'zh-CN' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  const depositAmount = booking?.depositAmount || 0;
  const remainingBalance = booking ? (booking.totalEstimatedAmount - booking.depositAmount) : 0;

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-12) 0 var(--space-20)', textAlign: 'center' }}>
        <Container size="narrow">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem' }}>
            <Loader2 style={{ width: '2.5rem', height: '2.5rem', animation: 'spin 1s linear infinite', color: '#2d5a43' }} />
            <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              {t('booking.verifyingDeposit', 'Đang xác thực giao dịch và tải thông tin đặt phòng từ hệ thống...')}
            </p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="hsw-deposit-result-page" style={{ padding: 'var(--space-12) 0 var(--space-20)' }}>
      <Container size="narrow">
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: `1.5px solid ${isSuccess ? 'rgba(44, 76, 56, 0.25)' : 'rgba(185, 28, 28, 0.25)'}`,
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            overflow: 'hidden',
            textAlign: 'center',
          }}
        >
          {/* Header Banner */}
          <div
            style={{
              padding: 'var(--space-8) var(--space-6) var(--space-6)',
              backgroundColor: isSuccess ? 'rgba(44, 76, 56, 0.04)' : 'rgba(185, 28, 28, 0.04)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: isSuccess ? 'var(--accent-forest)' : '#b91c1c',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-4)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
              }}
            >
              {isSuccess ? <CheckCircle2 size={36} /> : <XCircle size={36} />}
            </div>

            <div
              style={{
                display: 'inline-block',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: isSuccess ? 'var(--accent-forest)' : '#b91c1c',
                marginBottom: 'var(--space-2)',
              }}
            >
              {t('customer.depositResult.badge', 'Đặt Kỳ Nghỉ > Kết Quả Đặt Cọc')}
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-2xl)',
                fontWeight: 500,
                color: 'var(--text-primary)',
                margin: '0 0 var(--space-2)',
              }}
            >
              {isSuccess
                ? t('customer.depositResult.successTitle', 'Đặt Cọc Kỳ Nghỉ Thành Công')
                : t('customer.depositResult.failureTitle', 'Thanh Toán Đặt Cọc Không Thành Công')}
            </h1>

            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                maxWidth: '480px',
                margin: '0 auto',
                lineHeight: 1.6,
              }}
            >
              {isSuccess
                ? t(
                    'customer.depositResult.successSubtitle',
                    'Khoản đặt cọc 30% đã được ghi nhận. Biệt thự và các buổi trị liệu của quý khách đã được giữ chỗ an toàn.'
                  )
                : t(
                    'customer.depositResult.failureSubtitle',
                    'Giao dịch thanh toán chưa thể hoàn tất. Đặt chỗ của quý khách đang được tạm giữ trong vòng 24 giờ.'
                  )}
            </p>
          </div>

          {/* Transaction Metadata Card */}
          <div style={{ padding: 'var(--space-8)' }}>
            <div
              style={{
                backgroundColor: 'var(--bg-soft)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-6)',
                textAlign: 'left',
                marginBottom: 'var(--space-6)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--space-4)',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    MÃ ĐẶT CHỖ
                  </div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {bookingRefDisplay}
                  </div>
                </div>

                {isSuccess && (
                  <>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        MÃ GIAO DỊCH VNPAY
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--accent-forest)', marginTop: '4px', fontFamily: 'monospace' }}>
                        {vnpayTxnRefDisplay}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        SỐ TIỀN ĐẶT CỌC (30%)
                      </div>
                      <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--accent-forest)', marginTop: '2px' }}>
                        {formatVND(depositAmount, i18n.language)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        SỐ DƯ CÒN LẠI (70%)
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {formatVND(remainingBalance, i18n.language)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        THỜI GIAN GIAO DỊCH
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {formattedDate}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        KÊNH THANH TOÁN
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Cổng Thanh Toán VNPay (Trực Tuyến)
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Important Notice */}
            {isSuccess ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-4)',
                  backgroundColor: 'rgba(44, 76, 56, 0.05)',
                  border: '1px solid rgba(44, 76, 56, 0.15)',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left',
                  marginBottom: 'var(--space-8)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                <ShieldCheck size={18} style={{ color: 'var(--accent-forest)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: 'var(--accent-forest)', display: 'block', marginBottom: '2px' }}>
                    {t('customer.depositResult.importantNotice', 'Khoản đặt cọc đảm bảo giữ chỗ cho kỳ nghỉ. Khoản tiền 70% còn lại sẽ được thanh toán thoải mái tại quầy lễ tân khi quý khách nhận phòng.')}
                  </strong>
                  <span>
                    Quý khách không cần thanh toán thêm khoản cọc trực tuyến nào khác. Quản gia biệt thự sẽ chuẩn bị sẵn trà chào mừng và lịch trình cá nhân hóa khi quý khách đến nhận phòng.
                  </span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-4)',
                  backgroundColor: 'rgba(185, 28, 28, 0.05)',
                  border: '1px solid rgba(185, 28, 28, 0.15)',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left',
                  marginBottom: 'var(--space-8)',
                  fontSize: 'var(--text-xs)',
                  color: '#991b1b',
                  lineHeight: 1.6,
                }}
              >
                <XCircle size={18} style={{ color: '#b91c1c', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Tài khoản chưa bị trừ tiền.</strong> Quý khách có thể thử lại thanh toán với phương thức khác (Mã QR, thẻ ATM hoặc thẻ quốc tế).
                </div>
              </div>
            )}

            {/* Navigation CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {isSuccess ? (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate(booking ? `/customer/bookings/${booking.retreatBookingId}` : `/customer/bookings`)}
                    icon={<ArrowRight size={16} />}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--accent-forest)',
                      color: '#ffffff',
                      fontWeight: 600,
                    }}
                  >
                    {t('customer.depositResult.viewBookingBtn', '→ Xem Chi Tiết Đặt Chỗ & Lịch Trình')}
                  </Button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <Link
                      to="/customer/bookings"
                      className="hsw-btn hsw-btn-secondary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        textDecoration: 'none',
                        fontSize: 'var(--text-xs)',
                        padding: '10px 14px',
                      }}
                    >
                      <FileText size={14} />
                      <span>{t('customer.depositResult.myBookingsBtn', 'Xem Tất Cả Kỳ Nghỉ')}</span>
                    </Link>

                    <Link
                      to="/customer/dashboard"
                      className="hsw-btn hsw-btn-secondary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        textDecoration: 'none',
                        fontSize: 'var(--text-xs)',
                        padding: '10px 14px',
                      }}
                    >
                      <LayoutDashboard size={14} />
                      <span>{t('customer.depositResult.dashboardBtn', 'Về Bảng Điều Khiển')}</span>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate(bookingIdParam ? `/customer/booking/summary?bookingId=${bookingIdParam}` : '/customer/booking/new')}
                    icon={<RotateCcw size={16} />}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--accent-forest)',
                      color: '#ffffff',
                      fontWeight: 600,
                    }}
                  >
                    {t('customer.depositResult.retryBtn', 'Thử Lại Thanh Toán Đặt Cọc')}
                  </Button>

                  <Link
                    to="/customer/dashboard"
                    className="hsw-btn hsw-btn-secondary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                      fontSize: 'var(--text-xs)',
                      padding: '10px 14px',
                    }}
                  >
                    <LayoutDashboard size={14} />
                    <span>{t('customer.depositResult.dashboardBtn', 'Về Bảng Điều Khiển')}</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

