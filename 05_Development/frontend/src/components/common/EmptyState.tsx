import React from 'react';
import { Sparkles } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action
}) => {
  return (
    <div className="hsw-empty-state">
      <div className="hsw-empty-icon">
        {icon || <Sparkles size={40} />}
      </div>
      <h3 className="hsw-empty-title">{title}</h3>
      <p className="hsw-empty-text">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
