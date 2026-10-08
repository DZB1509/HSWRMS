/**
 * Screen #27 — Available / Alternative Slot Selection
 * Shown when the originally requested Therapist+Room is unavailable.
 * Proactively searches ALL valid retreat days to present nearest alternatives.
 * Enforces ATOMIC booking: specific Date, specific Time, specific Therapist, specific Room.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSpa } from '../../context/SpaContext';
import { useCustomer } from '../../context/CustomerContext';
import {
  ChevronLeft,
  Clock,
  User,
  MapPin,
  Calendar,
  Sparkles,
  Check,
  Filter,
  ArrowRight,
  AlertCircle,
  Leaf,
} from 'lucide-react';
import type { LocalizedString, AvailableSlot } from '../../types/spa';

interface SlotGroup {
  date: string;
  slots: AvailableSlot[];
}

export const SpaAlternativeSlotsPage: React.FC = () => {
  const { t, i18n } = useTranslation('customer');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const treatmentId = searchParams.get('treatment') || '';
  const requestedDate = searchParams.get('date') || '2026-09-26';

  const { treatments, getAvailableSlots } = useSpa();
  const { activeBooking, profile } = useCustomer();

  const currentLang = (i18n.language || 'en') as keyof LocalizedString;
  const localize = (ls?: LocalizedString | null): string => {
    if (!ls) return '';
    if (typeof ls === 'string') return ls;
    return ls[currentLang] || ls.en || Object.values(ls)[0] || '';
  };

  const [dateFilter, setDateFilter] = useState<'all' | string>('all');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  const treatment = treatments.find((tr) => tr.id === treatmentId);

  // Available retreat dates (7 days stay window)
  const availableDates = useMemo(() => {
    const dates: string[] = [];
    const base = new Date('2026-09-25');
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  // Search across ALL valid dates inside retreat window
  const allRetreatSlots = useMemo(() => {
    if (!treatmentId) return [];
    const collected: AvailableSlot[] = [];
    for (const d of availableDates) {
      const daySlots = getAvailableSlots(treatmentId, d);
      // Ensure date is explicitly set on each slot
      for (const slot of daySlots) {
        collected.push({ ...slot, date: d });
      }
    }
    return collected;
  }, [treatmentId, availableDates, getAvailableSlots]);

  // Groupings per Requirement 3:
  // 1. Nearest available
  // 2. Tomorrow / Next valid retreat day
  // 3. Other available dates
  const { nearestGroup, nextDayGroup, otherDatesGroup } = useMemo<{
    nearestGroup: SlotGroup | null;
    nextDayGroup: SlotGroup | null;
    otherDatesGroup: AvailableSlot[];
  }>(() => {
    if (allRetreatSlots.length === 0) {
      return { nearestGroup: null, nextDayGroup: null, otherDatesGroup: [] };
    }

    // Identify unique dates with slots, sorted chronologically
    const datesWithSlots = Array.from(new Set(allRetreatSlots.map((s) => s.date))).sort();

    // Find date closest to or equal to requestedDate
    let nearestDate = datesWithSlots.find((d) => d >= requestedDate);
    if (!nearestDate) {
      nearestDate = datesWithSlots[0];
    }

    const nearestSlots = allRetreatSlots.filter((s) => s.date === nearestDate);

    // Next date with slots after nearestDate
    const remainingDates = datesWithSlots.filter((d) => d !== nearestDate);
    const nextDate = remainingDates.length > 0 ? remainingDates[0] : null;
    const nextDaySlots = nextDate ? allRetreatSlots.filter((s) => s.date === nextDate) : [];

    // Other dates
    const otherDates = remainingDates.filter((d) => d !== nextDate);
    const otherSlots = otherDates.length > 0 ? allRetreatSlots.filter((s) => otherDates.includes(s.date)) : [];

    return {
      nearestGroup: { date: nearestDate, slots: nearestSlots },
      nextDayGroup: nextDate ? { date: nextDate, slots: nextDaySlots } : null,
      otherDatesGroup: otherSlots,
    };
  }, [allRetreatSlots, requestedDate]);

  // Filtered view if user toggles dateFilter chip
  const displayedSlots = useMemo(() => {
    if (dateFilter === 'all') return allRetreatSlots;
    return allRetreatSlots.filter((s) => s.date === dateFilter);
  }, [allRetreatSlots, dateFilter]);

  const formatDateHeader = (dStr: string) => {
    const dt = new Date(dStr + 'T00:00:00');
    return dt.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const hasActiveStay = Boolean(activeBooking && profile);

  const handleProceed = () => {
    if (!selectedSlot || !treatment || !activeBooking || !profile) return;

    const pendingState = {
      bookingReference: activeBooking.bookingReference,
      customerId: profile.id,
      customerName: profile.fullName,
      treatmentId,
      therapistId: selectedSlot.therapistId,
      roomId: selectedSlot.roomId,
      date: selectedSlot.date,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      chargeType: treatment.isIncludedInRetreat ? 'included' : 'extra',
    };

    navigate(
      `/customer/spa/confirmation?treatment=${treatmentId}&date=${selectedSlot.date}&time=${selectedSlot.startTime}&therapist=${selectedSlot.therapistId}&room=${selectedSlot.roomId}`,
      { state: pendingState }
    );
  };

  const renderSlotCard = (slot: AvailableSlot, idx: number) => {
    const isSelected =
      selectedSlot?.date === slot.date &&
      selectedSlot?.startTime === slot.startTime &&
      selectedSlot?.therapistId === slot.therapistId &&
      selectedSlot?.roomId === slot.roomId;

    return (
      <button
        type="button"
        key={`${slot.date}-${slot.startTime}-${slot.therapistId}-${slot.roomId}-${idx}`}
        className={`spa-alt-slot-card ${isSelected ? 'spa-alt-slot-card--active' : ''}`}
        onClick={() => setSelectedSlot(slot)}
        id={`spa-alt-slot-${slot.date}-${slot.startTime.replace(':', '')}`}
      >
        <div className="spa-alt-card-top">
          <span className="spa-alt-date-tag">
            <Calendar size={12} />
            {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <div className="spa-alt-slot-time">
            <Clock size={14} />
            <span>{slot.startTime} — {slot.endTime}</span>
          </div>
        </div>

        <div className="spa-alt-slot-info">
          <span className="spa-alt-meta-therapist">
            <User size={13} /> {slot.therapistName}
          </span>
          <span className="spa-alt-meta-room">
            <MapPin size={13} /> {localize(slot.roomName)}
          </span>
        </div>

        <div className="spa-alt-card-footer">
          <span className="spa-alt-atomic-badge">
            <Sparkles size={11} />
            {t('spa.atomicConfirmed', 'Therapist & Suite Available')}
          </span>
          {isSelected && <Check size={16} className="spa-alt-check" />}
        </div>
      </button>
    );
  };

  return (
    <div className="spa-alt-page" id="screen-27-alternative-slot-selection">
      {/* Back button */}
      <button className="spa-back-btn" onClick={() => navigate(-1)}>
        <ChevronLeft size={18} />
        <span>{t('spa.back', 'Back to Booking')}</span>
      </button>

      {/* Header Banner */}
      <div className="spa-alt-header">
        <div className="spa-alt-header-text">
          <div className="spa-alt-badge">
            <Sparkles size={14} />
            <span>{t('spa.smartFinder', 'Retreat Availability Search')}</span>
          </div>
          <h1>{t('spa.alternativeSlots', 'Alternative Available Slots')}</h1>
          {treatment && (
            <p className="spa-alt-subtitle">
              {t('spa.altDesc', 'Showing all verified Therapist & Suite combinations for')}{' '}
              <strong>{localize(treatment.name)}</strong> ({treatment.durationMinutes} min)
            </p>
          )}
        </div>
      </div>

      {/* Notification when requested day has no slots */}
      {nearestGroup?.date && nearestGroup.date !== requestedDate && (
        <div className="spa-alt-notice-banner">
          <AlertCircle size={18} />
          <div>
            <strong>
              {t('spa.dateFullyBookedNotice', 'Original Date Fully Booked')}:
            </strong>{' '}
            <span>
              {formatDateHeader(requestedDate)} {t('spa.noValidCombos', 'has no vacant suites. Showing nearest available dates within your retreat stay.')}
            </span>
          </div>
        </div>
      )}

      {/* Quick Filter: All or by specific Retreat Day */}
      <div className="spa-alt-filter-bar">
        <div className="spa-alt-filter-label">
          <Filter size={15} />
          <span>{t('spa.filterByDay', 'Filter by Day')}:</span>
        </div>
        <div className="spa-alt-filter-chips">
          <button
            className={`spa-chip ${dateFilter === 'all' ? 'spa-chip--active' : ''}`}
            onClick={() => setDateFilter('all')}
          >
            {t('spa.allRetreatDays', 'All Retreat Days')} ({allRetreatSlots.length})
          </button>
          {availableDates.map((d) => {
            const countForDay = allRetreatSlots.filter((s) => s.date === d).length;
            const dt = new Date(d + 'T00:00:00');
            const dayLabel = dt.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
            return (
              <button
                key={d}
                disabled={countForDay === 0}
                className={`spa-chip ${dateFilter === d ? 'spa-chip--active' : ''} ${countForDay === 0 ? 'spa-chip--disabled' : ''}`}
                onClick={() => setDateFilter(d)}
              >
                <span>{dayLabel}</span>
                <span className="spa-chip-count">{countForDay}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grouped Slot Content */}
      {allRetreatSlots.length > 0 ? (
        <div className="spa-alt-sections">
          {dateFilter === 'all' ? (
            <>
              {/* Group 1: Nearest Available */}
              {nearestGroup && nearestGroup.slots.length > 0 && (
                <section className="spa-alt-group">
                  <div className="spa-alt-group-header">
                    <div className="spa-alt-group-tag spa-alt-group-tag--nearest">
                      <Sparkles size={14} />
                      <span>{t('spa.nearestAvailable', 'Nearest Available')}</span>
                    </div>
                    <h2>{formatDateHeader(nearestGroup.date)}</h2>
                    <span className="spa-alt-group-count">{nearestGroup.slots.length} {t('spa.openings', 'openings')}</span>
                  </div>
                  <div className="spa-alt-slots-grid">
                    {nearestGroup.slots.map(renderSlotCard)}
                  </div>
                </section>
              )}

              {/* Group 2: Tomorrow / Next Valid Retreat Day */}
              {nextDayGroup && nextDayGroup.slots.length > 0 && (
                <section className="spa-alt-group">
                  <div className="spa-alt-group-header">
                    <div className="spa-alt-group-tag spa-alt-group-tag--next">
                      <Calendar size={14} />
                      <span>{t('spa.nextAvailableDay', 'Next Valid Retreat Day')}</span>
                    </div>
                    <h2>{formatDateHeader(nextDayGroup.date)}</h2>
                    <span className="spa-alt-group-count">{nextDayGroup.slots.length} {t('spa.openings', 'openings')}</span>
                  </div>
                  <div className="spa-alt-slots-grid">
                    {nextDayGroup.slots.map(renderSlotCard)}
                  </div>
                </section>
              )}

              {/* Group 3: Other Available Dates in Retreat */}
              {otherDatesGroup && otherDatesGroup.length > 0 && (
                <section className="spa-alt-group">
                  <div className="spa-alt-group-header">
                    <div className="spa-alt-group-tag spa-alt-group-tag--other">
                      <Leaf size={14} />
                      <span>{t('spa.otherRetreatDates', 'Other Available Dates')}</span>
                    </div>
                    <h2>{t('spa.subsequentRetreatDays', 'Subsequent Stay Openings')}</h2>
                    <span className="spa-alt-group-count">{otherDatesGroup.length} {t('spa.openings', 'openings')}</span>
                  </div>
                  <div className="spa-alt-slots-grid">
                    {otherDatesGroup.map(renderSlotCard)}
                  </div>
                </section>
              )}
            </>
          ) : (
            /* Specific Day Filtered List */
            <section className="spa-alt-group">
              <div className="spa-alt-group-header">
                <h2>{formatDateHeader(dateFilter)}</h2>
                <span className="spa-alt-group-count">{displayedSlots.length} {t('spa.openings', 'openings')}</span>
              </div>
              <div className="spa-alt-slots-grid">
                {displayedSlots.map(renderSlotCard)}
              </div>
            </section>
          )}
        </div>
      ) : (
        /* Helpful, Compact Empty State (Requirement 3 & 4) */
        <div className="spa-empty-card" id="spa-alt-empty-state">
          <div className="spa-empty-icon-box">
            <AlertCircle size={32} />
          </div>
          <h3>{t('spa.noAlternativesTitle', 'No Alternative Slots in Retreat Window')}</h3>
          <p>
            {t(
              'spa.noAlternativesDesc',
              'All therapist specialists and therapy suites are fully booked for this treatment during your stay.'
            )}
          </p>
          <div className="spa-empty-actions">
            <button
              className="spa-confirm-btn"
              onClick={() => navigate('/customer/spa')}
              id="spa-alt-empty-explore"
            >
              <Leaf size={16} />
              <span>{t('spa.exploreOtherTreatments', 'Change Treatment')}</span>
            </button>
            <button
              className="spa-secondary-btn"
              onClick={() => navigate(`/customer/spa/book?treatment=${treatmentId}`)}
              id="spa-alt-empty-change-pref"
            >
              <User size={16} />
              <span>{t('spa.changePreference', 'Change Therapist Preference')}</span>
            </button>
            <button
              className="spa-secondary-btn"
              onClick={() => navigate('/customer/dashboard')}
              id="spa-alt-empty-dashboard"
            >
              <span>{t('spa.returnToDashboard', 'Dashboard')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Action Bar when slot is selected */}
      {selectedSlot && (
        <div className="spa-alt-floating-bar" id="spa-alt-selected-bar">
          <div className="spa-alt-floating-content">
            <div className="spa-alt-floating-info">
              <span className="spa-alt-floating-label">{t('spa.selectedAlternative', 'Selected Slot')}:</span>
              <strong>
                {formatDateHeader(selectedSlot.date)} · {selectedSlot.startTime}–{selectedSlot.endTime}
              </strong>
              <span className="spa-alt-floating-sub">
                {selectedSlot.therapistName} · {localize(selectedSlot.roomName)}
              </span>
            </div>
            {!hasActiveStay && (
              <span
                style={{
                  color: '#f87171',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertCircle size={16} />
                {t('spa.activeBookingRequired', 'An active retreat booking and signed-in customer profile are required to reserve spa sessions.')}
              </span>
            )}
            <button
              className="spa-confirm-btn"
              onClick={handleProceed}
              disabled={!hasActiveStay}
              id="spa-alt-confirm-btn"
            >
              <span>{t('spa.proceedToConfirmation', 'Review & Confirm')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
