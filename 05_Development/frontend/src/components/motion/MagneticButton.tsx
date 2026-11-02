import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

export interface MagneticButtonProps {
  children: React.ReactNode;
  strength?: number; // small movement (e.g. 0.15 - 0.25)
  distance?: number; // alias for strength
  maxOffset?: number; // max movement clamped in px, default 6
  className?: string;
  style?: React.CSSProperties;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  strength,
  distance,
  maxOffset = 6,
  className = '',
  style,
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const effectiveStrength = distance ?? strength ?? 0.2;

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;

    const finePointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
    if (!finePointer) return;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.3, ease: 'power2.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.3, ease: 'power2.out' });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * effectiveStrength;
      const deltaY = (e.clientY - centerY) * effectiveStrength;

      // Limit movement to maxOffset px (default 6px)
      const clampedX = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
      const clampedY = Math.max(-maxOffset, Math.min(maxOffset, deltaY));

      xTo(clampedX);
      yTo(clampedY);
    };

    const handleMouseLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [effectiveStrength, maxOffset]);

  return (
    <div
      ref={buttonRef}
      className={`hsw-magnetic-wrap ${className}`}
      data-cursor="cta"
      style={{ display: 'inline-block', willChange: 'transform', ...style }}
    >
      {children}
    </div>
  );
};
