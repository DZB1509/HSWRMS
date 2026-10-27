export type ChargeCategory = 'PACKAGE' | 'SPA' | 'FNB';
export type FolioStatus = 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'CLOSED';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'VNPAY' | 'CARD';

export interface FolioItemResponse {
  folioItemId: number;
  folioId: number;
  chargeCategory: ChargeCategory;
  description: string;
  amount: number;
  chargedAt: string;
  sourceBookingId?: number | null;
  sourceSpaSessionId?: number | null;
  sourceMealOrderId?: number | null;
}

export interface FolioResponse {
  folioId: number;
  retreatBookingId: number;
  bookingReference: string;
  customerName: string;
  villaNumber: string;
  totalCharges: number;
  totalPaid: number;
  balanceDue: number;
  folioStatus: FolioStatus;
  closedAt?: string | null;
  depositPaid?: number;
  packageOutstanding?: number;
  vatRate?: number;
  estimatedTax?: number;
  estimatedAmountDue?: number;
  invoiceId?: number;
  invoiceStatus?: string;
  canGenerateInvoice: boolean;
  hasUnsettledOrders: boolean;
  unsettledOrdersWarning?: string | null;
  items: FolioItemResponse[];
}

export interface PostChargeRequest {
  retreatBookingId: number;
  chargeCategory: ChargeCategory;
  description: string;
  amount: number;
  sourceBookingId?: number;
  sourceSpaSessionId?: number;
  sourceMealOrderId?: number;
}

export interface InvoiceResponse {
  invoiceId: number;
  folioId: number;
  retreatBookingId: number;
  invoiceNumber: string;
  bookingReference?: string;
  customerName?: string;
  villaNumber?: string;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  packageCharges?: number;
  depositDeducted?: number;
  packageOutstanding?: number;
  spaCharges?: number;
  fnbCharges?: number;
  vatRate?: number;
  subtotalAmount: number;
  taxAmount: number;
  finalAmount: number;
  amountPaid?: number;
  amountDue?: number;
  zeroBalance?: boolean;
  invoiceStatus: InvoiceStatus;
  issuedDate?: string | null;
  items: FolioItemResponse[];
}

export interface PaymentRequest {
  paymentMethod: PaymentMethod;
  amount: number;
  transactionReference?: string;
  idempotencyKey?: string;
  cardLast4?: string;
}

export interface PaymentResponse {
  transactionId: number;
  invoiceId?: number;
  retreatBookingId?: number;
  paymentType: 'DEPOSIT' | 'FINAL';
  paymentMethod: string;
  transactionReference: string;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  transactionDate: string;
  message?: string;
}

export interface FinalizeCheckoutResponse {
  invoiceId: number;
  bookingId: number;
  bookingReference: string;
  bookingStatus: string;
  folioStatus: string;
  invoiceStatus: string;
  villaId?: number;
  villaNumber?: string;
  villaStatus?: string;
  totalSettled: number;
  completedAt: string;
  message: string;
  zeroBalanceSettlement?: boolean;
  invoiceNumber?: string;
}

export interface CustomerReviewRequest {
  retreatBookingId: number;
  overallRating: number;
  comments?: string;
  roomRating?: number;
  spaRating?: number;
  diningRating?: number;
}

export interface CustomerReviewResponse {
  reviewId: number;
  retreatBookingId: number;
  overallRating: number;
  comments?: string;
  roomRating?: number;
  spaRating?: number;
  diningRating?: number;
  submittedAt: string;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  packageRevenue: number;
  spaRevenue: number;
  fnbRevenue: number;
  outstandingBalance: number;
  fromDate?: string;
  toDate?: string;
  categoryBreakdown: {
    name: string;
    value: number;
    color: string;
  }[];
  dailySeries?: {
    date: string;
    packageRevenue: number;
    spaRevenue: number;
    fnbRevenue: number;
    totalRevenue: number;
  }[];
}

export interface OccupancyAnalytics {
  totalVillas: number;
  occupiedCount: number;
  reservedCount: number;
  readyCount: number;
  cleaningCount: number;
  maintenanceCount: number;
  occupancyRate: number;
  fromDate?: string;
  toDate?: string;
  villaDetails: {
    villaId: number;
    villaNumber: string;
    category: string;
    status: string;
    customerName?: string | null;
    bookingReference?: string | null;
  }[];
}

export interface TherapistUtilization {
  totalTherapists: number;
  totalScheduledSessions: number;
  completedSessions: number;
  noShowSessions: number;
  cancelledSessions: number;
  totalBookedHours: number;
  fromDate?: string;
  toDate?: string;
  therapistDetails: {
    therapistId: number;
    name: string;
    sessionsCount: number;
    completedCount: number;
    noShowCount: number;
    cancelledCount: number;
    bookedMinutes: number;
    bookedHours: number;
  }[];
}
