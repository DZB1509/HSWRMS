import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Info } from 'lucide-react';
import { formatVND } from '../../i18n';

export interface PaymentSummaryProps {
  totalPrice: number;
  depositAmount: number;
  remainingBalance?: number;
  depositPaid?: boolean;
  highlightDeposit?: boolean;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  totalPrice,
  depositAmount,
  remainingBalance = totalPrice - depositAmount,
  depositPaid = false,
  highlightDeposit = true,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <div
      className="hsw-payment-summary"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-lg)',
          fontWeight: 500,
          color: 'var(--text-primary)',
          margin: '0 0 var(--space-4)',
          paddingBottom: 'var(--space-3)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {t('customer.payment.summaryTitle', 'Price & Deposit Breakdown')}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            {t('customer.payment.packageRate', 'Full Retreat Package Rate')}
          </span>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {formatVND(totalPrice, i18n.language)}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            {t('customer.payment.serviceTax', 'VAT & Resort Wellness Amenities (Included)')}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--accent-olive)', fontWeight: 600 }}>
            {t('customer.payment.included', '100% Inclusive')}
          </span>
        </div>

        <div
          style={{
            height: '1px',
            backgroundColor: 'var(--border-subtle)',
            margin: 'var(--space-1) 0',
          }}
        />

        {/* Deposit Highlight Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: highlightDeposit ? 'var(--space-3) var(--space-4)' : '0',
            backgroundColor: highlightDeposit ? 'var(--accent-sand-soft)' : 'transparent',
            borderRadius: 'var(--radius-sm)',
            border: highlightDeposit ? '1px solid var(--accent-sand)' : 'none',
          }}
        >
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--accent-forest)' }}>
              {t('customer.payment.depositDueNow', 'Deposit Required (30%)')}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {depositPaid
                ? t('customer.payment.depositPaidStatus', '✓ Successfully Paid & Confirmed')
                : t('customer.payment.depositDueHint', 'Due now to secure your villa & retreat schedule')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-xl)',
                fontWeight: 700,
                color: 'var(--accent-forest)',
              }}
            >
              {formatVND(depositAmount, i18n.language)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-1)' }}>
          <div>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {t('customer.payment.remainingAtResort', 'Remaining Balance (70%)')}
            </span>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
              {t('customer.payment.remainingHint', 'Settled comfortably upon check-in at resort reception')}
            </div>
          </div>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {formatVND(remainingBalance, i18n.language)}
          </span>
        </div>
      </div>

      {/* Cancellation Terms Hint */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          padding: 'var(--space-3)',
          backgroundColor: 'var(--bg-soft)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        <Info size={14} style={{ color: 'var(--accent-olive)', flexShrink: 0, marginTop: '2px' }} />
        <span>
          {t(
            'customer.payment.cancellationPolicy',
            'Complimentary cancellation & 100% deposit refund available up to 7 calendar days before your arrival date.'
          )}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginTop: 'var(--space-4)',
          fontSize: '11px',
          color: 'var(--text-tertiary)',
        }}
      >
        <ShieldCheck size={14} style={{ color: 'var(--accent-olive)' }} />
        <span>{t('customer.payment.sslGuarantee', 'Encrypted & Certified VNPay Hospitality Transaction')}</span>
      </div>
    </div>
  );
};
