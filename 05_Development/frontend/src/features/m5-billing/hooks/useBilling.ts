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

export const useBilling = (bookingId: number | string = 1) => {
  const [folio, setFolio] = useState<FolioResponse | null>(null);
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
  const [review, setReview] = useState<CustomerReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFolio = useCallback(async () => {
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

  const fetchInvoice = useCallback(async (invoiceId: number | string = 1) => {
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

  const generateInvoice = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await billingApi.generateInvoice(bookingId);
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
