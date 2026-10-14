import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Sun, Utensils } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSmoothScroll } from './SmoothScrollProvider';

const EXPERIENCE_MEDIA = [
  {
    url: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1200&q=80',
    alt: 'HeavenStay Hydrotherapy & Herbal Spa Rituals',
  },
  {
    url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80',
    alt: 'HeavenStay Dawn Oceanfront Yoga & Meditation',
  },
  {
    url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    alt: 'HeavenStay Nourishing Organic Culinary Experiences',
  },
];

export const EXP_SEGMENTS = [
  { min: 0.0, max: 0.35, target: 0.05 }, // 01 - Hydrotherapy & Spa Rituals
  { min: 0.35, max: 0.7, target: 0.52 }, // 02 - Dawn Yoga & Meditation
  { min: 0.7, max: 1.0, target: 0.86 }, // 03 - Nourishing Culinary Experiences
];

const getInitialIsDesktop = () => {
  if (typeof window === 'undefined') return false;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const wide = window.innerWidth >= 1024;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return wide && finePointer && !reducedMotion;
};

const getTargetIntent = (locState: any): number | null => {
  if (locState && typeof locState.landingExperienceTarget === 'number') {
    return locState.landingExperienceTarget;
  }
  if (typeof window !== 'undefined') {
    const hash = window.location.hash;
    if (hash === '#spa') return 0;
    if (hash === '#dining') return 2;
  }
  return null;
};

export const ExperiencesStickyStory: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { lenis } = useSmoothScroll();

  const initialTarget = getTargetIntent(location.state);
  const [activeExp, setActiveExp] = useState<number>(() => (initialTarget !== null ? initialTarget : 0));
  const [isDesktop, setIsDesktop] = useState(getInitialIsDesktop);
  const containerRef = useRef<HTMLDivElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const refreshHandlerRef = useRef<(() => void) | null>(null);
  const sortHandlerRef = useRef<(() => void) | null>(null);
  const pendingTargetRef = useRef<{ index: number; smooth: boolean } | null>(
    initialTarget !== null ? { index: initialTarget, smooth: false } : null
  );
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    const checkIsDesktop = () => {
      const finePointer = window.matchMedia('(pointer: fine)').matches;
      const wide = window.innerWidth >= 1024;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setIsDesktop(wide && finePointer && !reducedMotion);
    };

    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  const scrollToExperience = (targetIndex: number, smooth = true) => {
    if (targetIndex < 0 || targetIndex >= 3) return;

    if (!isDesktop) {
      const targetEl = document.getElementById(targetIndex === 2 ? 'dining' : `exp-${targetIndex}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
      }
      setActiveExp(targetIndex);
      const targetHash = targetIndex === 0 ? 'spa' : targetIndex === 2 ? 'dining' : `exp-${targetIndex}`;
      window.history.replaceState(null, '', `/#${targetHash}`);
      return;
    }

    const st = stRef.current || ScrollTrigger.getById('experiences-story');
    if (!st || typeof st.start !== 'number' || typeof st.end !== 'number' || st.end <= st.start) {
      pendingTargetRef.current = { index: targetIndex, smooth };
      return;
    }

    const segment = EXP_SEGMENTS[targetIndex] || EXP_SEGMENTS[0];
    const targetScroll = st.start + (st.end - st.start) * segment.target;

    isNavigatingRef.current = true;
    setActiveExp(targetIndex);

    if (lenis) {
      lenis.scrollTo(targetScroll, {
        immediate: !smooth,
        onComplete: () => {
          isNavigatingRef.current = false;
        },
      });
    } else {
      window.scrollTo({
        top: targetScroll,
        behavior: smooth ? 'smooth' : 'auto',
      });
      requestAnimationFrame(() => {
        isNavigatingRef.current = false;
      });
    }

    const targetHash = targetIndex === 0 ? 'spa' : targetIndex === 2 ? 'dining' : `exp-${targetIndex}`;
    window.history.replaceState(null, '', `/#${targetHash}`);
  };

  useEffect(() => {
    if (!isDesktop || !containerRef.current) return;

    const el = containerRef.current;
    let hasConsumedPending = false;

    // Remove any previous instance and revert its pin spacer to prevent duplicate/orphan spacers
    ScrollTrigger.getById('experiences-story')?.kill(true);

    const sortOnRefreshInit = () => {
      ScrollTrigger.sort();
    };
    sortHandlerRef.current = sortOnRefreshInit;
    ScrollTrigger.addEventListener('refreshInit', sortOnRefreshInit);

    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        id: 'experiences-story',
        trigger: el,
        start: 'top 88px',
        end: '+=100%',
        pin: true,
        pinSpacing: true,
        scrub: 0.5,
        refreshPriority: -1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (isNavigatingRef.current) return;
          const p = self.progress;
          if (p < EXP_SEGMENTS[0].max) {
            setActiveExp(0);
          } else if (p < EXP_SEGMENTS[1].max) {
            setActiveExp(1);
          } else {
            setActiveExp(2);
          }
        },
      });
      stRef.current = st;

      const handleRefresh = () => {
        if (hasConsumedPending) return;
        if (pendingTargetRef.current !== null) {
          const pending = pendingTargetRef.current;
          const curSt = stRef.current || st;
          if (curSt && typeof curSt.start === 'number' && typeof curSt.end === 'number' && curSt.end > curSt.start) {
            hasConsumedPending = true;
            pendingTargetRef.current = null;
            if (refreshHandlerRef.current) {
              ScrollTrigger.removeEventListener('refresh', refreshHandlerRef.current);
              refreshHandlerRef.current = null;
            }

            if (location.state && (location.state as any).landingExperienceTarget !== undefined) {
              try {
                const newState = { ...(location.state as any) };
                delete newState.landingExperienceTarget;
                window.history.replaceState(newState, '', window.location.pathname + window.location.hash);
              } catch (_) {}
            }

            scrollToExperience(pending.index, pending.smooth);
          }
        }
      };

      refreshHandlerRef.current = handleRefresh;
      if (pendingTargetRef.current !== null) {
        ScrollTrigger.addEventListener('refresh', handleRefresh);
      }

      ScrollTrigger.sort();
      ScrollTrigger.refresh();

      requestAnimationFrame(() => {
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
        if (!hasConsumedPending && pendingTargetRef.current !== null) {
          handleRefresh();
        }
      });
    }, el);

    return () => {
      if (sortHandlerRef.current) {
        ScrollTrigger.removeEventListener('refreshInit', sortHandlerRef.current);
        sortHandlerRef.current = null;
      }
      if (refreshHandlerRef.current) {
        ScrollTrigger.removeEventListener('refresh', refreshHandlerRef.current);
        refreshHandlerRef.current = null;
      }
      stRef.current = null;
      ScrollTrigger.getById('experiences-story')?.kill(true);
      ctx.revert();
    };
  }, [isDesktop]);

  useEffect(() => {
    (window as any).__hswScrollToExperience = (index: number, smooth = true) => {
      scrollToExperience(index, smooth);
    };

    const handleCustomNav = (e: Event) => {
      const customEvent = e as CustomEvent<{ index: number; smooth?: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.index === 'number') {
        scrollToExperience(customEvent.detail.index, customEvent.detail.smooth ?? true);
      }
    };

    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#dining') {
        scrollToExperience(2, true);
      } else if (hash === '#spa') {
        scrollToExperience(0, true);
      }
    };

    window.addEventListener('hsw:scroll-experience', handleCustomNav);
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);

    return () => {
      delete (window as any).__hswScrollToExperience;
      window.removeEventListener('hsw:scroll-experience', handleCustomNav);
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
    };
  }, [isDesktop, lenis]);

  useEffect(() => {
    if (location.state && typeof (location.state as any).landingExperienceTarget === 'number') {
      const target = (location.state as any).landingExperienceTarget;
      if (stRef.current) {
        scrollToExperience(target, false);
        try {
          const newState = { ...(location.state as any) };
          delete newState.landingExperienceTarget;
          window.history.replaceState(newState, '', window.location.pathname + window.location.hash);
        } catch (_) {}
      }
    }
  }, [location.state]);

  const experiences = [
    {
      index: '01',
      icon: <Sparkles size={20} />,
      title: t('landing.experiences.spa.title'),
      desc: t('landing.experiences.spa.desc'),
      img: EXPERIENCE_MEDIA[0],
    },
    {
      index: '02',
      icon: <Sun size={20} />,
      title: t('landing.experiences.yoga.title'),
      desc: t('landing.experiences.yoga.desc'),
      img: EXPERIENCE_MEDIA[1],
    },
    {
      index: '03',
      icon: <Utensils size={20} />,
      title: t('landing.experiences.dining.title'),
      desc: t('landing.experiences.dining.desc'),
      img: EXPERIENCE_MEDIA[2],
    },
  ];

  // Mobile / Tablet Fallback: 3 stacked editorial cards with hover zoom
  if (!isDesktop) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: 'var(--space-8)',
        }}
      >
        {experiences.map((exp, idx) => (
          <div
            key={exp.index}
            id={idx === 2 ? 'dining' : undefined}
            className="hsw-experience-card"
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-card)',
              scrollMarginTop: '80px',
            }}
          >
            <div style={{ aspectRatio: '16/10', overflow: 'hidden', position: 'relative' }}>
              <img
                src={exp.img.url}
                alt={exp.img.alt}
                className="hsw-experience-img"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />
              <div className="hsw-experience-overlay" />
            </div>
            <div style={{ padding: 'var(--space-6)' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--accent-olive)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {exp.index} · HEAVENSTAY
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {exp.title}
              </h3>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {exp.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop Sticky Media Storytelling
  return (
    <div
      ref={containerRef}
      className="hsw-experiences-sticky-story"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.15fr',
        gap: 'var(--space-12)',
        alignItems: 'center',
        maxWidth: '1160px',
        margin: '0 auto',
        minHeight: '520px',
      }}
    >
      {/* Left: Interactive list of experiences */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {experiences.map((exp, idx) => {
          const isActive = idx === activeExp;
          return (
            <div
              key={exp.index}
              onClick={() => setActiveExp(idx)}
              data-cursor="explore"
              className={`hsw-story-nav-item ${isActive ? 'is-active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-5)',
                padding: 'var(--space-5) var(--space-6)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--surface-elevated, var(--surface))' : 'transparent',
                border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                boxShadow: isActive ? 'var(--shadow-story-active, var(--shadow-card))' : 'none',
                opacity: isActive ? 1 : 0.72,
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                scrollMarginTop: '80px',
                position: 'relative',
              }}
            >
              {/* Decorative Moving Luminous Rim for Active Item */}
              <span className="hsw-story-rim" aria-hidden="true" />

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
                {exp.index}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ color: isActive ? 'var(--accent-forest)' : 'var(--text-secondary)' }}>
                    {exp.icon}
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
                    {exp.title}
                  </h3>
                </div>

                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    textShadow: isActive ? 'var(--shadow-story-text-desc, var(--shadow-text-desc-rest))' : 'none',
                    lineHeight: 1.7,
                    margin: 0,
                    maxWidth: '440px',
                    transition: 'color 0.3s, text-shadow 0.3s',
                  }}
                >
                  {exp.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right: Sticky Image Crossfade Media Panel (Editorial Media) */}
      <div
        className="hsw-editorial-media"
        style={{
          position: 'relative',
          aspectRatio: '16 / 11',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-modal)',
          backgroundColor: '#1b2319',
        }}
      >
        {EXPERIENCE_MEDIA.map((media, idx) => (
          <img
            key={media.url}
            src={media.url}
            alt={media.alt}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: idx === activeExp ? 1 : 0,
              transform: idx === activeExp ? 'scale(1)' : 'scale(1.05)',
              transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        ))}

        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(23, 29, 21, 0.45) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

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
          <span>EXPERIENCE {experiences[activeExp].index}</span>
          <span>•</span>
          <span>{experiences[activeExp].title}</span>
        </div>
      </div>
    </div>
  );
};
