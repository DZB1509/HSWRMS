import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCustomer } from '../../context/CustomerContext';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { BookingStatusChip } from '../../components/customer/BookingStatusChip';
import { PrivacyNotice } from '../../components/customer/PrivacyNotice';
import {
  Sparkles,
  Calendar,
  HeartPulse,
  Utensils,
  UserCheck,
  Settings,
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin,
  Compass,
} from 'lucide-react';

export const CustomerDashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language as 'vi' | 'en' | 'zh-CN' | 'ja' | 'fr') || 'en';
  const { profile, activeBooking, wellnessProfile } = useCustomer();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('customer.dashboard.greetingMorning', 'Good morning');
    if (hour < 18) return t('customer.dashboard.greetingAfternoon', 'Good afternoon');
    return t('customer.dashboard.greetingEvening', 'Good evening');
  };

  const bookingName = activeBooking
    ? activeBooking.retreatName[lang] || activeBooking.retreatName.en || activeBooking.retreatName.vi
    : '';

  const villaName = activeBooking
    ? activeBooking.villaType[lang] || activeBooking.villaType.en || activeBooking.villaType.vi
    : '';

  return (
    <div className="hsw-customer-dashboard-page" style={{ padding: 'var(--space-6) 0 var(--space-16)' }}>
      <Container size="standard">
        {/* ====================================================================
            A. Welcome & Sanctuary Greeting
            ==================================================================== */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-8)',
            paddingBottom: 'var(--space-6)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--accent-olive)',
                backgroundColor: 'var(--accent-sand-soft)',
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                marginBottom: 'var(--space-2)',
              }}
            >
              <Sparkles size={13} />
              <span>{t('customer.dashboard.badge', 'Personalized Wellness Sanctuary')}</span>
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(26px, 4vw, 36px)',
                fontWeight: 400,
                color: 'var(--text-primary)',
                margin: '0 0 var(--space-2)',
              }}
            >
              {getGreeting()}, {profile.fullName}
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
              {t('customer.dashboard.welcomeSub', 'Welcome back to your mindful retreat journey at HeavenStay.')}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--accent-sand-soft)',
                color: 'var(--accent-forest)',
                border: '1px solid var(--accent-sand)',
              }}
            >
              <ShieldCheck size={14} />
              <span>{profile.membershipTier}</span>
            </span>
          </div>
        </div>

        {/* ====================================================================
            B. Upcoming Retreat Highlight Card
            ==================================================================== */}
        {activeBooking ? (
          <div
            className="hsw-upcoming-retreat-card"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-card)',
              overflow: 'hidden',
              marginBottom: 'var(--space-10)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
            }}
          >
            {/* Left Media Column */}
            <div style={{ position: 'relative', minHeight: '260px' }}>
              <img
                src={activeBooking.heroImage}
                alt={bookingName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(23, 29, 21, 0.7) 0%, transparent 60%)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 'var(--space-4)',
                  left: 'var(--space-4)',
                  right: 'var(--space-4)',
                  color: '#ffffff',
                }}
              >
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.85, marginBottom: '2px' }}>
                  {activeBooking.days} {t('labels.days', 'Days')} · {activeBooking.nights} {t('labels.nights', 'Nights')}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-xl)',
                    margin: 0,
                    color: '#ffffff',
                    fontWeight: 500,
                  }}
                >
                  {bookingName}
                </h3>
              </div>
            </div>

            {/* Right Details Column */}
            <div
              style={{
                padding: 'var(--space-6) var(--space-8)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookingStatusChip status={activeBooking.status} />
                    <BookingStatusChip depositStatus={activeBooking.depositStatus} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono, monospace)' }}>
                    {activeBooking.bookingReference}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <Calendar size={16} style={{ color: 'var(--accent-olive)', flexShrink: 0 }} />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                      <strong>{t('customer.dashboard.upcomingCard.checkIn', 'Check-in')}:</strong> {activeBooking.startDate} →{' '}
                      <strong>{t('customer.dashboard.upcomingCard.checkOut', 'Check-out')}:</strong> {activeBooking.endDate}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <MapPin size={16} style={{ color: 'var(--accent-olive)', flexShrink: 0 }} />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                      <strong>{t('customer.dashboard.upcomingCard.villaAssigned', 'Assigned Villa')}:</strong>{' '}
                      {activeBooking.villaNumber ? `${activeBooking.villaNumber} · ` : ''}{villaName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <Clock size={16} style={{ color: 'var(--accent-olive)', flexShrink: 0 }} />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      {t('customer.payment.remainingAtResort', 'Remaining balance (70%)')} due upon arrival.
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
                <Link to={`/customer/bookings/${activeBooking.id}`}>
                  <Button
                    variant="primary"
                    size="md"
                    icon={<ArrowRight size={15} />}
                    style={{ backgroundColor: 'var(--accent-forest)', color: '#ffffff' }}
                  >
                    {t('customer.dashboard.upcomingCard.viewBooking', 'View Booking & Itinerary')}
                  </Button>
                </Link>
                <Link to="/customer/bookings">
                  <Button variant="tertiary" size="md">
                    {t('customer.dashboard.quickActions.myBookings', 'My Bookings')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: 'var(--space-8)',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
              marginBottom: 'var(--space-10)',
            }}
          >
            <Compass size={36} style={{ color: 'var(--accent-olive)', margin: '0 auto var(--space-3)' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
              {t('customer.dashboard.noUpcoming', 'No Active Retreat')}
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto var(--space-5)' }}>
              {t('customer.dashboard.noUpcomingDesc', 'You have no upcoming retreats booked. Explore our holistic packages to begin your renewal.')}
            </p>
            <Link to="/retreats">
              <Button variant="primary" size="md">
                {t('customer.dashboard.exploreRetreats', 'Explore Retreats')}
              </Button>
            </Link>
          </div>
        )}

        {/* ====================================================================
            C. Wellness Journey Summary & Safeguard Grid
            ==================================================================== */}
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 400,
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-5)',
          }}
        >
          {t('customer.dashboard.wellnessJourney.title', 'Wellness Care & Readiness')}
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: 'var(--space-6)',
            marginBottom: 'var(--space-10)',
          }}
        >
          {/* Card 1: Health & Dietary Profile Readiness (Safe Summary - No Sensitive Exposure) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={18} style={{ color: 'var(--accent-forest)' }} />
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('customer.dashboard.wellnessJourney.profileStatus', 'Health & Dietary Profile')}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: wellnessProfile.isComplete ? '#2d5a27' : '#b45309',
                    backgroundColor: wellnessProfile.isComplete ? '#eef5ec' : '#fef3c7',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  {wellnessProfile.isComplete
                    ? t('customer.dashboard.wellnessJourney.profileComplete', 'Complete & Active')
                    : t('customer.dashboard.wellnessJourney.profileIncomplete', 'Action Recommended')}
                </span>
              </div>

              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 var(--space-4)' }}>
                {t(
                  'customer.dashboard.wellnessJourney.profileDesc',
                  'Your health considerations and dietary safeguards are securely on file for your therapist and culinary team.'
                )}
              </p>
            </div>

            <Link to="/customer/health-profile">
              <Button variant="secondary" size="sm" icon={<ArrowRight size={13} />}>
                {t('customer.dashboard.wellnessJourney.updateProfile', 'Review Profile')}
              </Button>
            </Link>
          </div>

          {/* Card 2: Spa & Therapy Preview */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
                <HeartPulse size={18} style={{ color: 'var(--accent-olive)' }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {t('customer.dashboard.wellnessJourney.spaPreview', 'Complimentary Daily Treatments')}
                </span>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 var(--space-4)' }}>
                {t(
                  'customer.dashboard.wellnessJourney.spaDesc',
                  '1x Himalayan Salt Stone Therapy & 1x Aromatherapy Herbal Compress reserved.'
                )}
              </p>
            </div>

            <Link to="/customer/spa">
              <Button variant="secondary" size="sm" icon={<ArrowRight size={13} />}>
                {t('customer.nav.spa', 'Spa & Therapy')}
              </Button>
            </Link>
          </div>

          {/* Card 3: Dining & Nutrition Preview */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
                <Utensils size={18} style={{ color: '#b45309' }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {t('customer.dashboard.wellnessJourney.diningPreview', 'Tailored Organic Nutrition')}
                </span>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 var(--space-4)' }}>
                {t(
                  'customer.dashboard.wellnessJourney.diningDesc',
                  'Pescatarian & Gluten-conscious meal plan prepared daily without shellfish exposure.'
                )}
              </p>
            </div>

            <Link to="/customer/dining/menu">
              <Button variant="secondary" size="sm" icon={<ArrowRight size={13} />}>
                {t('customer.nav.dining', 'Nourishing Dining')}
              </Button>
            </Link>
          </div>
        </div>

        {/* ====================================================================
            D. Privacy Safeguard Notice Banner
            ==================================================================== */}
        <PrivacyNotice
          title={t('customer.dashboard.notices.profileSafeguardTitle', 'Privacy Safeguard Active')}
          description={t(
            'customer.dashboard.notices.profileSafeguardDesc',
            'Only certified therapists access your treatment notes. Your culinary team receives only dietary requirements.'
          )}
          variant="highlight"
        />

        {/* ====================================================================
            E. Quick Actions Navigation Grid
            ==================================================================== */}
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
            fontWeight: 400,
            color: 'var(--text-primary)',
            margin: 'var(--space-8) 0 var(--space-4)',
          }}
        >
          {t('customer.dashboard.quickActions.title', 'Quick Actions')}
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          <Link to="/customer/bookings" style={{ textDecoration: 'none' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                transition: 'all 0.2s ease',
              }}
            >
              <Calendar size={18} style={{ color: 'var(--accent-forest)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {t('customer.dashboard.quickActions.myBookings', 'My Bookings')}
              </span>
            </div>
          </Link>

          <Link to="/customer/health-profile" style={{ textDecoration: 'none' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                transition: 'all 0.2s ease',
              }}
            >
              <HeartPulse size={18} style={{ color: 'var(--accent-olive)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {t('customer.dashboard.quickActions.wellnessProfile', 'Wellness Profile')}
              </span>
            </div>
          </Link>

          <Link to="/customer/account" style={{ textDecoration: 'none' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                transition: 'all 0.2s ease',
              }}
            >
              <Settings size={18} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {t('customer.dashboard.quickActions.accountSettings', 'Account Settings')}
              </span>
            </div>
          </Link>

          <Link to="/retreats" style={{ textDecoration: 'none' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                transition: 'all 0.2s ease',
              }}
            >
              <Compass size={18} style={{ color: 'var(--accent-forest)' }} />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {t('customer.dashboard.quickActions.browsePackages', 'Browse Retreats')}
              </span>
            </div>
          </Link>
        </div>
      </Container>
    </div>
  );
};
