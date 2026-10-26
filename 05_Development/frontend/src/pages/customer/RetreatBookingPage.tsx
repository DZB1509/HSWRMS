import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { CustomerPageHeader } from '../../components/customer/CustomerPageHeader';
import { formatVND } from '../../i18n';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  Home,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  getRetreatPackages,
  getVillaCategories,
  calculateBooking,
  createCustomerBooking,
  type RetreatPackageDto,
  type VillaCategoryDto,
  type BookingCalculationResponse,
} from '../../api/booking/retreatBookingApi';

export const RetreatBookingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [packages, setPackages] = useState<RetreatPackageDto[]>([]);
  const [categories, setCategories] = useState<VillaCategoryDto[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Default start date: tomorrow or next Friday
  const getDefaultStartDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const [guestCount, setGuestCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');

  // Calculation state
  const [calculation, setCalculation] = useState<BookingCalculationResponse | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 1. Initial Load from SQL Server
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setLoadingInitial(true);
      setLoadError(null);
      try {
        const [pkgs, cats] = await Promise.all([
          getRetreatPackages(),
          getVillaCategories(),
        ]);

        if (!isMounted) return;
        setPackages(pkgs);
        setCategories(cats);

        // Determine initially selected package
        const retreatQuery = searchParams.get('retreat');
        let initialPkg = pkgs[0];
        if (retreatQuery) {
          const match = pkgs.find(
            (p) => String(p.retreatPackageId) === retreatQuery || p.packageCode.toLowerCase() === retreatQuery.toLowerCase()
          );
          if (match) initialPkg = match;
        }

        if (initialPkg) {
          setSelectedPackageId(initialPkg.retreatPackageId);
          // Choose first eligible category or fallback
          const eligible = initialPkg.eligibleVillaCategories;
          if (eligible && eligible.length > 0) {
            setSelectedCategoryId(eligible[0].villaCategoryId);
          } else if (cats.length > 0) {
            setSelectedCategoryId(cats[0].villaCategoryId);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        setLoadError(err?.message || 'Failed to connect to HSWRMS retreat catalog.');
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  // Selected package object
  const selectedPkg = packages.find((p) => p.retreatPackageId === selectedPackageId) || null;

  // Filter categories to only those eligible for the package
  const eligibleCategories = selectedPkg?.eligibleVillaCategories && selectedPkg.eligibleVillaCategories.length > 0
    ? selectedPkg.eligibleVillaCategories
    : categories;

  // Compute end date based on package nights
  const calculateEndDate = (start: string, nights: number) => {
    try {
      const d = new Date(start);
      d.setDate(d.getDate() + nights);
      return d.toISOString().split('T')[0];
    } catch {
      return start;
    }
  };

  const endDate = selectedPkg ? calculateEndDate(startDate, selectedPkg.durationNights) : startDate;

  // 2. Trigger Calculation whenever parameters change
  useEffect(() => {
    if (!selectedPackageId || !selectedCategoryId || !startDate || !selectedPkg) {
      return;
    }

    let isCancelled = false;
    const runCalculation = async () => {
      setCalculating(true);
      setCalcError(null);
      try {
        const computedEndDate = calculateEndDate(startDate, selectedPkg.durationNights);
        const res = await calculateBooking({
          retreatPackageId: selectedPackageId,
          villaCategoryId: selectedCategoryId,
          checkInDate: startDate,
          checkOutDate: computedEndDate,
          guestCount,
        });

        if (!isCancelled) {
          setCalculation(res);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setCalcError(err?.message || 'Failed to calculate pricing and availability.');
          setCalculation(null);
        }
      } finally {
        if (!isCancelled) setCalculating(false);
      }
    };

    runCalculation();
    return () => {
      isCancelled = true;
    };
  }, [selectedPackageId, selectedCategoryId, startDate, guestCount, selectedPkg]);

  // 3. Handle Package Selection Change
  const handlePackageChange = (pkgId: number) => {
    setSelectedPackageId(pkgId);
    const pkg = packages.find((p) => p.retreatPackageId === pkgId);
    if (pkg && pkg.eligibleVillaCategories && pkg.eligibleVillaCategories.length > 0) {
      setSelectedCategoryId(pkg.eligibleVillaCategories[0].villaCategoryId);
    }
  };

  // 4. Submit and Create Real Booking in SQL Server
  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackageId || !selectedCategoryId || !calculation) return;

    if (!calculation.available || calculation.availableCount <= 0) {
      alert('Selected villa category is not available for these dates. Please choose another date or category.');
      return;
    }

    setSubmitting(true);
    try {
      const booking = await createCustomerBooking({
        retreatPackageId: selectedPackageId,
        requestedVillaCategoryId: selectedCategoryId,
        checkInDate: startDate,
        checkOutDate: endDate,
        guestCount,
        specialRequest: specialRequests.trim() || undefined,
      });

      // Save to sessionStorage for summary screen
      sessionStorage.setItem('hsw_active_draft_booking', JSON.stringify(booking));
      navigate(`/customer/booking/summary?bookingId=${booking.retreatBookingId}`);
    } catch (err: any) {
      alert('Error creating booking: ' + (err?.message || 'Server error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
        <Container size="standard">
          <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-forest)', margin: '0 auto var(--space-4)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading retreat reservation options from SQL Server...</p>
        </Container>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
        <Container size="standard">
          <AlertCircle size={40} style={{ color: '#b91c1c', margin: '0 auto var(--space-4)' }} />
          <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>Unable to connect to Resort System</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>{loadError}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="hsw-booking-form-page" style={{ padding: 'var(--space-6) 0 var(--space-16)' }}>
      <Container size="standard">
        <CustomerPageHeader
          badge={t('customer.bookingForm.badge', 'Step 1 of 3 · Live Reservation Engine')}
          title={t('customer.bookingForm.title', 'Reserve Your Retreat Experience')}
          subtitle={t('customer.bookingForm.subtitle', 'Live rates, verified villa inventory, and direct deposit confirmation.')}
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
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                  <Sparkles size={18} style={{ color: 'var(--accent-forest)' }} />
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0 }}>
                    1. Select Retreat Package
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {packages.map((pkg) => {
                    const isSelected = pkg.retreatPackageId === selectedPackageId;
                    return (
                      <div
                        key={pkg.retreatPackageId}
                        onClick={() => handlePackageChange(pkg.retreatPackageId)}
                        style={{
                          padding: 'var(--space-4)',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '2px solid var(--accent-forest)' : '1px solid var(--border-subtle)',
                          backgroundColor: isSelected ? 'rgba(44, 76, 56, 0.04)' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: isSelected ? 'var(--accent-forest)' : 'var(--text-primary)' }}>
                            {pkg.packageName}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--accent-forest)' }}>
                            {formatVND(pkg.basePrice, i18n.language)}
                          </span>
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          {pkg.durationNights + 1} Ngày {pkg.durationNights} Đêm · {pkg.wellnessGoal}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Villa Category Selector (Filtered by Package Eligibility) */}
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                  <Home size={18} style={{ color: 'var(--accent-forest)' }} />
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0 }}>
                    2. Select Villa Category
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {eligibleCategories.map((cat) => {
                    const isSelected = cat.villaCategoryId === selectedCategoryId;
                    return (
                      <div
                        key={cat.villaCategoryId}
                        onClick={() => setSelectedCategoryId(cat.villaCategoryId)}
                        style={{
                          padding: 'var(--space-4)',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '2px solid var(--accent-forest)' : '1px solid var(--border-subtle)',
                          backgroundColor: isSelected ? 'rgba(44, 76, 56, 0.04)' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: isSelected ? 'var(--accent-forest)' : 'var(--text-primary)' }}>
                            {cat.categoryName}
                          </span>
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {cat.priceModifier > 0 ? `+${formatVND(cat.priceModifier, i18n.language)}` : 'Included'}
                          </span>
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          Sức chứa tối đa: {cat.maxOccupancy} khách · {cat.bedroomDescription || cat.bedroomCount + ' PN'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Dates & Party Size */}
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                  <Calendar size={18} style={{ color: 'var(--accent-forest)' }} />
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0 }}>
                    3. Travel Dates & Party
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}>
                      Check-in Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 'var(--text-sm)',
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}>
                      Check-out Date (Auto)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      disabled
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--surface-muted, #f8f9fa)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-secondary)',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}>
                    Number of Guests (Max for Category: {categories.find(c => c.villaCategoryId === selectedCategoryId)?.maxOccupancy || 4})
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={categories.find(c => c.villaCategoryId === selectedCategoryId)?.maxOccupancy || 10}
                    value={guestCount}
                    onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 'var(--text-sm)',
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '6px' }}>
                    Special Requests (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Dietary allergies, quiet location preference, arrival notes..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 'var(--text-sm)',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Pricing & Availability Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                  Cost & Inventory Summary
                </h3>

                {calculating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                    <Loader2 className="animate-spin" size={16} />
                    <span style={{ fontSize: 'var(--text-sm)' }}>Verifying inventory in SQL Server...</span>
                  </div>
                )}

                {calcError && (
                  <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(185, 28, 28, 0.06)', color: '#b91c1c', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                    <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                    {calcError}
                  </div>
                )}

                {calculation && !calculating && (
                  <div>
                    {/* Availability status */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: calculation.available ? 'rgba(44, 76, 56, 0.08)' : 'rgba(185, 28, 28, 0.08)',
                        color: calculation.available ? 'var(--accent-forest)' : '#b91c1c',
                        fontWeight: 600,
                        fontSize: 'var(--text-sm)',
                        marginBottom: 'var(--space-4)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {calculation.available ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        <span>{calculation.available ? 'Available in SQL Server' : 'Sold Out / Overbooked'}</span>
                      </div>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                        {calculation.availableCount} Villas Remaining
                      </span>
                    </div>

                    {/* Breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Retreat Base ({guestCount} Guests)</span>
                        <span>{formatVND(calculation.packageBaseAmount, i18n.language)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Villa Category Upgrade</span>
                        <span>{formatVND(calculation.villaModifierAmount, i18n.language)}</span>
                      </div>
                      <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 'var(--text-base)' }}>
                        <span>Total Estimated Stay</span>
                        <span style={{ color: 'var(--accent-forest)' }}>{formatVND(calculation.totalEstimatedAmount, i18n.language)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b45309', fontWeight: 600 }}>
                        <span>Required Deposit ({calculation.depositPercentage}%)</span>
                        <span>{formatVND(calculation.requiredDepositAmount, i18n.language)}</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={!calculation.available || submitting}
                      style={{ width: '100%', justifyContent: 'center' }}
                      icon={submitting ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                    >
                      {submitting ? 'Creating Booking Draft...' : 'Proceed to Payment Summary'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Policy Notes */}
              <div
                style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(44, 76, 56, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--accent-forest)', marginBottom: '4px' }}>
                  ✓ Transparent Booking Policy (SRS FR-M2-02)
                </div>
                • Booking holds inventory for 15 minutes while awaiting deposit payment.
                <br />
                • Free cancellation up to 48 hours prior to arrival with 100% deposit refund.
                <br />
                • Physical villa is assigned upon check-in declaration.
              </div>
            </div>
          </div>
        </form>
      </Container>
    </div>
  );
};
