import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Utensils,
  Heart,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { RevealOnScroll } from '../../components/motion/RevealOnScroll';
import { TextReveal } from '../../components/motion/TextReveal';
import { ImageReveal } from '../../components/motion/ImageReveal';
import { ParallaxMedia } from '../../components/motion/ParallaxMedia';
import { MagneticButton } from '../../components/motion/MagneticButton';
import { MOCK_RETREAT_PACKAGES } from '../../data/mockRetreats';
import { formatVND } from '../../i18n';

export const RetreatDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'vi' | 'en' | 'zh-CN' | 'ja' | 'fr';

  // Match by slug or id
  const retreat =
    MOCK_RETREAT_PACKAGES.find((pkg) => pkg.slug === id || pkg.id === id) ||
    MOCK_RETREAT_PACKAGES[0];

  const name = retreat.names[lang] || retreat.names.en || retreat.names.vi;
  const tagline = retreat.taglines[lang] || retreat.taglines.en || retreat.taglines.vi;
  const description = retreat.descriptions[lang] || retreat.descriptions.en || retreat.descriptions.vi;
  const villaName = retreat.villaName[lang] || retreat.villaName.en || retreat.villaName.vi;
  const villaDesc = retreat.villaDescription[lang] || retreat.villaDescription.en || retreat.villaDescription.vi;
  const suitableList = retreat.suitableFor[lang] || retreat.suitableFor.en || retreat.suitableFor.vi;
  const inclusionsList = retreat.inclusions[lang] || retreat.inclusions.en || retreat.inclusions.vi;
  const spaHighlights = retreat.wellnessHighlights[lang] || retreat.wellnessHighlights.en || retreat.wellnessHighlights.vi;
  const diningHighlights = retreat.diningHighlights[lang] || retreat.diningHighlights.en || retreat.diningHighlights.vi;

  return (
    <div className="hsw-retreat-detail-page" style={{ paddingBottom: 'var(--space-16)' }}>
      {/* ====================================================================
          1. Hero with Breadcrumb & Editorial Overview
          ==================================================================== */}
      <section
        style={{
          position: 'relative',
          minHeight: '65vh',
          display: 'flex',
          alignItems: 'flex-end',
          backgroundColor: '#171d15',
          color: '#ffffff',
          overflow: 'hidden',
          paddingBottom: 'var(--space-12)',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden' }}>
          <ParallaxMedia speed={0.06} style={{ width: '100%', height: '115%', top: '-7%' }}>
            <img
              src={retreat.heroImage}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }}
            />
          </ParallaxMedia>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(23, 29, 21, 0.95) 0%, rgba(23, 29, 21, 0.35) 60%, rgba(23, 29, 21, 0.7) 100%)',
            }}
          />
        </div>

        <Container size="standard" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Link
              to="/retreats"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                letterSpacing: '0.05em',
                color: 'var(--accent-sand)',
                textTransform: 'uppercase',
              }}
            >
              <ArrowLeft size={14} />
              <span>{t('retreat.detail.backToList')}</span>
            </Link>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
              flexWrap: 'wrap',
              fontSize: 'var(--text-xs)',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} style={{ color: 'var(--accent-sand)' }} />
              <span>{retreat.days} {t('labels.days')} · {retreat.nights} {t('labels.nights')}</span>
            </div>
            <span>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} style={{ color: 'var(--accent-sand)' }} />
              <span>{villaName}</span>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-3)' }}>
            <TextReveal
              as="h1"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px, 5vw, 54px)',
                fontWeight: 400,
                color: '#ffffff',
                lineHeight: 1.15,
                maxWidth: '820px',
                margin: 0,
              }}
            >
              {name}
            </TextReveal>
            {retreat.names.en && retreat.names.en !== name && (
              <div
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-sand)',
                  marginTop: '8px',
                }}
              >
                {retreat.names.en}
              </div>
            )}
          </div>

          <p
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--accent-sand-soft)',
              maxWidth: '640px',
              lineHeight: 1.6,
              marginBottom: 'var(--space-6)',
            }}
          >
            {tagline}
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-6)',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255, 255, 255, 0.7)' }}>
                {t('labels.startingFrom')}
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-sand)' }}>
                {formatVND(retreat.startingPrice, i18n.language)}
              </div>
            </div>

            {/* Note: Clicking this navigates to Screen 15 (Retreat Booking Form), which remains the official placeholder */}
            <MagneticButton distance={0.2} maxOffset={6}>
              <Link to="/customer/booking/new">
                <Button
                  variant="primary"
                  size="lg"
                  className="hsw-btn-retreat-primary hsw-btn-retreat-hero"
                  icon={<ArrowRight size={17} />}
                >
                  {t('retreat.detail.ctaBookHero', t('retreat.detail.ctaBook'))}
                </Button>
              </Link>
            </MagneticButton>
          </div>
        </Container>
      </section>

      {/* ====================================================================
          2. Overview & Philosophy
          ==================================================================== */}
      <section style={{ padding: 'var(--space-12) 0', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-canvas)' }}>
        <Container size="standard">
          <RevealOnScroll>
            <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
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
                {t('retreat.detail.overview')}
              </span>
              <TextReveal as="p" style={{ fontSize: 'var(--text-lg)', lineHeight: 1.8, color: 'var(--text-primary)' }}>
                {description}
              </TextReveal>
            </div>
          </RevealOnScroll>
        </Container>
      </section>

      {/* ====================================================================
          3. MaestroClass-style Numbered Journey ("What the X Days Hold")
          ==================================================================== */}
      <section style={{ padding: 'var(--space-16) 0', backgroundColor: '#ffffff', borderBottom: '1px solid var(--border-subtle)' }}>
        <Container size="standard">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
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
              {t('retreat.detail.itineraryTitle')}
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 400,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {t('retreat.detail.daysOfRest', { days: retreat.days })}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            {retreat.itinerary.map((stage, idx) => {
              const stageTitle = stage.title[lang] || stage.title.en || stage.title.vi;
              const stageDesc = stage.description[lang] || stage.description.en || stage.description.vi;

              const stageHighlights = Array.isArray(stage.highlights)
                ? stage.highlights
                : (stage.highlights[lang] || stage.highlights.en || stage.highlights.vi || []);

              return (
                <RevealOnScroll key={stage.day} delayMs={idx * 80}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr',
                      gap: 'var(--space-6)',
                      padding: 'var(--space-6)',
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'var(--text-3xl)',
                        color: 'var(--accent-olive)',
                        fontWeight: 400,
                        borderRight: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {stage.stageNumber}
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-forest)', fontWeight: 700, marginBottom: '4px' }}>
                        {t('labels.days')} {stage.day}
                      </div>
                      <h3
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'var(--text-2xl)',
                          color: 'var(--text-primary)',
                          margin: '0 0 var(--space-2)',
                        }}
                      >
                        {stageTitle}
                      </h3>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 var(--space-4)' }}>
                        {stageDesc}
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {stageHighlights.map((h, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              backgroundColor: '#ffffff',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-pill)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            ✓ {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ====================================================================
          4. Inclusions & Accommodation Showcase
          ==================================================================== */}
      <section style={{ padding: 'var(--space-16) 0', backgroundColor: 'var(--bg-soft)', borderBottom: '1px solid var(--border-subtle)' }}>
        <Container size="standard">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 'var(--space-12)',
            }}
          >
            {/* Left: Inclusions List */}
            <RevealOnScroll>
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
                  {t('retreat.detail.whatIncluded')}
                </span>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-3xl)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-6)',
                  }}
                >
                  {t('retreat.detail.comprehensiveCare')}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {inclusionsList.map((inc, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.6 }}>{inc}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 'var(--space-6)', fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  {t('retreat.detail.priceDisclaimer')}
                </div>
              </div>
            </RevealOnScroll>

            {/* Right: Villa Accommodation */}
            <RevealOnScroll delayMs={150}>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <ImageReveal
                  src={retreat.galleryImages[1] || retreat.heroImage}
                  alt={villaName}
                  aspectRatio="16 / 10"
                />
                <div style={{ padding: 'var(--space-6)' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-olive)', fontWeight: 700, marginBottom: '4px' }}>
                    {t('retreat.detail.accommodationTitle')}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                    {villaName}
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                    {villaDesc}
                  </p>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </Container>
      </section>

      {/* ====================================================================
          5. Highlights: Spa & Dining & Suitable For
          ==================================================================== */}
      <section style={{ padding: 'var(--space-16) 0', backgroundColor: '#ffffff', borderBottom: '1px solid var(--border-subtle)' }}>
        <Container size="standard">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-8)',
            }}
          >
            <RevealOnScroll delayMs={100}>
              <div
                style={{
                  padding: 'var(--space-8)',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-forest)', marginBottom: 'var(--space-4)' }}>
                  <Sparkles size={20} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', margin: 0 }}>
                    {t('retreat.detail.wellnessHighlights')}
                  </h3>
                </div>
                <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {spaHighlights.map((sh, idx) => (
                    <li key={idx}>{sh}</li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delayMs={200}>
              <div
                style={{
                  padding: 'var(--space-8)',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-forest)', marginBottom: 'var(--space-4)' }}>
                  <Utensils size={20} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', margin: 0 }}>
                    {t('retreat.detail.diningHighlights')}
                  </h3>
                </div>
                <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {diningHighlights.map((dh, idx) => (
                    <li key={idx}>{dh}</li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delayMs={300}>
              <div
                style={{
                  padding: 'var(--space-8)',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-forest)', marginBottom: 'var(--space-4)' }}>
                  <Heart size={20} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', margin: 0 }}>
                    {t('retreat.detail.suitableForTitle')}
                  </h3>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {suitableList.map((st, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {st}
                    </span>
                  ))}
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </Container>
      </section>

      {/* ====================================================================
          6. Final Reservation Action Panel
          ==================================================================== */}
      <section style={{ padding: 'var(--space-16) 0', backgroundColor: 'var(--bg-soft)', textAlign: 'center' }}>
        <Container size="narrow">
          <RevealOnScroll>
            <ShieldCheck size={32} style={{ color: 'var(--accent-olive)', margin: '0 auto var(--space-3)' }} />
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 400,
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-3)',
              }}
            >
              {t('retreat.detail.readyToBook')}
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto var(--space-6)' }}>
              {t('retreat.detail.depositNote')}
            </p>

            <MagneticButton distance={0.2} maxOffset={6}>
              <Link to="/customer/booking/new">
                <Button
                  variant="primary"
                  size="lg"
                  className="hsw-btn-retreat-primary hsw-btn-retreat-hero"
                  icon={<ArrowRight size={17} />}
                >
                  {t('retreat.detail.ctaBook')} — {formatVND(retreat.startingPrice, i18n.language)}
                </Button>
              </Link>
            </MagneticButton>
          </RevealOnScroll>
        </Container>
      </section>
    </div>
  );
};
