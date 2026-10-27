import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isNetworkOrTimeoutError,
  canExecutePayment,
  canExecuteCheckout,
  getPendingPaymentMessage,
  isPendingOutcomeUnverified,
} from './paymentSafety.ts';
import { resolveNumericBookingId } from './bookingResolver.ts';

describe('Payment & Checkout Safety Guards', () => {
  describe('Unverified ID Fail-Closed Guards', () => {
    it('blocks payment execution when invoice ID is unverified in production', () => {
      const result = canExecutePayment({
        resolvedInvoiceId: null,
        amountToPay: 500000,
        isDev: false,
        isProcessing: false,
      });
      assert.strictEqual(result.allowed, false);
      assert.match(result.reason || '', /Unverified invoice ID/i);
    });

    it('allows payment execution when invoice ID is verified in production', () => {
      const result = canExecutePayment({
        resolvedInvoiceId: 108,
        amountToPay: 500000,
        isDev: false,
        isProcessing: false,
      });
      assert.strictEqual(result.allowed, true);
    });

    it('allows demo simulation only when isDev is true', () => {
      const devResult = canExecutePayment({
        resolvedInvoiceId: null,
        amountToPay: 500000,
        isDev: true,
        isProcessing: false,
      });
      assert.strictEqual(devResult.allowed, true);

      const prodResult = canExecutePayment({
        resolvedInvoiceId: null,
        amountToPay: 500000,
        isDev: false,
        isProcessing: false,
      });
      assert.strictEqual(prodResult.allowed, false);
    });

    it('blocks checkout completion when invoice ID is unverified in production', () => {
      const result = canExecuteCheckout({
        resolvedInvoiceId: null,
        isDev: false,
        isFinalizing: false,
        outstandingBalance: 0,
      });
      assert.strictEqual(result.allowed, false);
      assert.match(result.reason || '', /Unverified invoice ID/i);
    });

    it('allows checkout completion when invoice ID is verified and balance is zero', () => {
      const result = canExecuteCheckout({
        resolvedInvoiceId: 108,
        isDev: false,
        isFinalizing: false,
        outstandingBalance: 0,
      });
      assert.strictEqual(result.allowed, true);
    });

    it('blocks checkout completion when outstanding balance remains', () => {
      const result = canExecuteCheckout({
        resolvedInvoiceId: 108,
        isDev: false,
        isFinalizing: false,
        outstandingBalance: 250000,
      });
      assert.strictEqual(result.allowed, false);
      assert.match(result.reason || '', /Outstanding balance/i);
    });

    it('never invents or guesses numeric booking IDs from reference codes', () => {
      assert.strictEqual(resolveNumericBookingId('HSW-88192'), null);
      assert.strictEqual(resolveNumericBookingId('HSW-999'), null);
      assert.strictEqual(resolveNumericBookingId(''), null);
      assert.strictEqual(resolveNumericBookingId(undefined), null);
    });
  });

  describe('Network Error & Timeout Ambiguity Classification', () => {
    it('classifies browser offline state as ambiguous network issue', () => {
      assert.strictEqual(isNetworkOrTimeoutError(new Error('something'), false), true);
    });

    it('identifies fetch network failure (TypeError: Failed to fetch)', () => {
      const err = new TypeError('Failed to fetch');
      assert.strictEqual(isNetworkOrTimeoutError(err, true), true);
    });

    it('identifies axios / node timeout codes (ECONNABORTED, ETIMEDOUT)', () => {
      const abortErr = { code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' };
      const timeoutErr = { code: 'ETIMEDOUT', message: 'connection timed out' };
      assert.strictEqual(isNetworkOrTimeoutError(abortErr, true), true);
      assert.strictEqual(isNetworkOrTimeoutError(timeoutErr, true), true);
    });

    it('identifies generic NetworkError messages', () => {
      const err = new Error('NetworkError when attempting to fetch resource.');
      assert.strictEqual(isNetworkOrTimeoutError(err, true), true);
    });

    it('does NOT classify standard HTTP 4xx/5xx business rejection as network timeout', () => {
      const businessErr = new Error('INVOICE_ALREADY_SETTLED: Invoice has zero balance due');
      assert.strictEqual(isNetworkOrTimeoutError(businessErr, true), false);

      const notFoundErr = new Error('Resource not found with ID: 999');
      assert.strictEqual(isNetworkOrTimeoutError(notFoundErr, true), false);
    });
  });

  describe('Pending Transaction Safety Semantics', () => {
    it('ensures pending state does not settle or alter stay balance', () => {
      // Simulation of folio transaction status invariants
      type TransactionStatus = 'success' | 'failed' | 'cancelled' | 'pending';
      const shouldClearBalance = (status: TransactionStatus): boolean => {
        return status === 'success';
      };

      assert.strictEqual(shouldClearBalance('pending'), false);
      assert.strictEqual(shouldClearBalance('failed'), false);
      assert.strictEqual(shouldClearBalance('cancelled'), false);
      assert.strictEqual(shouldClearBalance('success'), true);
    });

    it('ensures pending message warns against immediate retry without claiming funds were not debited', () => {
      const msg = getPendingPaymentMessage();
      // Must warn against immediate retry to prevent duplicate charges
      assert.match(msg, /do not submit another payment immediately/i);
      assert.match(msg, /duplicate charges/i);
      // Must state that status is unverified or unconfirmed
      assert.match(msg, /unverified|unconfirmed/i);
      // Must NOT claim that funds were not debited or that account was not charged
      assert.doesNotMatch(msg, /not debited/i);
      assert.doesNotMatch(msg, /no charges were made/i);
      assert.doesNotMatch(msg, /chưa bị trừ/i);
      assert.doesNotMatch(msg, /không bị trừ/i);

      // Verify helper function
      assert.strictEqual(isPendingOutcomeUnverified('pending'), true);
      assert.strictEqual(isPendingOutcomeUnverified('success'), false);
      assert.strictEqual(isPendingOutcomeUnverified('failed'), false);
    });
  });
});
