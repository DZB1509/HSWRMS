import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  ShieldCheck,
  ArrowLeft,
  Lock,
  HelpCircle,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { useFolio } from '../../context/FolioContext';
import { useAuth } from '../../hooks/useAuth';
import { formatVND } from '../../i18n';

export const FinalPaymentPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId?: string }>();
  const { role } = useAuth();
  const { getFolioForBooking, processPayment } = useFolio();

  const isStaff = role === 'receptionist' || role === 'manager' || role === 'admin';
  const folioData = getFolioForBooking(bookingId);

  // Simulation mode for deterministic reviewer evaluation (Rule 21 & Rule 67)
  const [simulateMode, setSimulateMode] = useState<'success' | 'failed' | 'cancelled'>('success');
  const [isProcessing, setIsProcessing] = useState(false);

  const amountToPay = folioData.outstandingBalance;

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      const tx = await processPayment(folioData.bookingReference, amountToPay, simulateMode);
      const targetResultPath = isStaff && bookingId
        ? `/receptionist/checkout/${bookingId}/payment-result?txId=${tx.id}`
        : `/customer/checkout/payment-result?txId=${tx.id}`;
      navigate(targetResultPath);
    } finally {
      setIsProcessing(false);
    }
  };

  const backRoute = isStaff && bookingId
    ? `/receptionist/folio/${bookingId}`
    : '/customer/folio';

  return (
    <div className="hsw-folio-page">
      <Container size="narrow">
        <div className="hsw-payment-container">
          {/* Back link */}
          <Link
            to={backRoute}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-4)',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} />
            <span>{t('payment.backToFolio', 'Back to Stay Folio')}</span>
          </Link>

          <div className="hsw-payment-card">
            {/* Header */}
            <div
              style={{
                padding: 'var(--space-6) var(--space-8)',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <CreditCard size={22} style={{ color: 'var(--accent-forest)' }} />
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 500 }}>
                  {t('payment.title', 'Final Settlement Payment')}
                </h1>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {t('payment.subtitle', 'Complete your remaining retreat package and extras settlement before checkout.')}
              </p>
            </div>

            <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
              {/* Reference & Villa Tag */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: '#fbfbfa',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--space-5)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>{t('payment.bookingRef', 'Booking Ref')}: <strong style={{ color: 'var(--text-primary)' }}>{folioData.bookingReference}</strong></span>
                <span>{t('payment.sanctuaryVilla', 'Sanctuary Villa')}: <strong style={{ color: 'var(--text-primary)' }}>{folioData.villaCode}</strong></span>
              </div>

              {/* Breakdown Summary */}
              <div className="hsw-payment-breakdown">
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {t('payment.breakdownTitle', 'Outstanding Balance Breakdown')}
                </div>
                <div className="hsw-payment-breakdown-row">
                  <span>{t('payment.packageRemaining', 'Retreat Package Remaining Balance')}</span>
                  <span>{formatVND(folioData.retreatRemaining)}</span>
                </div>
                <div className="hsw-payment-breakdown-row">
                  <span>{t('payment.spaExtras', 'Spa & Holistic Therapies Extras')}</span>
                  <span>{formatVND(folioData.spaExtrasTotal)}</span>
                </div>
                <div className="hsw-payment-breakdown-row">
                  <span>{t('payment.diningExtras', 'Dining & A-la-carte Extras')}</span>
                  <span>{formatVND(folioData.fnbExtrasTotal)}</span>
                </div>
                <div className="hsw-payment-breakdown-row">
                  <span>{t('payment.totalDue', 'Total Settlement Amount')}</span>
                  <span style={{ color: 'var(--accent-forest)' }}>{formatVND(amountToPay)}</span>
                </div>
              </div>

              {/* Selected Payment Gateway: Mock VNPay */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  {t('payment.gatewayLabel', 'Payment Gateway')}
                </label>
                <div className="hsw-payment-provider-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#e02424',
                        color: '#ffffff',
                        fontWeight: 900,
                        fontSize: '14px',
                        borderRadius: '4px',
                        letterSpacing: '0.5px',
                        fontFamily: 'sans-serif',
                      }}
                    >
                      VNPAY
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                        {t('payment.vnpayMockTitle', 'VNPay Gateway (Simulated Integration)')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {t('payment.vnpayMockSub', 'Supports domestic ATM, QR-Pay & international credit cards')}
                      </div>
                    </div>
                  </div>
                  <span className="hsw-status-pill included">
                    {t('payment.activeGateway', 'Active')}
                  </span>
                </div>
              </div>

              {/* Prototype Simulation Selector for Testers (Rule 21 & 67) */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3) var(--space-4)',
                  marginBottom: 'var(--space-5)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    {t('payment.simulationTitle', 'Evaluation / Demo Simulation Mode')}
                  </span>
                  <HelpCircle size={13} style={{ color: '#94a3b8' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSimulateMode('success')}
                    style={{
                      padding: '6px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: simulateMode === 'success' ? '1.5px solid var(--accent-forest)' : '1px solid #cbd5e1',
                      backgroundColor: simulateMode === 'success' ? 'rgba(44, 76, 56, 0.08)' : '#ffffff',
                      color: simulateMode === 'success' ? 'var(--accent-forest)' : '#64748b',
                      cursor: 'pointer',
                    }}
                    id="btn-simulate-success"
                  >
                    ✓ {t('payment.modeSuccess', 'Success (Normal)')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulateMode('failed')}
                    style={{
                      padding: '6px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: simulateMode === 'failed' ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                      backgroundColor: simulateMode === 'failed' ? 'rgba(220, 38, 38, 0.08)' : '#ffffff',
                      color: simulateMode === 'failed' ? '#dc2626' : '#64748b',
                      cursor: 'pointer',
                    }}
                    id="btn-simulate-failed"
                  >
                    ✕ {t('payment.modeFailed', 'Simulate Failure')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulateMode('cancelled')}
                    style={{
                      padding: '6px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: simulateMode === 'cancelled' ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                      backgroundColor: simulateMode === 'cancelled' ? 'rgba(217, 119, 6, 0.08)' : '#ffffff',
                      color: simulateMode === 'cancelled' ? '#d97706' : '#64748b',
                      cursor: 'pointer',
                    }}
                    id="btn-simulate-cancelled"
                  >
                    ⊘ {t('payment.modeCancelled', 'Simulate Cancel')}
                  </button>
                </div>
              </div>

              {/* Prototype Disclaimer */}
              <div className="hsw-payment-disclaimer">
                <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>{t('payment.disclaimerTitle', 'Prototype Demonstration Environment')}: </strong>
                  {t(
                    'payment.disclaimerText',
                    'This transaction is processed entirely within the local demo environment. No real banking credentials or external financial charges will occur.'
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <button
                  type="button"
                  className="hsw-btn hsw-btn-retreat-primary"
                  onClick={handlePay}
                  disabled={isProcessing || amountToPay <= 0}
                  style={{ width: '100%', justifyContent: 'center' }}
                  id="btn-pay-vnpay"
                >
                  <Lock size={16} />
                  <span>
                    {isProcessing
                      ? t('payment.processing', 'Processing Mock Transaction...')
                      : t('payment.payWithVnpay', 'Pay {{amount}} with VNPay', { amount: formatVND(amountToPay) })}
                  </span>
                </button>

                <button
                  type="button"
                  className="hsw-btn hsw-btn-secondary"
                  onClick={() => navigate(backRoute)}
                  style={{ width: '100%', justifyContent: 'center' }}
                  id="btn-cancel-to-folio"
                >
                  <span>{t('payment.cancelReturn', 'Return to Folio Summary')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default FinalPaymentPage;
