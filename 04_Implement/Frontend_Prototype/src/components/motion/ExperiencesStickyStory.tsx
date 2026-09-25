import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Sun, Utensils } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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

export const ExperiencesStickyStory: React.FC = () => {
  const { t } = useTranslation();
  const [activeExp, setActiveExp] = useState(0);
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
            setActiveExp(0);
          } else if (p < 0.7) {
            setActiveExp(1);
          } else {
            setActiveExp(2);
          }
        },
      });
    }, el);

    return () => ctx.revert();
  }, [isDesktop]);

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
        {experiences.map((exp) => (
          <div
            key={exp.index}
            className="hsw-experience-card"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-card)',
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
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-5)',
                padding: 'var(--space-5) var(--space-6)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isActive ? '#ffffff' : 'transparent',
                border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                boxShadow: isActive ? 'var(--shadow-card)' : 'none',
                opacity: isActive ? 1 : 0.45,
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 600,
                  color: isActive ? 'var(--accent-forest)' : 'var(--text-tertiary)',
                  width: '32px',
                  flexShrink: 0,
                  transition: 'color 0.3s',
                }}
              >
                {exp.index}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ color: isActive ? 'var(--accent-forest)' : 'var(--text-tertiary)' }}>
                    {exp.icon}
                  </span>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--text-xl)',
                      fontWeight: 500,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      margin: 0,
                    }}
                  >
                    {exp.title}
                  </h3>
                </div>

                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    margin: 0,
                    maxWidth: '440px',
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
          borderRadius: 'var(--radius-md)',
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
