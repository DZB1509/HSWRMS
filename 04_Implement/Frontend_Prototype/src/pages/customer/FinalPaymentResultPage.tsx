import React from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Receipt,
  Home,
  CreditCard,
  FileCheck2,
  HelpCircle,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { useFolio } from '../../context/FolioContext';
import { useAuth } from '../../hooks/useAuth';
import { formatVND } from '../../i18n';

export const FinalPaymentResultPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId?: string }>();
  const { role } = useAuth();
  const { getTransactionById, latestTransaction, activeFolio } = useFolio();

  const isStaff = role === 'receptionist' || role === 'manager' || role === 'admin';
  const txId = searchParams.get('txId');
  const transaction = txId ? getTransactionById(txId) : latestTransaction;

  const currentRef = transaction?.bookingReference || bookingId || activeFolio.bookingReference;

  const folioRoute = isStaff && bookingId
    ? `/receptionist/folio/${bookingId}`
    : '/customer/folio';

  const paymentRoute = isStaff && bookingId
    ? `/receptionist/checkout/${bookingId}/payment`
    : '/customer/checkout/payment';

  const checkoutConfirmationRoute = isStaff && bookingId
    ? `/receptionist/checkout/${bookingId}/confirmation`
    : '/customer/checkout/confirmation';

  // Rule 23: Direct Route Safety — Safe recovery if accessed without transaction
  if (!transaction) {
    return (
      <div className="hsw-folio-page">
        <Container size="narrow">
          <div className="hsw-result-card">
            <div className="hsw-result-icon-circle cancelled">
              <HelpCircle size={36} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>
              {t('paymentResult.noSessionTitle', 'No Active Payment Session')}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
              {t(
                'paymentResult.noSessionText',
                'No recent payment transaction record was found for this browser session. You can review your stay folio or proceed to settlement.'
              )}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)' }}>
              <button
                type="button"
                className="hsw-btn hsw-btn-secondary"
                onClick={() => navigate(folioRoute)}
                id="btn-recovery-folio"
              >
                <Receipt size={16} />
                <span>{t('paymentResult.returnFolio', 'Return to Folio')}</span>
              </button>
              <button
                type="button"
                className="hsw-btn hsw-btn-retreat-primary"
                onClick={() => navigate(paymentRoute)}
                id="btn-recovery-payment"
              >
                <CreditCard size={16} />
                <span>{t('paymentResult.goToPayment', 'Go to Final Payment')}</span>
              </button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const isSuccess = transaction.status === 'success';
  const isFailed = transaction.status === 'failed';
  const isCancelled = transaction.status === 'cancelled';

  return (
    <div className="hsw-folio-page">
      <Container size="narrow">
        <div className="hsw-result-card">
          {/* Status Icon */}
          <div className={`hsw-result-icon-circle ${transaction.status}`}>
            {isSuccess && <CheckCircle2 size={38} />}
            {isFailed && <XCircle size={38} />}
            {isCancelled && <AlertTriangle size={38} />}
          </div>

          {/* Heading */}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>
            {isSuccess && t('paymentResult.successTitle', 'Payment Transaction Successful')}
            {isFailed && t('paymentResult.failedTitle', 'Payment Transaction Failed')}
            {isCancelled && t('paymentResult.cancelledTitle', 'Payment Transaction Cancelled')}
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '520px', margin: '0 auto var(--space-4)' }}>
            {isSuccess &&
              t(
                'paymentResult.successSubtitle',
                'Your payment of {{amount}} has been authorized and recorded on your resort folio.',
                { amount: formatVND(transaction.amount) }
              )}
            {isFailed &&
              t(
                'paymentResult.failedSubtitle',
                'The payment could not be processed by the gateway. {{reason}}',
                { reason: transaction.failureReason || t('paymentResult.defaultFailReason', 'Simulated card issuer decline.') }
              )}
            {isCancelled &&
              t(
                'paymentResult.cancelledSubtitle',
                'The payment process was cancelled before completion. No charges were made to your account.'
              )}
          </p>

          {/* CRITICAL RULE 3 & 22 NOTICE FOR SUCCESS: Payment != Checkout */}
          {isSuccess && (
            <div
              style={{
                backgroundColor: 'rgba(44, 76, 56, 0.05)',
                border: '1.5px solid rgba(44, 76, 56, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4) var(--space-5)',
                margin: 'var(--space-5) 0',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-forest)', fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: '4px' }}>
                <FileCheck2 size={16} />
                <span>{t('paymentResult.noticeImportant', 'Payment Succeeded · Checkout Not Yet Finalized')}</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {t(
                  'paymentResult.noticeDescription',
                  'Your financial folio balance is now settled. Please note that completing payment does not automatically check you out of HeavenStay. Please proceed to Resort Checkout to complete key return and departure verification.'
                )}
              </p>
            </div>
          )}

          {/* Transaction Meta Grid */}
          <div className="hsw-result-meta-grid">
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t('paymentResult.txId', 'Transaction Reference')}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                {transaction.id}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t('paymentResult.bookingRef', 'Booking Reference')}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {currentRef}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t('paymentResult.gateway', 'Gateway / Provider')}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                VNPay Mock Gateway
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t('paymentResult.settledAmount', 'Settled Amount')}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: isSuccess ? 'var(--accent-forest)' : 'var(--text-primary)' }}>
                {formatVND(transaction.amount)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {isSuccess && (
              <>
                <button
                  type="button"
                  className="hsw-btn hsw-btn-retreat-primary"
                  onClick={() => navigate(checkoutConfirmationRoute)}
                  style={{ width: '100%', justifyContent: 'center' }}
                  id="btn-continue-to-checkout"
                >
                  <Home size={16} />
                  <span>{t('paymentResult.continueToCheckout', 'Continue to Resort Checkout')}</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  className="hsw-btn hsw-btn-secondary"
                  onClick={() => navigate(folioRoute)}
                  style={{ width: '100%', justifyContent: 'center' }}
                  id="btn-view-settled-folio"
                >
                  <Receipt size={16} />
                  <span>{t('paymentResult.viewFolio', 'View Settled Folio Statement')}</span>
                </button>
              </>
            )}

            {isFailed && (
              <>
                <button
                  type="button"
                  className="hsw-btn hsw-btn-retreat-primary"
                  onClick={() => navigate(paymentRoute)}
                  style={{ width: '100%', justifyContent: 'center' }}
                  id="btn-retry-payment"
                >
                  <RotateCcw size={16} />
                  <span>{t('paymentResult.retryPayment', 'Retry Final Payment')}</span>
                </button>

                <button
                  type="button"
                  className="hsw-btn hsw-btn-secondary"
                  onClick={() => navigate(folioRoute)}
                  style={{ width: '100%', justifyContent: 'center' }}
                  id="btn-fail-return-folio"
                >
                  <span>{t('paymentResult.returnFolio', 'Return to Folio')}</span>
                </button>
              </>
            )}

            {isCancelled && (
              <>
                <button
                  type="button"
                  className="hsw-btn hsw-btn-retreat-primary"
                  onClick={() => navigate(paymentRoute)}
                  style={{ width: '100%', justifyContent: 'center' }}
                  id="btn-repay-cancelled"
                >
                  <CreditCard size={16} />
                  <span>{t('paymentResult.returnToPayment', 'Resume Settlement')}</span>
                </button>

                <button
                  type="button"
                  className="hsw-btn hsw-btn-secondary"
                  onClick={() => navigate(folioRoute)}
                  style={{ width: '100%', justifyContent: 'center' }}
                  id="btn-cancel-return-folio"
                >
                  <span>{t('paymentResult.returnFolio', 'Return to Folio')}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default FinalPaymentResultPage;
