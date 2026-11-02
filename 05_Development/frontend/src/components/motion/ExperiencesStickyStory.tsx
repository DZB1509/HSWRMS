import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Sun, Utensils, ChevronLeft, ChevronRight } from 'lucide-react';
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

// Breakpoint: Viewports >= 768px (container >= 720px) maintain 2-column storytelling.
// Viewports < 768px render the intentional compact mobile storytelling showcase.
const TWO_COLUMN_MIN_WIDTH = 768;

const getInitialIsDesktop = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= TWO_COLUMN_MIN_WIDTH;
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

  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const refreshHandlerRef = useRef<(() => void) | null>(null);
  const sortHandlerRef = useRef<(() => void) | null>(null);
  const pendingTargetRef = useRef<{ index: number; smooth: boolean } | null>(
    initialTarget !== null ? { index: initialTarget, smooth: false } : null
  );
  const isNavigatingRef = useRef(false);

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
        ScrollTrigger.getById('experiences-story')?.refresh();
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
          ScrollTrigger.getById('experiences-story')?.refresh();
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

  const scrollToExperience = (targetIndex: number, smooth = true) => {
    if (targetIndex < 0 || targetIndex >= 3) return;

    if (!isDesktop) {
      setActiveExp(targetIndex);
      const targetHash = targetIndex === 0 ? 'spa' : targetIndex === 2 ? 'dining' : 'yoga';
      window.history.replaceState(null, '', `/#${targetHash}`);
      const targetEl = document.getElementById(targetHash);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'nearest' });
      }
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

    const st = ScrollTrigger.create({
      id: 'experiences-story',
      trigger: el,
      start: 'top 88px',
      end: '+=100%',
      pin: true,
      pinSpacing: true,
      scrub: 0.5,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (isNavigatingRef.current) return;
        const progress = self.progress;
        if (progress < EXP_SEGMENTS[0].max) {
          setActiveExp(0);
        } else if (progress < EXP_SEGMENTS[1].max) {
          setActiveExp(1);
        } else {
          setActiveExp(2);
        }
      },
      onRefreshInit: () => {
        if (!hasConsumedPending && pendingTargetRef.current && stRef.current) {
          const pending = pendingTargetRef.current;
          if (stRef.current.end > stRef.current.start) {
            hasConsumedPending = true;
            pendingTargetRef.current = null;
            scrollToExperience(pending.index, pending.smooth);
          }
        }
      },
    });

    stRef.current = st;

    const onRefresh = () => {
      if (!hasConsumedPending && pendingTargetRef.current && st.end > st.start) {
        const pending = pendingTargetRef.current;
        hasConsumedPending = true;
        pendingTargetRef.current = null;
        scrollToExperience(pending.index, pending.smooth);
      }
    };
    refreshHandlerRef.current = onRefresh;
    ScrollTrigger.addEventListener('refresh', onRefresh);

    const sortHandler = () => {
      ScrollTrigger.sort();
    };
    sortHandlerRef.current = sortHandler;
    window.addEventListener('load', sortHandler);

    return () => {
      if (refreshHandlerRef.current) {
        ScrollTrigger.removeEventListener('refresh', refreshHandlerRef.current);
        refreshHandlerRef.current = null;
      }
      if (sortHandlerRef.current) {
        window.removeEventListener('load', sortHandlerRef.current);
        sortHandlerRef.current = null;
      }
      st.kill(true);
      stRef.current = null;
    };
  }, [isDesktop, lenis]);

  useEffect(() => {
    const locTarget = getTargetIntent(location.state);
    if (locTarget !== null) {
      setActiveExp(locTarget);
      if (isDesktop) {
        const st = stRef.current || ScrollTrigger.getById('experiences-story');
        if (st && typeof st.start === 'number' && st.end > st.start) {
          const segment = EXP_SEGMENTS[locTarget] || EXP_SEGMENTS[0];
          const targetScroll = st.start + (st.end - st.start) * segment.target;
          if (lenis) {
            lenis.scrollTo(targetScroll, { immediate: false });
          } else {
            window.scrollTo({ top: targetScroll, behavior: 'smooth' });
          }
        } else {
          pendingTargetRef.current = { index: locTarget, smooth: false };
        }
      } else {
        const targetHash = locTarget === 0 ? 'spa' : locTarget === 2 ? 'dining' : 'yoga';
        const targetEl = document.getElementById(targetHash);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }

      if (location.state && (location.state as any).landingExperienceTarget !== undefined) {
        try {
          const newState = { ...(location.state as any) };
          delete newState.landingExperienceTarget;
          window.history.replaceState(newState, '', window.location.pathname + window.location.hash);
        } catch (_) {}
      }
    }
  }, [location.state, isDesktop, lenis]);

  // Direct window hashchange listener for real-time external anchor navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#spa') scrollToExperience(0, true);
      else if (hash === '#yoga') scrollToExperience(1, true);
      else if (hash === '#dining') scrollToExperience(2, true);
    };

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [isDesktop]);

  const experiences = [
    {
      index: '01',
      icon: <Sparkles size={20} />,
      title: t('landing.experiences.spa.title'),
      desc: t('landing.experiences.spa.desc'),
      img: EXPERIENCE_MEDIA[0],
      anchorId: 'spa',
    },
    {
      index: '02',
      icon: <Sun size={20} />,
      title: t('landing.experiences.yoga.title'),
      desc: t('landing.experiences.yoga.desc'),
      img: EXPERIENCE_MEDIA[1],
      anchorId: 'yoga',
    },
    {
      index: '03',
      icon: <Utensils size={20} />,
      title: t('landing.experiences.dining.title'),
      desc: t('landing.experiences.dining.desc'),
      img: EXPERIENCE_MEDIA[2],
      anchorId: 'dining',
    },
  ];

  return (
    <div ref={rootRef} className="hsw-experiences-story-root" style={{ width: '100%', position: 'relative' }}>
      {!isDesktop ? (
        /* ==========================================================================
           Intentional Compact Mobile Storytelling Layout (< 768px / container < 720px)
           1. Anchors for #spa, #yoga, #dining deep-linking
           2. Interactive Stepper Selector
           3. Featured Active Experience Media Banner (16:10)
           4. Experience Badge, Title & Complete Description
           5. Previous / Next Stepper Controls + Indicator Dots
           ========================================================================== */
        <div
          className="hsw-experiences-mobile-fallback"
          style={{ width: '100%', maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
        >
          {/* Deep link anchor elements for direct navigation (#spa, #yoga, #dining) */}
          <div id="spa" style={{ position: 'relative', top: '-70px' }} />
          <div id="yoga" style={{ position: 'relative', top: '-70px' }} />
          <div id="dining" style={{ position: 'relative', top: '-70px' }} />

          {/* 1. Interactive Stepper Selector Pills */}
          <div
            role="tablist"
            aria-label="Experiences stage switcher"
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
            {experiences.map((exp, idx) => {
              const isActive = idx === activeExp;
              return (
                <button
                  key={exp.index}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => scrollToExperience(idx, true)}
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
                  <span>{exp.index}</span>
                  <span>•</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{exp.title.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* 2. Featured Active Experience Showcase Card with Moving Luminous Rim */}
          <div
            id={`exp-mobile-active-${activeExp}`}
            className="hsw-story-nav-item hsw-experience-card is-active"
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

            {/* Paired Media Banner with Vignette & Floating Pill Tag */}
            <div style={{ position: 'relative', aspectRatio: '16 / 10', overflow: 'hidden', width: '100%' }}>
              <img
                src={EXPERIENCE_MEDIA[activeExp].url}
                alt={EXPERIENCE_MEDIA[activeExp].alt}
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
                  color: 'var(--accent-sand)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <span>{experiences[activeExp].index}</span>
                <span>•</span>
                <span>HEAVENSTAY</span>
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
                  {experiences[activeExp].icon}
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
                  {experiences[activeExp].title}
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
                {experiences[activeExp].desc}
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
                  disabled={activeExp === 0}
                  onClick={() => scrollToExperience(Math.max(0, activeExp - 1))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: activeExp === 0 ? 'transparent' : 'var(--surface)',
                    color: activeExp === 0 ? 'var(--text-disabled)' : 'var(--text-primary)',
                    cursor: activeExp === 0 ? 'not-allowed' : 'pointer',
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
                  {experiences.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      aria-label={`Go to experience ${dotIdx + 1}`}
                      onClick={() => scrollToExperience(dotIdx)}
                      style={{
                        width: dotIdx === activeExp ? '20px' : '8px',
                        height: '8px',
                        borderRadius: 'var(--radius-pill)',
                        border: 'none',
                        backgroundColor: dotIdx === activeExp ? 'var(--accent-forest)' : 'var(--border-strong)',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  disabled={activeExp === experiences.length - 1}
                  onClick={() => scrollToExperience(Math.min(experiences.length - 1, activeExp + 1))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: activeExp === experiences.length - 1 ? 'transparent' : 'var(--surface)',
                    color: activeExp === experiences.length - 1 ? 'var(--text-disabled)' : 'var(--text-primary)',
                    cursor: activeExp === experiences.length - 1 ? 'not-allowed' : 'pointer',
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
          className="hsw-experiences-sticky-story hsw-experiences-story-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)',
            gap: 'clamp(16px, 2.5vw, var(--space-12))',
            alignItems: 'center',
            maxWidth: '1120px',
            margin: '0 auto',
            minHeight: '460px',
            position: 'relative',
            width: '100%',
          }}
        >
          {/* Left: Navigation steps */}
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
                  height: `${(activeExp / 2) * 100}%`,
                  background: 'linear-gradient(to bottom, var(--accent-sand), var(--accent-forest))',
                  transition: 'height 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                  borderRadius: '2px',
                }}
              />
            </div>

            {experiences.map((exp, idx) => {
              const isActive = idx === activeExp;
              return (
                <div
                  key={exp.index}
                  id={`exp-${idx}`}
                  onClick={() => scrollToExperience(idx, true)}
                  data-cursor="explore"
                  className={`hsw-story-nav-item ${isActive ? 'is-active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-4)',
                    padding: 'clamp(10px, 1.5vw, 16px) clamp(12px, 1.8vw, 20px)',
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

                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--accent-forest)' : 'var(--text-secondary)',
                      opacity: isActive ? 1 : 0.55,
                      transform: isActive ? 'scale(1.02)' : 'scale(1)',
                      textShadow: isActive ? 'var(--shadow-story-text-number, var(--shadow-text-rest))' : 'none',
                      width: 'clamp(24px, 3vw, 32px)',
                      fontSize: 'clamp(1.125rem, 1.8vw, var(--text-2xl))',
                      flexShrink: 0,
                      transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {exp.index}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ color: isActive ? 'var(--accent-forest)' : 'var(--text-secondary)' }}>
                        {exp.icon}
                      </span>
                      <h3
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'clamp(1rem, 1.6vw, var(--text-xl))',
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
                        fontSize: 'clamp(0.8125rem, 1.1vw, var(--text-sm))',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        textShadow: isActive ? 'var(--shadow-story-text-desc, var(--shadow-text-desc-rest))' : 'none',
                        lineHeight: 1.6,
                        margin: 0,
                        maxWidth: '420px',
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

          {/* Right: Sticky Image Crossfade Panel (Editorial Media) */}
          <div
            className="hsw-editorial-media"
            style={{
              position: 'relative',
              aspectRatio: '16 / 11',
              width: '100%',
              maxWidth: '100%',
              borderRadius: 'clamp(12px, 1.5vw, var(--radius-xl))',
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

            {/* Floating badge */}
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
              <span>{experiences[activeExp].index}</span>
              <span>•</span>
              <span>HEAVENSTAY</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
