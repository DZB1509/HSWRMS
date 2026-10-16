import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Building2,
  ArrowRight,
  Sparkles,
  Search,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { CustomerPageHeader } from '../../components/customer/CustomerPageHeader';
import { BookingStatusChip } from '../../components/customer/BookingStatusChip';
import { useCustomer } from '../../context/CustomerContext';
import { formatVND } from '../../i18n';

type SupportedLanguage = 'vi' | 'en' | 'zh-CN' | 'ja' | 'fr';
type FilterTab = 'all' | 'upcoming' | 'completed' | 'cancelled';

export const MyBookingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLanguage;
  const navigate = useNavigate();
  const { bookings } = useCustomer();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBookings = bookings.filter((b) => {
    // Tab filter
    if (activeTab === 'upcoming') {
      if (b.status !== 'upcoming' && b.status !== 'in_stay') return false;
    } else if (activeTab === 'completed') {
      if (b.status !== 'completed') return false;
    } else if (activeTab === 'cancelled') {
      if (b.status !== 'cancelled') return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const pkgName = (b.retreatName[lang] || b.retreatName.en || b.retreatName.vi).toLowerCase();
      const ref = b.bookingReference.toLowerCase();
      return pkgName.includes(q) || ref.includes(q);
    }

    return true;
  });

  return (
    <div className="hsw-my-bookings-page" style={{ padding: 'var(--space-6) 0 var(--space-16)' }}>
      <Container size="standard">
        <CustomerPageHeader
          badge={t('customer.bookingsList.badge', 'My Wellness Itineraries')}
          title={t('customer.bookingsList.title', 'My Bookings')}
          subtitle={t('customer.bookingsList.subtitle', 'Track your confirmed, upcoming, and past restorative retreat journeys.')}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/customer/retreats')}
              icon={<Sparkles size={14} />}
              style={{
                borderColor: 'var(--accent-forest)',
                color: 'var(--accent-forest)',
                fontWeight: 600,
              }}
            >
              {t('customer.bookingsList.bookNewRetreat', 'Explore & Book Retreats')}
            </Button>
          }
        />

        {/* Filter Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-8)',
            backgroundColor: 'var(--surface)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {(
              [
                { id: 'all', label: t('customer.bookingsList.filterAll', 'All Journeys') },
                { id: 'upcoming', label: t('customer.bookingsList.filterUpcoming', 'Upcoming & Active') },
                { id: 'completed', label: t('customer.bookingsList.filterCompleted', 'Completed') },
                { id: 'cancelled', label: t('customer.bookingsList.filterCancelled', 'Cancelled') },
              ] as { id: FilterTab; label: string }[]
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--accent-forest)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '220px', flex: '0 1 260px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference or package..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: 'var(--text-xs)',
                backgroundColor: 'var(--bg-soft)',
              }}
            />
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-12) var(--space-6)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-soft)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                marginBottom: 'var(--space-3)',
              }}
            >
              <Calendar size={22} />
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-lg)',
                fontWeight: 500,
                color: 'var(--text-primary)',
                margin: '0 0 var(--space-2)',
              }}
            >
              {t('customer.bookingsList.emptyTitle', 'No Bookings Found')}
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto var(--space-4)' }}>
              {t('customer.bookingsList.emptyDesc', 'You have no bookings matching the selected category.')}
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/customer/retreats')}
              style={{
                backgroundColor: 'var(--accent-forest)',
                color: '#ffffff',
                fontWeight: 600,
              }}
            >
              {t('customer.bookingsList.bookNewRetreat', 'Explore & Book Retreats')}
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {filteredBookings.map((b) => {
              const pkgName = b.retreatName[lang] || b.retreatName.en || b.retreatName.vi;
              const villaName = b.villaType[lang] || b.villaType.en || b.villaType.vi;

              return (
                <div
                  key={b.id}
                  className="customer-booking-card"
                  id={`booking-card-${b.id}`}
                >
                  {/* Left Column: Image */}
                  <div className="customer-booking-card-media">
                    <img
                      src={b.heroImage}
                      alt={pkgName}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 'var(--space-3)',
                        left: 'var(--space-3)',
                        display: 'flex',
                        gap: '6px',
                      }}
                    >
                      <BookingStatusChip status={b.status} />
                    </div>
                  </div>

                  {/* Middle Column: Details */}
                  <div
                    style={{
                      padding: 'var(--space-6)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRight: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          marginBottom: 'var(--space-2)',
                        }}
                      >
                        <span style={{ fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
                          {t('customer.bookingsList.ref', 'Ref')}: {b.bookingReference}
                        </span>
                        <span>·</span>
                        <BookingStatusChip depositStatus={b.depositStatus} />
                      </div>

                      <h3
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'var(--text-lg)',
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          margin: '0 0 var(--space-3)',
                        }}
                      >
                        {pkgName}
                      </h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={14} style={{ color: 'var(--accent-forest)' }} />
                          <span>
                            {b.startDate} → {b.endDate} ({b.days} {t('labels.days', 'Days')} / {b.nights} {t('labels.nights', 'Nights')})
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Building2 size={14} style={{ color: 'var(--accent-forest)' }} />
                          <span>
                            {villaName} {b.villaNumber ? `(${b.villaNumber})` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px dashed var(--border-subtle)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {t('customer.depositResult.amountPaid', 'Deposit Paid')}:{' '}
                        <strong style={{ color: 'var(--accent-forest)' }}>
                          {formatVND(b.depositAmount, i18n.language)}
                        </strong>{' '}
                        / Total {formatVND(b.totalPrice, i18n.language)}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: CTA */}
                  <div
                    style={{
                      padding: 'var(--space-6)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'var(--bg-soft)',
                      gap: 'var(--space-3)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {b.status === 'upcoming'
                        ? 'Schedule Confirmed'
                        : b.status === 'in_stay'
                        ? 'Welcome in Residence'
                        : b.status === 'completed'
                        ? 'Past Sanctuary Journey'
                        : 'Reservation Cancelled'}
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/customer/bookings/${b.id}`)}
                      icon={<ArrowRight size={14} />}
                      style={{
                        backgroundColor: 'var(--accent-forest)',
                        color: '#ffffff',
                        fontWeight: 600,
                        width: '100%',
                        maxWidth: '220px',
                      }}
                      data-cursor="view"
                    >
                      {t('customer.bookingsList.viewDetails', 'View Details & Itinerary')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
};
