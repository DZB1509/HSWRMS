import React from 'react';

export interface HeavenStayLogoProps {
  /** 'public' -> 'WELLNESS RESORT', 'customer' -> 'CỔNG KHÁCH HÀNG', 'compact' -> no subtitle */
  variant?: 'public' | 'customer' | 'compact';
  /** True when rendered over the transparent hero navbar */
  isHeroActive?: boolean;
  /** Size token: 'sm' (24px mark), 'md' (30px mark, default), 'lg' (40px mark) */
  size?: 'sm' | 'md' | 'lg';
  /** Optional custom class name */
  className?: string;
}

/**
 * HeavenStay Brand Emblem & Wordmark Component
 * Inspired by Image A: botanical leaf sprig, celestial sun rays, 4-point sparkle star, and coastal waves.
 * Web-optimized SVG emblem + luxury serif wordmark designed for quiet luxury resort identity.
 */
export const HeavenStayLogo: React.FC<HeavenStayLogoProps> = ({
  variant = 'public',
  isHeroActive = false,
  size = 'md',
  className = '',
}) => {
  const markDimensions = {
    sm: { width: 28, height: 28 },
    md: { width: 38, height: 38 },
    lg: { width: 48, height: 48 },
  }[size];

  const subtitleText = {
    public: 'WELLNESS RESORT',
    customer: 'CỔNG KHÁCH HÀNG',
    compact: '',
  }[variant];

  const ariaLabel =
    variant === 'customer'
      ? 'HeavenStay — Cổng Khách Hàng'
      : 'HeavenStay Wellness Resort';

  return (
    <div
      className={`hsw-brand-logo-root ${isHeroActive ? 'is-hero-active' : ''} ${className}`}
      aria-label={ariaLabel}
    >
      {/* Refined Vector Emblem inspired by Image A */}
      <svg
        className="hsw-brand-emblem"
        width={markDimensions.width}
        height={markDimensions.height}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        {/* Outer Circular Boundary Arcs */}
        {/* Top-Right Boundary Arc */}
        <path
          d="M 33 8.5 C 43 8.8 52 14.5 56 23.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          className="hsw-emblem-stroke-primary"
        />

        {/* Botanical Branch (Left Arc) */}
        {/* Main Stem curving upwards along the left circumference */}
        <path
          d="M 18.5 44 C 11.5 35 11 20 23.5 9.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="hsw-emblem-stroke-primary"
        />

        {/* Botanical Leaves along the stem */}
        {/* Leaf 1 - Lower Outer */}
        <path
          d="M 16 41 C 12 40 9 37 10.5 33.5 C 13.5 34 15.5 37.5 16 41 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="hsw-emblem-stroke-secondary"
        />
        {/* Leaf 2 - Mid Lower Outer */}
        <path
          d="M 13.5 33.5 C 8.5 32 6.5 28.5 8.5 25.5 C 11.5 26.5 13 29.5 13.5 33.5 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="hsw-emblem-stroke-secondary"
        />
        {/* Leaf 3 - Mid Upper Outer */}
        <path
          d="M 13 25 C 8.5 22.5 8 18.5 11 16 C 13.5 18 13.5 21.5 13 25 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="hsw-emblem-stroke-secondary"
        />
        {/* Leaf 4 - Top Outer */}
        <path
          d="M 16 17 C 13 13 14 9 17.5 7.5 C 19 11 18 14.5 16 17 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="hsw-emblem-stroke-secondary"
        />
        {/* Leaf 5 - Mid Inner */}
        <path
          d="M 17 28 C 20.5 26.5 21.5 23 20 21 C 17.5 22.5 17 25.5 17 28 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="hsw-emblem-stroke-secondary"
        />
        {/* Leaf 6 - Top Inner */}
        <path
          d="M 19.5 20 C 23 17.5 23.5 14 21.5 12.5 C 19.5 14.5 19 17 19.5 20 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="hsw-emblem-stroke-secondary"
        />

        {/* Radiant Sun (Top Right) */}
        {/* Sun Core Disc */}
        <circle
          cx="44.5"
          cy="21.5"
          r="5"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
          className="hsw-emblem-stroke-accent"
        />
        {/* Radiating Sun Rays */}
        <line x1="44.5" y1="12.5" x2="44.5" y2="9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="hsw-emblem-stroke-accent" />
        <line x1="50.8" y1="14.8" x2="53.2" y2="12.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="hsw-emblem-stroke-accent" />
        <line x1="53.5" y1="21.5" x2="56.5" y2="21.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="hsw-emblem-stroke-accent" />
        <line x1="50.8" y1="28.2" x2="53.2" y2="30.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="hsw-emblem-stroke-accent" />
        <line x1="38.2" y1="14.8" x2="35.8" y2="12.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="hsw-emblem-stroke-accent" />

        {/* Celestial 4-Pointed Sparkle Star (Center) */}
        {/* Primary 4-pointed sparkle */}
        <path
          d="M 31 21 C 31 25.5 28.5 28 24 28 C 28.5 28 31 30.5 31 35 C 31 30.5 33.5 28 38 28 C 33.5 28 31 25.5 31 21 Z"
          fill="currentColor"
          className="hsw-emblem-fill-accent"
        />
        {/* Accent Star - Small Top Right */}
        <path
          d="M 37.5 17 C 37.5 18.2 36.8 19 35.5 19 C 36.8 19 37.5 19.8 37.5 21 C 37.5 19.8 38.2 19 39.5 19 C 38.2 19 37.5 18.2 37.5 17 Z"
          fill="currentColor"
          className="hsw-emblem-fill-accent"
        />
        {/* Accent Star - Small Lower */}
        <path
          d="M 37.5 34 C 37.5 35 36.8 35.8 35.8 35.8 C 36.8 35.8 37.5 36.6 37.5 37.6 C 37.5 36.6 38.2 35.8 39.2 35.8 C 38.2 35.8 37.5 35 37.5 34 Z"
          fill="currentColor"
          className="hsw-emblem-fill-accent"
        />

        {/* Coastal Ocean Waves (Bottom Third of the Emblem) */}
        {/* Wave 1: Prominent upper crest with curl inspired by Image A */}
        <path
          d="M 22 45 C 27 42.5 32 42 36.5 44 C 40 45.5 44 45.5 47.5 42 C 49 40.5 49 38 46.5 37 C 43.5 36 41 38 40.5 40 C 40 43 43 45 46.5 46"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="hsw-emblem-stroke-primary"
        />
        {/* Wave 2: Middle rhythmic wave line */}
        <path
          d="M 18.5 49 C 23.5 46.5 28.5 46.5 33.5 48.5 C 38.5 50.5 43.5 50 49.5 46.5 C 51.5 45.5 53 45 54 45.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          fill="none"
          className="hsw-emblem-stroke-primary"
        />
        {/* Wave 3: Bottom gentle ocean current anchoring the circle */}
        <path
          d="M 21.5 54 C 26.5 51.5 31.5 51.5 36.5 53.5 C 41.5 55.5 46.5 54.5 51.5 51.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          className="hsw-emblem-stroke-secondary"
        />
      </svg>

      {/* Brand Text Block */}
      <div className="hsw-brand-text">
        <span className="hsw-brand-name">HEAVENSTAY</span>
        {subtitleText ? (
          <span className={`hsw-brand-tagline ${variant === 'customer' ? 'is-customer-portal' : ''}`}>
            {subtitleText}
          </span>
        ) : null}
      </div>
    </div>
  );
};
