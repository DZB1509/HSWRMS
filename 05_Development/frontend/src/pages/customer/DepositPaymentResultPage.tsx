import React from 'react';
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
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { useCustomer } from '../../context/CustomerContext';
import { formatVND } from '../../i18n';

type SupportedLanguage = 'vi' | 'en' | 'zh-CN' | 'ja' | 'fr';

export const DepositPaymentResultPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLanguage;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getBookingById } = useCustomer();

  const ref = searchParams.get('ref') || 'HSW-84920';
  const statusParam = searchParams.get('status') || 'success';
  const isSuccess = statusParam === 'success';

  // Look up booking if available
  const booking = getBookingById(ref);

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

  const depositAmount = booking?.depositAmount || 14100000;
  const remainingBalance = booking?.remainingBalance || 32900000;
  const transactionId = booking?.paymentDetails?.transactionId || `VNPAY-${Date.now().toString().slice(-8)}`;

  return (
    <div className="hsw-deposit-result-page" style={{ padding: 'var(--space-12) 0 var(--space-20)' }}>
      <Container size="narrow">
        <div
          style={{
            backgroundColor: '#ffffff',
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
              {t('customer.depositResult.badge', 'Step 3 of 3 · Transaction Confirmation')}
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
                ? t('customer.depositResult.successTitle', 'Retreat Deposit Confirmed')
                : t('customer.depositResult.failureTitle', 'Deposit Payment Unsuccessful')}
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
                    'Your 30% deposit has been processed successfully. Your villa and wellness sessions are reserved.'
                  )
                : t(
                    'customer.depositResult.failureSubtitle',
                    'The payment transaction could not be completed. Your reservation remains on temporary hold for 24 hours.'
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
                    {t('customer.depositResult.bookingRef', 'Booking Reference')}
                  </div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {ref}
                  </div>
                </div>

                {isSuccess && (
                  <>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {t('customer.depositResult.transactionId', 'Transaction ID')}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--accent-forest)', marginTop: '4px', fontFamily: 'monospace' }}>
                        {transactionId}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {t('customer.depositResult.amountPaid', 'Deposit Amount Paid (30%)')}
                      </div>
                      <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--accent-forest)', marginTop: '2px' }}>
                        {formatVND(depositAmount, i18n.language)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {t('customer.payment.remainingAtResort', 'Remaining Balance (70%)')}
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {formatVND(remainingBalance, i18n.language)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {t('customer.depositResult.paymentDate', 'Payment Date & Time')}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {formattedDate}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {t('customer.depositResult.paymentMethod', 'Payment Channel')}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        VNPay Hospitality Gateway (Online)
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
                    {t('customer.depositResult.importantNotice', 'Deposit payment secures your reservation. The remaining 70% balance is settled comfortably at resort reception upon check-in.')}
                  </strong>
                  <span>
                    No further online deposit is required. Your villa host will have your welcome tea and customized schedule prepared upon arrival.
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
                  <strong>No funds were deducted.</strong> You may retry the payment with an alternative method (QR Code, ATM card, or international credit card).
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
                    onClick={() => navigate(booking ? `/customer/bookings/${booking.id}` : `/customer/bookings`)}
                    icon={<ArrowRight size={16} />}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--accent-forest)',
                      color: '#ffffff',
                      fontWeight: 600,
                    }}
                  >
                    {t('customer.depositResult.viewBookingBtn', 'View Booking Detail & Itinerary')}
                  </Button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <Link
                      to="/customer/bookings"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <FileText size={14} />
                      <span>{t('customer.depositResult.myBookingsBtn', 'View All Bookings')}</span>
                    </Link>

                    <Link
                      to="/customer/dashboard"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <LayoutDashboard size={14} />
                      <span>{t('customer.depositResult.dashboardBtn', 'Customer Dashboard')}</span>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate('/customer/booking/summary')}
                    icon={<RotateCcw size={16} />}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--accent-forest)',
                      color: '#ffffff',
                      fontWeight: 600,
                    }}
                  >
                    {t('customer.depositResult.retryBtn', 'Retry Deposit Payment')}
                  </Button>

                  <Link
                    to="/customer/dashboard"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <LayoutDashboard size={14} />
                    <span>{t('customer.depositResult.dashboardBtn', 'Customer Dashboard')}</span>
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
