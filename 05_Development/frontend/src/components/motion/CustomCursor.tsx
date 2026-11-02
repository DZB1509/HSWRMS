import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCursor, type CursorState } from './CursorProvider';

export const CustomCursor: React.FC = () => {
  const { t } = useTranslation();
  const { customText, cursorMode } = useCursor();

  const containerRef = useRef<HTMLDivElement>(null);
  const bead1Ref = useRef<HTMLDivElement>(null);
  const bead2Ref = useRef<HTMLDivElement>(null);
  const bead3Ref = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  const isVisibleRef = useRef<boolean>(false);
  const isTouchingRef = useRef<boolean>(false);
  const currentStateRef = useRef<CursorState>('default');

  const target = useRef({ x: -100, y: -100 });
  const pos1 = useRef({ x: -100, y: -100 });
  const pos2 = useRef({ x: -100, y: -100 });
  const pos3 = useRef({ x: -100, y: -100 });

  const isOperational = cursorMode === 'operational';

  // Helper to sync container className directly without React rerenders
  const updateContainerClass = (state: CursorState, visible: boolean) => {
    if (!containerRef.current) return;
    containerRef.current.className = `hsw-cursor-wrap state-${state} ${
      isOperational ? 'is-operational' : ''
    } ${state === 'hidden' ? 'is-hidden' : ''} ${visible ? 'is-visible' : ''}`;
  };

  const setVisible = (visible: boolean) => {
    isVisibleRef.current = visible;
    updateContainerClass(currentStateRef.current, visible);
  };

  const updateState = (state: CursorState) => {
    if (currentStateRef.current === state) return;
    currentStateRef.current = state;
    updateContainerClass(state, isVisibleRef.current);

    if (labelRef.current) {
      let text = '';
      if (!isOperational) {
        if (customText) {
          text = customText;
        } else if (state === 'view') {
          text = t('motion.view', 'View');
        } else if (state === 'explore') {
          text = t('motion.explore', 'Explore');
        } else if (state === 'drag') {
          text = t('motion.drag', 'Drag');
        }
      }
      labelRef.current.textContent = text;
    }
  };

  useEffect(() => {
    let rafId: number;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const animate = () => {
      const finePointer = window.matchMedia('(pointer: fine)').matches;
      const reducedMotion = motionQuery.matches;

      // Physics factors:
      // Desktop fine pointer: full organic 3-bead trailing wellness flow
      // Reduced motion on non-desktop / coarse pointer: instantaneous snapping
      const f1 = (reducedMotion && !finePointer) ? 1.0 : isOperational ? 0.48 : 0.35;
      const f2 = (reducedMotion && !finePointer) ? 1.0 : isOperational ? 0.26 : 0.18;
      const f3 = (reducedMotion && !finePointer) ? 1.0 : isOperational ? 0.16 : 0.10;

      pos1.current.x += (target.current.x - pos1.current.x) * f1;
      pos1.current.y += (target.current.y - pos1.current.y) * f1;

      pos2.current.x += (target.current.x - pos2.current.x) * f2;
      pos2.current.y += (target.current.y - pos2.current.y) * f2;

      pos3.current.x += (target.current.x - pos3.current.x) * f3;
      pos3.current.y += (target.current.y - pos3.current.y) * f3;

      if (bead1Ref.current) {
        bead1Ref.current.style.translate = `${pos1.current.x}px ${pos1.current.y}px`;
      }
      if (bead2Ref.current) {
        bead2Ref.current.style.translate = `${pos2.current.x}px ${pos2.current.y}px`;
      }
      if (bead3Ref.current) {
        bead3Ref.current.style.translate = `${pos3.current.x}px ${pos3.current.y}px`;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        isTouchingRef.current = true;
        target.current = { x: e.clientX, y: e.clientY };
        pos1.current = { x: e.clientX, y: e.clientY };
        pos2.current = { x: e.clientX, y: e.clientY };
        pos3.current = { x: e.clientX, y: e.clientY };
        setVisible(true);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      target.current = { x: e.clientX, y: e.clientY };

      if (e.pointerType !== 'touch') {
        if (!isVisibleRef.current || (pos1.current.x < 0 && pos1.current.y < 0)) {
          pos1.current = { x: e.clientX, y: e.clientY };
          pos2.current = { x: e.clientX, y: e.clientY };
          pos3.current = { x: e.clientX, y: e.clientY };
          setVisible(true);
        }
      }

      const targetEl = e.target as HTMLElement | null;
      if (!targetEl || typeof targetEl.closest !== 'function') return;

      // Preserve native text cursor/caret over editable fields
      if (
        targetEl.closest(
          'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable="true"]'
        )
      ) {
        updateState('hidden');
        return;
      }

      // Check contextual data-cursor
      if (!isOperational) {
        const cursorTarget = targetEl.closest('[data-cursor]') as HTMLElement | null;
        if (cursorTarget) {
          const state = cursorTarget.getAttribute('data-cursor') as CursorState;
          if (state) {
            updateState(state);
            return;
          }
        }
      }

      // Check clickable interactive targets
      if (
        targetEl.closest(
          'a, button, [role="button"], .hsw-clickable, .ops-interactive-card, .ops-card, .ops-table tr, .ops-clickable, .ops-table-tr, .ops-pagination-btn, .ops-filter-pill, .ops-tab-btn, [data-cursor]'
        )
      ) {
        updateState('link');
        return;
      }

      updateState('default');
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        isTouchingRef.current = false;
        setVisible(false);
      }
    };

    const handlePointerCancel = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        isTouchingRef.current = false;
        setVisible(false);
      }
    };

    const handleMouseLeave = () => {
      if (!isTouchingRef.current) {
        setVisible(false);
      }
    };

    const handleMouseEnter = () => {
      if (!isTouchingRef.current && pos1.current.x >= 0 && pos1.current.y >= 0) {
        setVisible(true);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerCancel, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isOperational, t, customText]);

  return (
    <div
      ref={containerRef}
      className={`hsw-cursor-wrap state-default ${isOperational ? 'is-operational' : ''}`}
      aria-hidden="true"
    >
      {/* Bead 3: Trailing bead */}
      <div ref={bead3Ref} className="hsw-cursor-bead bead-3" />
      {/* Bead 2: Middle bead */}
      <div ref={bead2Ref} className="hsw-cursor-bead bead-2" />
      {/* Bead 1: Leading bead -> expands into badge on contextual targets */}
      <div ref={bead1Ref} className="hsw-cursor-bead bead-1">
        <span ref={labelRef} className="hsw-cursor-label" />
      </div>
    </div>
  );
};
