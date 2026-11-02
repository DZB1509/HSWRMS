import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Sun, Feather, ChevronLeft, ChevronRight } from 'lucide-react';
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

// Breakpoint: Viewports >= 768px (container >= 720px) maintain spacious 2-column storytelling.
// Viewports < 768px render the intentional compact mobile storytelling showcase.
const TWO_COLUMN_MIN_WIDTH = 768;

const getInitialIsDesktop = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= TWO_COLUMN_MIN_WIDTH;
};

export const PillarsStickyStory: React.FC = () => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(getInitialIsDesktop);

  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Container-aware Responsive Observer:
  // Uses ResizeObserver on rootRef to measure actual container width while avoiding layout loops.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let resizeTimer: any = null;
    const updateLayout = () => {
      const width = root.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1200);
      const wide = width >= 720 || (typeof window !== 'undefined' && window.innerWidth >= TWO_COLUMN_MIN_WIDTH);
      setIsDesktop((prev) => (prev !== wide ? wide : prev));
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.getById('pillars-story')?.refresh();
      }, 100);
    };

    updateLayout();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect.width;
          const wide = w >= 720 || (typeof window !== 'undefined' && window.innerWidth >= TWO_COLUMN_MIN_WIDTH);
          setIsDesktop((prev) => (prev !== wide ? wide : prev));
        }
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          ScrollTrigger.getById('pillars-story')?.refresh();
        }, 100);
      });
      ro.observe(root);
    }

    window.addEventListener('resize', updateLayout);
    return () => {
      clearTimeout(resizeTimer);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateLayout);
    };
  }, []);

  const scrollToPillar = (targetIndex: number, smooth = true) => {
    setActiveIndex(targetIndex);

    if (!isDesktop) {
      const targetCard = document.getElementById(`pillar-mobile-step-${targetIndex}`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'nearest' });
      }
      return;
    }

    const trigger = ScrollTrigger.getById('pillars-story');
    if (!trigger) return;

    const targetProgress = targetIndex === 0 ? 0.15 : targetIndex === 1 ? 0.5 : 0.85;
    const targetScroll = trigger.start + (trigger.end - trigger.start) * targetProgress;

    window.scrollTo({
      top: targetScroll,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  useEffect(() => {
    if (!isDesktop || !containerRef.current) return;

    const el = containerRef.current;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        id: 'pillars-story',
        trigger: el,
        start: 'top 88px',
        end: '+=100%',
        pin: true,
        pinSpacing: true,
        scrub: 0.5,
        invalidateOnRefresh: true,
        anticipatePin: 1,
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

    return () => {
      ctx.revert();
      ScrollTrigger.getById('pillars-story')?.kill(true);
    };
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

  return (
    <div ref={rootRef} className="hsw-pillars-story-root" style={{ width: '100%', position: 'relative' }}>
      {!isDesktop ? (
        /* ==========================================================================
           Intentional Compact Mobile Storytelling Layout (< 768px / container < 720px)
           1. Interactive Stepper Selector
           2. Featured Active Step Media Banner (16:10)
           3. Step Badge, Title & Complete Description
           4. Previous / Next Stepper Controls + Indicator Dots
           ========================================================================== */
        <div
          className="hsw-pillars-mobile-fallback"
          style={{ width: '100%', maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
        >
          {/* 1. Interactive Stepper Selector Pills */}
          <div
            role="tablist"
            aria-label="Pillars stage switcher"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '4px',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            {pillars.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.num}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => scrollToPillar(idx, true)}
                  style={{
                    flex: '1 1 0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-pill)',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--accent-forest)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>{item.num}</span>
                  <span>•</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* 2. Featured Active Step Showcase Card with Moving Luminous Rim */}
          <div
            id={`pillar-mobile-step-${activeIndex}`}
            className="hsw-story-nav-item is-active"
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--accent-sand)',
              boxShadow: 'var(--shadow-modal)',
              overflow: 'hidden',
              position: 'relative',
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Moving Luminous Rim */}
            <span className="hsw-story-rim" aria-hidden="true" />

            {/* Paired Media Banner with Vignette & Floating Stage Pill */}
            <div style={{ position: 'relative', aspectRatio: '16 / 10', overflow: 'hidden', width: '100%' }}>
              <img
                src={PILLAR_IMAGES[activeIndex].url}
                alt={PILLAR_IMAGES[activeIndex].alt}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scale(1.02)',
                  transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(23, 29, 21, 0.65) 0%, rgba(23, 29, 21, 0.15) 50%, transparent 80%)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'rgba(23, 29, 21, 0.75)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <span>STAGE {pillars[activeIndex].num}</span>
                <span>•</span>
                <span>{pillars[activeIndex].title}</span>
              </div>
            </div>

            {/* Story Card Content Body */}
            <div style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-sand-soft), var(--bg-canvas))',
                    color: 'var(--accent-forest)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {pillars[activeIndex].icon}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(1.2rem, 4.5vw, 1.45rem)',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  {pillars[activeIndex].title}
                </h3>
              </div>

              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {pillars[activeIndex].desc}
              </p>

              {/* Stepper Navigation Controls (Prev / Next & Dots) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 'var(--space-5)',
                  paddingTop: 'var(--space-4)',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <button
                  type="button"
                  disabled={activeIndex === 0}
                  onClick={() => scrollToPillar(Math.max(0, activeIndex - 1))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: activeIndex === 0 ? 'transparent' : 'var(--surface)',
                    color: activeIndex === 0 ? 'var(--text-disabled)' : 'var(--text-primary)',
                    cursor: activeIndex === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ChevronLeft size={16} />
                  <span>Trước</span>
                </button>

                {/* Step indicator dots */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {pillars.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      aria-label={`Go to stage ${dotIdx + 1}`}
                      onClick={() => scrollToPillar(dotIdx)}
                      style={{
                        width: dotIdx === activeIndex ? '20px' : '8px',
                        height: '8px',
                        borderRadius: 'var(--radius-pill)',
                        border: 'none',
                        backgroundColor: dotIdx === activeIndex ? 'var(--accent-forest)' : 'var(--border-strong)',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  disabled={activeIndex === pillars.length - 1}
                  onClick={() => scrollToPillar(Math.min(pillars.length - 1, activeIndex + 1))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: activeIndex === pillars.length - 1 ? 'transparent' : 'var(--surface)',
                    color: activeIndex === pillars.length - 1 ? 'var(--text-disabled)' : 'var(--text-primary)',
                    cursor: activeIndex === pillars.length - 1 ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>Tiếp theo</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==========================================================================
           Spacious 2-Column Desktop Storytelling (>= 768px / container >= 720px)
           ========================================================================== */
        <div
          ref={containerRef}
          className="hsw-pillars-sticky-story hsw-pillars-story-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 'clamp(16px, 2.5vw, var(--space-12))',
            alignItems: 'center',
            maxWidth: '1120px',
            margin: '0 auto',
            minHeight: '460px',
            position: 'relative',
            width: '100%',
          }}
        >
          {/* Left: Interactive Navigation & Story steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', position: 'relative' }}>
            {/* Continuous Gradient Vertical Timeline Guide */}
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
                }}
              />
            </div>

            {pillars.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={item.num}
                  id={`pillar-step-${idx}`}
                  onClick={() => scrollToPillar(idx, true)}
                  className={`hsw-story-nav-item ${isActive ? 'is-active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-4) var(--space-5)',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                    backgroundColor: isActive ? 'var(--surface)' : 'transparent',
                    border: isActive ? '1px solid var(--accent-sand)' : '1px solid transparent',
                    boxShadow: isActive ? 'var(--shadow-card)' : 'none',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {/* Decorative Moving Luminous Rim for Active Item */}
                  <span className="hsw-story-rim" aria-hidden="true" />

                  {/* Icon Indicator Badge with Pulse Ring */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isActive ? 'var(--accent-forest)' : 'var(--surface)',
                        color: isActive ? '#ffffff' : 'var(--text-secondary)',
                        border: '1px solid',
                        borderColor: isActive ? 'var(--accent-forest)' : 'var(--border-subtle)',
                        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: isActive ? '0 0 16px rgba(79, 90, 80, 0.35)' : 'none',
                      }}
                    >
                      {item.icon}
                    </div>
                  </div>

                  {/* Content details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: '11px',
                          fontWeight: 600,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: isActive ? 'var(--accent-sand-dark)' : 'var(--text-muted)',
                        }}
                      >
                        STAGE {item.num}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(1.15rem, 1.35vw, 1.45rem)',
                        fontWeight: 500,
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        marginBottom: 'var(--space-1)',
                        transition: 'color 0.25s ease',
                      }}
                    >
                      {item.title}
                    </h3>

                    <p
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: isActive ? 'var(--text-secondary)' : 'var(--text-muted)',
                        lineHeight: 1.6,
                        margin: 0,
                        transition: 'color 0.25s ease',
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Pinned Media Gallery showcase */}
          <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '440px' }}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '440px',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-modal)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--surface)',
              }}
            >
              {PILLAR_IMAGES.map((img, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: idx === activeIndex ? 1 : 0,
                    transform: idx === activeIndex ? 'scale(1)' : 'scale(1.05)',
                    transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
                    pointerEvents: idx === activeIndex ? 'auto' : 'none',
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.alt}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  {/* Subtle luxury ambient vignette */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'radial-gradient(circle at center, transparent 40%, rgba(23, 29, 21, 0.4) 100%)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              ))}

              {/* Floating Stage Identifier Badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 'var(--space-6)',
                  left: 'var(--space-6)',
                  zIndex: 2,
                  backgroundColor: 'rgba(23, 29, 21, 0.75)',
                  backdropFilter: 'blur(12px)',
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid rgba(216, 199, 174, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  color: '#ffffff',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {pillars[activeIndex].num}
                </span>
                <span style={{ color: 'var(--accent-sand)' }}>•</span>
                <span style={{ fontSize: '13px', fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>
                  {pillars[activeIndex].title}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
