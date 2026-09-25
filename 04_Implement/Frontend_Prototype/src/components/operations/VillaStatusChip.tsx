import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  BedDouble,
  Brush,
  Wrench,
  BookmarkCheck,
  Check,
} from 'lucide-react';
import type { VillaStatus, HousekeepingStatus } from '../../types/operations';

interface VillaStatusChipProps {
  status: VillaStatus;
  housekeeping?: HousekeepingStatus;
  size?: 'sm' | 'md';
}

export const VillaStatusChip: React.FC<VillaStatusChipProps> = ({
  status,
  housekeeping,
  size = 'md',
}) => {
  const { t } = useTranslation();

  let bg = '#F3EFEA';
  let color = 'var(--text-secondary)';
  let borderColor = 'var(--border-subtle)';
  let Icon = Sparkles;
  let label: string = String(status);

  switch (status) {
    case 'ready':
      bg = '#E8F5E9';
      color = '#1B5E20';
      borderColor = '#C8E6C9';
      Icon = Sparkles;
      label = t('operations.statuses.ready', 'Ready');
      break;
    case 'reserved':
      bg = '#E3F2FD';
      color = '#0D47A1';
      borderColor = '#BBDEFB';
      Icon = BookmarkCheck;
      label = t('operations.statuses.reserved', 'Reserved');
      break;
    case 'occupied':
      bg = '#ECEFF1';
      color = '#263238';
      borderColor = '#CFD8DC';
      Icon = BedDouble;
      label = t('operations.statuses.occupied', 'Occupied');
      break;
    case 'cleaning':
      bg = '#FFF8E1';
      color = '#B26A00';
      borderColor = '#FFE082';
      Icon = Brush;
      label = t('operations.statuses.cleaning', 'Cleaning');
      break;
    case 'maintenance':
      bg = '#FFEBEE';
      color = '#C62828';
      borderColor = '#FFCDD2';
      Icon = Wrench;
      label = t('operations.statuses.maintenance', 'Maintenance');
      break;
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
      aria-label={`Villa Status: ${label}`}
    >
      <Icon size={isSmall ? 12 : 14} />
      <span>{label}</span>
      {housekeeping && housekeeping === 'inspected' && status === 'ready' && (
        <span title={t('operations.statuses.inspected', 'Inspected')} style={{ display: 'inline-flex', marginLeft: '2px' }}>
          <Check size={11} strokeWidth={3} />
        </span>
      )}
    </span>
  );
};
