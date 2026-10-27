/**
 * Payment and Checkout Safety Guards
 * Enforces fail-closed rules when invoice or booking IDs are unverified,
 * distinguishes network timeouts from confirmed outcomes, and guards production integrity.
 */

export function isNetworkOrTimeoutError(err: unknown, isOnline = true): boolean {
  if (!isOnline) return true;
  if (!err) return false;
  if (typeof err === 'object') {
    const e = err as Record<string, any>;
    if (e.name === 'TypeError') return true;
    if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') return true;
    if (typeof e.message === 'string') {
      const msg = e.message.toLowerCase();
      if (
        msg.includes('failed to fetch') ||
        msg.includes('networkerror') ||
        msg.includes('network error') ||
        msg.includes('timeout') ||
        msg.includes('network request failed') ||
        msg.includes('aborted')
      ) {
        return true;
      }
    }
  }
  return false;
}

export function canExecutePayment(options: {
  resolvedInvoiceId: number | null;
  amountToPay: number;
  isDev: boolean;
  isProcessing: boolean;
}): { allowed: boolean; reason?: string } {
  if (options.isProcessing) {
    return { allowed: false, reason: 'Transaction is currently processing' };
  }
  if (options.amountToPay <= 0) {
    return { allowed: false, reason: 'Settlement amount must be greater than zero' };
  }
  if (!options.resolvedInvoiceId && !options.isDev) {
    return { allowed: false, reason: 'Unverified invoice ID cannot execute in production' };
  }
  return { allowed: true };
}

export function canExecuteCheckout(options: {
  resolvedInvoiceId: number | null;
  isDev: boolean;
  isFinalizing: boolean;
  outstandingBalance: number;
}): { allowed: boolean; reason?: string } {
  if (options.isFinalizing) {
    return { allowed: false, reason: 'Checkout is currently finalizing' };
  }
  if (options.outstandingBalance > 0) {
    return { allowed: false, reason: 'Outstanding balance must be settled before checkout' };
  }
  if (!options.resolvedInvoiceId && !options.isDev) {
    return { allowed: false, reason: 'Unverified invoice ID cannot complete checkout in production' };
  }
  return { allowed: true };
}

export const PENDING_PAYMENT_NOTICE =
  'Transaction outcome could not be verified due to network timeout or gateway delay. Debit status is unconfirmed; do not submit another payment immediately to prevent duplicate charges. Check your transaction status on the stay folio or contact the Front Desk.';

export function getPendingPaymentMessage(): string {
  return PENDING_PAYMENT_NOTICE;
}

export function isPendingOutcomeUnverified(status: string): boolean {
  return status === 'pending';
}

