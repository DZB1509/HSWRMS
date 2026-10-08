import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import type { BookingStatus, DepositStatus } from '../../types/customer';

export interface BookingStatusChipProps {
  status?: BookingStatus;
  depositStatus?: DepositStatus;
  size?: 'sm' | 'md';
}

export const BookingStatusChip: React.FC<BookingStatusChipProps> = ({
  status,
  depositStatus,
  size = 'md',
}) => {
  const { t } = useTranslation();

  if (depositStatus) {
    let bg = '#f4f5f3';
    let color = 'var(--text-secondary)';
    let border = 'var(--border-subtle)';
    let label = t('customer.status.depositPending', 'Deposit Pending');
    let icon = <Clock size={size === 'sm' ? 12 : 14} />;

    if (depositStatus === 'paid') {
      bg = '#eef5ec';
      color = '#2d5a27';
      border = '#c7e2be';
      label = t('customer.status.depositPaid', 'Deposit Paid (30%)');
      icon = <CheckCircle2 size={size === 'sm' ? 12 : 14} />;
    } else if (depositStatus === 'failed') {
      bg = '#fdf2f2';
      color = '#991b1b';
      border = '#fecaca';
      label = t('customer.status.depositFailed', 'Deposit Failed');
      icon = <XCircle size={size === 'sm' ? 12 : 14} />;
    } else if (depositStatus === 'refunded') {
      bg = '#fef3c7';
      color = '#92400e';
      border = '#fde68a';
      label = t('customer.status.depositRefunded', 'Deposit Refunded');
      icon = <AlertCircle size={size === 'sm' ? 12 : 14} />;
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: size === 'sm' ? '2px 8px' : '4px 12px',
          borderRadius: 'var(--radius-pill)',
          fontSize: size === 'sm' ? '11px' : '12px',
          fontWeight: 600,
          backgroundColor: bg,
          color,
          border: `1px solid ${border}`,
        }}
      >
        {icon}
        <span>{label}</span>
      </span>
    );
  }

  let bg = '#f4f5f3';
  let color = 'var(--text-secondary)';
  let border = 'var(--border-subtle)';
  let label = t('customer.status.upcoming', 'Upcoming Retreat');
  let icon = <Clock size={size === 'sm' ? 12 : 14} />;

  if (status === 'upcoming') {
    bg = '#eef5ec';
    color = '#2d5a27';
    border = '#c7e2be';
    label = t('customer.status.confirmed', 'Confirmed & Reserved');
    icon = <CheckCircle2 size={size === 'sm' ? 12 : 14} />;
  } else if (status === 'in_stay') {
    bg = '#eff6ff';
    color = '#1e40af';
    border = '#bfdbfe';
    label = t('customer.status.inStay', 'In-Stay / Active');
    icon = <CheckCircle2 size={size === 'sm' ? 12 : 14} />;
  } else if (status === 'completed') {
    bg = '#f4f5f3';
    color = '#4b5563';
    border = '#e5e7eb';
    label = t('customer.status.completed', 'Completed Journey');
    icon = <CheckCircle2 size={size === 'sm' ? 12 : 14} />;
  } else if (status === 'cancelled') {
    bg = '#fdf2f2';
    color = '#991b1b';
    border = '#fecaca';
    label = t('customer.status.cancelled', 'Cancelled');
    icon = <XCircle size={size === 'sm' ? 12 : 14} />;
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        borderRadius: 'var(--radius-pill)',
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: 600,
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
      }}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};
