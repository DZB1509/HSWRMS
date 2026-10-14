import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Sparkles, ChevronDown, Check } from 'lucide-react';
import { useTheme, type Theme } from '../../context/ThemeContext';

export interface ThemeToggleProps {
  variant?: 'light' | 'dark';
  className?: string;
  compact?: boolean;
}

interface ThemeOption {
  id: Theme;
  labelKey: string;
  defaultLabel: string;
  Icon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

const THEME_OPTIONS: ThemeOption[] = [
  { id: 'light', labelKey: 'theme.light', defaultLabel: 'Light', Icon: Sun },
  { id: 'dark', labelKey: 'theme.dark', defaultLabel: 'Dark', Icon: Moon },
  { id: 'blush', labelKey: 'theme.blush', defaultLabel: 'Blush', Icon: Sparkles },
];

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'dark',
  className = '',
  compact = false,
}) => {
  const { t } = useTranslation('common');
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption = THEME_OPTIONS.find((opt) => opt.id === theme) || THEME_OPTIONS[0];
  const CurrentIcon = currentOption.Icon;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    setIsOpen(false);
  };

  const triggerColorStyle =
    variant === 'light'
      ? {
          color: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
        }
      : {};

  return (
    <div className={`hsw-theme-switcher ${className}`} ref={containerRef}>
      <button
        type="button"
        className="hsw-theme-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('theme.select', 'Select Theme')}
        style={triggerColorStyle}
      >
        <CurrentIcon size={14} style={{ flexShrink: 0 }} />
        {!compact && (
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>
            {t(currentOption.labelKey, currentOption.defaultLabel)}
          </span>
        )}
        <ChevronDown
          size={12}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        />
      </button>

      {isOpen && (
        <div className="hsw-theme-dropdown" role="listbox" aria-label="Available themes">
          <div className="hsw-theme-header">
            {t('theme.appearance', 'Appearance')}
          </div>
          {THEME_OPTIONS.map((opt) => {
            const isSelected = opt.id === theme;
            const OptIcon = opt.Icon;
            return (
              <button
                key={opt.id}
                type="button"
                className={`hsw-theme-item ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelect(opt.id)}
                role="option"
                aria-selected={isSelected}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <OptIcon size={14} style={{ flexShrink: 0 }} />
                  <span>{t(opt.labelKey, opt.defaultLabel)}</span>
                </span>
                {isSelected && <Check size={13} style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
