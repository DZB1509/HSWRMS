import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Building2,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Lock,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { CustomerPageHeader } from '../../components/customer/CustomerPageHeader';
import { PaymentSummary } from '../../components/customer/PaymentSummary';
import {
  getCustomerBookingDetail,
  getVNPayDepositUrl,
  simulateSandboxVNPayPayment,
  type BookingSummaryResponse,
} from '../../api/booking/retreatBookingApi';
import { formatVND } from '../../i18n';

export const BookingSummaryPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingIdParam = searchParams.get('bookingId');

  const [booking, setBooking] = useState<BookingSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isVnpayModalOpen, setIsVnpayModalOpen] = useState(false);
  const [simulationState, setSimulationState] = useState<'idle' | 'processing' | 'success' | 'failure'>('idle');
  const [vnpayInitData, setVnpayInitData] = useState<{
    paymentUrl: string;
    transactionReference: string;
    testCallbackUrl?: string;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadBooking = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        let bId: number | null = bookingIdParam ? parseInt(bookingIdParam, 10) : null;

        if (!bId) {
          const cached = sessionStorage.getItem('hsw_active_draft_booking');
          if (cached) {
            const parsed = JSON.parse(cached);
            bId = parsed.retreatBookingId;
          }
        }

        if (bId) {
          const res = await getCustomerBookingDetail(bId);
          if (!isCancelled) {
            setBooking(res);
          }
        } else {
          if (!isCancelled) {
            setLoadError('No active reservation found. Please select a retreat package to begin.');
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setLoadError(err?.message || 'Failed to retrieve reservation details from server.');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadBooking();
    return () => {
      isCancelled = true;
    };
  }, [bookingIdParam]);

  const handleOpenPayment = async () => {
    if (!booking) return;
    setActionError(null);
    setSimulationState('idle');

    try {
      const res = await getVNPayDepositUrl(booking.retreatBookingId);
      setVnpayInitData(res);
      setIsVnpayModalOpen(true);
    } catch (err: any) {
      alert('Unable to initialize VNPay payment gateway: ' + (err?.message || 'Server error'));
    }
  };

  const handleSimulatePayment = async (outcome: 'success' | 'failure') => {
    if (!vnpayInitData || !booking) return;
    setSimulationState('processing');
    setActionError(null);

    try {
      const responseCode = outcome === 'success' ? '00' : '24';
      await simulateSandboxVNPayPayment(
        vnpayInitData.transactionReference,
        booking.depositAmount,
        responseCode
      );

      // Clear cached session draft
      sessionStorage.removeItem('hsw_active_draft_booking');
      setIsVnpayModalOpen(false);

      if (outcome === 'success') {
        navigate(
          `/customer/booking/deposit-result?bookingId=${booking.retreatBookingId}&ref=${vnpayInitData.transactionReference}&status=success`
        );
      } else {
        navigate(
          `/customer/booking/deposit-result?bookingId=${booking.retreatBookingId}&ref=${vnpayInitData.transactionReference}&status=failed`
        );
      }
    } catch (err: any) {
      setSimulationState('idle');
      setActionError(err?.message || 'Error processing VNPay verification with backend.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-16) 0', textAlign: 'center' }}>
        <Container size="standard">
          <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-forest)', margin: '0 auto var(--space-4)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Retrieving reservation details from SQL Server...</p>
        </Container>
      </div>
    );
  }

  if (loadError || !booking) {
    return (
      <div style={{ padding: 'var(--space-16) 0', textAlign: 'center' }}>
        <Container size="standard">
          <AlertCircle size={40} style={{ color: '#b91c1c', margin: '0 auto var(--space-4)' }} />
          <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>No Active Booking Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>{loadError || 'Reservation session not found.'}</p>
          <Button variant="primary" onClick={() => navigate('/customer/booking/new')}>
            Start New Reservation
          </Button>
        </Container>
      </div>
    );
  }

  const pkgTitle = booking.packageName;
  const villaTitle = booking.requestedCategoryName;
  const remainingBalance = booking.totalEstimatedAmount - booking.depositAmount;

  return (
    <div className="hsw-booking-summary-page" style={{ padding: 'var(--space-6) 0 var(--space-16)' }}>
      <Container size="standard">
        <CustomerPageHeader
          badge={t('customer.bookingSummary.badge', 'Step 2 of 3 · Review & Deposit')}
          title={t('customer.bookingSummary.title', 'Booking Summary & Deposit')}
          subtitle={t('customer.bookingSummary.subtitle', 'Review your retreat reservation details before confirming your 30% deposit.')}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
            gap: 'var(--space-8)',
            alignItems: 'flex-start',
          }}
        >
          {/* Left Column: Booking Details Review */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* 1. Retreat Overview Card */}
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
                <span
                  style={{
                    display: 'inline-block',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}
                >
                  {t('customer.bookingSummary.retreatPackage', 'Retreat Package')} · Ref: #{booking.retreatBookingId}
                </span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 500, margin: 0 }}>
                  {pkgTitle}
                </h2>
              </div>

              <div style={{ padding: 'var(--space-6)' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 'var(--space-4)',
                    marginBottom: 'var(--space-6)',
                    paddingBottom: 'var(--space-4)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                      <Calendar size={13} />
                      <span>{t('customer.bookingForm.checkInDate', 'Arrival Date')}</span>
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {booking.checkInDate}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                      <Calendar size={13} />
                      <span>{t('customer.bookingForm.checkOutDate', 'Departure Date')}</span>
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {booking.checkOutDate}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                      <User size={13} />
                      <span>Guest Count</span>
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {booking.guestCount || 1} Guests
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                      <Building2 size={13} />
                      <span>{t('customer.bookingSummary.villa', 'Accommodation')}</span>
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {villaTitle}
                    </div>
                  </div>
                </div>

                {/* Reservation Notes / Special Requests */}
                {booking.specialRequest && (
                  <div
                    style={{
                      backgroundColor: 'var(--bg-soft)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 'var(--space-3) var(--space-4)',
                      fontSize: 'var(--text-xs)',
                      lineHeight: 1.6,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <strong>{t('customer.bookingForm.specialRequests', 'Special Requests')}:</strong> {booking.specialRequest}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Deposit Channel Notice */}
            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-6)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
                <CreditCard size={18} style={{ color: 'var(--accent-forest)' }} />
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {t('customer.bookingSummary.depositSection', 'Deposit Payment Method')}
                </h3>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 var(--space-4)' }}>
                Pay 30% deposit securely via VNPay Hospitality Gateway. Holds booking inventory for 15 minutes.
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'rgba(44, 76, 56, 0.04)',
                  border: '1px solid rgba(44, 76, 56, 0.15)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    fontWeight: 700,
                    fontSize: '11px',
                    color: '#005baa',
                  }}
                >
                  VNPAY
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    VNPay Hospitality Gateway
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    QR Code · Domestic ATM Cards · Visa / MasterCard / JCB
                  </div>
                </div>
              </div>
            </div>

            {/* Back link */}
            <div>
              <Link
                to="/customer/booking/new"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                }}
              >
                <ArrowLeft size={14} />
                <span>Modify reservation dates or villa category</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Price & Deposit Breakdown + Pay CTA */}
          <div>
            <PaymentSummary
              totalPrice={booking.totalEstimatedAmount}
              depositAmount={booking.depositAmount}
              highlightDeposit={true}
            />

            <div style={{ marginTop: 'var(--space-6)' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={handleOpenPayment}
                icon={<ArrowRight size={16} />}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--accent-forest)',
                  color: '#ffffff',
                  fontWeight: 600,
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                Pay Deposit via VNPay ({formatVND(booking.depositAmount, i18n.language)})
              </Button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: 'var(--space-3)',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                }}
              >
                <Lock size={12} />
                <span>{t('customer.payment.sslGuarantee', 'Encrypted & Certified VNPay Hospitality Transaction')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* VNPay Modal */}
        {isVnpayModalOpen && vnpayInitData && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vnpay-modal-title"
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
                borderRadius: 'var(--radius-lg)',
                maxWidth: '520px',
                width: '100%',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                position: 'relative',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  backgroundColor: '#005baa',
                  color: '#ffffff',
                  padding: 'var(--space-4) var(--space-6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, letterSpacing: '1px' }}>VNPAY</span>
                  <span style={{ fontSize: '11px', opacity: 0.85 }}>| Hospitality Payment Gateway</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVnpayModalOpen(false)}
                  disabled={simulationState === 'processing'}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                  }}
                  aria-label={t('common.close', 'Close')}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: 'var(--space-6)' }}>
                <h3
                  id="vnpay-modal-title"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 500,
                    margin: '0 0 var(--space-2)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Retreat Deposit Confirmation
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '0 0 var(--space-4)' }}>
                  Deposit transaction reference in SQL Server:{' '}
                  <strong style={{ fontFamily: 'monospace', color: 'var(--accent-forest)' }}>
                    {vnpayInitData.transactionReference}
                  </strong>
                </p>

                {actionError && (
                  <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(185, 28, 28, 0.08)', color: '#b91c1c', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-4)' }}>
                    {actionError}
                  </div>
                )}

                {/* Amount display */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-soft)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-4)',
                    marginBottom: 'var(--space-5)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount to Deposit (30%)</div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--accent-forest)' }}>
                      {formatVND(booking.depositAmount, i18n.language)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Remaining 70% due at check-in:<br />
                    <strong>{formatVND(remainingBalance, i18n.language)}</strong>
                  </div>
                </div>

                {/* Actions */}
                {simulationState === 'processing' ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
                    <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-forest)', margin: '0 auto var(--space-2)' }} />
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent-forest)' }}>
                      Verifying HMAC-SHA512 signature & updating SQL Server...
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {/* Dev Sandbox Live Trigger */}
                    <button
                      type="button"
                      onClick={() => handleSimulatePayment('success')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--accent-forest)',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>Confirm Deposit & Verify Signature (Dev Sandbox)</span>
                    </button>

                    {/* Open VNPay Gateway Directly */}
                    {vnpayInitData.paymentUrl && (
                      <a
                        href={vnpayInitData.paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          width: '100%',
                          padding: '10px 16px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#005baa',
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 600,
                        }}
                      >
                        <ExternalLink size={14} />
                        <span>Open Official VNPay Gateway URL</span>
                      </a>
                    )}

                    {/* Failure Trigger */}
                    <button
                      type="button"
                      onClick={() => handleSimulatePayment('failure')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'transparent',
                        color: '#b91c1c',
                        border: '1px solid rgba(185, 28, 28, 0.3)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <AlertTriangle size={14} />
                      <span>Simulate Payment Failure / Cancellation</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

