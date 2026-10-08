import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCustomer } from '../../context/CustomerContext';
import { MOCK_RETREAT_PACKAGES } from '../../data/mockRetreats';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { CustomerPageHeader } from '../../components/customer/CustomerPageHeader';
import { PaymentSummary } from '../../components/customer/PaymentSummary';
import { formatVND } from '../../i18n';
import {
  Calendar,
  Sparkles,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  Home,
  Info,
} from 'lucide-react';

export const RetreatBookingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language as 'vi' | 'en' | 'zh-CN' | 'ja' | 'fr') || 'en';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile, wellnessProfile } = useCustomer();

  const retreatParam = searchParams.get('retreat') || 'mindful-essence';
  const initialPackage =
    MOCK_RETREAT_PACKAGES.find((pkg) => pkg.slug === retreatParam) ||
    MOCK_RETREAT_PACKAGES[0];

  const [selectedPkg, setSelectedPkg] = useState(initialPackage);

  // Default start date: 2026-11-06 (Friday)
  const [startDate, setStartDate] = useState('2026-11-06');
  const [customerCount, setCustomerCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [arrivalNotes, setArrivalNotes] = useState('');

  // Calculate check-out date based on package nights
  const calculateEndDate = (start: string, nights: number) => {
    try {
      const d = new Date(start);
      d.setDate(d.getDate() + nights);
      return d.toISOString().split('T')[0];
    } catch {
      return start;
    }
  };

  const endDate = calculateEndDate(startDate, selectedPkg.nights);
  const totalPrice = selectedPkg.startingPrice * customerCount;
  const depositAmount = Math.round(totalPrice * 0.3); // 30% deposit standard

  const handlePackageChange = (slug: string) => {
    const pkg = MOCK_RETREAT_PACKAGES.find((p) => p.slug === slug);
    if (pkg) setSelectedPkg(pkg);
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare draft booking state for Screen 16
    const draftBooking = {
      retreatSlug: selectedPkg.slug,
      retreatName: selectedPkg.names,
      heroImage: selectedPkg.heroImage,
      startDate,
      endDate,
      days: selectedPkg.days,
      nights: selectedPkg.nights,
      villaType: selectedPkg.villaName,
      villaNumber: 'Villa #102',
      customerCount,
      totalPrice,
      depositAmount,
      remainingBalance: totalPrice - depositAmount,
      specialRequests,
      arrivalNotes,
    };

    // Store in session storage for multi-step booking continuity
    sessionStorage.setItem('hsw_draft_booking', JSON.stringify(draftBooking));

    navigate('/customer/booking/summary');
  };

  const pkgTitle = selectedPkg.names[lang] || selectedPkg.names.en || selectedPkg.names.vi;
  const villaTitle = selectedPkg.villaName[lang] || selectedPkg.villaName.en || selectedPkg.villaName.vi;

  return (
    <div className="hsw-booking-form-page" style={{ padding: 'var(--space-6) 0 var(--space-16)' }}>
      <Container size="standard">
        <CustomerPageHeader
          badge={t('customer.bookingForm.badge', 'Step 1 of 3 · Reservation Details')}
          title={t('customer.bookingForm.title', 'Reserve Your Retreat Experience')}
          subtitle={t('customer.bookingForm.subtitle', 'Select your dates and customize your restorative journey.')}
        />

        <form onSubmit={handleContinue}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
              gap: 'var(--space-8)',
              alignItems: 'flex-start',
            }}
          >
            {/* Left Column: Form Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* 1. Selected Retreat Package Selector */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <Sparkles size={18} style={{ color: 'var(--accent-forest)' }} />
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
                    {t('customer.bookingForm.selectedPackage', 'Selected Retreat Package')}
                  </h2>
                </div>

                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <select
                    value={selectedPkg.slug}
                    onChange={(e) => handlePackageChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      backgroundColor: '#ffffff',
                    }}
                  >
                    {MOCK_RETREAT_PACKAGES.map((pkg) => (
                      <option key={pkg.slug} value={pkg.slug}>
                        {pkg.names[lang] || pkg.names.en || pkg.names.vi} ({pkg.days} {t('labels.days', 'Days')} / {pkg.nights} {t('labels.nights', 'Nights')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Package Quick Card */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--bg-soft)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <img
                    src={selectedPkg.heroImage}
                    alt={pkgTitle}
                    style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {pkgTitle}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-olive)', fontWeight: 600 }}>
                      {selectedPkg.days} {t('labels.days', 'Days')} · {selectedPkg.nights} {t('labels.nights', 'Nights')} · {formatVND(selectedPkg.startingPrice, i18n.language)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Dates & Duration Section */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <Calendar size={18} style={{ color: 'var(--accent-olive)' }} />
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
                    {t('customer.bookingForm.datesSection', 'Stay Dates & Duration')}
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {t('customer.bookingForm.checkInDate', 'Arrival Date')}
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-sm)',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {t('customer.bookingForm.checkOutDate', 'Departure Date')}
                    </label>
                    <input
                      type="text"
                      value={endDate}
                      disabled
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-sm)',
                        backgroundColor: 'var(--bg-soft)',
                        color: 'var(--text-secondary)',
                      }}
                    />
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Info size={13} />
                  <span>Check-in begins at 14:00. Check-out is until 12:00 noon.</span>
                </div>
              </div>

              {/* 3. Primary Customer Info (Pre-filled) */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <UserCheck size={18} style={{ color: 'var(--accent-forest)' }} />
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
                    {t('customer.bookingForm.customerInfoSection', 'Primary Customer Details')}
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {t('customer.account.fullName', 'Full Name')}
                    </label>
                    <input
                      type="text"
                      value={profile.fullName}
                      disabled
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-sm)',
                        backgroundColor: 'var(--bg-soft)',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {t('customer.account.email', 'Email Address')}
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-sm)',
                        backgroundColor: 'var(--bg-soft)',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {t('customer.account.phone', 'Phone Number')}
                    </label>
                    <input
                      type="text"
                      value={profile.phone}
                      disabled
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-sm)',
                        backgroundColor: 'var(--bg-soft)',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Number of Customers / Travelers
                    </label>
                    <select
                      value={customerCount}
                      onChange={(e) => setCustomerCount(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-sm)',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <option value={1}>1 Adult (Private Sanctuary)</option>
                      <option value={2}>2 Adults (Couples / Shared Villa)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Wellness Readiness Status Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-4) var(--space-5)',
                  backgroundColor: wellnessProfile.isComplete ? '#eef5ec' : '#fffbeb',
                  border: `1px solid ${wellnessProfile.isComplete ? '#c7e2be' : '#fde68a'}`,
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <ShieldCheck size={22} style={{ color: wellnessProfile.isComplete ? '#2d5a27' : '#b45309' }} />
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: wellnessProfile.isComplete ? '#2d5a27' : '#92400e' }}>
                      {wellnessProfile.isComplete
                        ? t('customer.bookingForm.wellnessComplete', 'Health & Dietary Profile is Complete')
                        : t('customer.bookingForm.wellnessIncomplete', 'Health Profile Recommended')}
                    </div>
                    <div style={{ fontSize: '11px', color: wellnessProfile.isComplete ? '#2d5a27' : '#78350f' }}>
                      Allergy precautions and therapist notes are ready for your stay.
                    </div>
                  </div>
                </div>

                <Link
                  to="/customer/health-profile"
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: wellnessProfile.isComplete ? '#2d5a27' : '#92400e',
                    textDecoration: 'underline',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('customer.bookingForm.wellnessLink', 'Review Profile')}
                </Link>
              </div>

              {/* 5. Personalized Preferences */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <Home size={18} style={{ color: 'var(--accent-olive)' }} />
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
                    {t('customer.bookingForm.preferencesSection', 'Personalized Retreat Requests')}
                  </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {t('customer.bookingForm.villaAssigned', 'Selected Villa Type')}
                    </label>
                    <input
                      type="text"
                      value={villaTitle}
                      disabled
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-sm)',
                        backgroundColor: 'var(--bg-soft)',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {t('customer.bookingForm.specialRequests', 'Special Requests / Celebrations')}
                    </label>
                    <textarea
                      rows={2}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder={t('customer.bookingForm.specialRequestsHint', 'e.g., quiet zone villa, anniversary welcome, extra buckwheat pillow')}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-sm)',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {t('customer.bookingForm.arrivalNotes', 'Estimated Arrival Time & Transport')}
                    </label>
                    <input
                      type="text"
                      value={arrivalNotes}
                      onChange={(e) => setArrivalNotes(e.target.value)}
                      placeholder={t('customer.bookingForm.arrivalNotesHint', 'e.g., Noi Bai Airport pickup requested at 14:00')}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-sm)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Price Breakdown & CTA */}
            <div style={{ position: 'sticky', top: '90px' }}>
              <PaymentSummary
                totalPrice={totalPrice}
                depositAmount={depositAmount}
                highlightDeposit={true}
              />

              <div style={{ marginTop: 'var(--space-6)' }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="hsw-btn-retreat-primary hsw-btn-retreat-hero"
                  icon={<ArrowRight size={17} />}
                  style={{ width: '100%' }}
                >
                  {t('customer.bookingForm.continueBtn', 'Continue to Booking Summary & Deposit')}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Container>
    </div>
  );
};
