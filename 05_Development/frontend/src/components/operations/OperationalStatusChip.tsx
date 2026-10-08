import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck2,
  FileQuestion,
  Send,
} from 'lucide-react';
import type { ArrivalStatus, ResidenceDeclarationStatus } from '../../types/operations';

interface OperationalStatusChipProps {
  type: 'arrival' | 'residence' | 'deposit';
  status: ArrivalStatus | ResidenceDeclarationStatus | 'paid' | 'pending' | 'failed';
  size?: 'sm' | 'md';
}

export const OperationalStatusChip: React.FC<OperationalStatusChipProps> = ({
  type,
  status,
  size = 'md',
}) => {
  const { t } = useTranslation();

  // Color mappings
  let bg = 'var(--bg-soft)';
  let color = 'var(--text-secondary)';
  let borderColor = 'var(--border-subtle)';
  let Icon = Clock;
  let label: string = String(status);

  if (type === 'arrival') {
    switch (status) {
      case 'expected':
        bg = '#E3F2FD';
        color = '#0D47A1';
        borderColor = '#BBDEFB';
        Icon = Clock;
        label = t('operations.statuses.expected', 'Expected');
        break;
      case 'arrived':
        bg = '#FFF8E1';
        color = '#B26A00';
        borderColor = '#FFE082';
        Icon = UserCheck;
        label = t('operations.statuses.arrived', 'Arrived');
        break;
      case 'checked_in':
        bg = '#E8F5E9';
        color = '#1B5E20';
        borderColor = '#C8E6C9';
        Icon = CheckCircle2;
        label = t('operations.statuses.checked_in', 'Checked In');
        break;
      case 'delayed':
        bg = '#FFF3E0';
        color = '#E65100';
        borderColor = '#FFE0B2';
        Icon = AlertTriangle;
        label = t('operations.statuses.delayed', 'Delayed');
        break;
      case 'cancelled':
        bg = '#FFEBEE';
        color = '#C62828';
        borderColor = '#FFCDD2';
        Icon = XCircle;
        label = t('operations.statuses.cancelled', 'Cancelled');
        break;
    }
  } else if (type === 'residence') {
    switch (status) {
      case 'pending':
        bg = '#FFF8E1';
        color = '#8C5400';
        borderColor = '#FFE082';
        Icon = FileQuestion;
        label = t('operations.arrivals.pendingReview', 'Pending Info');
        break;
      case 'ready':
        bg = '#E8F5E9';
        color = '#1B5E20';
        borderColor = '#C8E6C9';
        Icon = FileCheck2;
        label = t('operations.arrivals.readyToSubmit', 'Ready to Submit');
        break;
      case 'submitted':
        bg = '#F3E5F5';
        color = '#4A148C';
        borderColor = '#E1BEE7';
        Icon = Send;
        label = t('operations.arrivals.submittedToPolice', 'Submitted');
        break;
    }
  } else if (type === 'deposit') {
    switch (status) {
      case 'paid':
        bg = '#E8F5E9';
        color = '#1B5E20';
        borderColor = '#C8E6C9';
        Icon = CheckCircle2;
        label = t('operations.checkIn.depositSatisfied', 'Required Deposit Satisfied');
        break;
      case 'pending':
        bg = '#FFF8E1';
        color = '#8C5400';
        borderColor = '#FFE082';
        Icon = Clock;
        label = t('operations.statuses.pending', 'Pending Deposit');
        break;
      case 'failed':
        bg = '#FFEBEE';
        color = '#C62828';
        borderColor = '#FFCDD2';
        Icon = XCircle;
        label = t('operations.statuses.cancelled', 'Deposit Failed');
        break;
    }
  }

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: isSmall ? '2px 7px' : '3px 10px',
        borderRadius: 'var(--radius-pill)',
        fontSize: isSmall ? '11px' : '12px',
        fontWeight: 600,
        backgroundColor: bg,
        color: color,
        border: `1px solid ${borderColor}`,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
      aria-label={`Status: ${label}`}
    >
      <Icon size={isSmall ? 12 : 14} />
      <span>{label}</span>
    </span>
  );
};
