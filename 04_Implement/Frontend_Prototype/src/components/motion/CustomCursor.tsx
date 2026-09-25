import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { useCursor, type CursorState } from './CursorProvider';

export const CustomCursor: React.FC = () => {
  const { t } = useTranslation();
  const { cursorState, setCursorState, customText } = useCursor();

  const bead1Ref = useRef<HTMLDivElement>(null);
  const bead2Ref = useRef<HTMLDivElement>(null);
  const bead3Ref = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef<boolean>(false);

  // GSAP quickTo setters for 3 trailing beads (varied duration creates organic wellness flow)
  const x1To = useRef<gsap.QuickToFunc | null>(null);
  const y1To = useRef<gsap.QuickToFunc | null>(null);
  const x2To = useRef<gsap.QuickToFunc | null>(null);
  const y2To = useRef<gsap.QuickToFunc | null>(null);
  const x3To = useRef<gsap.QuickToFunc | null>(null);
  const y3To = useRef<gsap.QuickToFunc | null>(null);

  useEffect(() => {
    if (!bead1Ref.current || !bead2Ref.current || !bead3Ref.current) return;

    // Bead 1: Leading bead (fastest, duration 0.08s)
    x1To.current = gsap.quickTo(bead1Ref.current, 'x', { duration: 0.08, ease: 'power2.out' });
    y1To.current = gsap.quickTo(bead1Ref.current, 'y', { duration: 0.08, ease: 'power2.out' });

    // Bead 2: Middle bead (soft lag, duration 0.22s)
    x2To.current = gsap.quickTo(bead2Ref.current, 'x', { duration: 0.22, ease: 'power2.out' });
    y2To.current = gsap.quickTo(bead2Ref.current, 'y', { duration: 0.22, ease: 'power2.out' });

    // Bead 3: Trailing bead (gentle trail, duration 0.38s)
    x3To.current = gsap.quickTo(bead3Ref.current, 'x', { duration: 0.38, ease: 'power3.out' });
    y3To.current = gsap.quickTo(bead3Ref.current, 'y', { duration: 0.38, ease: 'power3.out' });

    const handlePointerMove = (e: PointerEvent) => {
      const { clientX, clientY } = e;

      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        gsap.to([bead1Ref.current, bead2Ref.current, bead3Ref.current], { opacity: 1, duration: 0.25 });
      }

      x1To.current?.(clientX);
      y1To.current?.(clientY);
      x2To.current?.(clientX);
      y2To.current?.(clientY);
      x3To.current?.(clientX);
      y3To.current?.(clientY);

      // Contextual detection from DOM under cursor
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Hide custom cursor over text inputs for clean native text selection / caret
      if (target.closest('input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable="true"]')) {
        setCursorState('hidden');
        return;
      }

      // Check explicit data-cursor attribute
      const cursorTarget = target.closest('[data-cursor]') as HTMLElement | null;
      if (cursorTarget) {
        const state = cursorTarget.getAttribute('data-cursor') as CursorState;
        if (state) {
          setCursorState(state);
          return;
        }
      }

      // Check clickable interactive elements
      if (target.closest('a, button, [role="button"], .hsw-clickable')) {
        setCursorState('link');
        return;
      }

      // Default state
      setCursorState('default');
    };

    const handleMouseLeave = () => {
      isVisibleRef.current = false;
      gsap.to([bead1Ref.current, bead2Ref.current, bead3Ref.current], { opacity: 0, duration: 0.25 });
    };

    const handleMouseEnter = () => {
      isVisibleRef.current = true;
      gsap.to([bead1Ref.current, bead2Ref.current, bead3Ref.current], { opacity: 1, duration: 0.25 });
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [setCursorState]);

  // Determine badge text
  let labelText: string | null = null;
  if (customText) {
    labelText = customText;
  } else if (cursorState === 'view') {
    labelText = t('motion.view');
  } else if (cursorState === 'explore') {
    labelText = t('motion.explore');
  } else if (cursorState === 'drag') {
    labelText = t('motion.drag');
  }

  const isHidden = cursorState === 'hidden';

  return (
    <div
      className={`hsw-cursor-wrap state-${cursorState} ${isHidden ? 'is-hidden' : ''}`}
      aria-hidden="true"
    >
      {/* Bead 3: Trailing bead (Soft Gold / Bronze #BFA07A) */}
      <div ref={bead3Ref} className="hsw-cursor-bead bead-3" />
      {/* Bead 2: Middle bead (Muted Sage / Forest #6F7F72) */}
      <div ref={bead2Ref} className="hsw-cursor-bead bead-2" />
      {/* Bead 1: Leading bead (Warm Sand / Champagne #E3D2B8) -> expands into badge on contextual targets */}
      <div ref={bead1Ref} className="hsw-cursor-bead bead-1">
        {labelText && <span className="hsw-cursor-label">{labelText}</span>}
      </div>
    </div>
  );
};

