import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import { SUPPORTED_LANGUAGES, changeLanguage, type SupportedLanguageCode } from '../../i18n';

export interface LanguageSwitcherProps {
  variant?: 'light' | 'dark';
  className?: string;
}

const SHORT_CODES: Record<string, string> = {
  vi: 'VI',
  en: 'EN',
  'zh-CN': '中文',
  ja: '日本語',
  fr: 'FR',
};

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dark',
  className = '',
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];
  const shortCode = SHORT_CODES[currentLang.code] || currentLang.code.toUpperCase();

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

  const handleSelect = (code: SupportedLanguageCode) => {
    changeLanguage(code);
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
    <div className={`hsw-lang-switcher ${className}`} ref={containerRef}>
      <button
        type="button"
        className="hsw-lang-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select Language"
        style={triggerColorStyle}
      >
        <Globe size={14} style={{ flexShrink: 0 }} />
        <span className="hsw-lang-label-full">{currentLang.label}</span>
        <span className="hsw-lang-label-short">{shortCode}</span>
        <ChevronDown size={12} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      {isOpen && (
        <div className="hsw-lang-dropdown" role="listbox" aria-label="Available languages">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === currentLang.code;
            return (
              <button
                key={lang.code}
                type="button"
                className={`hsw-lang-item ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelect(lang.code)}
                role="option"
                aria-selected={isSelected}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </span>
                {isSelected && <span style={{ fontSize: '10px' }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
