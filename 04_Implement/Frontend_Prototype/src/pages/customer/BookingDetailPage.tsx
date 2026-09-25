import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Sparkles,
  Utensils,
  HeartHandshake,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { CustomerPageHeader } from '../../components/customer/CustomerPageHeader';
import { BookingStatusChip } from '../../components/customer/BookingStatusChip';
import { PaymentSummary } from '../../components/customer/PaymentSummary';
import { TimelineItinerary } from '../../components/customer/TimelineItinerary';
import { useCustomer } from '../../context/CustomerContext';

type SupportedLanguage = 'vi' | 'en' | 'zh-CN' | 'ja' | 'fr';

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLanguage;
  const navigate = useNavigate();
  const { getBookingById, activeBooking, bookings } = useCustomer();

  // Find booking by ID or Reference, or fallback to active/first booking
  const booking = (id ? getBookingById(id) : null) || activeBooking || bookings[0];

  if (!booking) {
    return (
      <div style={{ padding: 'var(--space-16) 0', textAlign: 'center' }}>
        <Container size="standard">
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-4)' }}>
            Booking Not Found
          </h2>
          <Button variant="primary" onClick={() => navigate('/customer/bookings')}>
            {t('customer.bookingDetail.backToList', 'Back to My Bookings')}
          </Button>
        </Container>
      </div>
    );
  }

  const pkgTitle = booking.retreatName[lang] || booking.retreatName.en || booking.retreatName.vi;
  const villaTitle = booking.villaType[lang] || booking.villaType.en || booking.villaType.vi;

  return (
    <div className="hsw-booking-detail-page" style={{ padding: 'var(--space-6) 0 var(--space-16)' }}>
      <Container size="standard">
        {/* Back Link */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Link
            to="/customer/bookings"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--accent-forest)',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} />
            <span>{t('customer.bookingDetail.backToList', 'Back to My Bookings')}</span>
          </Link>
        </div>

        {/* Header with Status */}
        <CustomerPageHeader
          badge={`${t('customer.depositResult.bookingRef', 'Ref')}: ${booking.bookingReference}`}
          title={pkgTitle}
          subtitle={`${booking.startDate} → ${booking.endDate} · ${booking.days} ${t('labels.days', 'Days')} / ${booking.nights} ${t('labels.nights', 'Nights')}`}
          action={
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <BookingStatusChip status={booking.status} />
              <BookingStatusChip depositStatus={booking.depositStatus} />
            </div>
          }
        />

        {/* Main Grid: Details & Itinerary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: 'var(--space-8)',
            alignItems: 'flex-start',
          }}
        >
          {/* Left Column: Sanctuary Villa & Daily Itinerary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            {/* 1. Sanctuary Villa Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ position: 'relative', height: '200px' }}>
                <img
                  src={booking.heroImage}
                  alt={villaTitle}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'var(--space-3)',
                    right: 'var(--space-3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(4px)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--accent-forest)',
                  }}
                >
                  {booking.villaNumber || 'Villa #102'}
                </div>
              </div>

              <div style={{ padding: 'var(--space-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-2)' }}>
                  <Building2 size={16} style={{ color: 'var(--accent-forest)' }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
                    {villaTitle}
                  </h3>
                </div>

                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 var(--space-4)' }}>
                  Private eco-luxury sanctuary nestled among pine woods and tranquil waters. Features an infinity plunge pool, herbal steam shower, and dedicated mindfulness pavilion.
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: 'var(--space-3)',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-soft)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div>✓ King Organic Bed</div>
                  <div>✓ Private Pool & Deck</div>
                  <div>✓ Herbal Tea Bar</div>
                  <div>✓ Daily Turndown Ritual</div>
                </div>

                {booking.specialRequests && (
                  <div style={{ marginTop: 'var(--space-4)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <strong>Special Requests on File:</strong> {booking.specialRequests}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Daily Itinerary Timeline */}
            <div>
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: 'var(--accent-forest)' }}>
                  {t('customer.bookingDetail.badge', 'Retreat Itinerary')}
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 500, margin: '2px 0 0', color: 'var(--text-primary)' }}>
                  {t('customer.bookingDetail.itinerarySection', 'Personalized Retreat Itinerary')}
                </h2>
              </div>

              <TimelineItinerary days={booking.itinerary} />
            </div>
          </div>

          {/* Right Column: Financial Breakdown & Cross-Module Portals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', position: 'sticky', top: '90px' }}>
            {/* Payment Summary */}
            <PaymentSummary
              totalPrice={booking.totalPrice}
              depositAmount={booking.depositAmount}
              highlightDeposit={false}
            />

            {/* Transaction Verification Info */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-5)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
                <ShieldCheck size={18} style={{ color: 'var(--accent-forest)' }} />
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {t('customer.depositResult.paymentDate', 'Payment Details')}
                </h4>
              </div>

              <div style={{ fontSize: '11px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                <div>
                  <strong>{t('customer.depositResult.transactionId', 'Transaction ID')}:</strong>{' '}
                  <span style={{ fontFamily: 'monospace' }}>
                    {booking.paymentDetails?.transactionId || 'VNPAY-98421038'}
                  </span>
                </div>
                <div>
                  <strong>{t('customer.depositResult.paymentMethod', 'Channel')}:</strong>{' '}
                  {booking.paymentDetails?.paymentMethod || 'VNPay Hospitality Gateway'}
                </div>
                <div>
                  <strong>{t('customer.depositResult.paymentDate', 'Paid Date')}:</strong>{' '}
                  {booking.paymentDetails?.paidAt ? new Date(booking.paymentDetails.paidAt).toLocaleDateString() : 'Confirmed'}
                </div>
              </div>

              <div
                style={{
                  marginTop: 'var(--space-4)',
                  paddingTop: 'var(--space-3)',
                  borderTop: '1px dashed var(--border-subtle)',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                }}
              >
                {t('customer.depositResult.importantNotice', 'Deposit payment secures your reservation. The remaining 70% balance is settled comfortably at resort reception upon check-in.')}
              </div>
            </div>

            {/* Cross-Module Integration Actions (M3 & M4 Placeholders) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-5)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: 'var(--accent-forest)', marginBottom: 'var(--space-3)' }}>
                {t('customer.bookingDetail.crossModuleTitle', 'Complementary Wellness Modules')}
              </div>

              {/* Spa Link */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) 0',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <Sparkles size={16} style={{ color: 'var(--accent-forest)', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('customer.bookingDetail.crossSpaTitle', 'Spa & Holistic Therapies')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                    {t('customer.bookingDetail.crossSpaDesc', 'Explore complimentary daily treatments or reserve additional restorative sessions.')}
                  </div>
                  <Link
                    to="/customer/spa"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--accent-forest)',
                      textDecoration: 'none',
                    }}
                  >
                    <span>{t('customer.bookingDetail.crossSpaBtn', 'View Spa Sessions')}</span>
                    <ArrowLeft size={10} style={{ transform: 'rotate(180deg)' }} />
                  </Link>
                </div>
              </div>

              {/* Dining Link */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) 0',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <Utensils size={16} style={{ color: 'var(--accent-forest)', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('customer.bookingDetail.crossDiningTitle', 'Nourishing Dining & Meal Plans')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                    {t('customer.bookingDetail.crossDiningDesc', 'Browse executive chef botanical menus aligned with your dietary profile.')}
                  </div>
                  <Link
                    to="/customer/dining/menu"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--accent-forest)',
                      textDecoration: 'none',
                    }}
                  >
                    <span>{t('customer.bookingDetail.crossDiningBtn', 'View Dining Menu')}</span>
                    <ArrowLeft size={10} style={{ transform: 'rotate(180deg)' }} />
                  </Link>
                </div>
              </div>

              {/* Health Profile Link */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-3)',
                  paddingTop: 'var(--space-3)',
                }}
              >
                <HeartHandshake size={16} style={{ color: 'var(--accent-forest)', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {t('customer.bookingDetail.healthProfileHint', 'Your treatments and meals are prepared according to your confidential Wellness Profile.')}
                  </div>
                  <Link
                    to="/customer/health-profile"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--accent-forest)',
                      textDecoration: 'none',
                      marginTop: '4px',
                    }}
                  >
                    <span>{t('customer.dashboard.wellnessJourney.updateProfile', 'Review Profile')}</span>
                    <ArrowLeft size={10} style={{ transform: 'rotate(180deg)' }} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};
