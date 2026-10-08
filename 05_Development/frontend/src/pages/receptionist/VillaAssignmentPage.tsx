import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Users,
} from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';
import { useToast } from '../../components/common/Toast';
import { OperationalPageHeader } from '../../components/operations/OperationalPageHeader';
import { VillaStatusChip } from '../../components/operations/VillaStatusChip';
import type { Villa } from '../../types/operations';

export const VillaAssignmentPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();

  const {
    villas,
    getArrivalByBookingRef,
    assignVillaToBooking,
  } = useOperations();

  const arrival = getArrivalByBookingRef(bookingId || '');
  const currentLang = (i18n.language || 'en') as 'en' | 'vi' | 'zh-CN' | 'ja' | 'fr';

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [readinessFilter, setReadinessFilter] = useState<string>('all');

  if (!arrival) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <AlertCircle size={40} style={{ color: '#C62828', margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
          {t('operations.checkIn.arrivalNotFound', 'Arrival Record Not Found')}
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
          {t('operations.villaAssignment.cannotLoadContext', 'Cannot load villa assignment context without a valid booking reference.')}
        </p>
        <Link to="/receptionist/arrivals" className="hsw-btn hsw-btn-secondary">
          <ArrowLeft size={14} />
          <span>{t('operations.checkIn.returnToArrivals', 'Return to Daily Arrivals')}</span>
        </Link>
      </div>
    );
  }

  const retreatTitle =
    typeof arrival.retreatName === 'object'
      ? arrival.retreatName[currentLang] || arrival.retreatName.en
      : arrival.retreatName;

  // Filter villas
  const filteredVillas = useMemo(() => {
    return villas.filter((v) => {
      const matchesCategory =
        categoryFilter === 'all' || v.category === categoryFilter;

      const matchesReadiness =
        readinessFilter === 'all' || v.status === readinessFilter;

      return matchesCategory && matchesReadiness;
    });
  }, [villas, categoryFilter, readinessFilter]);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(villas.map((v) => v.category)));
  }, [villas]);

  const handleAssign = (villa: Villa) => {
    // Validation checks
    if (villa.status === 'maintenance') {
      showToast(t('operations.villaAssignment.maintenanceAlert', 'Villa is under maintenance and cannot be assigned.'), 'error');
      return;
    }

    if (villa.status === 'occupied' && villa.currentBookingRef !== arrival.bookingReference) {
      showToast(t('operations.villaAssignment.occupiedAlert', 'Villa is currently occupied by an active stay.'), 'error');
      return;
    }

    if (villa.capacity < arrival.partySize) {
      showToast(t('operations.villaAssignment.capacityAlert', 'Villa capacity is smaller than party size.'), 'warning');
      return;
    }

    const res = assignVillaToBooking(arrival.bookingReference, villa.id);
    if (res.success) {
      showToast(res.message, 'success');
      // Return to check-in screen after small delay
      setTimeout(() => {
        navigate(`/receptionist/check-in/${arrival.bookingReference}`);
      }, 400);
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <OperationalPageHeader
        title={t('operations.villaAssignment.title', 'Villa Assignment')}
        subtitle={t('operations.villaAssignment.subtitle', 'Select an eligible resort villa matching package criteria, capacity requirements, and operational readiness.')}
        badge="Screen #23"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Link
              to={`/receptionist/check-in/${arrival.bookingReference}`}
              className="hsw-btn hsw-btn-secondary"
              style={{ fontSize: 'var(--text-xs)', minHeight: '36px' }}
            >
              <ArrowLeft size={14} />
              <span>{t('operations.common.back', 'Back to Check-In')}</span>
            </Link>
          </div>
        }
      />

      {/* Main Layout: Left Side Booking Context, Right Side Villa Inventory */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* Left Column: Customer Booking Context */}
        <div
          className="ops-card"
          style={{
            padding: 'var(--space-5)',
            position: 'sticky',
            top: 'calc(var(--space-6) + 60px)',
          }}
        >
          <div style={{ paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
              {t('operations.villaAssignment.bookingContext', 'Customer Reservation Context')}
            </span>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {arrival.customerName}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: 'var(--accent-forest)', marginTop: '2px' }}>
              {arrival.bookingReference}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
            <div>
              <span style={{ color: 'var(--text-tertiary)', display: 'block' }}>{t('operations.common.package', 'Package')}:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{retreatTitle}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-tertiary)', display: 'block' }}>{t('operations.common.stayDates', 'Stay Dates')}:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{arrival.startDate} → {arrival.endDate}</strong>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>({arrival.nights} {t('operations.common.nights', 'Nights')})</div>
            </div>

            <div>
              <span style={{ color: 'var(--text-tertiary)', display: 'block' }}>{t('operations.villaAssignment.requiredCapacity', 'Required Capacity')}:</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--text-primary)' }}>
                <Users size={14} />
                <span>
                  {arrival.partySize === 1
                    ? t('operations.common.customerSolo', '1 Customer (Solo)')
                    : t('operations.common.customerCount', { count: arrival.partySize, defaultValue: `${arrival.partySize} Customers` })}
                </span>
              </span>
            </div>

            <div>
              <span style={{ color: 'var(--text-tertiary)', display: 'block' }}>{t('operations.common.packageCategory', 'Package Category')}:</span>
              <strong style={{ color: 'var(--accent-forest)' }}>{arrival.villaCategory}</strong>
            </div>

            <div style={{ paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                {t('operations.villaAssignment.currentlyAssigned', 'Currently Assigned')}:
              </span>
              {arrival.assignedVillaId ? (
                <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {arrival.assignedVillaNumber}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {t('operations.common.status', 'Status')}: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{t(`operations.statuses.${arrival.villaReadiness}`, arrival.villaReadiness)}</span>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#C62828', fontWeight: 600 }}>
                  {t('operations.common.notAssigned', 'Not Assigned')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Available Villa Inventory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          
          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {t('operations.villaAssignment.filterCategory', 'Category')}:
                </span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{
                    height: '32px',
                    padding: '0 var(--space-2)',
                    fontSize: 'var(--text-xs)',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-canvas)',
                    outline: 'none',
                  }}
                >
                  <option value="all">{t('operations.common.allCategories', 'All Categories')}</option>
                  {uniqueCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {t('operations.villaAssignment.filterReadiness', 'State')}:
                </span>
                <select
                  value={readinessFilter}
                  onChange={(e) => setReadinessFilter(e.target.value)}
                  style={{
                    height: '32px',
                    padding: '0 var(--space-2)',
                    fontSize: 'var(--text-xs)',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-canvas)',
                    outline: 'none',
                  }}
                >
                  <option value="all">{t('operations.common.allStates', 'All States')}</option>
                  <option value="ready">{t('operations.statuses.ready', 'Ready')}</option>
                  <option value="cleaning">{t('operations.statuses.cleaning', 'Cleaning')}</option>
                  <option value="reserved">{t('operations.statuses.reserved', 'Reserved')}</option>
                  <option value="occupied">{t('operations.statuses.occupied', 'Occupied')}</option>
                  <option value="maintenance">{t('operations.statuses.maintenance', 'Maintenance')}</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {t('operations.common.showingVillas', { count: filteredVillas.length, defaultValue: `Showing ${filteredVillas.length} villas` })}
            </div>
          </div>

          {/* Villa Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {filteredVillas.map((villa) => {
              const isAssignedToThis = arrival.assignedVillaId === villa.id;
              const isCapacityOk = villa.capacity >= arrival.partySize;
              const isUnderMaintenance = villa.status === 'maintenance';
              const isOccupiedByOther = villa.status === 'occupied' && villa.currentBookingRef !== arrival.bookingReference;
              const isCleaning = villa.status === 'cleaning';

              const canAssign = isCapacityOk && !isUnderMaintenance && !isOccupiedByOther;

              return (
                <div
                  key={villa.id}
                  className="ops-card"
                  style={{
                    border: isAssignedToThis ? '2px solid var(--accent-forest)' : undefined,
                    padding: 'var(--space-4)',
                    boxShadow: isAssignedToThis ? 'var(--shadow-sm)' : undefined,
                    opacity: canAssign ? 1 : 0.65,
                  }}
                >
                  <div>
                    {/* Top Row: Code & Status */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Villa #{villa.code}
                        </span>
                        {isAssignedToThis && (
                          <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#E8F5E9', color: '#1B5E20', padding: '1px 6px', borderRadius: 'var(--radius-pill)', border: '1px solid #C8E6C9' }}>
                            {t('operations.common.currentAssigned', 'Current')}
                          </span>
                        )}
                      </div>
                      <VillaStatusChip status={villa.status} housekeeping={villa.housekeeping} size="sm" />
                    </div>

                    {/* Name & Category */}
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent-forest)', marginBottom: '4px' }}>
                      {villa.name[currentLang] || villa.name.en}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                      {villa.category}
                    </div>

                    {/* Details: Capacity & Bed */}
                    <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', padding: '6px 8px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-xs)' }}>
                      <div>
                        <strong style={{ color: isCapacityOk ? 'var(--text-primary)' : '#C62828' }}>
                          {t('operations.checkIn.capacityLabel', { capacity: villa.capacity, defaultValue: `Capacity: ${villa.capacity} Persons` })}
                        </strong>
                      </div>
                      <div>•</div>
                      <div>{villa.bedType}</div>
                    </div>

                    {/* Features Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                      {villa.features.slice(0, 3).map((f) => (
                        <span key={f} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--bg-soft)', color: 'var(--text-tertiary)' }}>
                          {f}
                        </span>
                      ))}
                    </div>

                    {/* Warnings / Notices */}
                    {isUnderMaintenance && (
                      <div style={{ fontSize: '10px', color: '#C62828', marginBottom: '8px', fontWeight: 600 }}>
                        {t('operations.villaAssignment.maintenanceAlert', 'Villa is under maintenance.')} ({villa.maintenanceReason})
                      </div>
                    )}
                    {isOccupiedByOther && (
                      <div style={{ fontSize: '10px', color: '#C62828', marginBottom: '8px', fontWeight: 600 }}>
                        {t('operations.common.occupiedByCustomer', { name: villa.currentCustomerName, ref: villa.currentBookingRef, defaultValue: `Occupied by ${villa.currentCustomerName} (${villa.currentBookingRef})` })}
                      </div>
                    )}
                    {!isCapacityOk && (
                      <div style={{ fontSize: '10px', color: '#C62828', marginBottom: '8px', fontWeight: 600 }}>
                        {t('operations.villaAssignment.capacityAlert', 'Capacity insufficient for party size.')}
                      </div>
                    )}
                    {isCleaning && (
                      <div style={{ fontSize: '10px', color: '#B26A00', marginBottom: '8px', fontWeight: 500 }}>
                        {t('operations.villaAssignment.cleaningNotice', 'Villa in cleaning. Can assign, ready check needed.')}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div style={{ paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)', marginTop: 'var(--space-2)' }}>
                    {isAssignedToThis ? (
                      <button
                        type="button"
                        disabled
                        className="hsw-btn hsw-btn-secondary"
                        style={{ width: '100%', minHeight: '34px', fontSize: '11px', color: '#1B5E20' }}
                      >
                        <Check size={14} />
                        <span>{t('operations.common.alreadyAssigned', 'Already Assigned')}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAssign(villa)}
                        disabled={!canAssign}
                        className={canAssign ? 'hsw-btn hsw-btn-primary' : 'hsw-btn hsw-btn-secondary'}
                        style={{ width: '100%', minHeight: '34px', fontSize: '11px' }}
                      >
                        <span>{t('operations.villaAssignment.assignButton', 'Assign to Customer')}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
