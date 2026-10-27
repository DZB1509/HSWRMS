import { useState, useCallback, useEffect } from 'react';
import { billingApi } from '../api/billingApi';
import type {
  FolioResponse,
  InvoiceResponse,
  PaymentResponse,
  FinalizeCheckoutResponse,
  CustomerReviewResponse,
  CustomerReviewRequest,
  PaymentRequest,
} from '../types';

export const useBilling = (bookingId?: number | string) => {
  const [folio, setFolio] = useState<FolioResponse | null>(null);
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
  const [review, setReview] = useState<CustomerReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFolio = useCallback(async () => {
    if (!bookingId) {
      setError('Cannot fetch folio: Missing booking ID');
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await billingApi.getFolio(bookingId);
      setFolio(data);
      return data;
    } catch (err: any) {
      setError(err?.message || 'Failed to load folio');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  const fetchInvoice = useCallback(async (invoiceId: number | string) => {
    if (!invoiceId) {
      setError('Cannot fetch invoice: Missing invoice ID');
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await billingApi.getInvoice(invoiceId);
      setInvoice(data);
      return data;
    } catch (err: any) {
      setError(err?.message || 'Failed to load invoice');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateInvoice = useCallback(async (customBookingId?: number | string) => {
    const targetBookingId = customBookingId ?? bookingId;
    if (!targetBookingId) {
      setError('Cannot generate invoice: missing retreat booking ID');
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await billingApi.generateInvoice(targetBookingId);
      setInvoice(data);
      return data;
    } catch (err: any) {
      setError(err?.message || 'Failed to generate invoice');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  const processPayment = useCallback(async (invoiceId: number | string, req: PaymentRequest): Promise<PaymentResponse> => {
    if (!invoiceId) {
      const msg = 'Cannot process payment: Missing invoice ID';
      setError(msg);
      throw new Error(msg);
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await billingApi.payInvoice(invoiceId, req);
      await fetchFolio();
      return data;
    } catch (err: any) {
      setError(err?.message || 'Payment processing failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchFolio]);

  const finalizeCheckout = useCallback(async (invoiceId: number | string): Promise<FinalizeCheckoutResponse> => {
    if (!invoiceId) {
      const msg = 'Cannot finalize checkout: Missing invoice ID';
      setError(msg);
      throw new Error(msg);
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await billingApi.finalizeCheckout(invoiceId);
      await fetchFolio();
      return data;
    } catch (err: any) {
      setError(err?.message || 'Checkout finalization failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchFolio]);

  const submitReview = useCallback(async (req: CustomerReviewRequest): Promise<CustomerReviewResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await billingApi.submitReview(req);
      setReview(data);
      return data;
    } catch (err: any) {
      setError(err?.message || 'Failed to submit review');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchReview = useCallback(async () => {
    if (!bookingId) return null;
    try {
      const data = await billingApi.getReview(bookingId);
      setReview(data);
      return data;
    } catch {
      // Review may not exist yet
      return null;
    }
  }, [bookingId]);

  useEffect(() => {
    fetchFolio();
  }, [fetchFolio]);

  return {
    folio,
    invoice,
    review,
    isLoading,
    error,
    fetchFolio,
    fetchInvoice,
    generateInvoice,
    processPayment,
    finalizeCheckout,
    submitReview,
    fetchReview,
  };
};
