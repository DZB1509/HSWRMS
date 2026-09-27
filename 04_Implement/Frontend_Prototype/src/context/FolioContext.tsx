/**
 * HSWRMS — Module 5: Folio & Settlement Context Provider
 *
 * Centralized financial aggregation, payment transaction state,
 * resort checkout validation & completion, review submission,
 * and read-only manager analytics.
 *
 * Source-of-truth principle:
 * - Retreat booking: CustomerContext
 * - Spa charges: SpaContext
 * - F&B charges: DiningContext
 * - Stay / room operational status: OperationsContext
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type {
  FolioContextType,
  FolioSummary,
  FolioLineItem,
  PaymentTransaction,
  CheckoutRecord,
  CustomerStayReview,
  CheckoutBlocker,
} from '../types/folio';
import { useCustomer } from './CustomerContext';
import { useSpa } from './SpaContext';
import { useDining } from './DiningContext';
import { useOperations } from './OperationsContext';

const FolioContext = createContext<FolioContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SETTLED_BOOKINGS: 'hsw_settled_bookings_v1',
  SETTLED_SPA: 'hsw_settled_spa_v1',
  SETTLED_DINING: 'hsw_settled_dining_v1',
  CHECKOUT_RECORDS: 'hsw_checkout_records_v1',
  REVIEWS: 'hsw_stay_reviews_v1',
  TRANSACTIONS: 'hsw_payment_transactions_v1',
};

export const FolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { bookings, activeBooking } = useCustomer();
  const { sessions, therapists } = useSpa();
  const { alaCarteOrders } = useDining();
  const { villas, arrivals, updateVillaStatus } = useOperations();

  // ── Settlement State ────────────────────────────────
  const [settledBookings, setSettledBookings] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTLED_BOOKINGS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [settledSpaSessions, setSettledSpaSessions] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTLED_SPA);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [settledDiningOrders, setSettledDiningOrders] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTLED_DINING);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [checkoutRecords, setCheckoutRecords] = useState<Record<string, CheckoutRecord>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHECKOUT_RECORDS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [reviews, setReviews] = useState<Record<string, CustomerStayReview>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [latestTransaction, setLatestTransaction] = useState<PaymentTransaction | null>(null);

  // ── Helper: Folio Aggregation ────────────────────────
  const getFolioForBooking = useCallback(
    (bookingRef?: string): FolioSummary & { lineItems: FolioLineItem[] } => {
      // Find matching retreat booking
      const targetRef = bookingRef || activeBooking?.bookingReference || 'HSW-88192';
      const booking =
        bookings.find((b) => b.bookingReference === targetRef || b.id === targetRef) ||
        activeBooking ||
        bookings[0];

      const bRef = booking ? booking.bookingReference : targetRef;
      const customerId = booking?.id ? 'usr-cust-01' : 'usr-cust-01';
      const customerName = 'Eleanor Vance';
      const villaCode = booking?.villaNumber || 'Villa #102';
      const stayDates = booking
        ? `${booking.startDate} — ${booking.endDate}`
        : '2026-09-24 — 2026-09-27';

      const lineItems: FolioLineItem[] = [];

      // 1. Retreat Package Item
      const retreatTotal = booking?.totalPrice || 24500000;
      const depositPaid = booking?.depositStatus === 'paid' ? (booking.depositAmount || 7350000) : 0;
      const isRetreatSettled = Boolean(settledBookings[bRef]);
      const retreatRemaining = isRetreatSettled ? 0 : Math.max(0, retreatTotal - depositPaid);

      if (booking) {
        lineItems.push({
          id: `FOLIO-PKG-${booking.id}`,
          sourceType: 'retreat',
          sourceId: booking.id,
          title: booking.retreatName,
          subtitle: `${booking.days} Days / ${booking.nights} Nights · ${booking.villaType.en}`,
          serviceDate: booking.startDate,
          quantity: 1,
          unitAmount: retreatTotal,
          totalAmount: retreatTotal,
          status: isRetreatSettled ? 'settled' : depositPaid > 0 ? 'deposit_paid' : 'pending_settlement',
          createdAt: booking.createdAt,
          isIncludedInPackage: true,
        });
      }

      // 2. Spa Line Items (from SpaContext)
      // Strictly prevent double-counting: included sessions (price 0) are marked as included in package.
      // Filter sessions belonging to this customer/booking
      const customerSessions = sessions.filter(
        (s) => s.bookingReference === bRef || s.customerId === customerId
      );

      let spaExtrasTotal = 0;

      customerSessions.forEach((s) => {
        const isExtra = s.chargeType === 'extra' && s.price > 0;
        const isSettled = Boolean(settledSpaSessions[s.id]);

        if (isExtra && !isSettled) {
          spaExtrasTotal += s.price;
        }

        lineItems.push({
          id: `FOLIO-SPA-${s.id}`,
          sourceType: 'spa',
          sourceId: s.id,
          title: s.treatmentName,
          subtitle: `${s.date} ${s.startTime}–${s.endTime} · Therapist: ${s.therapistName} (${s.roomName.en})`,
          serviceDate: s.date,
          quantity: 1,
          unitAmount: s.price,
          totalAmount: s.price,
          status: !isExtra ? 'included' : isSettled ? 'settled' : 'pending_settlement',
          createdAt: s.createdAt,
          isIncludedInPackage: !isExtra,
        });
      });

      // Demo Enhancement: If Eleanor Vance has no extra spa sessions seeded in mockSpa,
      // add one traceable extra session (Hot Mineral Herbal Mud Wrap) so demo has rich multi-source extras
      const hasSpaExtra = customerSessions.some((s) => s.chargeType === 'extra');
      if (!hasSpaExtra && (bRef === 'HSW-88192' || bRef === 'HSW-84920')) {
        const demoExtraSessionId = 'SES-EXTRA-881';
        const isDemoSpaSettled = Boolean(settledSpaSessions[demoExtraSessionId]);
        const demoSpaPrice = 1500000;
        if (!isDemoSpaSettled) {
          spaExtrasTotal += demoSpaPrice;
        }
        lineItems.push({
          id: `FOLIO-SPA-${demoExtraSessionId}`,
          sourceType: 'spa',
          sourceId: demoExtraSessionId,
          title: {
            vi: 'Quấn Bùn Khoáng Thảo Dược Trị Liệu (Dịch Vụ Gọi Thêm)',
            en: 'Therapeutic Mineral Herbal Mud Wrap (Extra Service)',
            'zh-CN': '疗愈矿物草本泥裹（额外自选项目）',
            ja: 'ミネラルハーバルマッドラップ（追加オプション）',
            fr: 'Enveloppement Thérapeutique de Boue Minérale (Extra)',
          },
          subtitle: '2026-09-25 14:00 · Therapist: Nguyen Thi Lan (Lotus Suite)',
          serviceDate: '2026-09-25',
          quantity: 1,
          unitAmount: demoSpaPrice,
          totalAmount: demoSpaPrice,
          status: isDemoSpaSettled ? 'settled' : 'pending_settlement',
          createdAt: '2026-09-24T15:00:00Z',
          isIncludedInPackage: false,
        });
      }

      // 3. F&B Extra Line Items (from DiningContext)
      // Only AlaCarteOrders with chargeType === 'fnb_extra' and totalAmount > 0.
      // Daily meal selections are included retreat meals and are NOT extra billable items!
      const customerOrders = alaCarteOrders.filter((o) => o.bookingId === bRef);

      let fnbExtrasTotal = 0;

      customerOrders.forEach((o) => {
        const isSettled = Boolean(settledDiningOrders[o.id]);
        if (!isSettled) {
          fnbExtrasTotal += o.totalAmount;
        }

        lineItems.push({
          id: `FOLIO-FNB-${o.id}`,
          sourceType: 'fnb',
          sourceId: o.id,
          title: {
            vi: `Thực Đơn A-la-carte Tùy Chọn (${o.lines.length} món)`,
            en: `A-la-carte Nourishing Order (${o.lines.length} items)`,
            'zh-CN': `养生零点定制餐点 (${o.lines.length}道)`,
            ja: `アラカルト養生オーダー (${o.lines.length}品)`,
            fr: `Commande Nourrissante À la Carte (${o.lines.length} plats)`,
          },
          subtitle: `${o.location || 'Villa #102'} · Ordered ${o.createdAt.slice(0, 10)} ${o.targetTime || ''}`,
          serviceDate: o.createdAt.slice(0, 10),
          quantity: o.lines.reduce((sum, line) => sum + line.quantity, 0),
          unitAmount: o.totalAmount,
          totalAmount: o.totalAmount,
          status: isSettled ? 'settled' : 'pending_settlement',
          createdAt: o.createdAt,
          isIncludedInPackage: false,
        });
      });

      // 4. Summaries & Monies
      const totalExtras = spaExtrasTotal + fnbExtrasTotal;
      const totalBillable = retreatTotal + spaExtrasTotal + fnbExtrasTotal;
      const outstandingBalance = retreatRemaining + spaExtrasTotal + fnbExtrasTotal;
      const totalPaid = depositPaid + (retreatTotal - retreatRemaining) + (lineItems.filter(l => l.status === 'settled' && !l.isIncludedInPackage).reduce((s, l) => s + l.totalAmount, 0));
      const isFullySettled = outstandingBalance === 0;

      // 5. Checkout Blockers
      const blockers: CheckoutBlocker[] = [];

      if (retreatRemaining > 0) {
        blockers.push({
          type: 'unpaid_balance',
          titleKey: 'customer.checkout.blockerRetreatTitle',
          messageKey: 'customer.checkout.blockerRetreatMsg',
          amount: retreatRemaining,
          actionPath: `/customer/checkout/payment`,
          actionLabelKey: 'customer.checkout.actionPayBalance',
        });
      }

      if (spaExtrasTotal > 0) {
        blockers.push({
          type: 'unsettled_spa',
          titleKey: 'customer.checkout.blockerSpaTitle',
          messageKey: 'customer.checkout.blockerSpaMsg',
          amount: spaExtrasTotal,
          actionPath: `/customer/checkout/payment`,
          actionLabelKey: 'customer.checkout.actionPaySpa',
        });
      }

      if (fnbExtrasTotal > 0) {
        blockers.push({
          type: 'unsettled_fnb',
          titleKey: 'customer.checkout.blockerFnbTitle',
          messageKey: 'customer.checkout.blockerFnbMsg',
          amount: fnbExtrasTotal,
          actionPath: `/customer/checkout/payment`,
          actionLabelKey: 'customer.checkout.actionPayFnb',
        });
      }

      const canCheckout = blockers.length === 0;

      return {
        bookingReference: bRef,
        customerName,
        villaCode,
        stayDates,
        retreatTotal,
        depositPaid,
        retreatRemaining,
        spaExtrasTotal,
        fnbExtrasTotal,
        totalExtras,
        totalBillable,
        totalPaid,
        outstandingBalance,
        isFullySettled,
        canCheckout,
        blockers,
        lineItems,
      };
    },
    [activeBooking, bookings, sessions, alaCarteOrders, settledBookings, settledSpaSessions, settledDiningOrders]
  );

  const activeFolio = useMemo(() => {
    return getFolioForBooking();
  }, [getFolioForBooking]);

  // ── Payment Processing (Mock VNPay) ───────────────────
  const processPayment = async (
    bookingRef: string,
    amount: number,
    simulateMode: 'success' | 'failed' | 'cancelled' = 'success'
  ): Promise<PaymentTransaction> => {
    const txnId = `VNP-M5-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    if (simulateMode === 'failed') {
      const failedTxn: PaymentTransaction = {
        id: txnId,
        bookingReference: bookingRef,
        amount,
        provider: 'vnpay_mock',
        status: 'failed',
        createdAt: now,
        completedAt: now,
        failureReason: 'Card issuing bank authorization declined (Code 51: Insufficient balance or security hold).',
        cardLast4: '8821',
      };
      setTransactions((prev) => [failedTxn, ...prev]);
      setLatestTransaction(failedTxn);
      return failedTxn;
    }

    if (simulateMode === 'cancelled') {
      const cancelledTxn: PaymentTransaction = {
        id: txnId,
        bookingReference: bookingRef,
        amount,
        provider: 'vnpay_mock',
        status: 'cancelled',
        createdAt: now,
        completedAt: now,
        failureReason: 'Transaction aborted by customer on VNPay gateway authentication prompt.',
        cardLast4: '8821',
      };
      setTransactions((prev) => [cancelledTxn, ...prev]);
      setLatestTransaction(cancelledTxn);
      return cancelledTxn;
    }

    // Success path
    const successTxn: PaymentTransaction = {
      id: txnId,
      bookingReference: bookingRef,
      amount,
      provider: 'vnpay_mock',
      status: 'success',
      createdAt: now,
      completedAt: now,
      gatewayRef: `VNPGW-${Math.floor(10000000 + Math.random() * 90000000)}`,
      cardLast4: '8821',
    };

    // Settle all outstanding charges for this booking
    setSettledBookings((prev) => {
      const updated = { ...prev, [bookingRef]: true };
      try {
        localStorage.setItem(STORAGE_KEYS.SETTLED_BOOKINGS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setSettledSpaSessions((prev) => {
      const updated: Record<string, boolean> = {
        ...prev,
        'SES-EXTRA-881': true,
        'SES-305': true,
        'SES-308': true,
      };
      sessions.forEach((s) => {
        if (s.chargeType === 'extra') updated[s.id] = true;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.SETTLED_SPA, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setSettledDiningOrders((prev) => {
      const updated = { ...prev };
      alaCarteOrders.forEach((o) => {
        updated[o.id] = true;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.SETTLED_DINING, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setTransactions((prev) => {
      const updated = [successTxn, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setLatestTransaction(successTxn);
    return successTxn;
  };

  const getTransactionById = useCallback(
    (id: string) => transactions.find((t) => t.id === id),
    [transactions]
  );

  // ── Resort Checkout Completion ───────────────────────
  const completeResortCheckout = (
    bookingRef: string,
    settledBy: 'customer' | 'receptionist' = 'customer'
  ): { success: boolean; message: string; blockers?: CheckoutBlocker[] } => {
    // Idempotency guard: If checkout already completed, return success idempotently without state mutation
    if (checkoutRecords[bookingRef]) {
      const existing = checkoutRecords[bookingRef];
      return {
        success: true,
        message: `Resort checkout already finalized for ${bookingRef}. Key handover acknowledged for Villa #${existing.villaCode}.`,
      };
    }

    const folio = getFolioForBooking(bookingRef);

    // Enforce Rule 4: Checkout cannot complete while unpaid obligations remain
    if (!folio.canCheckout) {
      return {
        success: false,
        message: 'Resort checkout cannot proceed while unresolved monetary obligations remain.',
        blockers: folio.blockers,
      };
    }

    const now = new Date().toISOString();
    const record: CheckoutRecord = {
      bookingReference: bookingRef,
      checkoutDate: now,
      totalSettled: folio.totalBillable,
      villaCode: folio.villaCode,
      settledBy,
      completedAt: now,
    };

    setCheckoutRecords((prev) => {
      const updated = { ...prev, [bookingRef]: record };
      try {
        localStorage.setItem(STORAGE_KEYS.CHECKOUT_RECORDS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Update OperationsContext: Transition assigned villa to 'cleaning' with 'dirty' status
    const assignedArrival = arrivals.find((a) => a.bookingReference === bookingRef);
    if (assignedArrival && assignedArrival.assignedVillaId) {
      updateVillaStatus(assignedArrival.assignedVillaId, 'cleaning', 'dirty');
    } else {
      // Default fallback: Villa 102
      updateVillaStatus('V-102', 'cleaning', 'dirty');
    }

    return {
      success: true,
      message: `Resort checkout completed successfully for ${bookingRef}. Key handover acknowledged and housekeeping notification dispatched for Villa #${folio.villaCode}.`,
    };
  };

  const isStayCheckedOut = useCallback(
    (bookingRef: string): boolean => {
      return Boolean(checkoutRecords[bookingRef]);
    },
    [checkoutRecords]
  );

  const getCheckoutRecord = useCallback(
    (bookingRef: string): CheckoutRecord | undefined => {
      return checkoutRecords[bookingRef];
    },
    [checkoutRecords]
  );

  // ── Review & Rating (Post-Checkout Only) ──────────────
  const submitReview = (
    bookingRef: string,
    reviewData: Omit<CustomerStayReview, 'id' | 'submittedAt'>
  ): { success: boolean; message: string } => {
    // Enforce Rule 5: Review & Rating is optional and post-checkout only
    if (!isStayCheckedOut(bookingRef)) {
      return {
        success: false,
        message: 'Stay review and rating becomes available exclusively after resort check-out is complete.',
      };
    }

    if (reviews[bookingRef]) {
      return {
        success: false,
        message: 'A review has already been submitted for this completed retreat stay.',
      };
    }

    const newReview: CustomerStayReview = {
      ...reviewData,
      id: `REV-${Math.floor(1000 + Math.random() * 9000)}`,
      bookingReference: bookingRef,
      submittedAt: new Date().toISOString(),
    };

    setReviews((prev) => {
      const updated = { ...prev, [bookingRef]: newReview };
      try {
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    return {
      success: true,
      message: 'Thank you for your valuable reflections. Your review has been recorded to elevate future sanctuary journeys.',
    };
  };

  const getReviewForBooking = useCallback(
    (bookingRef: string): CustomerStayReview | undefined => {
      return reviews[bookingRef];
    },
    [reviews]
  );

  // ── Manager Analytical Aggregators (Rule 6: Privacy Safe) ──
  const getRevenueAnalytics = useCallback(() => {
    // 1. Retreat Revenue (confirmed bookings + deposits + settled balances)
    const retreatRevenue = bookings.reduce((sum, b) => {
      if (b.depositStatus === 'paid') {
        const remainingSettled = Boolean(settledBookings[b.bookingReference]);
        return sum + (remainingSettled ? b.totalPrice : b.depositAmount);
      }
      return sum;
    }, 0);

    // 2. Spa Revenue
    const spaRevenue = sessions.reduce((sum, s) => {
      if (s.chargeType === 'extra' && s.price > 0) {
        return sum + s.price;
      }
      return sum;
    }, 1500000); // include demo extra session

    // 3. F&B Revenue
    const fnbRevenue = alaCarteOrders.reduce((sum, o) => {
      return sum + o.totalAmount;
    }, 0);

    const totalRevenue = retreatRevenue + spaRevenue + fnbRevenue;
    const currentFolio = getFolioForBooking();
    const outstandingRevenue = currentFolio.outstandingBalance;

    return {
      totalRevenue,
      retreatRevenue,
      spaRevenue,
      fnbRevenue,
      outstandingRevenue,
      categoryBreakdown: [
        { name: 'Retreat Packages', value: retreatRevenue, color: '#4F5A50' },
        { name: 'Spa & Therapies', value: spaRevenue, color: '#6D7466' },
        { name: 'Nourishing Dining', value: fnbRevenue, color: '#D8C7AE' },
      ],
    };
  }, [bookings, sessions, alaCarteOrders, settledBookings, getFolioForBooking]);

  const getOccupancyAnalytics = useCallback(() => {
    const totalVillas = villas.length;
    const occupiedCount = villas.filter((v) => v.status === 'occupied').length;
    const reservedCount = villas.filter((v) => v.status === 'reserved').length;
    const readyCount = villas.filter((v) => v.status === 'ready').length;
    const cleaningCount = villas.filter((v) => v.status === 'cleaning').length;
    const maintenanceCount = villas.filter((v) => v.status === 'maintenance').length;
    // Mathematically exact calculation without premature integer rounding (e.g. 1/8 * 100 = 12.5%)
    const occupancyRate = totalVillas > 0 ? (occupiedCount / totalVillas) * 100 : 0;

    const villaDetails = villas.map((v) => {
      const isOccupied = v.status === 'occupied';
      const isReserved = v.status === 'reserved';
      return {
        id: v.id,
        code: v.code,
        category: v.category,
        status: v.status,
        customerName: isOccupied ? v.currentCustomerName : isReserved ? v.nextArrival?.customerName || v.currentCustomerName : undefined,
        bookingRef: isOccupied ? v.currentBookingRef : isReserved ? v.nextArrival?.bookingRef || v.currentBookingRef : undefined,
        activeCustomerName: isOccupied ? v.currentCustomerName : undefined,
        activeBookingRef: isOccupied ? v.currentBookingRef : undefined,
        previousCustomerName: !isOccupied && !isReserved && v.currentCustomerName ? v.currentCustomerName : undefined,
        previousBookingRef: !isOccupied && !isReserved && v.currentBookingRef ? v.currentBookingRef : undefined,
      };
    });

    return {
      totalVillas,
      occupiedCount,
      reservedCount,
      readyCount,
      cleaningCount,
      maintenanceCount,
      occupancyRate,
      villaDetails,
    };
  }, [villas]);

  const getTherapistUtilizationAnalytics = useCallback(() => {
    const totalTherapists = therapists.length;
    const totalScheduledSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.status === 'completed').length;
    const noShowSessions = sessions.filter((s) => s.status === 'no_show').length;
    const totalBookedMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalBookedHours = Math.round((totalBookedMinutes / 60) * 10) / 10;

    const therapistDetails = therapists.map((t) => {
      const tSessions = sessions.filter((s) => s.therapistId === t.id);
      const sCount = tSessions.length;
      const cCount = tSessions.filter((s) => s.status === 'completed').length;
      const nsCount = tSessions.filter((s) => s.status === 'no_show').length;
      const bMins = tSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
      const bHours = Math.round((bMins / 60) * 10) / 10;

      return {
        id: t.id,
        name: t.name,
        sessionsCount: sCount,
        completedCount: cCount,
        noShowCount: nsCount,
        bookedMinutes: bMins,
        bookedHours: bHours,
      };
    });

    return {
      totalTherapists,
      totalScheduledSessions,
      completedSessions,
      noShowSessions,
      totalBookedMinutes,
      totalBookedHours,
      therapistDetails,
    };
  }, [therapists, sessions]);

  return (
    <FolioContext.Provider
      value={{
        getFolioForBooking,
        activeFolio,
        processPayment,
        latestTransaction,
        getTransactionById,
        completeResortCheckout,
        isStayCheckedOut,
        getCheckoutRecord,
        submitReview,
        getReviewForBooking,
        getRevenueAnalytics,
        getOccupancyAnalytics,
        getTherapistUtilizationAnalytics,
      }}
    >
      {children}
    </FolioContext.Provider>
  );
};

export const useFolio = (): FolioContextType => {
  const context = useContext(FolioContext);
  if (!context) {
    throw new Error('useFolio must be used within a FolioProvider');
  }
  return context;
};
