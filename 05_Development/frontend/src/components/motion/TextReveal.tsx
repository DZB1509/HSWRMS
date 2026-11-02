import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export interface TextRevealProps {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  delayMs?: number;
  delay?: number;
  direction?: 'up' | 'down';
  stagger?: number;
}

export const TextReveal: React.FC<TextRevealProps> = ({
  children,
  as: Component = 'div',
  className = '',
  style,
  delayMs,
  delay,
  direction = 'up',
  stagger = 0.08,
}) => {
  const containerRef = useRef<HTMLElement | null>(null);

  const effectiveDelay = delayMs !== undefined ? delayMs / 1000 : (delay ?? 0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const targets = el.children.length > 0 ? Array.from(el.children) : el;
      gsap.set(targets, { opacity: 1, y: 0 });
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }

    const yOffset = direction === 'up' ? 24 : -24;

    const ctx = gsap.context(() => {
      // If there are direct child nodes, animate them sequentially; else animate container
      const targets = el.children.length > 0 ? el.children : el;

      gsap.fromTo(
        targets,
        {
          opacity: 0,
          y: yOffset,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          delay: effectiveDelay,
          stagger: el.children.length > 0 ? stagger : 0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
            once: true,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [effectiveDelay, direction, stagger]);

  return React.createElement(
    Component,
    {
      ref: containerRef,
      className: `hsw-text-reveal ${className}`,
      style: { ...style },
    },
    children
  );
};

