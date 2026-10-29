import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export interface ImageRevealProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  style?: React.CSSProperties;
  aspectRatio?: string;
  delayMs?: number;
  dataCursor?: string;
}

export const ImageReveal: React.FC<ImageRevealProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  style,
  aspectRatio,
  delayMs = 0,
  dataCursor,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && !finePointer) {
      gsap.set(container, { clipPath: 'none', opacity: 1 });
      gsap.set(img, { scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top 85%',
          toggleActions: 'play none none none',
          once: true,
        },
      });

      tl.fromTo(
        container,
        {
          clipPath: 'inset(12% 0% 12% 0%)',
          opacity: 0.2,
        },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          opacity: 1,
          duration: 1.1,
          delay: delayMs / 1000,
          ease: 'power3.inOut',
          onComplete: () => {
            gsap.set(container, { clearProps: 'clipPath' });
          },
        }
      ).fromTo(
        img,
        {
          scale: 1.08,
        },
        {
          scale: 1.0,
          duration: 1.2,
          ease: 'power2.out',
        },
        `<+0.1`
      );
    }, container);

    return () => ctx.revert();
  }, [delayMs]);

  // Subtle pointer-follow parallax & scale on fine-pointer desktop
  useEffect(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    const finePointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
    if (!finePointer) return;

    let isHovered = false;

    const onPointerEnter = () => {
      isHovered = true;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isHovered) return;
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const relX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const relY = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

      // Subtle parallax: ±3px offset, restrained 1.022 scale (quiet luxury editorial threshold)
      gsap.to(img, {
        x: relX * 6,
        y: relY * 6,
        scale: 1.022,
        duration: 0.6,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const onPointerLeave = () => {
      isHovered = false;
      gsap.to(img, {
        x: 0,
        y: 0,
        scale: 1.0,
        duration: 0.65,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    container.addEventListener('pointerenter', onPointerEnter);
    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerleave', onPointerLeave);

    return () => {
      container.removeEventListener('pointerenter', onPointerEnter);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`hsw-image-reveal-wrap ${containerClassName}`}
      data-cursor={dataCursor}
      style={{
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        position: 'relative',
        aspectRatio,
        ...style,
      }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          willChange: 'transform',
        }}
      />
    </div>
  );
};
