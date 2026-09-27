/**
 * HSWRMS — Module 5: Folio, Final Payment, Checkout, Feedback & Analytics
 * Domain type definitions.
 *
 * Business Rules Enforced:
 * 1. Consolidated Folio: Traceable line items from Retreat Package, Spa Extras, F&B Extras.
 * 2. Real Deposit: Uses actual booking depositAmount and remainingBalance.
 * 3. Payment != Checkout: Separate transaction outcome from resort checkout completion.
 * 4. Checkout Blocking: Blocked while unresolved monetary obligations remain.
 * 5. Review & Rating: Optional and post-checkout only.
 * 6. Manager Privacy: Analytical/operational aggregates only; no sensitive health/dietary/identity data.
 */

export type FolioSourceType = 'retreat' | 'spa' | 'fnb';

export type FolioItemStatus =
  | 'included'
  | 'deposit_paid'
  | 'pending_settlement'
  | 'settled';

export interface LocalizedString {
  vi: string;
  en: string;
  'zh-CN': string;
  ja: string;
  fr: string;
}

export interface FolioLineItem {
  id: string;
  sourceType: FolioSourceType;
  sourceId: string;
  title: LocalizedString;
  subtitle?: string;
  serviceDate?: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  status: FolioItemStatus;
  createdAt: string;
  isIncludedInPackage?: boolean;
}

export type CheckoutBlockerType =
  | 'unpaid_balance'
  | 'unsettled_spa'
  | 'unsettled_fnb'
  | 'not_in_stay';

export interface CheckoutBlocker {
  type: CheckoutBlockerType;
  titleKey: string;
  messageKey: string;
  amount?: number;
  count?: number;
  actionPath?: string;
  actionLabelKey?: string;
}

export interface FolioSummary {
  bookingReference: string;
  customerName: string;
  villaCode: string;
  stayDates: string;
  retreatTotal: number;
  depositPaid: number;
  retreatRemaining: number;
  spaExtrasTotal: number;
  fnbExtrasTotal: number;
  totalExtras: number;
  totalBillable: number;
  totalPaid: number;
  outstandingBalance: number;
  isFullySettled: boolean;
  canCheckout: boolean;
  blockers: CheckoutBlocker[];
}

export type PaymentTransactionStatus =
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed'
  | 'cancelled';

export interface PaymentTransaction {
  id: string;
  bookingReference: string;
  amount: number;
  provider: 'vnpay_mock';
  status: PaymentTransactionStatus;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
  gatewayRef?: string;
  cardLast4?: string;
}

export interface CheckoutRecord {
  bookingReference: string;
  checkoutDate: string; // ISO
  totalSettled: number;
  villaCode: string;
  settledBy: 'customer' | 'receptionist';
  completedAt: string;
}

export interface CustomerStayReview {
  id: string;
  bookingReference: string;
  customerId: string;
  customerName?: string;
  overallRating: number; // 1-5
  feedback: string;
  submittedAt: string;
}

export interface FolioContextType {
  getFolioForBooking: (bookingRef?: string) => FolioSummary & { lineItems: FolioLineItem[] };
  activeFolio: FolioSummary & { lineItems: FolioLineItem[] };
  processPayment: (
    bookingRef: string,
    amount: number,
    simulateMode?: 'success' | 'failed' | 'cancelled'
  ) => Promise<PaymentTransaction>;
  latestTransaction: PaymentTransaction | null;
  getTransactionById: (id: string) => PaymentTransaction | undefined;
  completeResortCheckout: (
    bookingRef: string,
    settledBy?: 'customer' | 'receptionist'
  ) => { success: boolean; message: string; blockers?: CheckoutBlocker[] };
  isStayCheckedOut: (bookingRef: string) => boolean;
  getCheckoutRecord: (bookingRef: string) => CheckoutRecord | undefined;
  submitReview: (
    bookingRef: string,
    reviewData: Omit<CustomerStayReview, 'id' | 'submittedAt'>
  ) => { success: boolean; message: string };
  getReviewForBooking: (bookingRef: string) => CustomerStayReview | undefined;
  // Manager analytical aggregators
  getRevenueAnalytics: () => {
    totalRevenue: number;
    retreatRevenue: number;
    spaRevenue: number;
    fnbRevenue: number;
    outstandingRevenue: number;
    categoryBreakdown: { name: string; value: number; color: string }[];
  };
  getOccupancyAnalytics: () => {
    totalVillas: number;
    occupiedCount: number;
    readyCount: number;
    cleaningCount: number;
    maintenanceCount: number;
    occupancyRate: number;
    villaDetails: {
      id: string;
      code: string;
      category: string;
      status: string;
      customerName?: string;
      bookingRef?: string;
    }[];
  };
  getTherapistUtilizationAnalytics: () => {
    totalTherapists: number;
    totalScheduledSessions: number;
    completedSessions: number;
    noShowSessions: number;
    totalBookedMinutes: number;
    totalBookedHours: number;
    therapistDetails: {
      id: string;
      name: string;
      sessionsCount: number;
      completedCount: number;
      noShowCount: number;
      bookedMinutes: number;
      bookedHours: number;
    }[];
  };
}
