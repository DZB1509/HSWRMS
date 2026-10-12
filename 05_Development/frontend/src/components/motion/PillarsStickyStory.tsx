import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Sun, Feather } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const PILLAR_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80',
    alt: 'HeavenStay Restore — Botanical hydrotherapy and herbal steam',
  },
  {
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    alt: 'HeavenStay Reconnect — Dawn mindfulness on coastal cliffs',
  },
  {
    url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
    alt: 'HeavenStay Nourish — Organic farm-to-table cuisine',
  },
];

export const PillarsStickyStory: React.FC = () => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkIsDesktop = () => {
      const finePointer = window.matchMedia('(pointer: fine)').matches;
      const wide = window.innerWidth >= 1024;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setIsDesktop(wide && finePointer && !reducedMotion);
    };

    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  useEffect(() => {
    if (!isDesktop || !containerRef.current) return;

    const el = containerRef.current;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88px',
        end: '+=100%',
        pin: true,
        pinSpacing: true,
        scrub: 0.5,
        onUpdate: (self) => {
          const p = self.progress;
          if (p < 0.35) {
            setActiveIndex(0);
          } else if (p < 0.7) {
            setActiveIndex(1);
          } else {
            setActiveIndex(2);
          }
        },
      });
    }, el);

    return () => ctx.revert();
  }, [isDesktop]);

  const pillars = [
    {
      num: '01',
      icon: <Compass size={22} />,
      title: t('landing.pillars.restore.title'),
      desc: t('landing.pillars.restore.desc'),
    },
    {
      num: '02',
      icon: <Sun size={22} />,
      title: t('landing.pillars.reconnect.title'),
      desc: t('landing.pillars.reconnect.desc'),
    },
    {
      num: '03',
      icon: <Feather size={22} />,
      title: t('landing.pillars.nourish.title'),
      desc: t('landing.pillars.nourish.desc'),
    },
  ];

  // Mobile & Tablet fallback (Stacked clean editorial layout, no pinning)
  if (!isDesktop) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-8)',
          maxWidth: '1080px',
          margin: '0 auto',
        }}
      >
        {pillars.map((item, idx) => (
          <div
            key={item.num}
            style={{
              textAlign: 'center',
              padding: 'var(--space-6) var(--space-8)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-4)',
              borderLeft: idx === 1 ? '1px solid var(--border-subtle)' : undefined,
              borderRight: idx === 1 ? '1px solid var(--border-subtle)' : undefined,
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-sand-soft), var(--bg-canvas))',
                color: 'var(--accent-forest)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 12px rgba(79, 90, 80, 0.08)',
              }}
            >
              {item.icon}
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-2xl)',
                fontWeight: 400,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {item.title}
            </h3>
            <div aria-hidden="true" style={{ width: '40px', height: '1px', backgroundColor: 'var(--accent-sand)' }} />
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                lineHeight: 1.75,
                margin: 0,
                maxWidth: '320px',
              }}
            >
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    );
  }

  // Desktop ClearPath-inspired Sticky Storytelling layout
  return (
    <div
      ref={containerRef}
      className="hsw-pillars-sticky-story"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-12)',
        alignItems: 'center',
        maxWidth: '1120px',
        margin: '0 auto',
        minHeight: '520px',
        position: 'relative',
      }}
    >
      {/* Left: Interactive Navigation & Story steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', position: 'relative' }}>
        {/* Refined Continuous Gradient Vertical Timeline Guide */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '26px',
            top: '32px',
            bottom: '32px',
            width: '1px',
            background: 'linear-gradient(to bottom, transparent, rgba(216, 199, 174, 0.6) 12%, rgba(79, 90, 80, 0.3) 50%, rgba(216, 199, 174, 0.6) 88%, transparent)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {/* Active progress segment connecting stages */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '2px',
              marginLeft: '-0.5px',
              height: `${(activeIndex / 2) * 100}%`,
              background: 'linear-gradient(to bottom, var(--accent-sand), var(--accent-forest))',
              transition: 'height 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
              borderRadius: '2px',
            }}
          />
        </div>

        {pillars.map((item, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={item.num}
              onClick={() => setActiveIndex(idx)}
              data-cursor="explore"
              className={`hsw-story-nav-item ${isActive ? 'is-active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-4)',
                padding: 'var(--space-4) var(--space-5)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--surface-elevated, var(--surface))' : 'transparent',
                border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                boxShadow: isActive ? 'var(--shadow-story-active, var(--shadow-card))' : 'none',
                opacity: isActive ? 1 : 0.72,
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* Decorative Moving Luminous Rim for Active Item */}
              <span className="hsw-story-rim" aria-hidden="true" />

              {/* Refined Timeline Node Indicator */}
              <div
                aria-hidden="true"
                style={{
                  width: '12px',
                  height: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '8px',
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    width: isActive ? '8px' : '5px',
                    height: isActive ? '8px' : '5px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? 'var(--accent-forest)' : 'var(--border-strong)',
                    boxShadow: isActive ? '0 0 0 2px var(--accent-sand), 0 2px 5px rgba(43, 68, 48, 0.25)' : 'none',
                    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </div>

              {/* Editorial Number */}
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-2xl)',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--accent-forest)' : 'var(--text-secondary)',
                  opacity: isActive ? 1 : 0.55,
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  textShadow: isActive ? 'var(--shadow-story-text-number, var(--shadow-text-rest))' : 'none',
                  width: '32px',
                  flexShrink: 0,
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {item.num}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ color: isActive ? 'var(--accent-forest)' : 'var(--text-secondary)' }}>
                    {item.icon}
                  </span>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--text-xl)',
                      fontWeight: 500,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      textShadow: isActive ? 'var(--shadow-story-text-title, var(--shadow-text-rest))' : 'none',
                      margin: 0,
                      transition: 'color 0.3s, text-shadow 0.3s',
                    }}
                  >
                    {item.title}
                  </h3>
                </div>

                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    textShadow: isActive ? 'var(--shadow-story-text-desc, var(--shadow-text-desc-rest))' : 'none',
                    lineHeight: 1.7,
                    margin: 0,
                    maxWidth: '420px',
                    transition: 'color 0.3s, text-shadow 0.3s',
                  }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right: Sticky Image Crossfade Panel (Editorial Media) */}
      <div
        className="hsw-editorial-media"
        style={{
          position: 'relative',
          aspectRatio: '4 / 3',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-modal)',
          backgroundColor: '#1b2319',
        }}
      >
        {PILLAR_IMAGES.map((img, idx) => (
          <img
            key={img.url}
            src={img.url}
            alt={img.alt}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: idx === activeIndex ? 1 : 0,
              transform: idx === activeIndex ? 'scale(1)' : 'scale(1.05)',
              transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        ))}

        {/* Ambient overlay vignette */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(23, 29, 21, 0.45) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        {/* Pillar Stage Tag */}
        <div
          style={{
            position: 'absolute',
            bottom: 'var(--space-4)',
            left: 'var(--space-5)',
            zIndex: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            backgroundColor: 'rgba(23, 29, 21, 0.75)',
            backdropFilter: 'blur(8px)',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--accent-sand)',
            fontWeight: 600,
          }}
        >
          <span>STAGE {pillars[activeIndex].num}</span>
          <span>•</span>
          <span>{pillars[activeIndex].title}</span>
        </div>
      </div>
    </div>
  );
};
