import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  Loader2,
  Home,
  Info,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { RevealOnScroll } from '../../components/motion/RevealOnScroll';
import { TextReveal } from '../../components/motion/TextReveal';
import { ParallaxMedia } from '../../components/motion/ParallaxMedia';
import { MagneticButton } from '../../components/motion/MagneticButton';
import { formatVND } from '../../i18n';
import { getRetreatPackages, type RetreatPackageDto } from '../../api/booking/retreatBookingApi';
import {
  resolvePackageName,
  resolveVillaCategoryName,
  resolvePackageWellnessGoal,
} from '../../i18n/dynamicContent';

export const RetreatDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();

  const [dbPackage, setDbPackage] = useState<RetreatPackageDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    getRetreatPackages()
      .then((list) => {
        if (!isCancelled) {
          const match = list.find(
            (p) =>
              String(p.retreatPackageId) === id ||
              p.packageCode.toLowerCase() === id?.toLowerCase()
          );
          if (match) {
            setDbPackage(match);
          } else {
            setDbPackage(null);
          }
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err?.message || 'Could not load retreat package from SQL Server backend.');
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-20) 0', textAlign: 'center' }}>
        <Container size="standard">
          <Loader2
            className="animate-spin"
            size={40}
            style={{ color: 'var(--accent-forest)', margin: '0 auto var(--space-4)' }}
          />
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Retrieving package details directly from SQL Server...
          </p>
        </Container>
      </div>
    );
  }

  if (error || !dbPackage) {
    return (
      <div style={{ padding: 'var(--space-16) 0', textAlign: 'center' }}>
        <Container size="narrow">
          <AlertCircle size={40} style={{ color: '#b91c1c', margin: '0 auto var(--space-4)' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
            {t('retreat.detail.notFoundTitle', 'Gói nghỉ dưỡng không tồn tại')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', lineHeight: 1.6 }}>
            {error || t('retreat.detail.notFoundDesc', 'Không tìm thấy thông tin gói nghỉ dưỡng này trong cơ sở dữ liệu SQL Server (MSG01: No search results).')}
          </p>
          <Link to="/retreats">
            <Button variant="primary">
              <ArrowLeft size={16} />
              <span>{t('retreat.detail.backToList', 'Quay lại danh sách gói nghỉ dưỡng')}</span>
            </Button>
          </Link>
        </Container>
      </div>
    );
  }

  const name = resolvePackageName(dbPackage.packageCode || dbPackage.packageName, i18n.language, dbPackage.packageName);
  const days = dbPackage.durationNights + 1;
  const nights = dbPackage.durationNights;
  const startingPrice = dbPackage.basePrice;
  const wellnessGoal = resolvePackageWellnessGoal(dbPackage.packageCode, i18n.language, dbPackage.wellnessGoal) || '—';
  const villaCategories =
    dbPackage.eligibleVillaCategories && dbPackage.eligibleVillaCategories.length > 0
      ? dbPackage.eligibleVillaCategories.map((v) => resolveVillaCategoryName(v.categoryName, i18n.language, v.categoryName)).join(', ')
      : '—';

  // Parse included treatments lines from DB
  const treatmentLines = dbPackage.includedTreatments
    ? dbPackage.includedTreatments
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
    : [];

  // Parse dietary plan lines from DB
  const dietaryLines = dbPackage.dietaryPlan
    ? dbPackage.dietaryPlan
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
    : [];

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
              src="/images/hero-resort-cliff.jpg"
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }}
            />
          </ParallaxMedia>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(23, 29, 21, 0.95) 0%, rgba(23, 29, 21, 0.35) 60%, rgba(23, 29, 21, 0.7) 100%)',
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
              <span>{t('retreat.detail.backToList', 'Tất cả các gói nghỉ dưỡng')}</span>
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
              <span>
                {days} {t('labels.days', 'Ngày')} · {nights} {t('labels.nights', 'Đêm')}
              </span>
            </div>
            <span>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} style={{ color: 'var(--accent-sand)' }} />
              <span>{villaCategories}</span>
            </div>
            <span>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--accent-sand)', fontWeight: 600 }}>{dbPackage.packageCode}</span>
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
            {wellnessGoal}
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
              <div
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                {t('labels.startingFrom', 'Giá khởi điểm từ')}
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent-sand)' }}>
                {formatVND(startingPrice, i18n.language)}
              </div>
            </div>

            <MagneticButton distance={0.2} maxOffset={6}>
              <Link to={`/customer/booking/new?packageId=${dbPackage.retreatPackageId}`}>
                <Button
                  variant="primary"
                  size="lg"
                  className="hsw-btn-retreat-primary hsw-btn-retreat-hero"
                  icon={<ArrowRight size={17} />}
                >
                  {t('retreat.detail.ctaBookHero', 'Đặt Gói Nghỉ Dưỡng')}
                </Button>
              </Link>
            </MagneticButton>
          </div>
        </Container>
      </section>

      {/* ====================================================================
          2. Overview & Wellness Goal
          ==================================================================== */}
      <section
        style={{
          padding: 'var(--space-12) 0',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-canvas)',
        }}
      >
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
                {t('retreat.detail.overview', 'Mục Tiêu Trị Liệu & Sức Khỏe')}
              </span>
              <TextReveal as="p" style={{ fontSize: 'var(--text-lg)', lineHeight: 1.8, color: 'var(--text-primary)' }}>
                {wellnessGoal}
              </TextReveal>
              {dbPackage.targetGuest && (
                <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  <strong>{t('retreat.detail.targetGuest', 'Đối tượng phù hợp: ')}</strong>
                  {dbPackage.targetGuest}
                </div>
              )}
            </div>
          </RevealOnScroll>
        </Container>
      </section>

      {/* ====================================================================
          3. Included Treatments & Therapies
          ==================================================================== */}
      <section
        style={{
          padding: 'var(--space-16) 0',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
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
              {t('retreat.detail.treatmentsTitle', 'Liệu Trình & Trị Liệu')}
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
              {t('retreat.detail.includedTreatmentsHeading', 'Chương Trình Trị Liệu Đã Bao Gồm')}
            </h2>
          </div>

          <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {treatmentLines.length > 0 ? (
              treatmentLines.map((treatment, idx) => (
                <RevealOnScroll key={idx} delayMs={idx * 60}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--space-4)',
                      padding: 'var(--space-5)',
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <CheckCircle2 size={20} style={{ color: 'var(--accent-forest)', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 500 }}>
                      {treatment}
                    </div>
                  </div>
                </RevealOnScroll>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>—</p>
            )}
          </div>
        </Container>
      </section>

      {/* ====================================================================
          4. Nutrition, Dietary Plan & Extra Charge Policy
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
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 'var(--space-12)',
            }}
          >
            {/* Left: Dietary Plan */}
            <RevealOnScroll>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-forest)', marginBottom: 'var(--space-3)' }}>
                  <Utensils size={20} />
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.14em',
                    }}
                  >
                    {t('retreat.detail.dietaryHeading', 'Chế Độ Dinh Dưỡng Thực Dưỡng')}
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-2xl)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  {t('retreat.detail.organicNutrition', 'Ẩm Thực Tinh Khiết')}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {dietaryLines.length > 0 ? (
                    dietaryLines.map((line, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <Sparkles size={16} style={{ color: 'var(--accent-olive)', flexShrink: 0, marginTop: '3px' }} />
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.6 }}>{line}</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-secondary)' }}>—</p>
                  )}
                </div>
              </div>
            </RevealOnScroll>

            {/* Right: Policies & Extras */}
            <RevealOnScroll delayMs={150}>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-olive)', marginBottom: 'var(--space-3)' }}>
                  <Info size={18} />
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    {t('retreat.detail.policyTitle', 'Quy Định & Phụ Phí')}
                  </span>
                </div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
                  {t('retreat.detail.includedNotice', 'Quyền Lợi & Điều Khoản Gói')}
                </h4>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {dbPackage.extraChargePolicy || '—'}
                </p>
              </div>
            </RevealOnScroll>
          </div>
        </Container>
      </section>

      {/* ====================================================================
          5. Eligible Villa Categories
          ==================================================================== */}
      {dbPackage.eligibleVillaCategories && dbPackage.eligibleVillaCategories.length > 0 && (
        <section
          style={{
            padding: 'var(--space-16) 0',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
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
                {t('retreat.detail.villasTitle', 'Không Gian Lưu Trú')}
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
                {t('retreat.detail.eligibleVillas', 'Hạng Villa Phù Hợp Với Gói Nghỉ Dưỡng')}
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 'var(--space-8)',
              }}
            >
              {dbPackage.eligibleVillaCategories.map((cat) => (
                <RevealOnScroll key={cat.villaCategoryId}>
                  <div
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-canvas)',
                      padding: 'var(--space-6)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-forest)', marginBottom: 'var(--space-2)' }}>
                        <Home size={18} />
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', margin: 0 }}>
                          {cat.categoryName}
                        </h3>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--accent-olive)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                        {cat.bedroomCount} Phòng ngủ · Tối đa {cat.maxOccupancy} khách {cat.hasPrivatePool ? '· Có hồ bơi riêng' : ''}
                      </div>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {cat.featuresAndAmenities || cat.areaDescription || '—'}
                      </p>
                    </div>

                    <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                        Trạng thái hạng phòng:
                      </span>{' '}
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-forest)' }}>
                        {cat.categoryStatus}
                      </span>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </Container>
        </section>
      )}

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
              {t('retreat.detail.readyToBook', 'Bắt Đầu Hành Trình Của Bạn')}
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto var(--space-6)' }}>
              {t('retreat.detail.depositNote', 'Thanh toán tiền cọc trực tiếp qua cổng VNPay để xác nhận đặt chỗ an toàn.')}
            </p>

            <MagneticButton distance={0.2} maxOffset={6}>
              <Link to={`/customer/booking/new?packageId=${dbPackage.retreatPackageId}`}>
                <Button
                  variant="primary"
                  size="lg"
                  className="hsw-btn-retreat-primary hsw-btn-retreat-hero"
                  icon={<ArrowRight size={17} />}
                >
                  {t('retreat.detail.ctaBook', 'Đặt Gói Nghỉ Dưỡng')} — {formatVND(startingPrice, i18n.language)}
                </Button>
              </Link>
            </MagneticButton>
          </RevealOnScroll>
        </Container>
      </section>
    </div>
  );
};
