import React, { useState } from 'react';
import { Utensils } from 'lucide-react';

interface FoodImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  aspectRatio?: string;
  onErrorFallbackIcon?: React.ReactNode;
}

export const FoodImage: React.FC<FoodImageProps> = ({
  src,
  alt,
  className = '',
  style = {},
  aspectRatio = '16 / 10',
  onErrorFallbackIcon,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className={`hsw-food-image-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio,
        backgroundColor: 'var(--bg-soft)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {!hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease, transform var(--transition-normal)',
          }}
          className="hsw-culinary-img"
          loading="lazy"
        />
      )}

      {/* Graceful quiet-luxury fallback placeholder */}
      {hasError && (
        <div
          className="hsw-food-image-fallback"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f2eb',
            color: 'var(--accent-olive)',
            padding: 'var(--space-3)',
            textAlign: 'center',
          }}
          role="img"
          aria-label={alt}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(79, 90, 80, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '6px',
              color: 'var(--accent-forest)',
            }}
          >
            {onErrorFallbackIcon || <Utensils size={20} />}
          </div>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: 'var(--accent-forest)',
              maxWidth: '90%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {alt}
          </span>
          <span
            style={{
              fontSize: '9px',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginTop: '2px',
            }}
          >
            HeavenStay Culinary
          </span>
        </div>
      )}
    </div>
  );
};
