import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCursor } from '../motion/CursorProvider';

export interface CursorEffectToggleProps {
  variant?: 'light' | 'dark';
  className?: string;
  compact?: boolean;
}

export const CursorEffectToggle: React.FC<CursorEffectToggleProps> = ({
  variant = 'dark',
  className = '',
  compact = false,
}) => {
  const { t } = useTranslation('common');
  const { cursorEnabled, toggleCursor } = useCursor();

  const triggerColorStyle =
    variant === 'light'
      ? {
          color: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
        }
      : {};

  return (
    <button
      type="button"
      role="switch"
      aria-checked={cursorEnabled}
      aria-label={t('preferences.toggleCursor', 'Toggle Cursor Effect')}
      className={`hsw-cursor-toggle ${cursorEnabled ? 'is-enabled' : ''} ${className}`}
      onClick={toggleCursor}
      style={triggerColorStyle}
    >
      <span className="hsw-cursor-toggle-dot" aria-hidden="true">
        {cursorEnabled ? '●' : '○'}
      </span>
      <span>
        {compact
          ? t('preferences.cursorShort', 'FX')
          : t('preferences.cursorLabel', 'Cursor FX')}
      </span>
    </button>
  );
};
