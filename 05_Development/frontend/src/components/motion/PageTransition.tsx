import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';

export const PageTransition: React.FC = () => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isFirstRender = useRef(true);

  // Operational screens must NOT have cinematic transitions (Requirement 18)
  const isOperationalRoute =
    location.pathname.startsWith('/receptionist') ||
    location.pathname.startsWith('/therapist') ||
    location.pathname.startsWith('/fb') ||
    location.pathname.startsWith('/manager') ||
    location.pathname.startsWith('/admin');

  useEffect(() => {
    // Skip on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const overlay = overlayRef.current;
    if (!overlay) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || isOperationalRoute) {
      gsap.set(overlay, { display: 'none', opacity: 0 });
      return;
    }

    // Short refined quiet-luxury wipe (total ~500ms)
    gsap.killTweensOf(overlay);

    const tl = gsap.timeline();
    tl.set(overlay, { display: 'block', opacity: 0, scaleY: 1 })
      .to(overlay, {
        opacity: 0.92,
        duration: 0.22,
        ease: 'power2.inOut',
      })
      .to(overlay, {
        opacity: 0,
        duration: 0.32,
        ease: 'power2.out',
        delay: 0.05,
        onComplete: () => {
          gsap.set(overlay, { display: 'none' });
        },
      });

    return () => {
      tl.kill();
    };
  }, [location.pathname, isOperationalRoute]);

  return (
    <div
      ref={overlayRef}
      className="hsw-page-transition-curtain"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        pointerEvents: 'none',
        display: 'none',
        backgroundColor: '#1b2319', // Deep sanctuary forest
        opacity: 0,
      }}
    />
  );
};
