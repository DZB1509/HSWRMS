/** M5 state adapter. Persisted billing, payment and checkout state always comes from the backend. */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { FolioContextType, FolioSummary, FolioLineItem, PaymentTransaction, CheckoutRecord, CustomerStayReview } from '../types/folio';
import { useCustomer } from './CustomerContext';
import { useAuth } from '../hooks/useAuth';
import { billingApi } from '../features/m5-billing/api/billingApi';
import type { FolioResponse, PaymentResponse, RevenueAnalytics, OccupancyAnalytics, TherapistUtilization } from '../features/m5-billing/types';

const FolioContext = createContext<FolioContextType | undefined>(undefined);
const localized = (value: string) => ({ vi: value, en: value, 'zh-CN': value, ja: value, fr: value });
const statusMap: Record<string, PaymentTransaction['status']> = {
  SUCCESSFUL: 'success', PENDING: 'pending', FAILED: 'failed', CANCELLED: 'cancelled', REFUNDED: 'failed',
};

function toTransaction(tx: PaymentResponse, bookingReference: string): PaymentTransaction {
  return {
    id: tx.transactionReference,
    bookingReference,
    amount: tx.amountPaid,
    provider: tx.paymentMethod,
    status: statusMap[tx.paymentStatus] || 'pending',
    createdAt: tx.transactionDate,
    failureReason: tx.paymentStatus === 'FAILED' ? tx.message : undefined,
    gatewayRef: tx.transactionReference,
  };
}

function toFolioSummary(folio: FolioResponse, bookingReference: string): FolioSummary & { lineItems: FolioLineItem[] } {
  const items = (folio.items || []).map((item): FolioLineItem => ({
    id: String(item.folioItemId),
    sourceType: item.chargeCategory === 'SPA' ? 'spa' : item.chargeCategory === 'FNB' ? 'fnb' : 'retreat',
    sourceId: String(item.sourceSpaSessionId ?? item.sourceMealOrderId ?? item.sourceBookingId ?? item.folioItemId),
    title: localized(item.description),
    serviceDate: item.chargedAt?.slice(0, 10),
    quantity: 1,
    unitAmount: item.payableAmount ?? item.adjustedAmount ?? item.amount,
    totalAmount: item.payableAmount ?? item.adjustedAmount ?? item.amount,
    status: item.isVoided ? 'settled' : 'pending_settlement',
    createdAt: item.chargedAt,
    isIncludedInPackage: item.chargeCategory === 'PACKAGE',
  }));
  const balance = Number(folio.balanceDue || 0);
  const spa = Number(folio.extraSpaCharges || 0);
  const fnb = Number(folio.extraFnbCharges || 0);
  const outstandingPackage = Number(folio.packageOutstanding ?? Math.max(0, balance - spa - fnb));
  const blockers = [] as FolioSummary['blockers'];
  if (outstandingPackage > 0) blockers.push({ type: 'unpaid_balance', titleKey: 'customer.checkout.blockerRetreatTitle', messageKey: 'customer.checkout.blockerRetreatMsg', amount: outstandingPackage, actionPath: '/customer/checkout/payment', actionLabelKey: 'customer.checkout.actionPayBalance' });
  if (spa > 0) blockers.push({ type: 'unsettled_spa', titleKey: 'customer.checkout.blockerSpaTitle', messageKey: 'customer.checkout.blockerSpaMsg', amount: spa, actionPath: '/customer/checkout/payment', actionLabelKey: 'customer.checkout.actionPaySpa' });
  if (fnb > 0) blockers.push({ type: 'unsettled_fnb', titleKey: 'customer.checkout.blockerFnbTitle', messageKey: 'customer.checkout.blockerFnbMsg', amount: fnb, actionPath: '/customer/checkout/payment', actionLabelKey: 'customer.checkout.actionPayFnb' });
  if (folio.hasUnsettledOrders && blockers.length === 0) blockers.push({ type: 'unsettled_fnb', titleKey: 'customer.checkout.blockerFnbTitle', messageKey: 'customer.checkout.blockerFnbMsg' });
  return {
    bookingReference: bookingReference || folio.bookingReference,
    customerName: folio.customerName || '—',
    villaCode: folio.villaNumber || '—',
    stayDates: '—',
    retreatTotal: Number(folio.packagePrice ?? folio.totalCharges ?? 0),
    depositPaid: Number(folio.depositPaid ?? folio.depositAmount ?? 0),
    retreatRemaining: outstandingPackage,
    spaExtrasTotal: spa,
    fnbExtrasTotal: fnb,
    totalExtras: spa + fnb,
    totalBillable: Number(folio.totalCharges || 0),
    totalPaid: Number(folio.totalPaid || 0),
    outstandingBalance: balance,
    isFullySettled: balance <= 0 && !folio.hasUnsettledOrders,
    canCheckout: balance <= 0 && !folio.hasUnsettledOrders && folio.folioStatus !== 'CLOSED',
    blockers,
    lineItems: items,
  };
}

const emptyFolio = (bookingReference: string): FolioSummary & { lineItems: FolioLineItem[] } => ({
  bookingReference, customerName: '—', villaCode: '—', stayDates: '—', retreatTotal: 0, depositPaid: 0,
  retreatRemaining: 0, spaExtrasTotal: 0, fnbExtrasTotal: 0, totalExtras: 0, totalBillable: 0,
  totalPaid: 0, outstandingBalance: 0, isFullySettled: false, canCheckout: false,
  blockers: [], lineItems: [],
});

export const FolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { bookings } = useCustomer();
  const { currentUser } = useAuth();
  const cacheOwnerId = currentUser?.id ?? null;
  const cacheOwnerRef = useRef(cacheOwnerId);
  const eligibleBookings = useMemo(() => bookings.filter(b => b.status !== 'cancelled'), [bookings]);
  const defaultBooking = eligibleBookings.length === 1 ? eligibleBookings[0] : undefined;
  const [folios, setFolios] = useState<Record<string, FolioResponse>>({});
  const [checkoutByBooking, setCheckoutByBooking] = useState<Record<string, CheckoutRecord>>({});
  const [reviews, setReviews] = useState<Record<string, CustomerStayReview>>({});
  const [latestTransaction, setLatestTransaction] = useState<PaymentTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<{ revenue?: RevenueAnalytics; occupancy?: OccupancyAnalytics; therapists?: TherapistUtilization }>({});

  useEffect(() => {
    cacheOwnerRef.current = cacheOwnerId;
    setFolios({});
    setCheckoutByBooking({});
    setReviews({});
    setLatestTransaction(null);
    setError(null);
  }, [cacheOwnerId]);

  const bookingFor = useCallback((ref?: string) => {
    if (ref) return bookings.find(b => b.bookingReference === ref || b.id === ref);
    return defaultBooking;
  }, [bookings, defaultBooking]);
  const numericBookingId = useCallback((ref?: string) => {
    const booking = bookingFor(ref);
    const candidate = booking?.id && /^\d+$/.test(String(booking.id))
      ? Number(booking.id)
      : ref && /^\d+$/.test(ref) ? Number(ref) : null;
    return candidate !== null && Number.isSafeInteger(candidate) && candidate > 0 ? candidate : null;
  }, [bookingFor]);
  const refreshFolio = useCallback(async (ref?: string) => {
    const requestOwnerId = cacheOwnerId;
    const booking = bookingFor(ref);
    const id = numericBookingId(ref);
    if (!id) throw new Error('A server booking ID is required to load the folio.');
    const response = await billingApi.getFolio(id);
    if (cacheOwnerRef.current !== requestOwnerId) return response;
    const key = booking?.bookingReference || ref || String(id);
    setFolios(prev => ({ ...prev, [key]: response }));
    setError(null);
    return response;
  }, [bookingFor, numericBookingId, cacheOwnerId]);

  useEffect(() => {
    if (!defaultBooking) return;
    let mounted = true;
    setIsLoading(true);
    refreshFolio(defaultBooking.bookingReference)
      .catch(err => { if (mounted) setError(err instanceof Error ? err.message : 'Unable to load the server folio.'); })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, [defaultBooking?.bookingReference, refreshFolio]);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([billingApi.getRevenueAnalytics(), billingApi.getOccupancyAnalytics(), billingApi.getTherapistUtilization()])
      .then(results => {
        if (!mounted) return;
        setAnalytics({
          ...(results[0].status === 'fulfilled' ? { revenue: results[0].value } : {}),
          ...(results[1].status === 'fulfilled' ? { occupancy: results[1].value } : {}),
          ...(results[2].status === 'fulfilled' ? { therapists: results[2].value } : {}),
        });
      });
    return () => { mounted = false; };
  }, []);

  const getFolioForBooking = useCallback((ref?: string) => {
    const booking = bookingFor(ref);
    const key = ref || booking?.bookingReference || '';
    const response = folios[key] || Object.values(folios).find(f => booking && f.retreatBookingId === Number(booking.id));
    return response ? toFolioSummary(response, key) : emptyFolio(key || '');
  }, [bookingFor, folios]);
  const activeFolio = useMemo(() => getFolioForBooking(defaultBooking?.bookingReference), [getFolioForBooking, defaultBooking?.bookingReference]);

  const processPayment: FolioContextType['processPayment'] = useCallback(async (bookingRef, amount, paymentMethod = 'VIETQR_BANK_TRANSFER') => {
    const folio = await refreshFolio(bookingRef);
    let invoiceId = folio.invoiceId;
    if (!invoiceId && folio.canGenerateInvoice) invoiceId = (await billingApi.generateInvoice(folio.retreatBookingId)).invoiceId;
    if (!invoiceId) throw new Error('The server has not provided a payable invoice for this booking.');
    const payment = await billingApi.payInvoice(invoiceId, { paymentMethod, amount });
    const transaction = toTransaction(payment, folio.bookingReference || bookingRef);
    setLatestTransaction(transaction);
    await refreshFolio(bookingRef);
    return transaction;
  }, [refreshFolio]);

  const getTransactionById = useCallback((reference: string) => latestTransaction?.id === reference ? latestTransaction : undefined, [latestTransaction]);

  const completeResortCheckout = useCallback(async (bookingRef: string, settledBy: 'customer' | 'receptionist' = 'customer') => {
    const folio = await refreshFolio(bookingRef);
    let invoiceId = folio.invoiceId;
    if (!invoiceId && folio.canGenerateInvoice) invoiceId = (await billingApi.generateInvoice(folio.retreatBookingId)).invoiceId;
    if (!invoiceId) throw new Error('Checkout cannot proceed: no server invoice is available.');
    const result = await billingApi.finalizeCheckout(invoiceId);
    const booking = bookingFor(bookingRef);
    const record: CheckoutRecord = {
      bookingReference: result.bookingReference || bookingRef,
      checkoutDate: result.completedAt,
      totalSettled: result.totalSettled,
      villaCode: result.villaNumber || '—',
      settledBy,
      completedAt: result.completedAt,
    };
    setCheckoutByBooking(prev => ({ ...prev, [record.bookingReference]: record }));
    await refreshFolio(booking?.bookingReference || bookingRef);
    return { success: true as const, message: result.message, record };
  }, [bookingFor, refreshFolio]);

  const isStayCheckedOut = useCallback((ref: string) => {
    const record = checkoutByBooking[ref];
    return Boolean(record) || folios[ref]?.folioStatus === 'CLOSED';
  }, [checkoutByBooking, folios, getFolioForBooking]);
  const getCheckoutRecord = useCallback((ref: string) => checkoutByBooking[ref], [checkoutByBooking]);

  const submitReview: FolioContextType['submitReview'] = useCallback(async (ref, data) => {
    const id = numericBookingId(ref);
    if (!id) return { success: false, message: 'A server booking ID is required to submit a review.' };
    const saved = await billingApi.submitReview({ retreatBookingId: id, overallRating: data.overallRating, roomRating: data.roomRating, spaRating: data.spaRating, diningRating: data.diningRating, comments: data.feedback });
    const review: CustomerStayReview = { ...data, id: String(saved.reviewId), bookingReference: ref, submittedAt: saved.submittedAt };
    setReviews(prev => ({ ...prev, [ref]: review }));
    return { success: true, message: 'Review submitted.' };
  }, [numericBookingId]);
  const getReviewForBooking = useCallback((ref: string) => reviews[ref], [reviews]);

  const getRevenueAnalytics = useCallback(() => {
    const value = analytics.revenue;
    return value ? {
      totalRevenue: value.totalRevenue, retreatRevenue: value.packageRevenue, spaRevenue: value.spaRevenue,
      fnbRevenue: value.fnbRevenue, outstandingRevenue: value.outstandingBalance, categoryBreakdown: value.categoryBreakdown,
    } : { totalRevenue: Number.NaN, retreatRevenue: Number.NaN, spaRevenue: Number.NaN, fnbRevenue: Number.NaN, outstandingRevenue: Number.NaN, categoryBreakdown: [] };
  }, [analytics.revenue]);
  const getOccupancyAnalytics = useCallback(() => {
    const value = analytics.occupancy;
    return value ? {
      totalVillas: value.totalVillas, occupiedCount: value.occupiedCount, reservedCount: value.reservedCount,
      readyCount: value.readyCount, cleaningCount: value.cleaningCount, maintenanceCount: value.maintenanceCount,
      occupancyRate: value.occupancyRate, villaDetails: value.villaDetails.map(v => ({
        id: String(v.villaId), code: v.villaNumber, category: v.category, status: v.status.toLowerCase(),
        customerName: v.customerName || undefined, bookingRef: v.bookingReference || undefined,
      })),
    } : { totalVillas: Number.NaN, occupiedCount: Number.NaN, reservedCount: Number.NaN, readyCount: Number.NaN, cleaningCount: Number.NaN, maintenanceCount: Number.NaN, occupancyRate: Number.NaN, villaDetails: [] };
  }, [analytics.occupancy]);
  const getTherapistUtilizationAnalytics = useCallback(() => {
    const value = analytics.therapists;
    return value ? {
      totalTherapists: value.therapistDetails.length, totalScheduledSessions: value.totalScheduledSessions,
      completedSessions: value.completedSessions, noShowSessions: value.noShowSessions,
      totalBookedMinutes: value.therapistDetails.reduce((sum, item) => sum + item.bookedMinutes, 0),
      totalBookedHours: value.totalBookedHours, therapistDetails: value.therapistDetails.map(item => ({
        id: String(item.therapistId), name: item.name, sessionsCount: item.sessionsCount,
        completedCount: item.completedCount, noShowCount: item.noShowCount,
        bookedMinutes: item.bookedMinutes, bookedHours: item.bookedHours,
      })),
    } : { totalTherapists: Number.NaN, totalScheduledSessions: Number.NaN, completedSessions: Number.NaN, noShowSessions: Number.NaN, totalBookedMinutes: Number.NaN, totalBookedHours: Number.NaN, therapistDetails: [] };
  }, [analytics.therapists]);
  const resetFolioSettlement = useCallback(() => {
    setFolios({}); setCheckoutByBooking({}); setLatestTransaction(null); setError(null);
  }, []);

  return <FolioContext.Provider value={{
    getFolioForBooking, activeFolio, processPayment, latestTransaction, getTransactionById,
    completeResortCheckout, isStayCheckedOut, getCheckoutRecord, submitReview, getReviewForBooking,
    resetFolioSettlement, getRevenueAnalytics, getOccupancyAnalytics, getTherapistUtilizationAnalytics,
    isLoading, error, refreshFolio,
  }}>{children}</FolioContext.Provider>;
};

export const useFolio = (): FolioContextType => {
  const context = useContext(FolioContext);
  if (!context) throw new Error('useFolio must be used within a FolioProvider');
  return context;
};
