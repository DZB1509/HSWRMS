import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  confirmText?: string;
  onConfirm?: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  confirmText,
  onConfirm
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="hsw-modal-backdrop" onClick={onClose}>
      <div className="hsw-modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="hsw-modal-header">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-secondary)', padding: '4px' }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="hsw-modal-body">{children}</div>
        <div className="hsw-modal-footer">
          {footer ? (
            footer
          ) : (
            <>
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              {confirmText && (
                <Button variant="primary" onClick={onConfirm || onClose}>{confirmText}</Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
