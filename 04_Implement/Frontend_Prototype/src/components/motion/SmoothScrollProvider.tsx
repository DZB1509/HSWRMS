import React, { useEffect, useRef, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Register ScrollTrigger plugin once safely
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface SmoothScrollContextValue {
  lenis: Lenis | null;
}

const SmoothScrollContext = createContext<SmoothScrollContextValue>({ lenis: null });

export const useSmoothScroll = () => useContext(SmoothScrollContext);

export interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

export const SmoothScrollProvider: React.FC<SmoothScrollProviderProps> = ({ children }) => {
  const lenisRef = useRef<Lenis | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Operational routes get crisp, fast responsive physics (duration 0.8s); Public gets gentle 1.1s
    const isOperational =
      window.location.pathname.startsWith('/receptionist') ||
      window.location.pathname.startsWith('/therapist') ||
      window.location.pathname.startsWith('/fb') ||
      window.location.pathname.startsWith('/manager') ||
      window.location.pathname.startsWith('/admin');

    const lenis = new Lenis({
      duration: isOperational ? 0.8 : 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth exponential curve
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: isOperational ? 1.0 : 0.9,
      // Do not intercept or apply Lenis to inner scroll containers, sidebars, modals, textareas, selects
      prevent: (node) => {
        if (!node || typeof (node as HTMLElement).closest !== 'function') return false;
        const el = node as HTMLElement;
        return Boolean(
          el.hasAttribute('data-lenis-prevent') ||
          el.classList.contains('lenis-prevent') ||
          el.closest(
            '.hsw-sidebar, .ops-table-container, .hsw-modal-content, .hsw-modal-overlay, .hsw-sidebar-drawer, textarea, select, [data-lenis-prevent]'
          )
        );
      },
    });

    lenisRef.current = lenis;

    // Connect Lenis to ScrollTrigger so trigger positions stay accurate
    lenis.on('scroll', ScrollTrigger.update);

    // Single coordinated animation loop: drive Lenis via GSAP ticker
    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // On route change, reset scroll position and recalculate ScrollTrigger positions
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 120);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <SmoothScrollContext.Provider value={{ lenis: lenisRef.current }}>
      {children}
    </SmoothScrollContext.Provider>
  );
};

