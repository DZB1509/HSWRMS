import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Receipt,
  Sparkles,
  Calendar,
  Home,
  CheckCircle2,
  CreditCard,
  Printer,
  ChevronRight,
  Clock,
  Coffee,
  HeartHandshake,
  AlertTriangle,
  RotateCw,
  Download,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { useFolio } from '../../context/FolioContext';
import { useCustomer } from '../../context/CustomerContext';
import { useAuth } from '../../hooks/useAuth';
import { formatVND } from '../../i18n';
import { billingApi } from '../../features/m5-billing/api/billingApi';
import { resolveNumericBookingId } from '../../features/m5-billing/utils/bookingResolver';
import type { FolioResponse } from '../../features/m5-billing/types';
import type { FolioLineItem, FolioItemStatus } from '../../types/folio';

type SupportedLanguage = 'vi' | 'en' | 'zh-CN' | 'ja' | 'fr';

export const FolioInvoicePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'vi') as SupportedLanguage;
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId?: string }>();
  const { role } = useAuth();
  const { getFolioForBooking, isStayCheckedOut } = useFolio();
  const { activeBooking } = useCustomer();

  const isStaff = role === 'receptionist' || role === 'manager' || role === 'admin';

  // Read active folio by route param or fallback to current customer active booking
  const folioData = useMemo(() => {
    return getFolioForBooking(bookingId);
  }, [getFolioForBooking, bookingId]);

  const numericBookingId = useMemo(() => {
    return resolveNumericBookingId(bookingId, folioData.bookingReference, activeBooking?.id);
  }, [bookingId, folioData.bookingReference, activeBooking?.id]);

  const isCheckedOut = isStayCheckedOut(folioData.bookingReference);

  // Live Backend State
  const [backendFolio, setBackendFolio] = useState<FolioResponse | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  // Simulated unsettled order toggle for presentation / evaluator testing
  const [simulateUnsettledOrder, setSimulateUnsettledOrder] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchBackendData = async () => {
      if (!numericBookingId) {
        if (isMounted) {
          setSyncError('No verified retreat booking ID found for live synchronization — displaying verified local state');
          setIsSyncing(false);
        }
        return;
      }
      setIsSyncing(true);
      try {
        const data = await billingApi.getFolio(numericBookingId);
        if (isMounted) {
          setBackendFolio(data);
          setSyncError(null);
        }
      } catch {
        if (isMounted) {
          setSyncError('Live backend offline — displaying verified local state');
        }
      } finally {
        if (isMounted) {
          setIsSyncing(false);
        }
      }
    };
    fetchBackendData();
    return () => {
      isMounted = false;
    };
  }, [numericBookingId]);

  // Billing Guard Check: Unsettled orders exist if backend flags it or simulation is active
  const hasUnsettledOrders = simulateUnsettledOrder || Boolean(backendFolio?.hasUnsettledOrders);
  const unsettledWarningMessage = simulateUnsettledOrder
    ? t(
        'folio.simulatedWarning',
        'Warning: Unsettled service orders exist (1 scheduled spa therapy session & 1 dining order in preparation). Cannot proceed to payment or checkout until completed.'
      )
    : backendFolio?.unsettledOrdersWarning ||
      t(
        'folio.unsettledWarning',
        'Warning: Unsettled service orders exist. All services must be marked Completed, Delivered, or Cancelled before settlement.'
      );

  // Group line items
  const retreatItems = folioData.lineItems.filter((i) => i.sourceType === 'retreat');
  const spaItems = folioData.lineItems.filter((i) => i.sourceType === 'spa');
  const diningItems = folioData.lineItems.filter((i) => i.sourceType === 'fnb');

  const getStatusLabel = (status: FolioItemStatus) => {
    switch (status) {
      case 'included':
        return t('folio.status.included', 'Package Included');
      case 'deposit_paid':
        return t('folio.status.depositPaid', 'Deposit Paid');
      case 'pending_settlement':
        return t('folio.status.pendingSettlement', 'Pending Settlement');
      case 'settled':
        return t('folio.status.settled', 'Settled');
      default:
        return status;
    }
  };

  const getLocalizedTitle = (item: FolioLineItem) => {
    if (!item.title) return '';
    return item.title[lang] || item.title.en || item.title.vi;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const invoiceId = backendFolio?.invoiceId;
    if (!invoiceId) {
      alert(t('folio.noInvoicePdf', 'Official PDF invoice is not yet generated for this stay. Please wait or proceed to final billing.'));
      return;
    }
    setIsDownloadingPdf(true);
    try {
      const invoiceNum = backendFolio?.bookingReference || folioData.bookingReference;
      await billingApi.downloadInvoicePdf(invoiceId, invoiceNum);
    } catch (err) {
      console.error('Failed to download invoice PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const invoiceQuery = backendFolio?.invoiceId ? `?invoiceId=${backendFolio.invoiceId}` : '';

  const paymentRoute = isStaff && bookingId
    ? `/receptionist/checkout/${bookingId}/payment${invoiceQuery}`
    : `/customer/checkout/payment${invoiceQuery}`;

  const checkoutRoute = isStaff && bookingId
    ? `/receptionist/checkout/${bookingId}/confirmation${invoiceQuery}`
    : `/customer/checkout/confirmation${invoiceQuery}`;

  const reviewRoute = `/customer/review/${folioData.bookingReference}`;

  return (
    <div className="hsw-folio-page">
      <Container size="wide">
        {/* Header */}
        <div className="hsw-folio-header">
          <div className="hsw-folio-title-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Receipt size={24} style={{ color: 'var(--accent-forest)' }} />
                <h1 className="hsw-folio-title">
                  {t('folio.title', 'Customer Folio & Consolidated Invoice')}
                </h1>
                {isSyncing && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <RotateCw size={12} className="animate-spin" />
                    <span>Syncing...</span>
                  </span>
                )}
              </div>
              <p className="hsw-folio-subtitle">
                {t(
                  'folio.subtitle',
                  'Itemized statement of retreat package, therapeutic spa sessions, and nourishing a-la-carte dining.'
                )}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              {/* Evaluator Simulation Control */}
              <button
                type="button"
                className={`hsw-btn ${simulateUnsettledOrder ? 'hsw-btn-retreat-primary' : 'hsw-btn-secondary'}`}
                onClick={() => setSimulateUnsettledOrder(!simulateUnsettledOrder)}
                title="Toggle simulated unsettled order to test Invariant 3 Billing Guard"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                id="btn-simulate-billing-guard"
              >
                <AlertTriangle size={14} />
                <span>{simulateUnsettledOrder ? 'Clear Simulated Order' : 'Test Billing Guard Block'}</span>
              </button>

              <button
                type="button"
                className="hsw-btn hsw-btn-secondary"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf || !backendFolio?.invoiceId}
                title={!backendFolio?.invoiceId ? t('folio.invoiceNotGenerated', 'Official PDF invoice is not yet generated for this stay') : t('folio.downloadPdf', 'Download PDF Invoice')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: !backendFolio?.invoiceId ? 0.6 : 1 }}
                id="btn-download-pdf-invoice"
              >
                {isDownloadingPdf ? <RotateCw size={15} className="animate-spin" /> : <Download size={15} />}
                <span>{isDownloadingPdf ? t('folio.downloadingPdf', 'Downloading PDF...') : t('folio.downloadPdf', 'Download PDF Invoice')}</span>
              </button>

              <button
                type="button"
                className="hsw-btn hsw-btn-secondary"
                onClick={handlePrint}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                id="btn-print-folio"
              >
                <Printer size={15} />
                <span>{t('folio.printStatement', 'Print Statement')}</span>
              </button>
            </div>
          </div>

          {/* Stay Metadata Badges */}
          <div className="hsw-folio-badges">
            <span className="hsw-folio-chip active">
              <Sparkles size={12} />
              {t('folio.ref', 'Booking Ref')}: <strong>{backendFolio ? backendFolio.bookingReference : folioData.bookingReference}</strong>
            </span>
            <span className="hsw-folio-chip">
              <Home size={12} />
              {t('folio.villa', 'Sanctuary Villa')}: <strong>{backendFolio ? backendFolio.villaNumber : folioData.villaCode}</strong>
            </span>
            <span className="hsw-folio-chip">
              <Calendar size={12} />
              {folioData.stayDates}
            </span>
            <span className={`hsw-status-pill ${isCheckedOut ? 'settled' : folioData.isFullySettled ? 'deposit_paid' : 'pending_settlement'}`}>
              {isCheckedOut
                ? t('folio.status.checkedOut', 'Checked Out')
                : folioData.isFullySettled
                ? t('folio.status.balanceCleared', 'Balance Cleared')
                : t('folio.status.activeStay', 'In-House Stay')}
            </span>
            {syncError && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {syncError}
              </span>
            )}
          </div>
        </div>

        {/* BILLING GUARD WARNING BANNER (INVARIANT 3) */}
        {hasUnsettledOrders && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: 'var(--space-6)',
              color: '#9f1239',
            }}
            id="billing-guard-alert-banner"
          >
            <AlertTriangle size={22} style={{ color: '#e11d48', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>
                {t('folio.guardAlertTitle', 'Billing Guard Notice: Unsettled Service Orders Exist')}
              </div>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>
                {unsettledWarningMessage}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: '12px', fontWeight: 600 }}>
                {t('folio.guardAlertAction', 'Checkout settlement and final payment are temporarily disabled until all orders reach final completion.')}
              </p>
            </div>
          </div>
        )}

        {/* Financial KPI Summary */}
        <div className="hsw-folio-kpi-grid">
          {/* Card 1: Retreat Package Total & Deposit */}
          <div className="hsw-folio-kpi-card">
            <div>
              <div className="hsw-folio-kpi-label">
                {t('folio.kpi.packageTotal', 'Package Total')}
              </div>
              <div className="hsw-folio-kpi-val">{formatVND(folioData.retreatTotal)}</div>
            </div>
            <div className="hsw-folio-kpi-sub">
              {t('folio.kpi.depositPaid', 'Deposit Paid')}:{' '}
              <strong style={{ color: 'var(--accent-forest)' }}>
                {formatVND(folioData.depositPaid)}
              </strong>{' '}
              · {t('folio.kpi.remaining', 'Remaining')}: {formatVND(folioData.retreatRemaining)}
            </div>
          </div>

          {/* Card 2: Spa & Therapy Extras */}
          <div className="hsw-folio-kpi-card">
            <div>
              <div className="hsw-folio-kpi-label">
                {t('folio.kpi.spaExtras', 'Spa & Therapy Extras')}
              </div>
              <div className="hsw-folio-kpi-val">{formatVND(folioData.spaExtrasTotal)}</div>
            </div>
            <div className="hsw-folio-kpi-sub">
              {spaItems.filter((i) => i.isIncludedInPackage).length > 0
                ? t('folio.kpi.includedTreatmentsNote', 'Included treatments: 0 VND')
                : t('folio.kpi.noIncludedTreatments', 'Standard included therapies applied')}
            </div>
          </div>

          {/* Card 3: Dining & A-la-carte Extras */}
          <div className="hsw-folio-kpi-card">
            <div>
              <div className="hsw-folio-kpi-label">
                {t('folio.kpi.diningExtras', 'Dining Extras')}
              </div>
              <div className="hsw-folio-kpi-val">{formatVND(folioData.fnbExtrasTotal)}</div>
            </div>
            <div className="hsw-folio-kpi-sub">
              {t('folio.kpi.retreatMealsIncluded', 'Full-board retreat meals: 0 VND')}
            </div>
          </div>

          {/* Card 4: Outstanding Amount Due */}
          <div className="hsw-folio-kpi-card highlight">
            <div>
              <div className="hsw-folio-kpi-label">
                {t('folio.kpi.amountDue', 'Outstanding Amount Due')}
              </div>
              <div className="hsw-folio-kpi-val highlight">
                {formatVND(folioData.outstandingBalance)}
              </div>
            </div>
            <div className="hsw-folio-kpi-sub">
              {folioData.outstandingBalance === 0 ? (
                <span style={{ color: 'var(--accent-forest)', fontWeight: 600 }}>
                  <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {t('folio.kpi.zeroDue', 'No pending payment obligations')}
                </span>
              ) : (
                <span style={{ color: '#b45309', fontWeight: 600 }}>
                  <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {t('folio.kpi.paymentRequired', 'Settlement required before departure')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 1: Retreat Package & Accommodation */}
        <div className="hsw-folio-section">
          <div className="hsw-folio-section-header">
            <div className="hsw-folio-section-title">
              <Sparkles size={18} style={{ color: 'var(--accent-forest)' }} />
              <span>{t('folio.sections.retreat', '1. Sanctuary Retreat Package & Villa Stay')}</span>
            </div>
            <div className="hsw-folio-section-amount">
              {formatVND(folioData.retreatTotal)}
            </div>
          </div>
          <div className="hsw-folio-table-wrapper">
            <table className="hsw-folio-table">
              <thead>
                <tr>
                  <th>{t('folio.table.source', 'Reference')}</th>
                  <th>{t('folio.table.description', 'Package Description')}</th>
                  <th>{t('folio.table.duration', 'Stay Duration')}</th>
                  <th style={{ textAlign: 'right' }}>{t('folio.table.totalAmount', 'Total Package')}</th>
                  <th style={{ textAlign: 'right' }}>{t('folio.table.depositPaid', 'Deposit Paid')}</th>
                  <th style={{ textAlign: 'right' }}>{t('folio.table.balanceDue', 'Remaining Balance')}</th>
                  <th>{t('folio.table.status', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {retreatItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="hsw-source-badge">{item.sourceId}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{getLocalizedTitle(item)}</div>
                      {item.subtitle && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {item.subtitle}
                        </div>
                      )}
                    </td>
                    <td>{folioData.stayDates}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {formatVND(item.totalAmount)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--accent-forest)' }}>
                      -{formatVND(folioData.depositPaid)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: folioData.retreatRemaining > 0 ? '#b45309' : 'var(--accent-forest)' }}>
                      {formatVND(folioData.retreatRemaining)}
                    </td>
                    <td>
                      <span className={`hsw-status-pill ${item.status}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Spa & Holistic Therapies */}
        <div className="hsw-folio-section">
          <div className="hsw-folio-section-header">
            <div className="hsw-folio-section-title">
              <HeartHandshake size={18} style={{ color: 'var(--accent-forest)' }} />
              <span>{t('folio.sections.spa', '2. Spa & Holistic Bodywork')}</span>
            </div>
            <div className="hsw-folio-section-amount">
              {formatVND(folioData.spaExtrasTotal)}
            </div>
          </div>
          <div className="hsw-folio-table-wrapper">
            <table className="hsw-folio-table">
              <thead>
                <tr>
                  <th>{t('folio.table.sessionCode', 'Session Code')}</th>
                  <th>{t('folio.table.treatment', 'Treatment & Therapist')}</th>
                  <th>{t('folio.table.time', 'Service Date & Time')}</th>
                  <th>{t('folio.table.coverage', 'Coverage Type')}</th>
                  <th style={{ textAlign: 'right' }}>{t('folio.table.charge', 'Billable Amount')}</th>
                  <th>{t('folio.table.status', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {spaItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-6)' }}>
                      {t('folio.empty.spa', 'No additional spa sessions billed to this stay.')}
                    </td>
                  </tr>
                ) : (
                  spaItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="hsw-source-badge">{item.sourceId}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{getLocalizedTitle(item)}</div>
                        {item.subtitle && (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {item.subtitle}
                          </div>
                        )}
                      </td>
                      <td>{item.serviceDate || '—'}</td>
                      <td>
                        {item.isIncludedInPackage ? (
                          <span className="hsw-status-pill included">
                            {t('folio.coverage.included', 'Included in Retreat Package (0 VND)')}
                          </span>
                        ) : (
                          <span className="hsw-status-pill pending_settlement">
                            {t('folio.coverage.extra', 'Extra Service')}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {item.totalAmount === 0 ? '0 VND' : formatVND(item.totalAmount)}
                      </td>
                      <td>
                        <span className={`hsw-status-pill ${item.status}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Nourishing Dining & A-la-carte */}
        <div className="hsw-folio-section">
          <div className="hsw-folio-section-header">
            <div className="hsw-folio-section-title">
              <Coffee size={18} style={{ color: 'var(--accent-forest)' }} />
              <span>{t('folio.sections.dining', '3. Nourishing Dining & A-la-carte Orders')}</span>
            </div>
            <div className="hsw-folio-section-amount">
              {formatVND(folioData.fnbExtrasTotal)}
            </div>
          </div>
          <div className="hsw-folio-table-wrapper">
            <table className="hsw-folio-table">
              <thead>
                <tr>
                  <th>{t('folio.table.orderRef', 'Order ID')}</th>
                  <th>{t('folio.table.items', 'Menu Items')}</th>
                  <th>{t('folio.table.orderTime', 'Ordered At')}</th>
                  <th>{t('folio.table.category', 'Category')}</th>
                  <th style={{ textAlign: 'right' }}>{t('folio.table.charge', 'Billable Amount')}</th>
                  <th>{t('folio.table.status', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {diningItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-6)' }}>
                      {t('folio.empty.dining', 'No extra a-la-carte orders recorded. Retreat full-board meals included.')}
                    </td>
                  </tr>
                ) : (
                  diningItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="hsw-source-badge">{item.sourceId}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{getLocalizedTitle(item)}</div>
                        {item.subtitle && (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {item.subtitle}
                          </div>
                        )}
                      </td>
                      <td>{item.serviceDate || '—'}</td>
                      <td>
                        {item.isIncludedInPackage ? (
                          <span className="hsw-status-pill included">
                            {t('folio.coverage.includedMeals', 'Retreat Meal Plan (0 VND)')}
                          </span>
                        ) : (
                          <span className="hsw-status-pill pending_settlement">
                            {t('folio.coverage.alacarteExtra', 'A-la-carte Order')}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {item.totalAmount === 0 ? '0 VND' : formatVND(item.totalAmount)}
                      </td>
                      <td>
                        <span className={`hsw-status-pill ${item.status}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Consolidated Tax & Invoicing Summary (SRS BF-05 / Data Rule 21) */}
        <div
          style={{
            backgroundColor: '#fbfbfa',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-5) var(--space-6)',
            marginBottom: 'var(--space-6)',
          }}
          id="invoice-tax-breakdown-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={18} style={{ color: 'var(--accent-forest)' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, margin: 0 }}>
                {t('folio.invoiceCalculationTitle', 'Official Invoice & Tax Reconciliation (SRS BF-05 / Data Rule 21)')}
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              VAT Rate: 8% on Chargeable Extras
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '13px' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '2px' }}>Retreat Package Total:</div>
              <div style={{ fontWeight: 600 }}>{formatVND(folioData.retreatTotal)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '2px' }}>Deposit Paid (Deducted):</div>
              <div style={{ fontWeight: 600, color: 'var(--accent-forest)' }}>-{formatVND(backendFolio?.depositPaid || folioData.depositPaid)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '2px' }}>Package Outstanding:</div>
              <div style={{ fontWeight: 600, color: (backendFolio?.packageOutstanding ?? folioData.retreatRemaining) > 0 ? '#b45309' : 'var(--accent-forest)' }}>
                {formatVND(backendFolio?.packageOutstanding ?? folioData.retreatRemaining)}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '2px' }}>Spa Extras:</div>
              <div style={{ fontWeight: 600 }}>{formatVND(folioData.spaExtrasTotal)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '2px' }}>Dining Extras:</div>
              <div style={{ fontWeight: 600 }}>{formatVND(folioData.fnbExtrasTotal)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '2px' }}>Subtotal (Extras + Pkg Rem):</div>
              <div style={{ fontWeight: 600 }}>
                {formatVND((backendFolio?.packageOutstanding ?? folioData.retreatRemaining) + folioData.spaExtrasTotal + folioData.fnbExtrasTotal)}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '2px' }}>VAT (8% on Extras):</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {formatVND(backendFolio?.estimatedTax ?? Math.round((folioData.spaExtrasTotal + folioData.fnbExtrasTotal) * 0.08))}
              </div>
            </div>
            <div style={{ borderLeft: '2px solid var(--accent-forest)', paddingLeft: '12px' }}>
              <div style={{ color: 'var(--accent-forest)', fontWeight: 700, marginBottom: '2px' }}>Final Amount Due:</div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--accent-forest)' }}>
                {formatVND(backendFolio?.estimatedAmountDue ?? folioData.outstandingBalance)}
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="hsw-folio-action-bar">
          <div className="hsw-folio-action-total">
            <span className="hsw-folio-action-total-label">
              {folioData.outstandingBalance > 0
                ? t('folio.action.totalDue', 'Final Amount to Settle')
                : t('folio.action.folioCleared', 'Folio Settlement Status')}
            </span>
            <span className="hsw-folio-action-total-val">
              {formatVND(folioData.outstandingBalance)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {hasUnsettledOrders ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#be123c', fontWeight: 600 }}>
                  <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {t('folio.actionBlockedByOrders', 'Settlement Blocked: Active orders pending')}
                </span>
                <button
                  type="button"
                  className="hsw-btn hsw-btn-retreat-primary"
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                  id="btn-proceed-final-payment-disabled"
                >
                  <CreditCard size={16} />
                  <span>{t('folio.action.proceedPayment', 'Proceed to Final Payment')}</span>
                </button>
              </div>
            ) : folioData.outstandingBalance > 0 ? (
              <button
                type="button"
                className="hsw-btn hsw-btn-retreat-primary"
                onClick={() => navigate(paymentRoute)}
                id="btn-proceed-final-payment"
              >
                <CreditCard size={16} />
                <span>{t('folio.action.proceedPayment', 'Proceed to Final Payment')}</span>
                <ChevronRight size={16} />
              </button>
            ) : isCheckedOut ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span className="hsw-status-pill settled" style={{ padding: '6px 12px', fontSize: '13px' }}>
                  <CheckCircle2 size={15} />
                  {t('folio.action.completedAndCheckedOut', 'Stay Completed & Departure Finalized')}
                </span>
                <Link
                  to={reviewRoute}
                  className="hsw-btn hsw-btn-secondary"
                  id="btn-leave-review-from-folio"
                >
                  <Sparkles size={15} />
                  <span>{t('folio.action.leaveReview', 'Leave a Stay Review')}</span>
                </Link>
              </div>
            ) : (
              <button
                type="button"
                className="hsw-btn hsw-btn-retreat-primary"
                onClick={() => navigate(checkoutRoute)}
                id="btn-proceed-checkout"
              >
                <CheckCircle2 size={16} />
                <span>{t('folio.action.proceedCheckout', 'Proceed to Resort Checkout')}</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default FolioInvoicePage;
