import React from 'react';

export type StatusCategory = 'booking' | 'spa' | 'meal' | 'payment' | 'villa' | 'generic';

export interface StatusChipProps {
  status: string;
  category?: StatusCategory;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  className = ''
}) => {
  const normalized = status.toLowerCase().trim();

  let colorClass = 'status-neutral';

  // Map known statuses to semantic colors
  if (['confirmed', 'completed', 'ready', 'successful', 'available', 'active'].includes(normalized)) {
    colorClass = 'status-success';
  } else if (['pending', 'pending deposit', 'preparing', 'submitted', 'needs cleaning'].includes(normalized)) {
    colorClass = 'status-warning';
  } else if (['cancelled', 'failed', 'no-show', 'maintenance', 'blocked'].includes(normalized)) {
    colorClass = 'status-danger';
  } else if (['checked-in', 'occupied', 'draft'].includes(normalized)) {
    colorClass = 'status-info';
  }

  return (
    <span className={`hsw-status-chip ${colorClass} ${className}`}>
      {status}
    </span>
  );
};
