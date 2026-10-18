import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Home,
  ArrowRight,
  CreditCard,
  Key,
  Heart,
  RotateCw,
  Download,
  Printer,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { useFolio } from '../../context/FolioContext';
import { useAuth } from '../../hooks/useAuth';
import { formatVND } from '../../i18n';
import { billingApi } from '../../features/m5-billing/api/billingApi';

export const CheckoutConfirmationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId?: string }>();
  const { role } = useAuth();
  const {
    getFolioForBooking,
    completeResortCheckout,
    isStayCheckedOut,
    getCheckoutRecord,
  } = useFolio();

  const isStaff = role === 'receptionist' || role === 'manager' || role === 'admin';
  const folioData = getFolioForBooking(bookingId);

  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [justCompleted, setJustCompleted] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [activeInvoiceId, setActiveInvoiceId] = useState<number>(2);

  React.useEffect(() => {
    billingApi.getFolio(bookingId || 1)
      .then((f) => {
        if (f.invoiceId) setActiveInvoiceId(f.invoiceId);
      })
      .catch(() => {});
  }, [bookingId]);

  const alreadyCheckedOut = isStayCheckedOut(folioData.bookingReference) || justCompleted;
  const existingRecord = getCheckoutRecord(folioData.bookingReference);

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await billingApi.downloadInvoicePdf(activeInvoiceId, folioData.bookingReference);
    } catch (err) {
      console.error('Failed to download invoice PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const folioRoute = isStaff && bookingId
    ? `/receptionist/folio/${bookingId}`
    : '/customer/folio';

  const paymentRoute = isStaff && bookingId
    ? `/receptionist/checkout/${bookingId}/payment`
    : '/customer/checkout/payment';

  const reviewRoute = `/customer/review/${folioData.bookingReference}`;

  const handleConfirmCheckout = async () => {
    setCheckoutError(null);
    setIsFinalizing(true);
    try {
      // Attempt backend atomic checkout finalization
      try {
        await billingApi.finalizeCheckout(activeInvoiceId);
      } catch (err: any) {
        if (err?.code === 'UNSETTLED_SERVICE_ORDERS' || err?.code === 'UNPAID_CHARGES_REMAIN') {
          setCheckoutError(err.message || 'Cannot checkout while unsettled service orders or unpaid balances remain.');
          setIsFinalizing(false);
          return;
        }
      }

      const result = completeResortCheckout(
        folioData.bookingReference,
        isStaff ? 'receptionist' : 'customer'
      );

      if (result.success) {
        setJustCompleted(true);
      } else {
        setCheckoutError(result.message);
      }
    } finally {
      setIsFinalizing(false);
    }
  };

  // ── 1. CHECKOUT BLOCKER VIEW (Rule 4 & 26) ────────────────────────
  if (!alreadyCheckedOut && (folioData.outstandingBalance > 0 || folioData.blockers.length > 0)) {
    return (
      <div className="hsw-folio-page">
        <Container size="narrow">
          <div className="hsw-blocker-panel">
            <div className="hsw-blocker-header">
              <AlertTriangle size={24} />
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>
                {t('checkout.blockerTitle', 'Resort Departure Handover Blocked')}
              </h2>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: '#9f1239', lineHeight: 1.5 }}>
              {t(
                'checkout.blockerDescription',
                'Checkout cannot be finalized while outstanding financial balances or unsettled folio charges remain associated with your stay.'
              )}
            </p>

            <ul className="hsw-blocker-list">
              {folioData.blockers.map((b, idx) => (
                <li key={idx} className="hsw-blocker-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCard size={15} style={{ color: '#be123c' }} />
                    <span>
                      {b.type === 'unpaid_balance' && t('checkout.blockerUnpaidPackage', 'Remaining Retreat Package Balance')}
                      {b.type === 'unsettled_spa' && t('checkout.blockerUnsettledSpa', 'Unsettled Spa & Therapy Extras')}
                      {b.type === 'unsettled_fnb' && t('checkout.blockerUnsettledDining', 'Unsettled Dining & A-la-carte Extras')}
                      {b.type === 'not_in_stay' && t('checkout.blockerNotInStay', 'Stay status is not currently active')}
                    </span>
                  </div>
                  {b.amount !== undefined && (
                    <strong style={{ color: '#be123c', fontFamily: 'monospace' }}>
                      {formatVND(b.amount)}
                    </strong>
                  )}
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#9f1239' }}>{t('checkout.totalPending', 'Total Unresolved')}: </span>
                <strong style={{ fontSize: 'var(--text-lg)', color: '#be123c' }}>
                  {formatVND(folioData.outstandingBalance)}
                </strong>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  type="button"
                  className="hsw-btn hsw-btn-secondary"
                  onClick={() => navigate(folioRoute)}
                  id="btn-blocker-view-folio"
                >
                  <Receipt size={15} />
                  <span>{t('checkout.viewFolio', 'Review Folio')}</span>
                </button>
                <button
                  type="button"
                  className="hsw-btn hsw-btn-retreat-primary"
                  onClick={() => navigate(paymentRoute)}
                  id="btn-blocker-resolve-payment"
                >
                  <CreditCard size={15} />
                  <span>{t('checkout.settleNow', 'Settle Outstanding Balance')}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // ── 2. PRE-CHECKOUT CONFIRMATION (Ready to complete) ──────────────
  if (!alreadyCheckedOut) {
    return (
      <div className="hsw-folio-page">
        <Container size="narrow">
          <div className="hsw-payment-card">
            <div
              style={{
                padding: 'var(--space-6) var(--space-8)',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Key size={22} style={{ color: 'var(--accent-forest)' }} />
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 500 }}>
                  {t('checkout.confirmTitle', 'Resort Departure & Villa Handover')}
                </h1>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {t('checkout.confirmSubtitle', 'Final verification of departure formalities and room clearance.')}
              </p>
            </div>

            <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
              {/* Financial Clearance Card */}
              <div
                style={{
                  backgroundColor: 'rgba(44, 76, 56, 0.05)',
                  border: '1px solid rgba(44, 76, 56, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4) var(--space-5)',
                  marginBottom: 'var(--space-5)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-forest)', fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: '4px' }}>
                  <CheckCircle2 size={16} />
                  <span>{t('checkout.folioClearedTitle', 'Financial Obligations Fully Settled')}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {t('checkout.folioClearedDesc', 'Your retreat package, therapeutic bodywork, and nourishing dining have been reconciled with 0 VND balance due.')}
                </div>
              </div>

              {/* Handover Details */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 'var(--space-3)',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4)',
                  marginBottom: 'var(--space-5)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {t('checkout.bookingRef', 'Booking Reference')}
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {folioData.bookingReference}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {t('checkout.villaCode', 'Sanctuary Villa')}
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {folioData.villaCode}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {t('checkout.stayDates', 'Stay Dates')}
                  </div>
                  <div style={{ color: 'var(--text-primary)' }}>
                    {folioData.stayDates}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {t('checkout.totalPaid', 'Total Package & Extras')}
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-forest)' }}>
                    {formatVND(folioData.totalBillable)}
                  </div>
                </div>
              </div>

              {/* Room Key Return Reminder Box */}
              <div
                style={{
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: 'var(--space-6)',
                  color: '#92400e',
                  fontSize: '13px',
                }}
              >
                <Key size={18} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Key Card Return Reminder:</strong> Please present your RFID room key card at the front desk counter during final departure handover.
                </span>
              </div>

              {checkoutError && (
                <div style={{ padding: 'var(--space-3)', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', fontSize: '13px', marginBottom: 'var(--space-4)' }}>
                  {checkoutError}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <button
                  type="button"
                  className="hsw-btn hsw-btn-retreat-primary"
                  onClick={handleConfirmCheckout}
                  disabled={isFinalizing}
                  style={{ width: '100%', justifyContent: 'center' }}
                  id="btn-confirm-departure"
                >
                  {isFinalizing ? <RotateCw size={16} className="animate-spin" /> : <Key size={16} />}
                  <span>
                    {isFinalizing
                      ? 'Finalizing Resort Departure...'
                      : t('checkout.btnConfirmDeparture', 'Complete Resort Checkout & Release Villa')}
                  </span>
                  {!isFinalizing && <ArrowRight size={16} />}
                </button>

                <button
                  type="button"
                  className="hsw-btn hsw-btn-secondary"
                  onClick={() => navigate(folioRoute)}
                  style={{ width: '100%', justifyContent: 'center' }}
                  id="btn-back-to-folio"
                >
                  <span>{t('checkout.btnBackFolio', 'Return to Folio')}</span>
                </button>
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // ── 3. POST-CHECKOUT COMPLETED CELEBRATION (Rule 28) ──────────────
  const completionDate = existingRecord?.completedAt
    ? new Date(existingRecord.completedAt).toLocaleString()
    : new Date().toLocaleString();

  return (
    <div className="hsw-folio-page">
      <Container size="narrow">
        <div className="hsw-result-card">
          <div className="hsw-result-icon-circle success">
            <CheckCircle2 size={40} />
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>
            {t('checkout.completedTitle', 'Resort Checkout Completed')}
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '540px', margin: '0 auto var(--space-4)' }}>
            {t(
              'checkout.completedSubtitle',
              'Thank you for staying at HeavenStay Wellness Resort. Your departure formalities and villa handover have been successfully recorded in the resort management system.'
            )}
          </p>

          {/* Operational notification: PhysicalVilla transition to NEEDS_CLEANING */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              backgroundColor: 'rgba(44, 76, 56, 0.08)',
              borderRadius: 'var(--radius-pill)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent-forest)',
              marginBottom: 'var(--space-6)',
            }}
          >
            <Home size={14} />
            <span>
              Sanctuary Villa #{folioData.villaCode} status changed to <strong>NEEDS_CLEANING</strong> · Housekeeping sanitization dispatched
            </span>
          </div>

          {/* Meta Grid */}
          <div className="hsw-result-meta-grid">
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t('checkout.bookingRef', 'Booking Reference')}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {folioData.bookingReference}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t('checkout.villaHandover', 'Villa Handover')}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {folioData.villaCode} (Needs Cleaning)
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t('checkout.settledTotal', 'Total Settled Folio')}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--accent-forest)' }}>
                {formatVND(folioData.totalBillable)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t('checkout.completedTime', 'Departure Recorded')}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                {completionDate}
              </div>
            </div>
          </div>

          {/* Actions: Review is optional (Rule 5 & 28) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Link
              to={reviewRoute}
              className="hsw-btn hsw-btn-retreat-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              id="btn-leave-stay-review"
            >
              <Heart size={16} />
              <span>{t('checkout.btnLeaveReview', 'Leave a Stay Review (Optional)')}</span>
              <ArrowRight size={16} />
            </Link>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
              <button
                type="button"
                className="hsw-btn hsw-btn-secondary"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                style={{ width: '100%', justifyContent: 'center' }}
                id="btn-checkout-download-pdf"
              >
                {isDownloadingPdf ? <RotateCw size={15} className="animate-spin" /> : <Download size={15} />}
                <span>{isDownloadingPdf ? 'Downloading...' : 'Download PDF Invoice'}</span>
              </button>

              <button
                type="button"
                className="hsw-btn hsw-btn-secondary"
                onClick={() => window.print()}
                style={{ width: '100%', justifyContent: 'center' }}
                id="btn-checkout-print"
              >
                <Printer size={15} />
                <span>Print Official Receipt</span>
              </button>
            </div>

            <Link
              to={folioRoute}
              className="hsw-btn hsw-btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              id="btn-view-final-folio"
            >
              <Receipt size={16} />
              <span>{t('checkout.btnViewFinalFolio', 'View Final Settled Folio Statement')}</span>
            </Link>

            <Link
              to="/customer/dashboard"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                marginTop: 'var(--space-2)',
                textDecoration: 'none',
              }}
            >
              {t('checkout.returnHome', 'Return to Sanctuary Dashboard')}
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CheckoutConfirmationPage;
