import { apiClient, getAuthToken } from '../../../api/client/apiClient';
import type {
  FolioResponse,
  PostChargeRequest,
  FolioItemResponse,
  InvoiceResponse,
  PaymentRequest,
  PaymentResponse,
  VietQrResponse,
  VnpayPaymentUrlResponse,
  InvoicePaymentStatus,
  FinalizeCheckoutResponse,
  CustomerReviewRequest,
  CustomerReviewResponse,
  RevenueAnalytics,
  OccupancyAnalytics,
  TherapistUtilization,
  CreateAdjustmentRequest,
  AdjustmentDecisionRequest,
  AdjustmentResponse,
  CreditNoteResponse,
} from '../types';

interface ApiResponse<T> {
  timestamp: string;
  success: boolean;
  message: string;
  data: T;
}

const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8080/api/v1';

export const billingApi = {
  // Folio & Charges
  getFolio: async (bookingId: number | string = 1): Promise<FolioResponse> => {
    const res = await apiClient.get<ApiResponse<FolioResponse>>(`/billing/folios/${bookingId}`);
    return res.data;
  },

  postCharge: async (data: PostChargeRequest): Promise<FolioItemResponse> => {
    const res = await apiClient.post<ApiResponse<FolioItemResponse>>('/billing/charges', data);
    return res.data;
  },

  // Invoice
  generateInvoice: async (bookingId: number | string = 1): Promise<InvoiceResponse> => {
    const res = await apiClient.post<ApiResponse<InvoiceResponse>>(`/billing/folios/${bookingId}/invoice`);
    return res.data;
  },

  getInvoice: async (invoiceId: number | string = 1): Promise<InvoiceResponse> => {
    const res = await apiClient.get<ApiResponse<InvoiceResponse>>(`/billing/invoices/${invoiceId}`);
    return res.data;
  },

  downloadInvoicePdf: async (invoiceId: number | string, invoiceNumber?: string): Promise<void> => {
    const url = `${API_BASE_URL}/billing/invoices/${invoiceId}/pdf`;
    const token = getAuthToken();

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to download invoice PDF: HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `invoice-${invoiceNumber || invoiceId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  // Payments & Checkout
  payInvoice: async (invoiceId: number | string, data: PaymentRequest): Promise<PaymentResponse> => {
    const res = await apiClient.post<ApiResponse<PaymentResponse>>(`/billing/invoices/${invoiceId}/pay`, data);
    return res.data;
  },

  getInvoiceVietQr: async (invoiceId: number | string): Promise<VietQrResponse> => {
    const res = await apiClient.get<ApiResponse<VietQrResponse>>(`/billing/invoices/${invoiceId}/vietqr`);
    return res.data;
  },

  getDepositVietQr: async (bookingId: number | string): Promise<VietQrResponse> => {
    const res = await apiClient.get<ApiResponse<VietQrResponse>>(`/billing/deposit/${bookingId}/vietqr`);
    return res.data;
  },

  createVnpayPaymentUrl: async (invoiceId: number, amount?: number, bookingId?: number): Promise<VnpayPaymentUrlResponse> => {
    const cleanInvoiceId = (typeof invoiceId === 'number' && !isNaN(invoiceId) && invoiceId > 0) ? invoiceId : undefined;
    const cleanBookingId = (typeof bookingId === 'number' && !isNaN(bookingId) && bookingId > 0) ? bookingId : undefined;
    const cleanAmount = (typeof amount === 'number' && !isNaN(amount) && amount > 0) ? amount : undefined;

    const res = await apiClient.post<ApiResponse<VnpayPaymentUrlResponse>>('/payments/vnpay/create-payment-url', {
      invoiceId: cleanInvoiceId,
      bookingId: cleanBookingId,
      amount: cleanAmount,
    });
    return res.data;
  },

  getInvoicePaymentStatus: async (invoiceId: number): Promise<InvoicePaymentStatus> => {
    const res = await apiClient.get<ApiResponse<InvoicePaymentStatus>>(`/invoices/${invoiceId}/payment-status`);
    return res.data;
  },

  simulateVnpay: async (transactionRef: string, outcome: 'SUCCESS' | 'FAILED' | 'CANCELLED'): Promise<void> => {
    await apiClient.post<ApiResponse<unknown>>(
      `/payments/vnpay/simulate?transactionRef=${encodeURIComponent(transactionRef)}&outcome=${outcome}`
    );
  },

  verifyVnpayReturn: async (queryString: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.get<ApiResponse<unknown>>(`/payments/vnpay/verify-return${queryString}`);
    return { success: res.success, message: res.message };
  },

  getTransactionStatus: async (reference: string): Promise<PaymentResponse> => {
    const res = await apiClient.get<ApiResponse<PaymentResponse>>(`/billing/payments/transactions/${reference}/status`);
    return res.data;
  },

  finalizeCheckout: async (invoiceId: number | string): Promise<FinalizeCheckoutResponse> => {
    const res = await apiClient.post<ApiResponse<FinalizeCheckoutResponse>>(`/billing/invoices/${invoiceId}/finalize-checkout`);
    return res.data;
  },

  // Customer Reviews
  submitReview: async (data: CustomerReviewRequest): Promise<CustomerReviewResponse> => {
    const res = await apiClient.post<ApiResponse<CustomerReviewResponse>>('/customer/reviews', data);
    return res.data;
  },

  getReview: async (bookingId: number | string = 1): Promise<CustomerReviewResponse> => {
    const res = await apiClient.get<ApiResponse<CustomerReviewResponse>>(`/customer/reviews/booking/${bookingId}`);
    return res.data;
  },

  // Analytics
  getRevenueAnalytics: async (fromDate?: string, toDate?: string): Promise<RevenueAnalytics> => {
    const res = await apiClient.get<ApiResponse<RevenueAnalytics>>('/analytics/revenue', {
      params: { fromDate, toDate },
    });
    return res.data;
  },

  getOccupancyAnalytics: async (fromDate?: string, toDate?: string): Promise<OccupancyAnalytics> => {
    const res = await apiClient.get<ApiResponse<OccupancyAnalytics>>('/analytics/occupancy', {
      params: { fromDate, toDate },
    });
    return res.data;
  },

  getTherapistUtilization: async (fromDate?: string, toDate?: string): Promise<TherapistUtilization> => {
    const res = await apiClient.get<ApiResponse<TherapistUtilization>>('/analytics/therapist-utilization', {
      params: { fromDate, toDate },
    });
    return res.data;
  },

  // Excel binary download
  downloadExcelReport: async (type: 'revenue' | 'occupancy' | 'therapist', fromDate?: string, toDate?: string): Promise<void> => {
    const params = new URLSearchParams();
    params.append('type', type);
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);

    const url = `${API_BASE_URL}/analytics/export?${params.toString()}`;
    const token = getAuthToken();

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to download report: HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `hswrms-${type}-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  // Adjustments & Credit Notes (WP-1B)
  submitAdjustmentRequest: async (data: CreateAdjustmentRequest): Promise<AdjustmentResponse> => {
    const res = await apiClient.post<ApiResponse<AdjustmentResponse>>('/billing/adjustments', data);
    return res.data;
  },

  listAdjustments: async (params?: { folioId?: number; bookingId?: number; status?: string }): Promise<AdjustmentResponse[]> => {
    const res = await apiClient.get<ApiResponse<AdjustmentResponse[]>>('/billing/adjustments', { params });
    return res.data;
  },

  getAdjustment: async (id: number): Promise<AdjustmentResponse> => {
    const res = await apiClient.get<ApiResponse<AdjustmentResponse>>(`/billing/adjustments/${id}`);
    return res.data;
  },

  processAdjustmentDecision: async (id: number, data: AdjustmentDecisionRequest): Promise<AdjustmentResponse> => {
    const res = await apiClient.post<ApiResponse<AdjustmentResponse>>(`/billing/adjustments/${id}/decision`, data);
    return res.data;
  },

  getCreditNote: async (id: number): Promise<CreditNoteResponse> => {
    const res = await apiClient.get<ApiResponse<CreditNoteResponse>>(`/billing/credit-notes/${id}`);
    return res.data;
  },

  getCreditNotesForInvoice: async (invoiceId: number): Promise<CreditNoteResponse[]> => {
    const res = await apiClient.get<ApiResponse<CreditNoteResponse[]>>(`/billing/invoices/${invoiceId}/credit-notes`);
    return res.data;
  },
};
