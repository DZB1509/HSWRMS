import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  ShieldCheck,
  ArrowLeft,
  Lock,
  Banknote,
  QrCode,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { useFolio } from '../../context/FolioContext';
import { useCustomer } from '../../context/CustomerContext';
import { useAuth } from '../../hooks/useAuth';
import { formatVND } from '../../i18n';
import { billingApi } from '../../features/m5-billing/api/billingApi';
import type { VietQrResponse, VnpayPaymentUrlResponse, FolioResponse, InvoiceResponse } from '../../features/m5-billing/types';
const formatCurrency = formatVND;
import { isNetworkOrTimeoutError } from '../../features/m5-billing/utils/paymentSafety';
import { resolveCustomerBookingId } from '../../features/m5-billing/utils/bookingResolver';

export const FinalPaymentPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { bookingId } = useParams<{ bookingId?: string }>();
  const { role } = useAuth();
  const { getFolioForBooking, resetFolioSettlement } = useFolio();
  const [backendFolio, setBackendFolio] = useState<FolioResponse | null>(null);
  const [backendInvoice, setBackendInvoice] = useState<InvoiceResponse | null>(null);
  const [isLoadingBackend, setIsLoadingBackend] = useState(true);
  const { activeBooking, bookings } = useCustomer();

  const isStaff = role === 'receptionist' || role === 'manager' || role === 'admin';
  const requestedBookingId = bookingId || searchParams.get('bookingId');
  const customerBookingId = resolveCustomerBookingId(requestedBookingId, bookings);
  const customerBooking = bookings.find(booking => Number(booking.id) === customerBookingId);
  const folioData = getFolioForBooking(role === 'customer' ? customerBooking?.bookingReference : bookingId);

  const numericBookingId = useMemo(() => {
    if (role === 'customer') return customerBookingId;
    if (bookingId && /^\d+$/.test(bookingId)) return Number(bookingId);
    if (bookingId && activeBooking?.bookingReference !== bookingId && activeBooking?.id !== bookingId) return null;
    const candidate = Number(activeBooking?.id);
    return Number.isSafeInteger(candidate) && candidate > 0 ? candidate : null;
  }, [role, customerBookingId, bookingId, activeBooking?.id]);

  const queryInvoiceId = searchParams.get('invoiceId');
  const initialInvoiceId = useMemo(() => {
    if (queryInvoiceId && /^\d+$/.test(queryInvoiceId.trim())) {
      const parsed = parseInt(queryInvoiceId.trim(), 10);
      if (parsed > 0) return parsed;
    }
    return null;
  }, [queryInvoiceId]);

  const [resolvedInvoiceId, setResolvedInvoiceId] = useState<number | null>(initialInvoiceId);

  useEffect(() => {
    if (initialInvoiceId && (!resolvedInvoiceId || resolvedInvoiceId !== initialInvoiceId)) {
      setResolvedInvoiceId(initialInvoiceId);
    }
  }, [initialInvoiceId]);

  // Resolve backend Folio & Invoice ID
  useEffect(() => {
    let isMounted = true;
    if (!numericBookingId) {
      setIsLoadingBackend(false);
      setPaymentError('A verified server booking ID is required to load payment details.');
      return;
    }

    const resolveBackendData = async () => {
      try {
        const folioRes = await billingApi.getFolio(numericBookingId);
        if (!isMounted) return;
        setBackendFolio(folioRes);
        if (folioRes.invoiceId) {
          setResolvedInvoiceId(folioRes.invoiceId);
        } else if (folioRes.canGenerateInvoice) {
          const newInvoice = await billingApi.generateInvoice(numericBookingId);
          if (isMounted && newInvoice.invoiceId) {
            setResolvedInvoiceId(newInvoice.invoiceId);
          }
        }
      } catch (err) {
        if (isMounted) setPaymentError(err instanceof Error ? err.message : 'Unable to load payment details from the server.');
      } finally {
        if (isMounted) setIsLoadingBackend(false);
      }
    };
    resolveBackendData();
    return () => {
      isMounted = false;
    };
  }, [numericBookingId]);

  // Fetch authoritative invoice statement when invoice ID is resolved
  useEffect(() => {
    let isMounted = true;
    const invId = resolvedInvoiceId || backendFolio?.invoiceId;
    if (!invId) return;

    billingApi.getInvoice(invId)
      .then((inv) => {
        if (isMounted) setBackendInvoice(inv);
      })
      .catch(() => {
        // Backend or invoice lookup fallback
      });
    return () => {
      isMounted = false;
    };
  }, [resolvedInvoiceId, backendFolio?.invoiceId]);

  // Payment Method Selection: VIETQR_BANK_TRANSFER vs VNPay vs Cash vs Card at Desk
  const [selectedMethod, setSelectedMethod] = useState<'VIETQR_BANK_TRANSFER' | 'VNPAY' | 'CASH' | 'CARD'>('VIETQR_BANK_TRANSFER');

  // VietQR state
  const [vietQrData, setVietQrData] = useState<VietQrResponse | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const pollTimerRef = useRef<any>(null);

  // VNPay state
  const [vnpayData, setVnpayData] = useState<VnpayPaymentUrlResponse | null>(null);
  const [isCreatingVnpay, setIsCreatingVnpay] = useState(false);
  const [vnpayError, setVnpayError] = useState<string | null>(null);
  const vnpayPollRef = useRef<any>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const amountToPay: number = useMemo(() => {
    if (!backendFolio) return 0;
    return Number(backendFolio.estimatedAmountDue ?? backendFolio.finalAmount ?? backendFolio.balanceDue ?? 0);
  }, [backendFolio]);

  // Synchronized financial breakdown matching S41 reconciliation
  const { packageBalance, extraSpaCharges, extraFnbCharges, taxAmount, totalAmount } = useMemo(() => {
    const items: Array<any> = backendFolio?.items || backendInvoice?.items || [];

    // 1. Package balance: packagePrice - depositAmount, or packageOutstanding
    let pkgBal = 0;
    if (typeof backendFolio?.packageOutstanding === 'number' && backendFolio.packageOutstanding > 0) {
      pkgBal = backendFolio.packageOutstanding;
    } else if (typeof backendInvoice?.packageOutstanding === 'number' && backendInvoice.packageOutstanding > 0) {
      pkgBal = backendInvoice.packageOutstanding;
    } else if (backendFolio?.packagePrice && (backendFolio?.depositAmount ?? backendFolio?.depositPaid)) {
      pkgBal = backendFolio.packagePrice - (backendFolio.depositAmount ?? backendFolio.depositPaid ?? 0);
    } else if (backendInvoice?.packageCharges && backendInvoice?.depositDeducted) {
      pkgBal = backendInvoice.packageCharges - backendInvoice.depositDeducted;
    } else if (typeof folioData.retreatRemaining === 'number' && folioData.retreatRemaining > 0) {
      pkgBal = folioData.retreatRemaining;
    } else {
      pkgBal = 0;
    }

    // 2. Extra Spa charges: from DTO or filter folio items (SPA / EXTRA_SPA)
    let spaChg = 0;
    if (typeof backendFolio?.extraSpaCharges === 'number' && backendFolio.extraSpaCharges > 0) {
      spaChg = backendFolio.extraSpaCharges;
    } else if (typeof backendInvoice?.spaCharges === 'number' && backendInvoice.spaCharges > 0) {
      spaChg = backendInvoice.spaCharges;
    } else {
      const spaItemsSum = items
        .filter((it: any) => {
          const cat = String(it.chargeCategory || '').toUpperCase();
          return cat === 'EXTRA_SPA' || cat === 'SPA';
        })
        .reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);
      spaChg = spaItemsSum;
    }

    // 3. Extra F&B charges: from DTO or filter folio items (FNB / EXTRA_FNB / MEAL)
    let fnbChg = 0;
    if (typeof backendFolio?.extraFnbCharges === 'number' && backendFolio.extraFnbCharges > 0) {
      fnbChg = backendFolio.extraFnbCharges;
    } else if (typeof backendInvoice?.fnbCharges === 'number' && backendInvoice.fnbCharges > 0) {
      fnbChg = backendInvoice.fnbCharges;
    } else {
      const fnbItemsSum = items
        .filter((it: any) => {
          const cat = String(it.chargeCategory || '').toUpperCase();
          return cat === 'EXTRA_FNB' || cat === 'FNB' || cat === 'MEAL';
        })
        .reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);
      fnbChg = fnbItemsSum;
    }

    // 4. Tax (VAT 8% on extras)
    let tax = 0;
    if (typeof backendInvoice?.taxAmount === 'number' && backendInvoice.taxAmount > 0) {
      tax = backendInvoice.taxAmount;
    } else if (typeof backendFolio?.estimatedTax === 'number' && backendFolio.estimatedTax > 0) {
      tax = backendFolio.estimatedTax;
    } else {
      const vatRate = backendFolio?.vatRate ?? backendInvoice?.vatRate;
      tax = vatRate == null ? 0 : Math.round((spaChg + fnbChg) * vatRate);
    }

    // 5. Total settlement amount
    const calcTotal = pkgBal + spaChg + fnbChg + tax;
    const tot = amountToPay > 0 ? amountToPay : calcTotal;

    return {
      packageBalance: pkgBal,
      extraSpaCharges: spaChg,
      extraFnbCharges: fnbChg,
      taxAmount: tax,
      totalAmount: tot,
    };
  }, [backendFolio, backendInvoice, folioData, amountToPay]);

  const isZeroBalance = amountToPay <= 0;

  // Load VietQR when invoice is available
  useEffect(() => {
    let isMounted = true;
    const invoiceIdToUse = resolvedInvoiceId;
    if (isZeroBalance || !invoiceIdToUse) return;

    const loadQr = async () => {
      setIsLoadingQr(true);
      try {
        const qrRes = await billingApi.getInvoiceVietQr(invoiceIdToUse);
        if (isMounted) {
          setVietQrData(qrRes);
        }
      } catch (err: any) {
        if (isMounted) { setVietQrData(null); setPaymentError(err instanceof Error ? err.message : 'VietQR is unavailable from the server.'); }
      } finally {
        if (isMounted) setIsLoadingQr(false);
      }
    };

    loadQr();
    return () => {
      isMounted = false;
    };
  }, [resolvedInvoiceId, numericBookingId, isZeroBalance, amountToPay]);

  // Polling for VietQR transaction status when displayed
  useEffect(() => {
    const transactionReference = vietQrData?.transactionReference;
    if (!transactionReference || selectedMethod !== 'VIETQR_BANK_TRANSFER') {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    const checkStatus = async () => {
      try {
        const txStatus = await billingApi.getTransactionStatus(transactionReference);
        if (txStatus && txStatus.paymentStatus === 'SUCCESSFUL') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          const invoiceSuffix = `&invoiceId=${resolvedInvoiceId}`;
          const tx = txStatus.transactionReference;
          navigate(
            isStaff && bookingId
              ? `/receptionist/checkout/${bookingId}/payment-result?txId=${tx}${invoiceSuffix}`
              : `/customer/checkout/payment-result?txId=${tx}${invoiceSuffix}`
          );
        }
      } catch {
        // Ignore polling errors
      }
    };

    pollTimerRef.current = setInterval(checkStatus, 3500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [vietQrData, selectedMethod, resolvedInvoiceId, isStaff, bookingId, folioData.bookingReference, amountToPay, navigate]);

  const targetInvoiceId = resolvedInvoiceId || backendFolio?.invoiceId || null;

  const fetchVnpayUrl = useCallback(async () => {
    if (!targetInvoiceId || isZeroBalance) return;
    setIsCreatingVnpay(true);
    setVnpayError(null);
    try {
      const res = await billingApi.createVnpayPaymentUrl(
        targetInvoiceId,
        amountToPay > 0 ? amountToPay : undefined,
        numericBookingId || undefined
      );
      setVnpayData(res);
    } catch (err: any) {
      console.warn('createVnpayPaymentUrl error:', err);
      const msg = String(err?.message || '').toLowerCase();
      const code = String(err?.code || '');
      if (
        msg.includes('already paid') ||
        msg.includes('already settled') ||
        code === 'INVOICE_ALREADY_PAID' ||
        code === 'INVOICE_ALREADY_SETTLED' ||
        code === 'NO_BALANCE_DUE'
      ) {
        setVnpayError('The invoice appears paid; refresh its status before continuing.');
        return;
      }
      setVnpayError(err?.message || 'Không thể tạo liên kết thanh toán VNPay.');
    } finally {
      setIsCreatingVnpay(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetInvoiceId, isZeroBalance, amountToPay, numericBookingId]);

  // VNPay tab: auto-create the signed payment URL (+ PENDING transaction) ONLY ONCE when entering the tab
  // If vnpayData already exists for the current invoice, DO NOT re-fetch (prevents duplicate HSW_INV records & infinite calls)
  useEffect(() => {
    if (selectedMethod === 'VNPAY' && !isZeroBalance && targetInvoiceId) {
      if (!vnpayData || vnpayData.invoiceId !== targetInvoiceId) {
        fetchVnpayUrl();
      }
    }
  }, [selectedMethod, isZeroBalance, targetInvoiceId, vnpayData, fetchVnpayUrl]);

  const handleReloadVnpay = () => {
    setVnpayData(null);
    setVnpayError(null);
    fetchVnpayUrl();
  };

  // VNPay tab: poll invoice payment status every 3s; jump to S43 once the IPN/return settles it
  useEffect(() => {
    if (selectedMethod !== 'VNPAY' || !vnpayData?.paymentUrl) return;
    const invoiceToPoll = vnpayData.invoiceId || targetInvoiceId;
    if (!invoiceToPoll) return;

    const tick = async () => {
      try {
        const st = await billingApi.getInvoicePaymentStatus(invoiceToPoll);
        if (st.paymentStatus === 'SUCCESSFUL') {
          if (vnpayPollRef.current) clearInterval(vnpayPollRef.current);
          if (st.transactionReference) {
            const suffix = `&invoiceId=${invoiceToPoll}`;
            navigate(isStaff && bookingId ? `/receptionist/checkout/${bookingId}/payment-result?txId=${st.transactionReference}${suffix}` : `/customer/checkout/payment-result?txId=${st.transactionReference}${suffix}`);
          }
        }
      } catch {
        // ignore transient polling errors
      }
    };
    vnpayPollRef.current = setInterval(tick, 3000);
    return () => {
      if (vnpayPollRef.current) clearInterval(vnpayPollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMethod, vnpayData, targetInvoiceId]);

  const openVnpayGateway = () => {
    if (!vnpayData?.paymentUrl) return;
    const popup = window.open(vnpayData.paymentUrl, '_blank');
    if (!popup) window.location.href = vnpayData.paymentUrl; // popup blocked → full redirect
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleManualCheckStatus = async () => {
    if (!vietQrData?.transactionReference) return;
    setIsCheckingStatus(true);
    setPaymentError(null);
    try {
      const txStatus = await billingApi.getTransactionStatus(vietQrData.transactionReference);
      if (txStatus.paymentStatus === 'SUCCESSFUL') {
        const invoiceSuffix = `&invoiceId=${resolvedInvoiceId}`;
        const tx = txStatus.transactionReference;
        navigate(
          isStaff && bookingId
            ? `/receptionist/checkout/${bookingId}/payment-result?txId=${tx}${invoiceSuffix}`
            : `/customer/checkout/payment-result?txId=${tx}${invoiceSuffix}`
        );
      } else {
        setPaymentError('Hệ thống chưa ghi nhận tiền về tài khoản cho nội dung: ' + vietQrData.transferContent + '. Vui lòng kiểm tra lại sau giây lát.');
      }
    } catch (err: any) {
      setPaymentError(err?.message || 'Không thể kiểm tra trạng thái giao dịch.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handlePay = async () => {
    if (selectedMethod === 'VNPAY') {
      openVnpayGateway();
      return;
    }
    setPaymentError(null);
    setIsProcessing(true);
    try {
      if (resolvedInvoiceId) {
        try {
          const backendRes = await billingApi.payInvoice(resolvedInvoiceId, {
            paymentMethod: selectedMethod,
            amount: amountToPay,
          });

          // If backend provided payment URL (e.g. redirect gateway)
          if (backendRes.paymentUrl) {
            window.location.href = backendRes.paymentUrl;
            return;
          }

          const invoiceSuffix = `&invoiceId=${resolvedInvoiceId}`;
          if (backendRes.paymentStatus === 'SUCCESSFUL') {
            navigate(
              isStaff && bookingId
                ? `/receptionist/checkout/${bookingId}/payment-result?txId=${backendRes.transactionReference}${invoiceSuffix}`
                : `/customer/checkout/payment-result?txId=${backendRes.transactionReference}${invoiceSuffix}`
            );
          } else if (backendRes.paymentStatus === 'FAILED') {
            const tx = backendRes.transactionReference;
            navigate(
              isStaff && bookingId
                ? `/receptionist/checkout/${bookingId}/payment-result?txId=${tx}${invoiceSuffix}`
                : `/customer/checkout/payment-result?txId=${tx}${invoiceSuffix}`
            );
          } else {
            const tx = backendRes.transactionReference;
            navigate(
              isStaff && bookingId
                ? `/receptionist/checkout/${bookingId}/payment-result?txId=${tx}${invoiceSuffix}`
                : `/customer/checkout/payment-result?txId=${tx}${invoiceSuffix}`
            );
          }
        } catch (err: any) {
          const isNetworkError = isNetworkOrTimeoutError(err, navigator.onLine);

          if (isNetworkError) {
            setPaymentError('The payment request status could not be confirmed. Check the invoice status before retrying.');
          } else {
            setPaymentError(err?.message || 'Giao dịch thanh toán bị từ chối bởi hệ thống máy chủ.');
          }
        }
      } else {
        setPaymentError('Không thể thực hiện thanh toán: Thiếu hóa đơn hợp lệ từ máy chủ.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleZeroBalanceCheckout = async () => {
    setIsProcessing(true);
    setPaymentError(null);
    try {
      if (!resolvedInvoiceId) {
        setPaymentError('Không thể hoàn tất trả phòng: Chưa có hóa đơn xác thực từ máy chủ.');
        return;
      }
      const invoiceQuery = resolvedInvoiceId ? `?invoiceId=${resolvedInvoiceId}` : '';
      const targetConfirmationPath =
        isStaff && bookingId
          ? `/receptionist/checkout/${bookingId}/confirmation${invoiceQuery}`
          : `/customer/checkout/confirmation${invoiceQuery}`;
      navigate(targetConfirmationPath);
    } finally {
      setIsProcessing(false);
    }
  };

  const backRoute = isStaff && bookingId
    ? `/receptionist/folio/${bookingId}`
    : '/customer/folio';

  if (isLoadingBackend || !backendFolio) {
    return <div className="hsw-folio-page"><Container size="narrow"><div className="hsw-payment-container" role="status">
      <h1>{isLoadingBackend ? 'Loading server folio…' : 'Payment details unavailable'}</h1>
      <p>{paymentError || 'The server has not returned a verified folio and invoice.'}</p>
      <button type="button" className="hsw-btn hsw-btn-secondary" onClick={() => navigate(backRoute)}>Return to Folio</button>
    </div></Container></div>;
  }

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
              {/* Payment Error Banner */}
              {paymentError && (
                <div
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fca5a5',
                    color: '#b91c1c',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    marginBottom: 'var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  id="payment-error-banner"
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Unverified Invoice Warning Banner */}
              {!resolvedInvoiceId && !import.meta.env.DEV && (
                <div
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    marginBottom: 'var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  id="unverified-invoice-warning"
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>Chưa có hóa đơn xác thực từ máy chủ cho lượt lưu trú này. Vui lòng liên hệ quầy lễ tân để tạo hóa đơn chính thức trước khi thanh toán.</span>
                </div>
              )}

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
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span>{t('payment.bookingRef', 'Booking Ref')}: <strong style={{ color: 'var(--text-primary)' }}>{folioData.bookingReference}</strong></span>
                  <span>{t('payment.sanctuaryVilla', 'Sanctuary Villa')}: <strong style={{ color: 'var(--text-primary)' }}>{folioData.villaCode}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetFolioSettlement?.();
                    window.location.reload();
                  }}
                  title="Xóa cache trình duyệt và đặt lại số dư"
                  style={{
                    background: 'none',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={11} />
                  <span>Reset Demo State</span>
                </button>
              </div>

              {/* Breakdown Summary - CHI TIẾT KHOẢN CẦN THANH TOÁN */}
              <div
                className="hsw-payment-breakdown"
                style={{
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: 'var(--space-6, 24px)',
                }}
              >
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--text-secondary, #64748b)', marginBottom: '8px' }}>
                  {t('payment.breakdownTitle', 'CHI TIẾT KHOẢN CẦN THANH TOÁN')}
                </div>

                <div className="space-y-2 py-3 border-b border-gray-100" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div className="flex justify-between text-sm" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                    <span className="text-gray-600" style={{ color: '#4b5563' }}>Số Dư Gói Nghỉ Dưỡng Chưa Thanh Toán</span>
                    <span className="font-medium text-gray-900" style={{ fontWeight: 600, color: '#111827' }}>{formatCurrency(packageBalance)}</span>
                  </div>
                  <div className="flex justify-between text-sm" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                    <span className="text-gray-600" style={{ color: '#4b5563' }}>Dịch Vụ Spa & Trị Liệu Ngoài Gói</span>
                    <span className="font-medium text-gray-900" style={{ fontWeight: 600, color: '#111827' }}>{formatCurrency(extraSpaCharges)}</span>
                  </div>
                  <div className="flex justify-between text-sm" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                    <span className="text-gray-600" style={{ color: '#4b5563' }}>Ẩm Thực Gọi Món A-la-carte Ngoài Gói</span>
                    <span className="font-medium text-gray-900" style={{ fontWeight: 600, color: '#111827' }}>{formatCurrency(extraFnbCharges)}</span>
                  </div>
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-sm" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                      <span className="text-gray-600" style={{ color: '#4b5563' }}>Thuế GTGT (VAT 8% dịch vụ ngoài gói)</span>
                      <span className="font-medium text-gray-900" style={{ fontWeight: 600, color: '#111827' }}>{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
                  <span className="font-semibold text-gray-900" style={{ fontWeight: 700, color: '#111827', fontSize: '15px' }}>Tổng Số Tiền Quyết Toán</span>
                  <span className="text-xl font-bold text-[#2D3E35]" style={{ fontSize: '20px', fontWeight: 700, color: '#2D3E35' }}>{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              {/* ZERO BALANCE DUE PATH (SRS FR-M5-02 Alt 2) */}
              {isZeroBalance ? (
                <div
                  style={{
                    backgroundColor: 'rgba(44, 76, 56, 0.08)',
                    border: '1.5px solid rgba(44, 76, 56, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-5)',
                    marginBottom: 'var(--space-6)',
                    textAlign: 'center',
                  }}
                  id="zero-balance-settlement-panel"
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(44, 76, 56, 0.15)', color: 'var(--accent-forest)', marginBottom: '8px' }}>
                    <ShieldCheck size={28} />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, color: 'var(--accent-forest)', margin: '0 0 6px' }}>
                    Zero Balance Settlement (SRS FR-M5-02 Alt 2)
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
                    Your initial retreat package deposit fully covers all accommodation, therapy, and dining charges. No additional payment is required to clear your stay folio.
                  </p>
                  <button
                    type="button"
                    className="hsw-btn hsw-btn-retreat-primary"
                    onClick={handleZeroBalanceCheckout}
                    disabled={isProcessing || !resolvedInvoiceId}
                    style={{ width: '100%', justifyContent: 'center' }}
                    id="btn-zero-balance-checkout"
                  >
                    <ShieldCheck size={16} />
                    <span>{isProcessing ? 'Finalizing Zero Balance Departure...' : 'Complete Checkout Directly (0 VND Due)'}</span>
                  </button>

                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed rgba(44, 76, 56, 0.2)', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        resetFolioSettlement?.();
                        window.location.reload();
                      }}
                      className="hsw-btn hsw-btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      id="btn-reset-folio-demo"
                    >
                      <RefreshCw size={14} />
                      <span>Khôi phục số dư chưa thanh toán (Reset Demo State)</span>
                    </button>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Nhấn để xóa cache đã thanh toán trong trình duyệt và nạp lại hóa đơn 19.418.000 đ để test VietQR
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Select Payment Method */}
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                      {t('payment.methodLabel', 'Select Settlement Method')}
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: isStaff ? '1fr 1fr 1fr 1fr' : '1fr 1fr', gap: '10px' }}>
                      {/* Option 1: VietQR Bank Transfer */}
                      <div
                        onClick={() => setSelectedMethod('VIETQR_BANK_TRANSFER')}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: selectedMethod === 'VIETQR_BANK_TRANSFER' ? '2px solid var(--accent-forest)' : '1px solid var(--border-subtle)',
                          backgroundColor: selectedMethod === 'VIETQR_BANK_TRANSFER' ? 'rgba(44, 76, 56, 0.05)' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                        id="btn-method-vietqr"
                      >
                        <div style={{ padding: '4px 6px', backgroundColor: '#005baa', color: '#fff', fontWeight: 900, fontSize: '10px', borderRadius: '4px' }}>
                          VietQR
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>Chuyển khoản VietQR</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Mã QR ngân hàng động</div>
                        </div>
                      </div>

                      {/* Option 2: VNPay */}
                      <div
                        onClick={() => setSelectedMethod('VNPAY')}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: selectedMethod === 'VNPAY' ? '2px solid var(--accent-forest)' : '1px solid var(--border-subtle)',
                          backgroundColor: selectedMethod === 'VNPAY' ? 'rgba(44, 76, 56, 0.05)' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                        id="btn-method-vnpay"
                      >
                        <div style={{ padding: '4px 8px', backgroundColor: '#e02424', color: '#fff', fontWeight: 900, fontSize: '11px', borderRadius: '4px' }}>
                          VNPay
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>VNPay Gateway</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Thẻ ATM / Ví VNPay</div>
                        </div>
                      </div>

                      {/* Option 3: Cash at Reception */}
                      {isStaff && (
                        <div
                          onClick={() => setSelectedMethod('CASH')}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            border: selectedMethod === 'CASH' ? '2px solid var(--accent-forest)' : '1px solid var(--border-subtle)',
                            backgroundColor: selectedMethod === 'CASH' ? 'rgba(44, 76, 56, 0.05)' : '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                          }}
                          id="btn-method-cash"
                        >
                          <Banknote size={24} style={{ color: 'var(--accent-forest)' }} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>Tiền mặt tại quầy</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Lễ tân thu tiền mặt</div>
                          </div>
                        </div>
                      )}

                      {/* Option 4: Card POS (Staff only) */}
                      {isStaff && (
                        <div
                          onClick={() => setSelectedMethod('CARD')}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            border: selectedMethod === 'CARD' ? '2px solid var(--accent-forest)' : '1px solid var(--border-subtle)',
                            backgroundColor: selectedMethod === 'CARD' ? 'rgba(44, 76, 56, 0.05)' : '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                          }}
                          id="btn-method-card"
                        >
                          <CreditCard size={24} style={{ color: 'var(--accent-forest)' }} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>Quẹt thẻ POS</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Máy POS quầy lễ tân</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Dynamic VietQR Display Panel */}
              {selectedMethod === 'VIETQR_BANK_TRANSFER' && !isZeroBalance && (
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: 'var(--space-5)',
                    marginBottom: 'var(--space-5)',
                  }}
                  id="vietqr-payment-panel"
                >
                  <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#1e293b', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                      <QrCode size={18} style={{ color: '#005baa' }} />
                      <span>Quét mã VietQR bằng ứng dụng Ngân hàng</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                      Mã QR đã nhúng tự động số tiền và nội dung đối soát. Hệ thống sẽ tự động đóng phòng khi giao dịch thành công.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {/* QR Image */}
                    <div
                      style={{
                        padding: '12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '220px',
                        minHeight: '220px',
                      }}
                    >
                      {isLoadingQr && !vietQrData ? (
                        <div style={{ width: '200px', height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px', gap: '8px' }}>
                          <RefreshCw size={24} className="hsw-spin" style={{ color: '#005baa' }} />
                          <span>Đang tạo VietQR...</span>
                        </div>
                      ) : vietQrData?.qrImageUrl ? (
                            <img
                              src={vietQrData.qrImageUrl}
                              alt="VietQR Napas 247"
                              style={{ width: '210px', height: 'auto', display: 'block', borderRadius: '6px' }}
                              className="w-64 h-64 mx-auto object-contain"
                              id="vietqr-image"
                            />
                      ) : <span role="status">VietQR details are unavailable from the server.</span>}
                    </div>

                    {/* Bank Transfer Details with Copy Buttons */}
                    <div style={{ flex: '1', minWidth: '240px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Ngân hàng */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
                          <span style={{ color: '#64748b' }}>Ngân hàng thụ hưởng:</span>
                          <strong style={{ color: '#0f172a' }}>{vietQrData?.bankName || '—'}</strong>
                        </div>

                        {/* Số tài khoản */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
                          <span style={{ color: '#64748b' }}>Số tài khoản:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ color: '#005baa', fontFamily: 'monospace', fontSize: '14px' }}>
                              {vietQrData?.accountNumber || '—'}
                            </strong>
                            <button
                              type="button"
                              onClick={() => vietQrData?.accountNumber && handleCopy(vietQrData.accountNumber, 'acc')}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: '#64748b' }}
                              title="Sao chép số tài khoản"
                            >
                              {copiedField === 'acc' ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Chủ tài khoản */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
                          <span style={{ color: '#64748b' }}>Chủ tài khoản:</span>
                          <strong style={{ color: '#0f172a' }}>{vietQrData?.accountName || '—'}</strong>
                        </div>

                        {/* Số tiền */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
                          <span style={{ color: '#64748b' }}>Số tiền:</span>
                          <strong style={{ color: '#16a34a', fontSize: '15px' }}>
                            {vietQrData?.amount != null ? formatVND(vietQrData.amount) : '—'}
                          </strong>
                        </div>

                        {/* Nội dung chuyển khoản */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', backgroundColor: '#e2e8f0', borderRadius: '6px' }}>
                          <span style={{ color: '#475569', fontSize: '12px' }}>Nội dung CK:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <code style={{ fontWeight: 700, color: '#b91c1c', fontSize: '13px' }}>
                              {vietQrData?.transferContent || '—'}
                            </code>
                            <button
                              type="button"
                              onClick={() => vietQrData?.transferContent && handleCopy(vietQrData.transferContent, 'content')}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: '#475569' }}
                              title="Sao chép nội dung chuyển khoản"
                            >
                              {copiedField === 'content' ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {vietQrData?.transactionReference ? (
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#16a34a' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                            <span>Đang lắng nghe thanh toán tự động...</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleManualCheckStatus}
                            disabled={isCheckingStatus}
                            className="hsw-btn hsw-btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <RefreshCw size={13} className={isCheckingStatus ? 'hsw-spin' : ''} />
                            <span>{isCheckingStatus ? 'Đang kiểm tra...' : 'Tôi đã chuyển tiền'}</span>
                          </button>
                        </div>
                      ) : (
                        <p role="status" style={{ marginTop: '12px', fontSize: '12px', color: '#475569' }}>
                          QR đã được tạo nhưng chưa xác nhận thanh toán. Quét mã không tự ghi nhận tiền hoặc hoàn tất thanh toán.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* VNPay Gateway Info when selected */}
              {selectedMethod === 'VNPAY' && !isZeroBalance && (
                <div
                  style={{
                    backgroundColor: '#fafafa',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: 'var(--space-5)',
                    textAlign: 'center',
                    marginBottom: 'var(--space-5)',
                  }}
                  id="vnpay-payment-panel"
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#1e293b', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                    <CreditCard size={18} style={{ color: '#e02424' }} />
                    <span>Cổng thanh toán VNPay (QR / Thẻ ATM / Ví VNPay)</span>
                  </div>

                  {isCreatingVnpay && !vnpayData ? (
                    <div style={{ padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <RefreshCw size={28} className="hsw-spin" style={{ color: '#e02424' }} />
                      <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Đang tạo liên kết và mã QR VNPay Sandbox...</p>
                    </div>
                  ) : vnpayError && !vnpayData ? (
                    <div style={{ padding: '20px', backgroundColor: 'rgba(220, 38, 38, 0.05)', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.2)', margin: '10px 0' }}>
                      <p style={{ fontSize: '13px', color: '#dc2626', margin: '0 0 10px' }}>{vnpayError}</p>
                      <button
                        type="button"
                        onClick={handleReloadVnpay}
                        className="hsw-btn hsw-btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <RefreshCw size={13} />
                        <span>Thử lại tạo liên kết VNPay</span>
                      </button>
                    </div>
                  ) : vnpayData ? (
                    <>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 auto 12px', maxWidth: '420px' }}>
                        Quét mã bằng app ngân hàng hoặc ví VNPay để thanh toán, hoặc bấm nút thanh toán ở thanh công cụ bên dưới để mở Cổng VNPay.
                      </p>
                      <div style={{ display: 'inline-block', padding: '10px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(vnpayData.paymentUrl)}`}
                          alt="Mã QR Cổng VNPay"
                          width={220}
                          height={220}
                          style={{ display: 'block', borderRadius: '4px' }}
                          id="vnpay-qr-image"
                        />
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569', margin: '12px 0 10px' }}>
                        Mã giao dịch: <code style={{ fontWeight: 700, color: '#0369a1' }}>{vnpayData.transactionReference}</code>
                      </div>
                      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: '#16a34a' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                        <span>Đang lắng nghe kết quả thanh toán từ VNPay Sandbox...</span>
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <button
                  type="button"
                  className="hsw-btn hsw-btn-retreat-primary"
                  onClick={selectedMethod === 'VNPAY' ? openVnpayGateway : handlePay}
                  disabled={
                    isProcessing ||
                    amountToPay <= 0 ||
                    !targetInvoiceId ||
                    (selectedMethod === 'VNPAY' && (!vnpayData?.paymentUrl || isCreatingVnpay))
                  }
                  style={{ width: '100%', justifyContent: 'center', backgroundColor: '#2D3E35' }}
                  id="btn-pay-vnpay"
                >
                  <Lock size={18} />
                  <span>
                    {isProcessing
                      ? t('payment.processing', 'Processing Settlement...')
                      : selectedMethod === 'VNPAY'
                      ? `Thanh toán ${formatVND(vnpayData?.amount || amountToPay)} qua Cổng VNPay`
                      : selectedMethod === 'VIETQR_BANK_TRANSFER'
                      ? `Xác nhận đã thanh toán VietQR (${formatVND(amountToPay)})`
                      : `Confirm Handover of ${formatVND(amountToPay)}`}
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
