import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export interface ParallaxMediaProps {
  children: React.ReactNode;
  speed?: number; // 0.05 to 0.15 (gentle 3-8% displacement)
  className?: string;
  style?: React.CSSProperties;
}

export const ParallaxMedia: React.FC<ParallaxMediaProps> = ({
  children,
  speed = 0.08,
  className = '',
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const target = targetRef.current;
    if (!container || !target) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const isMobile = window.innerWidth <= 768;

    if (prefersReducedMotion || isCoarsePointer || isMobile) {
      gsap.set(target, { y: 0 });
      return;
    }

    const yMovement = speed * 120; // 5-15px smooth displacement

    const ctx = gsap.context(() => {
      gsap.fromTo(
        target,
        {
          y: -yMovement,
        },
        {
          y: yMovement,
          ease: 'none',
          scrollTrigger: {
            trigger: container,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    }, container);

    return () => ctx.revert();
  }, [speed]);

  return (
    <div
      ref={containerRef}
      className={`hsw-parallax-container ${className}`}
      style={{ overflow: 'hidden', position: 'relative', ...style }}
    >
      <div
        ref={targetRef}
        className="hsw-parallax-inner"
        style={{
          width: '100%',
          height: '100%',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
};
