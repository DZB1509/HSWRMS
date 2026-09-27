import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import {
  Sparkles,
  ArrowRight,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { SectionHeading } from '../../components/common/SectionHeading';
import { Button } from '../../components/common/Button';
import { RetreatCard } from '../../components/retreat/RetreatCard';
import { RevealOnScroll } from '../../components/motion/RevealOnScroll';
import { TextReveal } from '../../components/motion/TextReveal';
import { ImageReveal } from '../../components/motion/ImageReveal';
import { MagneticButton } from '../../components/motion/MagneticButton';
import { PillarsStickyStory } from '../../components/motion/PillarsStickyStory';
import { ExperiencesStickyStory } from '../../components/motion/ExperiencesStickyStory';
import { MOCK_RETREAT_PACKAGES } from '../../data/mockRetreats';

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const heroRef = useRef<HTMLDivElement>(null);
  const heroBgRef = useRef<HTMLImageElement>(null);
  const heroHeadlineRef = useRef<HTMLHeadingElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const heroCtaRef = useRef<HTMLDivElement>(null);

  // Desktop Hero Scroll Choreography (Section 7)
  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reducedMotion || !heroRef.current) return;

    const ctx = gsap.context(() => {
      if (heroBgRef.current) {
        gsap.to(heroBgRef.current, {
          scale: 1.06,
          yPercent: 8,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }

      if (heroHeadlineRef.current) {
        gsap.to(heroHeadlineRef.current, {
          y: -35,
          opacity: 0.2,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: '65% top',
            scrub: true,
          },
        });
      }

      if (heroSubRef.current && heroCtaRef.current) {
        gsap.to([heroSubRef.current, heroCtaRef.current], {
          y: -20,
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: '15% top',
            end: '80% top',
            scrub: true,
          },
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const scrollToPhilosophy = () => {
    const el = document.getElementById('philosophy-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="hsw-landing-page">
      {/* ====================================================================
          A. Cinematic Nature Hero (Sylva & Amanoi inspired atmospheric depth)
          ==================================================================== */}
      <section
        ref={heroRef}
        className="hsw-hero-section"
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: '#171d15',
          color: '#ffffff',
          padding: 'var(--space-16) 0 var(--space-12)',
        }}
      >
        {/* Cinematic Backdrop Image with slow zoom & multi-layer gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
          }}
        >
          <img
            ref={heroBgRef}
            src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=2400&q=85"
            alt="HeavenStay — Secluded coastal bay surrounded by ancient cliffs and lush jungle canopy"
            className="hsw-hero-bg-image"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 35%',
              opacity: 0.6,
            }}
          />
          {/* Layered gradient: bottom-heavy vignette + radial center softening */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to bottom, rgba(23, 29, 21, 0.5) 0%, rgba(23, 29, 21, 0.15) 30%, rgba(23, 29, 21, 0.3) 60%, rgba(23, 29, 21, 0.85) 100%)',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(23, 29, 21, 0.4) 100%)',
            }}
          />
        </div>

        <Container size="standard" style={{ position: 'relative', zIndex: 3, textAlign: 'center' }}>
          <div
            style={{
              maxWidth: '880px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: 'var(--radius-pill)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--accent-sand)',
                marginBottom: 'var(--space-6)',
              }}
            >
              <Sparkles size={13} />
              <span>{t('landing.hero.badge')}</span>
            </div>

            <h1
              ref={heroHeadlineRef}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(36px, 6vw, 68px)',
                fontWeight: 400,
                lineHeight: 1.12,
                color: '#ffffff',
                marginBottom: 'var(--space-5)',
                letterSpacing: '-0.01em',
              }}
            >
              {t('landing.hero.headline')}
            </h1>

            <p
              ref={heroSubRef}
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'clamp(16px, 1.8vw, 19px)',
                lineHeight: 1.7,
                color: 'rgba(255, 255, 255, 0.88)',
                maxWidth: '680px',
                marginBottom: 'var(--space-8)',
              }}
            >
              {t('landing.hero.subheadline')}
            </p>

            <div
              ref={heroCtaRef}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-4)',
                flexWrap: 'wrap',
              }}
            >
              <MagneticButton distance={0.25} maxOffset={8}>
                <Link to="/retreats">
                  <Button
                    variant="primary"
                    size="lg"
                    className="hsw-btn-retreat-primary hsw-btn-retreat-hero"
                    icon={<ArrowRight size={17} />}
                  >
                    {t('landing.hero.ctaPrimary')}
                  </Button>
                </Link>
              </MagneticButton>

              <MagneticButton distance={0.2} maxOffset={6}>
                <Button
                  variant="secondary"
                  size="lg"
                  className="hsw-btn-hero-secondary"
                  icon={<Sparkles size={16} />}
                  onClick={scrollToPhilosophy}
                >
                  {t('landing.hero.ctaSecondary')}
                </Button>
              </MagneticButton>
            </div>
          </div>
        </Container>

        {/* Scroll Hint Indicator */}
        <button
          type="button"
          onClick={scrollToPhilosophy}
          aria-label={t('landing.hero.scrollHint')}
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 3,
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          <span>{t('landing.hero.scrollHint')}</span>
          <ChevronDown size={16} />
        </button>
      </section>

      {/* ====================================================================
          B. HeavenStay Introduction & Philosophy (Amanoi-inspired quiet luxury)
          ==================================================================== */}
      <section
        id="philosophy-section"
        style={{
          padding: 'var(--space-16) 0',
          backgroundColor: 'var(--bg-canvas)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <Container size="standard">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: 'var(--space-12)',
              alignItems: 'center',
            }}
          >
            <div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: 'var(--accent-olive)',
                  backgroundColor: 'var(--accent-sand-soft)',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                {t('landing.philosophy.badge')}
              </span>

              <TextReveal
                as="h2"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(30px, 3.8vw, 44px)',
                  fontWeight: 400,
                  lineHeight: 1.2,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-5)',
                }}
              >
                {t('landing.philosophy.title')}
              </TextReveal>

              <TextReveal
                as="p"
                delay={0.1}
                style={{
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  marginBottom: 'var(--space-4)',
                }}
              >
                {t('landing.philosophy.paragraph1')}
              </TextReveal>

              <TextReveal
                as="p"
                delay={0.2}
                style={{
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                }}
              >
                {t('landing.philosophy.paragraph2')}
              </TextReveal>
            </div>

            <ImageReveal
              src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80"
              alt="HeavenStay Tranquil Spa Pavilion"
              aspectRatio="4 / 3"
            />
          </div>
        </Container>
      </section>      {/* ====================================================================
          C. Wellness Journey Pillars — Editorial open layout & Sticky Story
          ==================================================================== */}
      <section
        style={{
          padding: 'var(--space-16) 0',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <Container size="standard">
          <SectionHeading
            badge={t('landing.pillars.badge')}
            title={t('landing.pillars.title')}
            alignment="center"
          />

          <PillarsStickyStory />
        </Container>
      </section>

      {/* ====================================================================
          D. Curated Retreat Packages Showcase
          ==================================================================== */}
      <section
        style={{
          padding: 'var(--space-16) 0',
          backgroundColor: 'var(--bg-soft)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <Container size="standard">
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-10)',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
            }}
          >
            <div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: 'var(--accent-olive)',
                  backgroundColor: 'var(--accent-sand-soft)',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {t('landing.showcase.badge')}
              </span>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(28px, 4vw, 40px)',
                  fontWeight: 400,
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                {t('landing.showcase.title')}
              </h2>
            </div>

            <Link to="/retreats">
              <Button variant="secondary" size="md" icon={<ArrowRight size={14} />}>
                {t('landing.showcase.viewAll')}
              </Button>
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: 'var(--space-8)',
            }}
          >
            {MOCK_RETREAT_PACKAGES.map((retreat, index) => (
              <RevealOnScroll key={retreat.id} delayMs={index * 120}>
                <RetreatCard retreat={retreat} />
              </RevealOnScroll>
            ))}
          </div>
        </Container>
      </section>

      {/* ====================================================================
          E. Wellness Experiences — Sticky Media Storytelling
          ==================================================================== */}
      <section
        style={{
          padding: 'var(--space-16) 0',
          backgroundColor: 'var(--bg-canvas)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <Container size="standard">
          <SectionHeading
            badge={t('landing.experiences.badge')}
            title={t('landing.experiences.title')}
            alignment="center"
          />

          <ExperiencesStickyStory />
        </Container>
      </section>

      {/* ====================================================================
          F. Sanctuary Residences & Villas
          ==================================================================== */}
      <section
        style={{
          padding: 'var(--space-16) 0',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <Container size="standard">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: 'var(--space-12)',
              alignItems: 'center',
            }}
          >
            <ImageReveal
              src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"
              alt="HeavenStay Sanctuary Villa"
              aspectRatio="16 / 11"
            />

            <div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: 'var(--accent-olive)',
                  backgroundColor: 'var(--accent-sand-soft)',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                {t('landing.villas.badge')}
              </span>

              <TextReveal
                as="h2"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(28px, 3.8vw, 42px)',
                  fontWeight: 400,
                  lineHeight: 1.2,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                {t('landing.villas.title')}
              </TextReveal>

              <p
                style={{
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  marginBottom: 'var(--space-6)',
                }}
              >
                {t('landing.villas.desc')}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {(t('landing.villas.features', { returnObjects: true }) as string[]).map((feature: string, idx: number) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--success-bg)',
                        color: 'var(--success)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '12px',
                      }}
                    >
                      ✓
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ====================================================================
          G. Customer Testimonials — Editorial pull-quote style
          ==================================================================== */}
      <section
        style={{
          padding: 'var(--space-16) 0',
          backgroundColor: 'var(--bg-canvas)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <Container size="narrow">
          <SectionHeading
            badge={t('landing.resonance.badge')}
            title={t('landing.resonance.title')}
            alignment="center"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
            {/* Testimonial 1 */}
            <RevealOnScroll delayMs={100}>
              <div
                style={{
                  position: 'relative',
                  textAlign: 'center',
                  padding: 'var(--space-6) var(--space-8)',
                }}
              >
                {/* Decorative oversized quotation mark */}
                <div
                  aria-hidden="true"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '80px',
                    lineHeight: 1,
                    color: 'var(--accent-sand)',
                    opacity: 0.5,
                    marginBottom: '-16px',
                    userSelect: 'none',
                  }}
                >
                  &ldquo;
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(18px, 2.5vw, 22px)',
                    lineHeight: 1.65,
                    color: 'var(--text-primary)',
                    fontStyle: 'italic',
                    marginBottom: 'var(--space-5)',
                    maxWidth: '640px',
                    margin: '0 auto var(--space-5)',
                  }}
                >
                  {t('landing.resonance.quote1')}
                </p>
                {/* Hairline divider */}
                <div
                  aria-hidden="true"
                  style={{
                    width: '48px',
                    height: '1px',
                    backgroundColor: 'var(--accent-sand)',
                    margin: '0 auto var(--space-3)',
                  }}
                />
                <div
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--accent-olive)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {t('landing.resonance.author1')}
                </div>
              </div>
            </RevealOnScroll>

            {/* Separator between testimonials */}
            <div
              aria-hidden="true"
              style={{
                width: '100%',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, var(--border-subtle), transparent)',
              }}
            />

            {/* Testimonial 2 */}
            <RevealOnScroll delayMs={200}>
              <div
                style={{
                  position: 'relative',
                  textAlign: 'center',
                  padding: 'var(--space-6) var(--space-8)',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '80px',
                    lineHeight: 1,
                    color: 'var(--accent-sand)',
                    opacity: 0.5,
                    marginBottom: '-16px',
                    userSelect: 'none',
                  }}
                >
                  &ldquo;
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(18px, 2.5vw, 22px)',
                    lineHeight: 1.65,
                    color: 'var(--text-primary)',
                    fontStyle: 'italic',
                    marginBottom: 'var(--space-5)',
                    maxWidth: '640px',
                    margin: '0 auto var(--space-5)',
                  }}
                >
                  {t('landing.resonance.quote2')}
                </p>
                <div
                  aria-hidden="true"
                  style={{
                    width: '48px',
                    height: '1px',
                    backgroundColor: 'var(--accent-sand)',
                    margin: '0 auto var(--space-3)',
                  }}
                />
                <div
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--accent-olive)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {t('landing.resonance.author2')}
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </Container>
      </section>

      {/* ====================================================================
          H. Final Transformation CTA
          ==================================================================== */}
      <section
        style={{
          padding: 'var(--space-16) 0',
          backgroundColor: 'var(--accent-forest)',
          color: '#ffffff',
          textAlign: 'center',
        }}
      >
        <Container size="narrow">
          <RevealOnScroll>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-pill)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--accent-sand)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <Shield size={14} />
              <span>{t('landing.cta.badge')}</span>
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px, 4.5vw, 48px)',
                fontWeight: 400,
                color: '#ffffff',
                marginBottom: 'var(--space-4)',
              }}
            >
              {t('landing.cta.title')}
            </h2>

            <p
              style={{
                fontSize: 'var(--text-base)',
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: 1.7,
                maxWidth: '560px',
                margin: '0 auto var(--space-8)',
              }}
            >
              {t('landing.cta.desc')}
            </p>

            <MagneticButton distance={0.25} maxOffset={8}>
              <Link to="/retreats">
                <Button
                  variant="primary"
                  size="lg"
                  icon={<ArrowRight size={16} />}
                  style={{
                    backgroundColor: 'var(--accent-sand)',
                    color: 'var(--accent-forest)',
                    fontWeight: 600,
                  }}
                >
                  {t('landing.cta.button')}
                </Button>
              </Link>
            </MagneticButton>
          </RevealOnScroll>
        </Container>
      </section>
    </div>
  );
};
