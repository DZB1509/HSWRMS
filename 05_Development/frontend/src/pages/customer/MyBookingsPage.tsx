import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Building2,
  ArrowRight,
  Sparkles,
  Search,
  Loader2,
  AlertCircle,
  User,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { CustomerPageHeader } from '../../components/customer/CustomerPageHeader';
import {
  getCustomerBookings,
  type CustomerBookingSummary,
} from '../../api/booking/retreatBookingApi';
import { formatVND } from '../../i18n';

type FilterTab = 'all' | 'upcoming' | 'completed' | 'cancelled';

export const MyBookingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<CustomerBookingSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isCancelled = false;

    const fetchBookings = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const list = await getCustomerBookings();
        if (!isCancelled) {
          setBookings(list);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setLoadError(err?.message || 'Failed to retrieve bookings from server.');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchBookings();
    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredBookings = bookings.filter((b) => {
    // Tab filter
    const status = b.bookingStatus.toUpperCase();
    if (activeTab === 'upcoming') {
      if (status !== 'CONFIRMED' && status !== 'PENDING' && status !== 'CHECKED_IN') return false;
    } else if (activeTab === 'completed') {
      if (status !== 'COMPLETED') return false;
    } else if (activeTab === 'cancelled') {
      if (status !== 'CANCELLED') return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const pkgName = (b.packageName || '').toLowerCase();
      const ref = (b.bookingReference || '').toLowerCase();
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
              onClick={() => navigate('/customer/booking/new')}
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

        {/* Loading State */}
        {loading && (
          <div style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
            <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-forest)', margin: '0 auto var(--space-4)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading reservations from SQL Server...</p>
          </div>
        )}

        {/* Error State */}
        {loadError && !loading && (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <AlertCircle size={36} style={{ color: '#b91c1c', margin: '0 auto var(--space-3)' }} />
            <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-2)' }}>Unable to Load Reservations</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>{loadError}</p>
            <Button variant="primary" size="sm" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        )}

        {/* Bookings List */}
        {!loading && !loadError && filteredBookings.length === 0 ? (
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
              onClick={() => navigate('/customer/booking/new')}
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
          !loading && !loadError && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {filteredBookings.map((b) => {
                const pkgName = b.packageName;
                const villaName = b.requestedCategoryName;

                return (
                  <div
                    key={b.retreatBookingId}
                    className="customer-booking-card"
                    id={`booking-card-${b.retreatBookingId}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(240px, 1fr) 220px',
                      backgroundColor: 'var(--surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
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
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '10px',
                              fontWeight: 700,
                              backgroundColor:
                                b.bookingStatus === 'CONFIRMED'
                                  ? 'rgba(44, 76, 56, 0.1)'
                                  : b.bookingStatus === 'CHECKED_IN'
                                  ? 'rgba(37, 99, 235, 0.1)'
                                  : b.bookingStatus === 'CANCELLED'
                                  ? 'rgba(185, 28, 28, 0.1)'
                                  : 'rgba(217, 119, 6, 0.1)',
                              color:
                                b.bookingStatus === 'CONFIRMED'
                                  ? 'var(--accent-forest)'
                                  : b.bookingStatus === 'CHECKED_IN'
                                  ? '#2563eb'
                                  : b.bookingStatus === 'CANCELLED'
                                  ? '#b91c1c'
                                  : '#d97706',
                            }}
                          >
                            {b.bookingStatus}
                          </span>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '10px',
                              fontWeight: 700,
                              backgroundColor: (b.depositStatus === 'PAID' || b.paymentStatus === 'SUCCESSFUL') ? 'rgba(44, 76, 56, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                              color: (b.depositStatus === 'PAID' || b.paymentStatus === 'SUCCESSFUL') ? 'var(--accent-forest)' : '#d97706',
                            }}
                          >
                            Deposit: {b.depositStatus || b.paymentStatus || 'PENDING'}
                          </span>
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
                              {b.checkInDate} → {b.checkOutDate}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Building2 size={14} style={{ color: 'var(--accent-forest)' }} />
                            <span>
                              {villaName} {b.assignedVillaNumber ? `(${b.assignedVillaNumber})` : ''}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={14} style={{ color: 'var(--accent-forest)' }} />
                            <span>Party: {b.guestCount || 1} Guests</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px dashed var(--border-subtle)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {t('customer.depositResult.amountPaid', 'Deposit Paid')}:{' '}
                          <strong style={{ color: 'var(--accent-forest)' }}>
                            {formatVND(b.depositAmount, i18n.language)}
                          </strong>{' '}
                          / Total {formatVND(b.totalAmount || b.totalEstimatedAmount, i18n.language)}
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
                        {b.bookingStatus === 'CONFIRMED'
                          ? 'Schedule Confirmed'
                          : b.bookingStatus === 'CHECKED_IN'
                          ? 'Welcome in Residence'
                          : b.bookingStatus === 'COMPLETED'
                          ? 'Past Sanctuary Journey'
                          : b.bookingStatus === 'CANCELLED'
                          ? 'Reservation Cancelled'
                          : 'Pending Deposit'}
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/customer/bookings/${b.retreatBookingId}`)}
                        icon={<ArrowRight size={14} />}
                        style={{
                          backgroundColor: 'var(--accent-forest)',
                          color: '#ffffff',
                          fontWeight: 600,
                          width: '100%',
                          maxWidth: '220px',
                        }}
                      >
                        {t('customer.bookingsList.viewDetails', 'View Details & Itinerary')}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </Container>
    </div>
  );
};

