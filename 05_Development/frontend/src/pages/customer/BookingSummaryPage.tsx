import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Building2,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Lock,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { CustomerPageHeader } from '../../components/customer/CustomerPageHeader';
import { PaymentSummary } from '../../components/customer/PaymentSummary';
import { useCustomer } from '../../context/CustomerContext';
import { MOCK_RETREAT_PACKAGES } from '../../data/mockRetreats';
import { formatVND } from '../../i18n';

type SupportedLanguage = 'vi' | 'en' | 'zh-CN' | 'ja' | 'fr';

interface DraftBookingData {
  retreatSlug: string;
  retreatName: Record<string, string>;
  heroImage: string;
  startDate: string;
  endDate: string;
  days: number;
  nights: number;
  villaType: Record<string, string>;
  villaNumber?: string;
  customerCount: number;
  totalPrice: number;
  depositAmount: number;
  remainingBalance: number;
  specialRequests?: string;
  arrivalNotes?: string;
}

export const BookingSummaryPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLanguage;
  const navigate = useNavigate();
  const { profile, createBooking } = useCustomer();

  const [draft, setDraft] = useState<DraftBookingData | null>(null);
  const [isVnpayModalOpen, setIsVnpayModalOpen] = useState(false);
  const [vnpayMethod, setVnpayMethod] = useState<'qr' | 'atm' | 'card'>('qr');
  const [simulationState, setSimulationState] = useState<'idle' | 'processing' | 'success' | 'failure'>('idle');

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('hsw_draft_booking');
      if (stored) {
        setDraft(JSON.parse(stored));
      } else {
        // Fallback default if accessed directly
        const defaultPkg = MOCK_RETREAT_PACKAGES[0];
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() + 14);
        const end = new Date(start);
        end.setDate(start.getDate() + defaultPkg.nights);

        const fallbackDraft: DraftBookingData = {
          retreatSlug: defaultPkg.slug,
          retreatName: defaultPkg.names,
          heroImage: defaultPkg.heroImage,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          days: defaultPkg.days,
          nights: defaultPkg.nights,
          villaType: defaultPkg.villaName,
          villaNumber: 'Villa #102',
          customerCount: 1,
          totalPrice: defaultPkg.startingPrice,
          depositAmount: Math.round(defaultPkg.startingPrice * 0.3),
          remainingBalance: defaultPkg.startingPrice - Math.round(defaultPkg.startingPrice * 0.3),
          specialRequests: 'Quiet villa location requested',
          arrivalNotes: 'Arrival at 14:00',
        };
        setDraft(fallbackDraft);
      }
    } catch {
      // Fallback
    }
  }, []);

  if (!draft) {
    return (
      <div style={{ padding: 'var(--space-16) 0', textAlign: 'center' }}>
        <Container size="standard">
          <p>{t('common.loading', 'Loading reservation details...')}</p>
        </Container>
      </div>
    );
  }

  const pkgTitle = draft.retreatName[lang] || draft.retreatName.en || draft.retreatName.vi;
  const villaTitle = draft.villaType[lang] || draft.villaType.en || draft.villaType.vi;

  const handleOpenPayment = () => {
    setIsVnpayModalOpen(true);
    setSimulationState('idle');
  };

  const handleSimulatePayment = (outcome: 'success' | 'failure') => {
    setSimulationState('processing');

    setTimeout(() => {
      if (outcome === 'success') {
        const fullPkg = MOCK_RETREAT_PACKAGES.find((p) => p.slug === draft.retreatSlug) || MOCK_RETREAT_PACKAGES[0];
        
        // Transform fullPkg.itinerary to customer ItineraryDay[]
        const adaptedItinerary = fullPkg.itinerary.map((d) => ({
          day: d.day,
          title: {
            vi: d.title.vi || `Ngày ${d.day}`,
            en: d.title.en || `Day ${d.day}`,
            'zh-CN': d.title['zh-CN'] || `第 ${d.day} 天`,
            ja: d.title.ja || `${d.day}日目`,
            fr: d.title.fr || `Jour ${d.day}`,
          },
          activities: [
            {
              time: '07:30',
              name: {
                vi: 'Khởi Động Thân Tâm & Thiền Định Buổi Sáng',
                en: 'Morning Pranayama & Sunrise Meditation',
                'zh-CN': '晨间呼吸调息与日出冥想',
                ja: '朝のプラーナヤーマ＆瞑想',
                fr: 'Méditation Matinale au Lever du Soleil',
              },
              type: 'mindfulness' as const,
              location: 'Lotus Lake Pavilion',
            },
            {
              time: '14:30',
              name: {
                vi: 'Trị Liệu Dưỡng Sinh Toàn Diện',
                en: 'Personalized Holistic Therapy Ritual',
                'zh-CN': '量身定制全息草本疗愈',
                ja: 'ホリスティック・トリートメント',
                fr: 'Rituel Thérapeutique Holistique',
              },
              type: 'spa' as const,
              location: 'Herbal Sanctuary Treatment Suites',
            },
            {
              time: '18:30',
              name: {
                vi: 'Bữa Tối Dưỡng Sinh Thực Dưỡng',
                en: 'Organic Farm-to-Table Nourishing Dinner',
                'zh-CN': '有机农场采摘滋养晚餐',
                ja: 'オーガニック滋養ディナー',
                fr: 'Dîner Biologique Ferme-à-Table',
              },
              type: 'dining' as const,
              location: 'The Botanical Pavilion',
            },
          ],
        }));

        const newBooking = createBooking({
          retreatSlug: draft.retreatSlug,
          retreatName: {
            vi: draft.retreatName.vi || pkgTitle,
            en: draft.retreatName.en || pkgTitle,
            'zh-CN': draft.retreatName['zh-CN'] || pkgTitle,
            ja: draft.retreatName.ja || pkgTitle,
            fr: draft.retreatName.fr || pkgTitle,
          },
          heroImage: draft.heroImage,
          startDate: draft.startDate,
          endDate: draft.endDate,
          days: draft.days,
          nights: draft.nights,
          villaType: {
            vi: draft.villaType.vi || villaTitle,
            en: draft.villaType.en || villaTitle,
            'zh-CN': draft.villaType['zh-CN'] || villaTitle,
            ja: draft.villaType.ja || villaTitle,
            fr: draft.villaType.fr || villaTitle,
          },
          villaNumber: draft.villaNumber || 'Villa #102',
          status: 'upcoming',
          totalPrice: draft.totalPrice,
          depositAmount: draft.depositAmount,
          remainingBalance: draft.remainingBalance,
          depositStatus: 'paid',
          paymentDetails: {
            transactionId: `VNPAY-${Date.now().toString().slice(-8)}`,
            paymentMethod:
              vnpayMethod === 'qr'
                ? 'VNPay QR Code'
                : vnpayMethod === 'atm'
                ? 'Local Domestic Banking (ATM)'
                : 'International Credit Card',
            paidAt: new Date().toISOString(),
            cardLast4: '8821',
          },
          specialRequests: draft.specialRequests,
          arrivalNotes: draft.arrivalNotes,
          itinerary: adaptedItinerary,
        });

        // Clear draft
        sessionStorage.removeItem('hsw_draft_booking');
        setIsVnpayModalOpen(false);

        // Navigate to Screen 17 with success
        navigate(`/customer/booking/deposit-result?ref=${newBooking.bookingReference}&status=success`);
      } else {
        setIsVnpayModalOpen(false);
        const tempRef = `HSW-TMP-${Date.now().toString().slice(-5)}`;
        navigate(`/customer/booking/deposit-result?ref=${tempRef}&status=failed`);
      }
    }, 1200);
  };

  return (
    <div className="hsw-booking-summary-page" style={{ padding: 'var(--space-6) 0 var(--space-16)' }}>
      <Container size="standard">
        <CustomerPageHeader
          badge={t('customer.bookingSummary.badge', 'Step 2 of 3 · Review & Deposit')}
          title={t('customer.bookingSummary.title', 'Booking Summary & Deposit')}
          subtitle={t('customer.bookingSummary.subtitle', 'Review your retreat reservation details before confirming your 30% deposit.')}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
            gap: 'var(--space-8)',
            alignItems: 'flex-start',
          }}
        >
          {/* Left Column: Booking Details Review */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* 1. Retreat Overview Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                <img
                  src={draft.heroImage}
                  alt={pkgTitle}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
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
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(8px)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}
                  >
                    {t('customer.bookingSummary.retreatPackage', 'Retreat Package')}
                  </span>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 500, margin: 0 }}>
                    {pkgTitle}
                  </h2>
                </div>
              </div>

              <div style={{ padding: 'var(--space-6)' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 'var(--space-4)',
                    marginBottom: 'var(--space-6)',
                    paddingBottom: 'var(--space-4)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                      <Calendar size={13} />
                      <span>{t('customer.bookingForm.checkInDate', 'Arrival Date')}</span>
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {draft.startDate}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                      <Calendar size={13} />
                      <span>{t('customer.bookingForm.checkOutDate', 'Departure Date')}</span>
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {draft.endDate}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                      <Clock size={13} />
                      <span>{t('customer.bookingSummary.duration', 'Duration')}</span>
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {draft.days} {t('labels.days', 'Days')} · {draft.nights} {t('labels.nights', 'Nights')}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                      <Building2 size={13} />
                      <span>{t('customer.bookingSummary.villa', 'Accommodation')}</span>
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {villaTitle}
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-3)' }}>
                    <User size={15} style={{ color: 'var(--accent-forest)' }} />
                    <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {t('customer.bookingSummary.customer', 'Customer Details')}
                    </h3>
                  </div>

                  <div
                    style={{
                      backgroundColor: 'var(--bg-soft)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 'var(--space-3) var(--space-4)',
                      fontSize: 'var(--text-xs)',
                      lineHeight: 1.6,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <div><strong>{profile.fullName}</strong></div>
                    <div>{profile.email} · {profile.phone}</div>
                    {draft.specialRequests && (
                      <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed var(--border-subtle)' }}>
                        <strong>{t('customer.bookingForm.specialRequests', 'Special Requests')}:</strong> {draft.specialRequests}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Deposit Channel Notice */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-6)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
                <CreditCard size={18} style={{ color: 'var(--accent-forest)' }} />
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {t('customer.bookingSummary.depositSection', 'Deposit Payment Method')}
                </h3>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 var(--space-4)' }}>
                {t('customer.bookingSummary.paymentMethodHint', 'Pay 30% deposit securely via VNPay Hospitality Gateway.')}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'rgba(44, 76, 56, 0.04)',
                  border: '1px solid rgba(44, 76, 56, 0.15)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    fontWeight: 700,
                    fontSize: '11px',
                    color: '#005baa',
                  }}
                >
                  VNPAY
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    VNPay Hospitality Gateway
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    QR Code · Local ATM Cards · Visa / MasterCard / JCB
                  </div>
                </div>
              </div>
            </div>

            {/* Back link */}
            <div>
              <Link
                to="/customer/booking/new"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                }}
              >
                <ArrowLeft size={14} />
                <span>{t('customer.bookingDetail.backToList', 'Modify reservation details')}</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Price & Deposit Breakdown + Pay CTA */}
          <div>
            <PaymentSummary
              totalPrice={draft.totalPrice}
              depositAmount={draft.depositAmount}
              highlightDeposit={true}
            />

            <div style={{ marginTop: 'var(--space-6)' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={handleOpenPayment}
                icon={<ArrowRight size={16} />}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--accent-forest)',
                  color: '#ffffff',
                  fontWeight: 600,
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                {t('customer.bookingSummary.payDepositBtn', 'Pay Deposit via VNPay (30%)')}
              </Button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: 'var(--space-3)',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                }}
              >
                <Lock size={12} />
                <span>{t('customer.payment.sslGuarantee', 'Encrypted & Certified VNPay Hospitality Transaction')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* VNPay Simulated Payment Modal */}
        {isVnpayModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vnpay-modal-title"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 19, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-4)',
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                maxWidth: '480px',
                width: '100%',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                position: 'relative',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  backgroundColor: '#005baa',
                  color: '#ffffff',
                  padding: 'var(--space-4) var(--space-6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, letterSpacing: '1px' }}>VNPAY</span>
                  <span style={{ fontSize: '11px', opacity: 0.85 }}>| Gateway Sandbox</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVnpayModalOpen(false)}
                  disabled={simulationState === 'processing'}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                  }}
                  aria-label={t('common.close', 'Close')}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: 'var(--space-6)' }}>
                <h3
                  id="vnpay-modal-title"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 500,
                    margin: '0 0 var(--space-2)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {t('customer.bookingSummary.vnpayModal.title', 'VNPay Hospitality Gateway (Simulation)')}
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '0 0 var(--space-4)' }}>
                  {t('customer.bookingSummary.vnpayModal.desc', 'Select a simulated payment method to complete your retreat deposit of')}{' '}
                  <strong style={{ color: 'var(--accent-forest)' }}>
                    {formatVND(draft.depositAmount, i18n.language)}
                  </strong>
                </p>

                {/* Simulated Payment Methods */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                  <button
                    type="button"
                    onClick={() => setVnpayMethod('qr')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-sm)',
                      border: `1.5px solid ${vnpayMethod === 'qr' ? 'var(--accent-forest)' : 'var(--border-subtle)'}`,
                      backgroundColor: vnpayMethod === 'qr' ? 'rgba(44, 76, 56, 0.05)' : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <QrCode size={20} style={{ color: 'var(--accent-forest)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {t('customer.bookingSummary.vnpayModal.methodQr', 'VNPay QR Code')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Scan via banking app (Vietcombank, Techcombank, BIDV, etc.)
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVnpayMethod('atm')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-sm)',
                      border: `1.5px solid ${vnpayMethod === 'atm' ? 'var(--accent-forest)' : 'var(--border-subtle)'}`,
                      backgroundColor: vnpayMethod === 'atm' ? 'rgba(44, 76, 56, 0.05)' : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <Building2 size={20} style={{ color: 'var(--accent-forest)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {t('customer.bookingSummary.vnpayModal.methodAtm', 'Local Domestic ATM / Internet Banking')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Over 40 Vietnamese domestic commercial banks
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVnpayMethod('card')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-sm)',
                      border: `1.5px solid ${vnpayMethod === 'card' ? 'var(--accent-forest)' : 'var(--border-subtle)'}`,
                      backgroundColor: vnpayMethod === 'card' ? 'rgba(44, 76, 56, 0.05)' : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <CreditCard size={20} style={{ color: 'var(--accent-forest)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {t('customer.bookingSummary.vnpayModal.methodCard', 'Visa / MasterCard / JCB')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Global international cards with 3D Secure
                      </div>
                    </div>
                  </button>
                </div>

                {/* Simulation Control Notice */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-soft)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-3)',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    marginBottom: 'var(--space-6)',
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                    <ShieldCheck size={13} />
                    <span>Prototype Simulation Mode</span>
                  </div>
                  {t('customer.bookingSummary.vnpayModal.secureNotice', 'Simulated sandbox transaction. No real funds or credit cards will be charged.')}
                </div>

                {/* Actions */}
                {simulationState === 'processing' ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                    <div
                      style={{
                        display: 'inline-block',
                        width: '28px',
                        height: '28px',
                        border: '3px solid rgba(44, 76, 56, 0.2)',
                        borderTopColor: 'var(--accent-forest)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        marginBottom: 'var(--space-2)',
                      }}
                    />
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--accent-forest)' }}>
                      Connecting to VNPay secure host & verifying deposit...
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <button
                      type="button"
                      onClick={() => handleSimulatePayment('success')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--accent-forest)',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>{t('customer.bookingSummary.vnpayModal.methodSimulateSuccess', 'Simulate Successful Deposit')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSimulatePayment('failure')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'transparent',
                        color: '#b91c1c',
                        border: '1px solid rgba(185, 28, 28, 0.3)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <AlertTriangle size={14} />
                      <span>{t('customer.bookingSummary.vnpayModal.methodSimulateFailure', 'Simulate Payment Failure / Cancel')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};
